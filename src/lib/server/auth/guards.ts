import { error, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export function requireUser(event: RequestEvent) {
	if (!event.locals.user) {
		throw redirect(302, '/auth?mode=login');
	}
	return event.locals.user;
}

export function requirePermission(event: RequestEvent, code: string) {
	const user = requireUser(event);
	if (!event.locals.permissions.includes(code)) {
		throw error(403, { code: 'FORBIDDEN', message: 'Insufficient permissions' });
	}
	return user;
}

export function requireAnyPermission(event: RequestEvent, codes: string[]) {
	const user = requireUser(event);
	if (!codes.some((c) => event.locals.permissions.includes(c))) {
		throw error(403, { code: 'FORBIDDEN', message: 'Insufficient permissions' });
	}
	return user;
}

export function requireRole(event: RequestEvent, roleName: string) {
	const user = requireUser(event);
	if (!event.locals.roles.includes(roleName)) {
		throw error(403, { code: 'FORBIDDEN', message: 'Insufficient role' });
	}
	return user;
}
