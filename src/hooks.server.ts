import type { Handle } from '@sveltejs/kit';
import { verifySession, getSessionCookieName } from '$lib/server/auth/session';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(getSessionCookieName());

	if (token) {
		const ctx = await verifySession(token);
		if (ctx) {
			event.locals.user = {
				id: ctx.user.id,
				email: ctx.user.email,
				displayName: ctx.user.displayName,
				avatarUrl: ctx.user.avatarUrl,
				organizationId: ctx.session.organizationId,
				mustChangePassword: ctx.user.mustChangePassword ?? false
			};
			event.locals.roles = ctx.roles;
			event.locals.permissions = ctx.permissions;
			event.locals.sessionToken = token;
		}
	}

	if (!event.locals.user) {
		event.locals.user = null;
		event.locals.roles = [];
		event.locals.permissions = [];
		event.locals.sessionToken = null;
	}

	const response = await resolve(event);
	return response;
};
