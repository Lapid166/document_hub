import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db/client';
import { products, aiPrompts, aiPromptMappings } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { requirePermission } from '$lib/server/auth/guards';
import { readNineRouterDb, writeNineRouterDb } from '$lib/server/ai/nineRouter';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		throw redirect(302, '/auth?mode=login');
	}
	requirePermission(event, 'tools:read');

	const orgId = event.locals.user.organizationId!;

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

	// Load products for dropdown assignment
	const dbProducts = await db
		.select()
		.from(products)
		.where(eq(products.organizationId, orgId));

	return {
		products: dbProducts,
		nineRouterDb,
		prompts: dbPrompts,
		promptMappings: dbPromptMappings
	};
};

export const actions: Actions = {
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
