import crypto from 'crypto';

const CSRF_SECRET = process.env.SESSION_SECRET || 'dev-csrf-secret';

function sign(payload: string): string {
	const hmac = crypto.createHmac('sha256', CSRF_SECRET);
	hmac.update(payload);
	return hmac.digest('hex');
}

export function generateCsrfToken(): string {
	return crypto.randomBytes(32).toString('hex');
}

export function signCsrfToken(token: string): string {
	return `${token}.${sign(token)}`;
}

export function verifyCsrfToken(token: string, signed: string): boolean {
	const [rawToken, sig] = signed.split('.');
	if (rawToken !== token) return false;
	return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(sign(token), 'hex'));
}
