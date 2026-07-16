import { db } from '../db/client';
import { sessions, users, userRoles, roles, rolePermissions, permissions } from '../db/schema';
import { eq, and, gt } from 'drizzle-orm';
import crypto from 'crypto';

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;
const SESSION_COOKIE_NAME = 'session_token';

function generateToken(): string {
	return crypto.randomBytes(32).toString('hex');
}

function hashToken(token: string): string {
	return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createSession(
	userId: string,
	organizationId: string,
	ip?: string,
	ua?: string
) {
	const token = generateToken();
	const tokenHash = hashToken(token);

	const [session] = await db
		.insert(sessions)
		.values({
			userId,
			organizationId,
			tokenHash,
			expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
			ipAddress: ip,
			userAgent: ua
		})
		.returning();

	return { token, session };
}

export async function verifySession(token: string) {
	const tokenHash = hashToken(token);

	const [session] = await db
		.select()
		.from(sessions)
		.where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date())))
		.limit(1);

	if (!session || !session.userId) return null;

	const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);

	if (!user || !user.isActive) return null;

	const rolesWithPerms = await db
		.select({
			role: roles.name,
			permissionCode: permissions.code
		})
		.from(userRoles)
		.innerJoin(roles, eq(userRoles.roleId, roles.id))
		.innerJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
		.innerJoin(permissions, eq(rolePermissions.permissionCode, permissions.code))
		.where(eq(userRoles.userId, user.id));

	const roleNames = [...new Set(rolesWithPerms.map((r) => r.role))];
	const permissionCodes = [...new Set(rolesWithPerms.map((r) => r.permissionCode))];

	return {
		session,
		user,
		roles: roleNames,
		permissions: permissionCodes
	};
}

export async function revokeSession(token: string) {
	const tokenHash = hashToken(token);
	await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
}

export async function revokeAllUserSessions(userId: string) {
	await db.delete(sessions).where(eq(sessions.userId, userId));
}

export function getSessionCookieName() {
	return SESSION_COOKIE_NAME;
}

export function getSessionDuration() {
	return SESSION_DURATION_MS;
}
