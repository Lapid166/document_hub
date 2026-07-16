import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db/client';
import { users, userTwoFactorSettings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { auditLog } from '$lib/server/auth/audit';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) throw redirect(302, '/auth?mode=login');

	const [user] = await db
		.select({
			id: users.id,
			email: users.email,
			displayName: users.displayName,
			avatarUrl: users.avatarUrl,
			bio: users.bio
		})
		.from(users)
		.where(eq(users.id, event.locals.user.id))
		.limit(1);

	const [twoFa] = await db
		.select()
		.from(userTwoFactorSettings)
		.where(eq(userTwoFactorSettings.userId, event.locals.user.id))
		.limit(1);

	return { profile: user, twoFaEnabled: twoFa?.isEnabled ?? false };
};

export const actions: Actions = {
	updateProfile: async (event) => {
		const user = event.locals.user;
		if (!user) throw redirect(302, '/auth?mode=login');

		const formData = await event.request.formData();
		const displayName = String(formData.get('displayName') || '');
		const avatarUrl = String(formData.get('avatarUrl') || '');
		const bio = String(formData.get('bio') || '');

		await db
			.update(users)
			.set({
				displayName: displayName || undefined,
				avatarUrl: avatarUrl || undefined,
				bio: bio || undefined,
				updatedAt: new Date()
			})
			.where(eq(users.id, user.id));

		await auditLog({
			organizationId: user.organizationId,
			userId: user.id,
			action: 'profile_update'
		});

		return { success: true };
	}
};
