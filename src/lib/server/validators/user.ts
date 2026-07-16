import { z } from 'zod';

export const createUserSchema = z.object({
	email: z.string().email(),
	displayName: z.string().min(1).max(255),
	roleId: z.string().uuid(),
	password: z.string().min(8).max(128)
});

export const resetPasswordSchema = z.object({
	newPassword: z.string().min(8).max(128)
});

export const updateStatusSchema = z.object({
	isActive: z.boolean()
});

export const assignRoleSchema = z.object({
	roleId: z.string().uuid()
});
