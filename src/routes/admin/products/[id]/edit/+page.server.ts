import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db/client';
import { categories, tags, products, productTags, productVersions } from '$lib/server/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { requirePermission } from '$lib/server/auth/guards';
import { saveFile } from '$lib/server/storage/upload';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		throw redirect(302, '/auth?mode=login');
	}
	requirePermission(event, 'tools:create');

	const orgId = event.locals.user.organizationId!;
	const productId = event.params.id;

	// Load product (supports both ID or Slug)
	const [product] = await db
		.select()
		.from(products)
		.where(
			and(
				or(eq(products.id, productId), eq(products.slug, productId)),
				eq(products.organizationId, orgId)
			)
		)
		.limit(1);

	if (!product) {
		throw redirect(302, '/admin?tab=products');
	}

	// Fetch categories & tags
	const allCategories = await db
		.select()
		.from(categories)
		.where(eq(categories.organizationId, orgId));
	const allTags = await db.select().from(tags).where(eq(tags.organizationId, orgId));

	// Fetch currently selected tags
	const selectedTags = await db
		.select({ tagId: productTags.tagId })
		.from(productTags)
		.where(eq(productTags.productId, product.id));

	// Fetch product versions
	const versions = await db
		.select()
		.from(productVersions)
		.where(eq(productVersions.productId, product.id));

	const formattedProduct = {
		...product,
		slideshowImages: (product.slideshowImages || []) as string[],
		customFields: (product.customFields || {}) as Record<string, string>
	};

	return {
		product: formattedProduct,
		categories: allCategories,
		tags: allTags,
		selectedTagIds: selectedTags.map((t) => t.tagId),
		versions
	};
};

