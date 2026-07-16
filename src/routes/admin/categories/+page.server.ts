import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db/client';
import { categories } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { requirePermission } from '$lib/server/auth/guards';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		throw redirect(302, '/auth?mode=login');
	}
	requirePermission(event, 'tools:read');

	const orgId = event.locals.user.organizationId!;
	const allCategories = await db
		.select()
		.from(categories)
		.where(eq(categories.organizationId, orgId));

	return {
		categories: allCategories
	};
};

export const actions: Actions = {
	create: async (event) => {
		requirePermission(event, 'tools:create');
		const orgId = event.locals.user!.organizationId!;
		const data = await event.request.formData();
		const name = data.get('name') as string;
		let slug = data.get('slug') as string;
		const description = data.get('description') as string;
		const parentIdStr = data.get('parentId') as string;
		const parentId = parentIdStr && parentIdStr !== '' ? parentIdStr : null;
		const layoutType = data.get('layoutType') as string || 'plugin_tools_game';

		if (!name || name.trim() === '') {
			return fail(400, { message: 'Tên danh mục không được để trống' });
		}

		if (!slug || slug.trim() === '') {
			slug = name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/(^-|-$)/g, '');
		}
		slug = slug.trim();

		try {
			const [existing] = await db
				.select()
				.from(categories)
				.where(and(eq(categories.slug, slug), eq(categories.organizationId, orgId)))
				.limit(1);

			if (existing) {
				return fail(400, { message: 'Slug danh mục đã tồn tại' });
			}

			const [inserted] = await db.insert(categories).values({
				organizationId: orgId,
				name,
				slug,
				description,
				layoutType,
				parentId
			}).returning();

			return { success: true, category: inserted };
		} catch (err: any) {
			return fail(500, { message: err.message || 'Lỗi hệ thống' });
		}
	},
	update: async (event) => {
		requirePermission(event, 'tools:create');
		const orgId = event.locals.user!.organizationId!;
		const data = await event.request.formData();
		const id = data.get('id') as string;
		const name = data.get('name') as string;
		let slug = data.get('slug') as string;
		const description = data.get('description') as string;
		const parentIdStr = data.get('parentId') as string;
		const parentId = parentIdStr && parentIdStr !== '' ? parentIdStr : null;
		const layoutType = data.get('layoutType') as string || 'plugin_tools_game';

		if (!id || !name || name.trim() === '') {
			return fail(400, { message: 'Thông tin không hợp lệ' });
		}

		if (!slug || slug.trim() === '') {
			slug = name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/(^-|-$)/g, '');
		}
		slug = slug.trim();

		try {
			const [existing] = await db
				.select()
				.from(categories)
				.where(and(eq(categories.slug, slug), eq(categories.organizationId, orgId)))
				.limit(1);

			if (existing && existing.id !== id) {
				return fail(400, { message: 'Slug danh mục đã tồn tại' });
			}

			await db
				.update(categories)
				.set({
					name,
					slug,
					description,
					layoutType,
					parentId,
					updatedAt: new Date()
				})
				.where(and(eq(categories.id, id), eq(categories.organizationId, orgId)));

			return { success: true };
		} catch (err: any) {
			return fail(500, { message: err.message || 'Lỗi hệ thống' });
		}
	},
	delete: async (event) => {
		requirePermission(event, 'tools:create');
		const orgId = event.locals.user!.organizationId!;
		const data = await event.request.formData();
		const id = data.get('id') as string;

		if (!id) {
			return fail(400, { message: 'ID không hợp lệ' });
		}

		try {
			await db
				.update(categories)
				.set({ parentId: null })
				.where(and(eq(categories.parentId, id), eq(categories.organizationId, orgId)));

			await db
				.delete(categories)
				.where(and(eq(categories.id, id), eq(categories.organizationId, orgId)));

			return { success: true };
		} catch (err: any) {
			return fail(500, { message: err.message || 'Lỗi hệ thống' });
		}
	}
};
