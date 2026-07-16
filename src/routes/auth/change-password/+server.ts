import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/client';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '$lib/server/auth/password';
import { revokeAllUserSessions } from '$lib/server/auth/session';
import { auditLog } from '$lib/server/auth/audit';
import { changePasswordSchema } from '$lib/server/validators/auth';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ code: 'UNAUTHORIZED', message: 'Not authenticated' }, { status: 401 });
	}

	const body = await request.json();
	const parsed = changePasswordSchema.safeParse(body);

	if (!parsed.success) {
		return json(
			{ code: 'VALIDATION_ERROR', message: 'Password must be 8-128 characters' },
			{ status: 400 }
		);
	}

	const { currentPassword, newPassword } = parsed.data;

	const [user] = await db
		.select({ passwordHash: users.passwordHash })
		.from(users)
		.where(eq(users.id, locals.user.id))
		.limit(1);

	if (!user) {
		return json({ code: 'NOT_FOUND', message: 'User not found' }, { status: 404 });
	}

	const valid = await verifyPassword(currentPassword, user.passwordHash);
	if (!valid) {
		return json(
			{ code: 'INVALID_CREDENTIALS', message: 'Current password is incorrect' },
			{ status: 401 }
		);
	}

	const newHash = await hashPassword(newPassword);
	await db
		.update(users)
		.set({ passwordHash: newHash, mustChangePassword: false, updatedAt: new Date() })
		.where(eq(users.id, locals.user.id));

	await revokeAllUserSessions(locals.user.id);

	await auditLog({
		organizationId: locals.user.organizationId,
		userId: locals.user.id,
		action: 'password_change'
	});

	return json({ success: true });
};
