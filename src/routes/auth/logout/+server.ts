import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { revokeSession, getSessionCookieName } from '$lib/server/auth/session';
import { auditLog } from '$lib/server/auth/audit';

export const POST: RequestHandler = async ({ cookies, locals }) => {
	const token = cookies.get(getSessionCookieName());

	if (token) {
		await revokeSession(token);
		cookies.delete(getSessionCookieName(), { path: '/' });

		if (locals.user) {
			await auditLog({
				organizationId: locals.user.organizationId,
				userId: locals.user.id,
				action: 'logout'
			});
		}
	}

	return json({ success: true, redirect: '/auth?mode=login' });
};
