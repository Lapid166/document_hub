import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/client';
import { users } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { revokeAllUserSessions } from '$lib/server/auth/session';
import { auditLog } from '$lib/server/auth/audit';
import { requirePermission } from '$lib/server/auth/guards';

export const POST: RequestHandler = async (event) => {
	requirePermission(event, 'users:update_status');

	const orgId = event.locals.user!.organizationId!;
	const userId = event.params.id;
	const body = await event.request.json();
	const isActive = body?.isActive;

	if (typeof isActive !== 'boolean') {
		return json({ code: 'VALIDATION_ERROR', message: 'Invalid input' }, { status: 400 });
	}

	const targetUser = await db
		.select()
		.from(users)
		.where(and(eq(users.id, userId), eq(users.organizationId!, orgId)))
		.limit(1);

	if (!targetUser.length) {
		return json({ code: 'NOT_FOUND', message: 'User not found' }, { status: 404 });
	}

	await db.update(users).set({ isActive, updatedAt: new Date() }).where(eq(users.id, userId));

	if (!isActive) {
		await revokeAllUserSessions(userId);
	}

	await auditLog({
		organizationId: orgId,
		userId: event.locals.user!.id,
		action: isActive ? 'user_activate' : 'user_deactivate',
		resourceType: 'user',
		resourceId: userId,
		ipAddress: event.getClientAddress()
	});

	return json({ success: true });
};
