import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/auth/guards';
import { verifyTOTP, enable2FA } from '$lib/server/auth/totp';
import { auditLog } from '$lib/server/auth/audit';

export const POST: RequestHandler = async (event) => {
	const user = requireUser(event);
	const { token } = await event.request.json();

	if (!token || typeof token !== 'string') {
		return json({ code: 'VALIDATION_ERROR', message: 'Token required' }, { status: 400 });
	}

	const valid = await verifyTOTP(user.id, token);
	if (!valid) {
		return json({ code: 'INVALID_TOKEN', message: 'Invalid TOTP code' }, { status: 400 });
	}

	await enable2FA(user.id);

	await auditLog({
		organizationId: user.organizationId,
		userId: user.id,
		action: '2fa_enabled',
		ipAddress: event.getClientAddress()
	});

	return json({ success: true });
};
