import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db/client';
import { categories, tags, products, productTags, productVersions } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { requirePermission } from '$lib/server/auth/guards';
import { saveFile } from '$lib/server/storage/upload';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		throw redirect(302, '/auth?mode=login');
	}
	requirePermission(event, 'tools:create');

	const orgId = event.locals.user.organizationId!;
	const allCategories = await db
		.select()
		.from(categories)
		.where(eq(categories.organizationId, orgId));
	const allTags = await db.select().from(tags).where(eq(tags.organizationId, orgId));

	return {
		categories: allCategories,
		tags: allTags
	};
};

export const actions: Actions = {
	create: async (event) => {
		requirePermission(event, 'tools:create');
		const orgId = event.locals.user!.organizationId!;
		const userId = event.locals.user!.id;
		const data = await event.request.formData();

		// Basic Fields
		const name = data.get('name') as string;
		let slug = data.get('slug') as string;
		const categoryId = data.get('categoryId') as string || null;
		const description = data.get('description') as string;
		const detailedDescription = data.get('detailedDescription') as string;
		const icon = data.get('icon') as string || 'icon-[lucide--package]';
		const iconColor = data.get('iconColor') as string || 'text-emerald-500 bg-emerald-500/10';

		// Tech Specs
		const liveDemoUrl = data.get('liveDemoUrl') as string;
		const wpVersion = data.get('wpVersion') as string;
		const phpVersion = data.get('phpVersion') as string;
		const author = data.get('author') as string || 'Team';

		// Enable download checkbox
		const enableDownload = data.get('enableDownload') === 'true';

		// Validation
		if (!name || name.trim() === '') {
			return fail(400, { message: 'Tên sản phẩm không được để trống' });
		}

		if (!slug || slug.trim() === '') {
			slug = name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/(^-|-$)/g, '');
		}
		slug = slug.trim();

		try {
			// Check unique slug
			const [existing] = await db
				.select()
				.from(products)
				.where(and(eq(products.slug, slug), eq(products.organizationId, orgId)))
				.limit(1);

			if (existing) {
				return fail(400, { message: 'Đường dẫn Slug đã được sử dụng bởi sản phẩm khác.' });
			}

			// Handle slideshow images upload
			const slideshowFiles = data.getAll('slideshowFiles') as File[];
			const slideshowUrls: string[] = [];
			for (const file of slideshowFiles) {
				if (file && file.size > 0) {
					const buffer = Buffer.from(await file.arrayBuffer());
					const uploadRes = await saveFile(file.name, buffer, file.type);
					slideshowUrls.push(uploadRes.url);
				}
			}

			// Handle Custom Fields JSON parsing
			const customFieldsJson = data.get('customFieldsJson') as string;
			let customFields = {};
			if (customFieldsJson) {
				try {
					customFields = JSON.parse(customFieldsJson);
				} catch (e) {
					// Ignore invalid JSON or fallback
				}
			}

			// File Upload details (initial version details if enableDownload is active)
			let downloadUrl = '';
			let fileSize = '';
			let fileType = '';
			let versionNumber = 'v1.0.0';
			let changelogRaw = 'Phiên bản đầu tiên.';

			if (enableDownload) {
				const downloadFile = data.get('downloadFile') as File;
				if (downloadFile && downloadFile.size > 0) {
					const buffer = Buffer.from(await downloadFile.arrayBuffer());
					const uploadRes = await saveFile(downloadFile.name, buffer, downloadFile.type);
					downloadUrl = uploadRes.url;
					fileSize = uploadRes.size;
					fileType = uploadRes.type;
				}
				versionNumber = (data.get('versionNumber') as string || 'v1.0.0').trim();
				changelogRaw = data.get('changelogRaw') as string || 'Phiên bản đầu tiên.';
			}

			// Insert product
			const [seededProd] = await db
				.insert(products)
				.values({
					organizationId: orgId,
					slug,
					name,
					categoryId,
					description,
					detailedDescription,
					icon,
					iconColor,
					liveDemoUrl,
					downloadUrl: enableDownload ? downloadUrl : null,
					fileSize: enableDownload ? fileSize : null,
					fileType: enableDownload ? fileType : null,
					wpVersion,
					phpVersion,
					author,
					slideshowImages: slideshowUrls,
					customFields,
					enableDownload,
					createdBy: userId
				})
				.returning();

			// Associate selected tags
			const tagIds = data.getAll('tagIds') as string[];
			for (const tagId of tagIds) {
				await db.insert(productTags).values({
					productId: seededProd.id,
					tagId: tagId
				});
			}

			// Seed initial version in product_versions
			if (enableDownload) {
				await db.insert(productVersions).values({
					productId: seededProd.id,
					versionNumber,
					changelogRaw,
					downloadUrl,
					fileSize,
					fileType,
					isCurrentActive: true,
					createdBy: userId
				});
			}

			throw redirect(303, '/admin?tab=products');
		} catch (err: any) {
			if (err.status === 303) throw err; // Allow redirect to go through
			return fail(500, { message: err.message || 'Lỗi hệ thống khi lưu sản phẩm' });
		}
	}
};
