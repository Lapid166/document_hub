import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/auth/guards';
import { generateTOTPUri, generateRecoveryCodes } from '$lib/server/auth/totp';
import { auditLog } from '$lib/server/auth/audit';

export const POST: RequestHandler = async (event) => {
	const user = requireUser(event);

	const { uri, secret } = await generateTOTPUri(user.id, user.email);
	const recoveryCodes = await generateRecoveryCodes(user.id);

	await auditLog({
		organizationId: user.organizationId,
		userId: user.id,
		action: '2fa_setup_initiated',
		ipAddress: event.getClientAddress()
	});

	return json({ uri, secret, recoveryCodes });
};
