import { db } from '../db/client';
import { allowedEmailDomains } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function isEmailAllowed(email: string, organizationId: string): Promise<boolean> {
	const domain = email.split('@')[1]?.toLowerCase();
	if (!domain) return false;

	const allowed = await db
		.select()
		.from(allowedEmailDomains)
		.where(eq(allowedEmailDomains.organizationId, organizationId));

	return allowed.some((a) => {
		const pattern = a.domainPattern.toLowerCase();
		return domain === pattern || domain.endsWith('.' + pattern);
	});
}
