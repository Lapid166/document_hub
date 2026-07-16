import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db/client';
import { products, categories, tags, allowedEmailDomains, organizations, aiPrompts, aiPromptMappings } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { requirePermission } from '$lib/server/auth/guards';
import { saveStorageSettings } from '$lib/server/storage/upload';
import { readNineRouterDb, writeNineRouterDb } from '$lib/server/ai/nineRouter';

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

	// Load domains
	const dbDomains = await db
		.select()
		.from(allowedEmailDomains)
		.where(eq(allowedEmailDomains.organizationId, orgId));

	// Load organization settings (for S3 storage settings)
	const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);

	// Load 9router configuration
	const nineRouterDb = await readNineRouterDb();

	// Load AI Prompts
	const dbPrompts = await db
		.select()
		.from(aiPrompts)
		.where(eq(aiPrompts.organizationId, orgId));

	// Load AI Prompt Mappings
	const dbPromptMappings = await db
		.select()
		.from(aiPromptMappings)
		.where(eq(aiPromptMappings.organizationId, orgId));

	return {
		products: dbProducts,
		categories: dbCategories,
		tags: dbTags,
		allowedDomains: dbDomains.map((d) => d.domainPattern),
		storageSettings: (org?.settingsJson as any)?.storage || {
			type: 'local',
			s3: { endpoint: '', accessKey: '', secretKey: '', bucket: '', region: 'us-east-1' }
		},
		nineRouterDb,
		prompts: dbPrompts,
		promptMappings: dbPromptMappings
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
	},

	addDomain: async (event) => {
		requirePermission(event, 'system:settings');
		const orgId = event.locals.user!.organizationId!;
		const userId = event.locals.user!.id;
		const data = await event.request.formData();
		const domainPattern = (data.get('domainPattern') as string || '').trim();

		if (!domainPattern) return fail(400, { message: 'Domain không hợp lệ' });

		try {
			const [existing] = await db
				.select()
				.from(allowedEmailDomains)
				.where(
					and(
						eq(allowedEmailDomains.domainPattern, domainPattern),
						eq(allowedEmailDomains.organizationId, orgId)
					)
				)
				.limit(1);

			if (existing) return fail(400, { message: 'Tên miền đã tồn tại trong danh sách' });

			await db.insert(allowedEmailDomains).values({
				organizationId: orgId,
				domainPattern,
				createdBy: userId
			});
			return { success: true };
		} catch (err: any) {
			return fail(500, { message: err.message || 'Lỗi hệ thống' });
		}
	},

	removeDomain: async (event) => {
		requirePermission(event, 'system:settings');
		const orgId = event.locals.user!.organizationId!;
		const data = await event.request.formData();
		const domainPattern = (data.get('domainPattern') as string || '').trim();

		if (!domainPattern) return fail(400, { message: 'Domain không hợp lệ' });

		try {
			await db
				.delete(allowedEmailDomains)
				.where(
					and(
						eq(allowedEmailDomains.domainPattern, domainPattern),
						eq(allowedEmailDomains.organizationId, orgId)
					)
				);
			return { success: true };
		} catch (err: any) {
			return fail(500, { message: err.message || 'Lỗi hệ thống' });
		}
	},

	updateStorageSettings: async (event) => {
		requirePermission(event, 'system:settings');
		const data = await event.request.formData();
		const type = data.get('type') as 'local' | 's3';
		const endpoint = data.get('endpoint') as string;
		const accessKey = data.get('accessKey') as string;
		const secretKey = data.get('secretKey') as string;
		const bucket = data.get('bucket') as string;
		const region = (data.get('region') as string) || 'us-east-1';

		try {
			await saveStorageSettings(type, { endpoint, accessKey, secretKey, bucket, region });
			return { success: true };
		} catch (err: any) {
			return fail(500, { message: err.message || 'Lỗi hệ thống' });
		}
	},

	syncToS3: async (event) => {
		requirePermission(event, 'system:settings');
		try {
			const { syncLocalToS3 } = await import('$lib/server/storage/upload');
			const result = await syncLocalToS3();
			return { success: true, ...result };
		} catch (err: any) {
			return fail(500, { message: err.message || 'Đồng bộ thất bại' });
		}
	},

	updateNineRouterConfig: async (event) => {
		requirePermission(event, 'system:settings');
		const data = await event.request.formData();
		const connectionsJson = data.get('connectionsJson') as string;
		const modelAliasesJson = data.get('modelAliasesJson') as string;

		try {
			const dbData = await readNineRouterDb();
			if (connectionsJson) {
				dbData.providerConnections = JSON.parse(connectionsJson);
			}
			if (modelAliasesJson) {
				dbData.modelAliases = JSON.parse(modelAliasesJson);
			}
			await writeNineRouterDb(dbData);
			return { success: true };
		} catch (err: any) {
			return fail(500, { message: err.message || 'Lỗi lưu cấu hình 9router' });
		}
	},

	upsertPrompt: async (event) => {
		requirePermission(event, 'system:settings');
		const orgId = event.locals.user!.organizationId!;
		const data = await event.request.formData();
		const id = data.get('id') as string;
		const name = data.get('name') as string;
		const description = data.get('description') as string;
		const systemPrompt = data.get('systemPrompt') as string;
		const temperature = parseFloat(data.get('temperature') as string || '0.7');
		const maxTokens = parseInt(data.get('maxTokens') as string || '2048');
		const modelAlias = data.get('modelAlias') as string;

		if (!name || !systemPrompt || !modelAlias) {
			return fail(400, { message: 'Thiếu thông tin bắt buộc' });
		}

		try {
			if (id) {
				// Update
				await db
					.update(aiPrompts)
					.set({
						name,
						description,
						systemPrompt,
						temperature,
						maxTokens,
						modelAlias,
						updatedAt: new Date()
					})
					.where(and(eq(aiPrompts.id, id), eq(aiPrompts.organizationId, orgId)));
			} else {
				// Insert
				await db.insert(aiPrompts).values({
					organizationId: orgId,
					name,
					description,
					systemPrompt,
					temperature,
					maxTokens,
					modelAlias
				});
			}
			return { success: true };
		} catch (err: any) {
			return fail(500, { message: err.message || 'Lỗi hệ thống' });
		}
	},

	deletePrompt: async (event) => {
		requirePermission(event, 'system:settings');
		const orgId = event.locals.user!.organizationId!;
		const data = await event.request.formData();
		const id = data.get('id') as string;

		if (!id) return fail(400, { message: 'ID không hợp lệ' });

		try {
			await db.delete(aiPrompts).where(and(eq(aiPrompts.id, id), eq(aiPrompts.organizationId, orgId)));
			return { success: true };
		} catch (err: any) {
			return fail(500, { message: err.message || 'Lỗi hệ thống' });
		}
	},

	savePromptMapping: async (event) => {
		requirePermission(event, 'system:settings');
		const orgId = event.locals.user!.organizationId!;
		const data = await event.request.formData();
		const id = data.get('id') as string;
		const featureCode = data.get('featureCode') as string;
		const promptId = data.get('promptId') as string;
		const productId = data.get('productId') as string || null;
		const guestDailyQuota = parseInt(data.get('guestDailyQuota') as string || '10');
		const userDailyQuota = parseInt(data.get('userDailyQuota') as string || '50');
		const enablePow = data.get('enablePow') === 'true';
		const enableFingerprint = data.get('enableFingerprint') === 'true';
		const dailyTokenBudget = parseFloat(data.get('dailyTokenBudget') as string || '5.0');

		if (!featureCode || !promptId) {
			return fail(400, { message: 'Thiếu thông tin bắt buộc' });
		}

		try {
			if (id) {
				await db
					.update(aiPromptMappings)
					.set({
						featureCode,
						promptId,
						productId: productId || null,
						guestDailyQuota,
						userDailyQuota,
						enablePow,
						enableFingerprint,
						dailyTokenBudget,
						updatedAt: new Date()
					})
					.where(and(eq(aiPromptMappings.id, id), eq(aiPromptMappings.organizationId, orgId)));
			} else {
				await db.insert(aiPromptMappings).values({
					organizationId: orgId,
					featureCode,
					promptId,
					productId: productId || null,
					guestDailyQuota,
					userDailyQuota,
					enablePow,
					enableFingerprint,
					dailyTokenBudget
				});
			}
			return { success: true };
		} catch (err: any) {
			return fail(500, { message: err.message || 'Lỗi hệ thống' });
		}
	},

	deletePromptMapping: async (event) => {
		requirePermission(event, 'system:settings');
		const orgId = event.locals.user!.organizationId!;
		const data = await event.request.formData();
		const id = data.get('id') as string;

		if (!id) return fail(400, { message: 'ID không hợp lệ' });

		try {
			await db.delete(aiPromptMappings).where(and(eq(aiPromptMappings.id, id), eq(aiPromptMappings.organizationId, orgId)));
			return { success: true };
		} catch (err: any) {
			return fail(500, { message: err.message || 'Lỗi hệ thống' });
		}
	}
};
