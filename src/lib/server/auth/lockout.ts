import { db } from '../db/client';
import { securityEvents } from '../db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

const MAX_FAILURES = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

export async function recordLoginFailure(organizationId: string, email: string, ip?: string) {
	await db.insert(securityEvents).values({
		organizationId,
		eventType: 'login_failure',
		severity: 'medium',
		detailsJson: { email, ip }
	});
}

export async function isLockedOut(organizationId: string, email: string): Promise<boolean> {
	const since = new Date(Date.now() - LOCKOUT_WINDOW_MS);
	const [result] = await db
		.select({ count: sql<number>`count(*)::int` })
		.from(securityEvents)
		.where(
			and(
				eq(securityEvents.organizationId, organizationId),
				eq(securityEvents.eventType, 'login_failure'),
				gte(securityEvents.createdAt, since),
				sql`details_json->>'email' = ${email}`
			)
		);

	return (result?.count ?? 0) >= MAX_FAILURES;
}
