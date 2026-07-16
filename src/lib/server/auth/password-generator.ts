import crypto from 'crypto';

export function generateQuickPassword(email: string): string {
	const prefix = email.split('@')[0].replace(/[^a-zA-Z0-9.]/g, '');
	const length = crypto.randomInt(3, 6);
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
	let suffix = '';
	for (let i = 0; i < length; i++) {
		suffix += chars[crypto.randomInt(0, chars.length)];
	}
	return prefix + suffix;
}
