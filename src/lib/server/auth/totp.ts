import * as OTPAuth from 'otpauth';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { db } from '../db/client';
import { userTwoFactorSettings, userRecoveryCodes, users } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function generateTOTPUri(userId: string, email: string) {
	const totp = new OTPAuth.TOTP({
		issuer: process.env.PUBLIC_APP_NAME || 'DocumentHub',
		label: email,
		algorithm: 'SHA1',
		digits: 6,
		period: 30,
		secret: new OTPAuth.Secret({ size: 20 })
	});

	const secretEncrypted = totp.secret.base32;
	await db
		.insert(userTwoFactorSettings)
		.values({ userId, isEnabled: false, secretEncrypted })
		.onConflictDoUpdate({
			target: userTwoFactorSettings.userId,
			set: { isEnabled: false, secretEncrypted }
		});

	return { uri: totp.toString(), secret: totp.secret.base32 };
}

export async function verifyTOTP(userId: string, token: string): Promise<boolean> {
	const [settings] = await db
		.select()
		.from(userTwoFactorSettings)
		.where(eq(userTwoFactorSettings.userId, userId))
		.limit(1);

	if (!settings?.secretEncrypted) return false;

	const totp = new OTPAuth.TOTP({
		issuer: process.env.PUBLIC_APP_NAME || 'DocumentHub',
		label: '',
		algorithm: 'SHA1',
		digits: 6,
		period: 30,
		secret: OTPAuth.Secret.fromBase32(settings.secretEncrypted)
	});

	const delta = totp.validate({ token, window: 1 });
	return delta !== null;
}

export async function enable2FA(userId: string) {
	await db
		.update(userTwoFactorSettings)
		.set({ isEnabled: true })
		.where(eq(userTwoFactorSettings.userId, userId));
}

export async function disable2FA(userId: string) {
	await db.delete(userTwoFactorSettings).where(eq(userTwoFactorSettings.userId, userId));
	await db.delete(userRecoveryCodes).where(eq(userRecoveryCodes.userId, userId));
	await db.update(users).set({ updatedAt: new Date() }).where(eq(users.id, userId));
}

export async function generateRecoveryCodes(userId: string): Promise<string[]> {
	const codes: string[] = [];
	const hashedCodes: { codeHash: string; userId: string }[] = [];

	for (let i = 0; i < 4; i++) {
		const raw = crypto.randomBytes(8).toString('hex').toUpperCase();
		codes.push(raw);
		const hash = await bcrypt.hash(raw, 10);
		hashedCodes.push({ codeHash: hash, userId });
	}

	await db.insert(userRecoveryCodes).values(hashedCodes);
	return codes;
}

export async function verifyRecoveryCode(userId: string, code: string): Promise<boolean> {
	const allCodes = await db
		.select()
		.from(userRecoveryCodes)
		.where(eq(userRecoveryCodes.userId, userId));

	for (const stored of allCodes) {
		if (stored.isUsed) continue;
		const match = await bcrypt.compare(code, stored.codeHash);
		if (match) {
			await db
				.update(userRecoveryCodes)
				.set({ isUsed: true })
				.where(eq(userRecoveryCodes.id, stored.id));
			return true;
		}
	}
	return false;
}

export async function is2FAEnabled(userId: string): Promise<boolean> {
	const [settings] = await db
		.select()
		.from(userTwoFactorSettings)
		.where(eq(userTwoFactorSettings.userId, userId))
		.limit(1);
	return settings?.isEnabled ?? false;
}
