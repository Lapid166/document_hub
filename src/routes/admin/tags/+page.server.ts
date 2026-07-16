import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db/client';
import { tags } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { requirePermission } from '$lib/server/auth/guards';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		throw redirect(302, '/auth?mode=login');
	}
	requirePermission(event, 'tools:read');

	const orgId = event.locals.user.organizationId!;
	const allTags = await db.select().from(tags).where(eq(tags.organizationId, orgId));

	return {
		tags: allTags
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

		if (!name || name.trim() === '') {
			return fail(400, { message: 'Tên thẻ không được để trống' });
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
				.from(tags)
				.where(and(eq(tags.slug, slug), eq(tags.organizationId, orgId)))
				.limit(1);

			if (existing) {
				return fail(400, { message: 'Slug thẻ đã tồn tại' });
			}

			const [inserted] = await db.insert(tags).values({
				organizationId: orgId,
				name,
				slug,
				description
			}).returning();

			return { success: true, tag: inserted };
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
				.from(tags)
				.where(and(eq(tags.slug, slug), eq(tags.organizationId, orgId)))
				.limit(1);

			if (existing && existing.id !== id) {
				return fail(400, { message: 'Slug thẻ đã tồn tại' });
			}

			await db
				.update(tags)
				.set({
					name,
					slug,
					description,
					updatedAt: new Date()
				})
				.where(and(eq(tags.id, id), eq(tags.organizationId, orgId)));

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
			await db.delete(tags).where(and(eq(tags.id, id), eq(tags.organizationId, orgId)));
			return { success: true };
		} catch (err: any) {
			return fail(500, { message: err.message || 'Lỗi hệ thống' });
		}
	}
};
