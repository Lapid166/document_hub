// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Error {
			code?: string;
			message: string;
		}
		interface Locals {
			user: {
				id: string;
				email: string;
				displayName: string | null;
				avatarUrl: string | null;
				organizationId: string | null;
				mustChangePassword: boolean;
			} | null;
			roles: string[];
			permissions: string[];
			sessionToken: string | null;
		}
	}
}

export {};
