import bcrypt from 'bcrypt';

const COST = parseInt(process.env.BCRYPT_COST || '12');

export async function hashPassword(plain: string): Promise<string> {
	return bcrypt.hash(plain, COST);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
	return bcrypt.compare(plain, hash);
}
