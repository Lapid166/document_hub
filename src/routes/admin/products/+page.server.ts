import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db/client';
import { products, categories, tags } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { requirePermission } from '$lib/server/auth/guards';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		throw redirect(302, '/auth?mode=login');
	}
	requirePermission(event, 'tools:read');

	const orgId = event.locals.user.organizationId!;

	// Load products
	const dbProducts = await db
		.select()
		.from(products)
		.where(eq(products.organizationId, orgId));

	// Load categories & tags for counts/filters
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

export const actions: Actions = {
	deleteProduct: async (event) => {
		requirePermission(event, 'tools:publish');
		const orgId = event.locals.user!.organizationId!;
		const userId = event.locals.user!.id;
		const data = await event.request.formData();
		const id = data.get('id') as string;

		if (!id) return fail(400, { message: 'ID không hợp lệ' });

		try {
			const [product] = await db
				.select()
				.from(products)
				.where(and(eq(products.id, id), eq(products.organizationId, orgId)))
				.limit(1);

			if (!product) {
				return fail(404, { message: 'Không tìm thấy sản phẩm' });
			}

			// Check permissions: Only creator or Super Admin can delete
			const isSuperAdmin = event.locals.roles?.includes('super_admin');
			if (product.createdBy !== userId && !isSuperAdmin) {
				return fail(403, { message: 'Bạn không có quyền xóa sản phẩm này.' });
			}

			await db.delete(products).where(eq(products.id, id));
			return { success: true };
		} catch (err: any) {
			return fail(500, { message: err.message || 'Lỗi hệ thống' });
		}
	}
};
