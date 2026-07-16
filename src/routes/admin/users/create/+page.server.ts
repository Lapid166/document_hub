import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import { users, userRoles, roles } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { hashPassword } from '$lib/server/auth/password';
import { auditLog } from '$lib/server/auth/audit';
import { requirePermission } from '$lib/server/auth/guards';

export const load: PageServerLoad = async (event) => {
	requirePermission(event, 'users:create');

	const orgId = event.locals.user!.organizationId!;

	const orgRoles = await db.select().from(roles).where(eq(roles.organizationId!, orgId));

	return { roles: orgRoles };
};

export const actions: Actions = {
	default: async (event) => {
		requirePermission(event, 'users:create');

		const orgId = event.locals.user!.organizationId!;

		const formData = await event.request.formData();
		const email = String(formData.get('email') || '');
		const displayName = String(formData.get('displayName') || '');
		const roleId = String(formData.get('roleId') || '');
		const password = String(formData.get('password') || '');

		if (!email || !displayName || !roleId || !password || password.length < 8) {
			return fail(400, { error: 'Invalid input' });
		}

		const [existing] = await db
			.select()
			.from(users)
			.where(and(eq(users.email, email.toLowerCase()), eq(users.organizationId!, orgId)))
			.limit(1);

		if (existing) {
			return fail(409, { error: 'Email already exists' });
		}

		const passwordHash = await hashPassword(password);

		const [newUser] = await db
			.insert(users)
			.values({
				organizationId: orgId,
				email: email.toLowerCase(),
				passwordHash,
				displayName,
				isActive: true,
				mustChangePassword: true
			})
			.returning();

		await db.insert(userRoles).values({
			userId: newUser.id,
			roleId
		});

		await auditLog({
			organizationId: orgId,
			userId: event.locals.user!.id,
			action: 'user_create',
			resourceType: 'user',
			resourceId: newUser.id,
			details: { email, displayName },
			ipAddress: event.getClientAddress()
		});

		return { success: true, userId: newUser.id, generatedPassword: password };
	}
};
