import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import { products, categories, tags } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { requirePermission } from '$lib/server/auth/guards';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		throw redirect(302, '/auth?mode=login');
	}
	requirePermission(event, 'tools:read');

	const orgId = event.locals.user.organizationId!;

	// Load products for overview metrics
	const dbProducts = await db
		.select()
		.from(products)
		.where(eq(products.organizationId, orgId));

	// Load categories & tags for counts
	const dbCategories = await db
		.select()
		.from(categories)
		.where(eq(categories.organizationId, orgId));
	const dbTags = await db.select().from(tags).where(eq(tags.organizationId, orgId));

	return {
		products: dbProducts,
		categories: dbCategories,
		tags: dbTags
	};
};