export const actions: Actions = {
	update: async (event) => {
		requirePermission(event, 'tools:create');
		const orgId = event.locals.user!.organizationId!;
		const productId = event.params.id;
		const userId = event.locals.user!.id;
		const data = await event.request.formData();

		// Load product
		const [product] = await db
			.select()
			.from(products)
			.where(
				and(
					or(eq(products.id, productId), eq(products.slug, productId)),
					eq(products.organizationId, orgId)
				)
			)
			.limit(1);

		if (!product) {
			return fail(404, { message: 'Không tìm thấy sản phẩm' });
		}

		// Owner/RBAC check: Only creator or Super Admin can edit
		const isSuperAdmin = event.locals.roles?.includes('super_admin');
		if (product.createdBy !== userId && !isSuperAdmin) {
			return fail(403, { message: 'Bạn không có quyền chỉnh sửa sản phẩm này.' });
		}

		// Basic fields
		const name = data.get('name') as string;
		let slug = data.get('slug') as string;
		const categoryId = data.get('categoryId') as string || null;
		const description = data.get('description') as string;
		const detailedDescription = data.get('detailedDescription') as string;
		const icon = data.get('icon') as string || 'icon-[lucide--package]';
		const iconColor = data.get('iconColor') as string || 'text-emerald-500 bg-emerald-500/10';

		// Tech specs
		const liveDemoUrl = data.get('liveDemoUrl') as string;
		const wpVersion = data.get('wpVersion') as string;
		const phpVersion = data.get('phpVersion') as string;
		const author = data.get('author') as string || 'Team';
		const enableDownload = data.get('enableDownload') === 'true';

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
			// Check unique slug (excluding current product)
			const [existing] = await db
				.select()
				.from(products)
				.where(and(eq(products.slug, slug), eq(products.organizationId, orgId)))
				.limit(1);

			if (existing && existing.id !== product.id) {
				return fail(400, { message: 'Đường dẫn Slug đã được sử dụng bởi sản phẩm khác.' });
			}

			// Handle slideshow files (append new uploads if any)
			const slideshowFiles = data.getAll('slideshowFiles') as File[];
			let slideshowUrls = [...(product.slideshowImages as string[])];

			// If user uploaded new slideshow files, we upload them and update
			const hasNewSlides = slideshowFiles.some((f) => f && f.size > 0);
			if (hasNewSlides) {
				const newUrls: string[] = [];
				for (const file of slideshowFiles) {
					if (file && file.size > 0) {
						const buffer = Buffer.from(await file.arrayBuffer());
						const uploadRes = await saveFile(file.name, buffer, file.type);
						newUrls.push(uploadRes.url);
					}
				}
				slideshowUrls = newUrls; // Replace slideshow with new set of uploads
			}

			// Handle Custom Fields JSON parsing
			const customFieldsJson = data.get('customFieldsJson') as string;
			let customFields = {};
			if (customFieldsJson) {
				try {
					customFields = JSON.parse(customFieldsJson);
				} catch (e) {
					// Ignore invalid JSON
				}
			}

			// Update product
			await db
				.update(products)
				.set({
					name,
					slug,
					categoryId,
					description,
					detailedDescription,
					icon,
					iconColor,
					liveDemoUrl,
					wpVersion,
					phpVersion,
					author,
					slideshowImages: slideshowUrls,
					customFields,
					enableDownload,
					updatedAt: new Date()
				})
				.where(eq(products.id, product.id));

			// Re-associate tags
			await db.delete(productTags).where(eq(productTags.productId, product.id));
			const tagIds = data.getAll('tagIds') as string[];
			for (const tagId of tagIds) {
				await db.insert(productTags).values({
					productId: product.id,
					tagId: tagId
				});
			}

			return { success: true };
		} catch (err: any) {
			return fail(500, { message: err.message || 'Lỗi hệ thống' });
		}
	},

	addVersion: async (event) => {
		requirePermission(event, 'tools:create');
		const orgId = event.locals.user!.organizationId!;
		const productId = event.params.id;
		const userId = event.locals.user!.id;
		const data = await event.request.formData();

		// Load product
		const [product] = await db
			.select()
			.from(products)
			.where(
				and(
					or(eq(products.id, productId), eq(products.slug, productId)),
					eq(products.organizationId, orgId)
				)
			)
			.limit(1);

		if (!product) {
			return fail(404, { message: 'Không tìm thấy sản phẩm' });
		}

		// Owner/RBAC check
		const isSuperAdmin = event.locals.roles?.includes('super_admin');
		if (product.createdBy !== userId && !isSuperAdmin) {
			return fail(403, { message: 'Bạn không có quyền quản lý phiên bản cho sản phẩm này.' });
		}

		const versionNumber = (data.get('versionNumber') as string || '').trim();
		const changelogRaw = data.get('changelogRaw') as string || '';
		const makeActive = data.get('makeActive') === 'true';
		const downloadFile = data.get('downloadFile') as File;

		if (!versionNumber) {
			return fail(400, { message: 'Số phiên bản không được để trống' });
		}

		if (!downloadFile || downloadFile.size === 0) {
			return fail(400, { message: 'Vui lòng tải lên tệp tin phiên bản sản phẩm (.zip)' });
		}

		try {
			const buffer = Buffer.from(await downloadFile.arrayBuffer());
			const uploadRes = await saveFile(downloadFile.name, buffer, downloadFile.type);

			// Check unique version number for this product
			const [existingVer] = await db
				.select()
				.from(productVersions)
				.where(
					and(
						eq(productVersions.productId, product.id),
						eq(productVersions.versionNumber, versionNumber)
					)
				)
				.limit(1);

			if (existingVer) {
				return fail(400, { message: 'Số phiên bản này đã tồn tại cho sản phẩm này.' });
			}

			// Atomic transaction logic:
			await db.transaction(async (tx) => {
				if (makeActive) {
					// Set all other versions to inactive
					await tx
						.update(productVersions)
						.set({ isCurrentActive: false })
						.where(eq(productVersions.productId, product.id));
				}

				// Insert new version
				await tx.insert(productVersions).values({
					productId: product.id,
					versionNumber,
					changelogRaw,
					downloadUrl: uploadRes.url,
					fileSize: uploadRes.size,
					fileType: uploadRes.type,
					isCurrentActive: makeActive,
					createdBy: userId
				});

				if (makeActive) {
					// Update product downloadUrl to point to this new version
					await tx
						.update(products)
						.set({
							downloadUrl: uploadRes.url,
							fileSize: uploadRes.size,
							fileType: uploadRes.type,
							updatedAt: new Date()
						})
						.where(eq(products.id, product.id));
				}
			});

			return { success: true };
		} catch (err: any) {
			return fail(500, { message: err.message || 'Lỗi hệ thống khi thêm phiên bản' });
		}
	},

	setActiveVersion: async (event) => {
		requirePermission(event, 'tools:create');
		const orgId = event.locals.user!.organizationId!;
		const productId = event.params.id;
		const userId = event.locals.user!.id;
		const data = await event.request.formData();
		const versionId = data.get('versionId') as string;

		// Load product
		const [product] = await db
			.select()
			.from(products)
			.where(
				and(
					or(eq(products.id, productId), eq(products.slug, productId)),
					eq(products.organizationId, orgId)
				)
			)
			.limit(1);

		if (!product || !versionId) {
			return fail(404, { message: 'Sản phẩm hoặc phiên bản không hợp lệ' });
		}

		// Owner/RBAC check
		const isSuperAdmin = event.locals.roles?.includes('super_admin');
		if (product.createdBy !== userId && !isSuperAdmin) {
			return fail(403, { message: 'Bạn không có quyền sửa sản phẩm này.' });
		}

		try {
			const [targetVersion] = await db
				.select()
				.from(productVersions)
				.where(and(eq(productVersions.id, versionId), eq(productVersions.productId, product.id)))
				.limit(1);

			if (!targetVersion) {
				return fail(404, { message: 'Không tìm thấy phiên bản yêu cầu' });
			}

			await db.transaction(async (tx) => {
				// Deactivate all versions of this product
				await tx
					.update(productVersions)
					.set({ isCurrentActive: false })
					.where(eq(productVersions.productId, product.id));

				// Activate the target version
				await tx
					.update(productVersions)
					.set({ isCurrentActive: true, updatedAt: new Date() })
					.where(eq(productVersions.id, versionId));

				// Update product downloadUrl to point to active version details
				await tx
					.update(products)
					.set({
						downloadUrl: targetVersion.downloadUrl,
						fileSize: targetVersion.fileSize,
						fileType: targetVersion.fileType,
						updatedAt: new Date()
					})
					.where(eq(products.id, product.id));
			});

			return { success: true };
		} catch (err: any) {
			return fail(500, { message: err.message || 'Lỗi hệ thống khi thiết lập phiên bản hoạt động' });
		}
	},

	deleteVersion: async (event) => {
		requirePermission(event, 'tools:create');
		const orgId = event.locals.user!.organizationId!;
		const productId = event.params.id;
		const userId = event.locals.user!.id;
		const data = await event.request.formData();
		const versionId = data.get('versionId') as string;

		// Load product
		const [product] = await db
			.select()
			.from(products)
			.where(
				and(
					or(eq(products.id, productId), eq(products.slug, productId)),
					eq(products.organizationId, orgId)
				)
			)
			.limit(1);

		if (!product || !versionId) {
			return fail(404, { message: 'Thông tin không hợp lệ' });
		}

		// Owner/RBAC check
		const isSuperAdmin = event.locals.roles?.includes('super_admin');
		if (product.createdBy !== userId && !isSuperAdmin) {
			return fail(403, { message: 'Bạn không có quyền sửa sản phẩm này.' });
		}

		try {
			const [targetVersion] = await db
				.select()
				.from(productVersions)
				.where(and(eq(productVersions.id, versionId), eq(productVersions.productId, product.id)))
				.limit(1);

			if (!targetVersion) {
				return fail(404, { message: 'Không tìm thấy phiên bản' });
			}

			await db.transaction(async (tx) => {
				// Delete the version record
				await tx.delete(productVersions).where(eq(productVersions.id, versionId));

				if (targetVersion.isCurrentActive) {
					// Find another version to make active
					const [newActive] = await tx
						.select()
						.from(productVersions)
						.where(eq(productVersions.productId, product.id))
						.limit(1);

					if (newActive) {
						await tx
							.update(productVersions)
							.set({ isCurrentActive: true })
							.where(eq(productVersions.id, newActive.id));

						await tx
							.update(products)
							.set({
								downloadUrl: newActive.downloadUrl,
								fileSize: newActive.fileSize,
								fileType: newActive.fileType,
								updatedAt: new Date()
							})
							.where(eq(products.id, product.id));
					} else {
						// No versions left
						await tx
							.update(products)
							.set({
								downloadUrl: null,
								fileSize: null,
								fileType: null,
								updatedAt: new Date()
							})
							.where(eq(products.id, product.id));
					}
				}
			});

			return { success: true };
		} catch (err: any) {
			return fail(500, { message: err.message || 'Lỗi hệ thống khi xóa phiên bản' });
		}
	}
};
