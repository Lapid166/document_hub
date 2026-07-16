import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/client';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '$lib/server/auth/password';
import { createSession, getSessionCookieName } from '$lib/server/auth/session';
import { isEmailAllowed } from '$lib/server/auth/domain-allowlist';
import { isLockedOut, recordLoginFailure } from '$lib/server/auth/lockout';
import { auditLog, logSecurityEvent } from '$lib/server/auth/audit';
import { loginSchema } from '$lib/server/validators/auth';

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	const body = await request.json();
	const parsed = loginSchema.safeParse(body);

	if (!parsed.success) {
		return json({ code: 'VALIDATION_ERROR', message: 'Invalid input' }, { status: 400 });
	}

	const { email, password } = parsed.data;
	const ip = getClientAddress();

	const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);

	if (!user) {
		return json(
			{ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
			{ status: 401 }
		);
	}

	if (!user.organizationId) {
		return json(
			{ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
			{ status: 401 }
		);
	}

	const allowed = await isEmailAllowed(email, user.organizationId);
	if (!allowed) {
		return json(
			{ code: 'DOMAIN_NOT_ALLOWED', message: 'Email domain not authorized' },
			{ status: 403 }
		);
	}

	if (await isLockedOut(user.organizationId, email)) {
		await logSecurityEvent({
			organizationId: user.organizationId,
			eventType: 'login_lockout',
			severity: 'high',
			details: { email, ip }
		});
		return json(
			{ code: 'ACCOUNT_LOCKED', message: 'Too many failed attempts. Try again in 15 minutes.' },
			{ status: 429 }
		);
	}

	if (!user.isActive) {
		return json({ code: 'ACCOUNT_DISABLED', message: 'Account is disabled' }, { status: 403 });
	}

	const valid = await verifyPassword(password, user.passwordHash);
	if (!valid) {
		await recordLoginFailure(user.organizationId, email, ip);
		return json(
			{ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
			{ status: 401 }
		);
	}

	const { token } = await createSession(user.id, user.organizationId, ip);

	cookies.set(getSessionCookieName(), token, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 60 * 24
	});

	await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

	await auditLog({
		organizationId: user.organizationId,
		userId: user.id,
		action: 'login',
		details: { email },
		ipAddress: ip
	});

	return json({
		success: true,
		mustChangePassword: user.mustChangePassword,
		redirect: user.mustChangePassword ? '/auth/change-password' : '/admin'
	});
};
