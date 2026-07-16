import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db/client';
import { allowedEmailDomains, organizations } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { requirePermission } from '$lib/server/auth/guards';
import { saveStorageSettings } from '$lib/server/storage/upload';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		throw redirect(302, '/auth?mode=login');
	}
	requirePermission(event, 'tools:read');

	const orgId = event.locals.user.organizationId!;

	// Load domains
	const dbDomains = await db
		.select()
		.from(allowedEmailDomains)
		.where(eq(allowedEmailDomains.organizationId, orgId));

	// Load organization settings (for S3 storage settings)
	const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);

	return {
		allowedDomains: dbDomains.map((d) => d.domainPattern),
		storageSettings: (org?.settingsJson as any)?.storage || {
			type: 'local',
			s3: { endpoint: '', accessKey: '', secretKey: '', bucket: '', region: 'us-east-1' }
		}
	};
};

export const actions: Actions = {
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
	}
};
