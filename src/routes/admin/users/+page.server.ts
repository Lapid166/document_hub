import type { PageServerLoad } from './$types';
import { requirePermission } from '$lib/server/auth/guards';
import { db } from '$lib/server/db/client';
import { users, userRoles, roles } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	requirePermission(event, 'users:read');

	const orgId = event.locals.user!.organizationId!;

	const rows = await db
		.select({
			id: users.id,
			email: users.email,
			displayName: users.displayName,
			isActive: users.isActive,
			lastLoginAt: users.lastLoginAt,
			roleName: roles.name,
			roleId: roles.id
		})
		.from(users)
		.leftJoin(userRoles, eq(users.id, userRoles.userId))
		.leftJoin(roles, eq(userRoles.roleId, roles.id))
		.where(eq(users.organizationId, orgId))
		.orderBy(users.createdAt);

	return { users: rows };
};
