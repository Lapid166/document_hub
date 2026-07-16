import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/client';
import { users } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { hashPassword } from '$lib/server/auth/password';
import { revokeAllUserSessions } from '$lib/server/auth/session';
import { auditLog } from '$lib/server/auth/audit';
import { requirePermission } from '$lib/server/auth/guards';
import { generateQuickPassword } from '$lib/server/auth/password-generator';

export const POST: RequestHandler = async (event) => {
	requirePermission(event, 'users:reset_password');

	const orgId = event.locals.user!.organizationId!;
	const userId = event.params.id;

	const targetUser = await db
		.select()
		.from(users)
		.where(and(eq(users.id, userId), eq(users.organizationId!, orgId)))
		.limit(1);

	if (!targetUser.length) {
		return json({ code: 'NOT_FOUND', message: 'User not found' }, { status: 404 });
	}

	const newPassword = generateQuickPassword(targetUser[0].email);
	const passwordHash = await hashPassword(newPassword);

	await db
		.update(users)
		.set({ passwordHash, mustChangePassword: true, updatedAt: new Date() })
		.where(eq(users.id, userId));

	await revokeAllUserSessions(userId);

	await auditLog({
		organizationId: orgId,
		userId: event.locals.user!.id,
		action: 'user_reset_password',
		resourceType: 'user',
		resourceId: userId,
		ipAddress: event.getClientAddress()
	});

	return json({ success: true, newPassword });
};
