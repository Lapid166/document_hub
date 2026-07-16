export function hasPermission(permissions: string[], code: string): boolean {
	return permissions.includes(code);
}

export function hasAnyPermission(permissions: string[], codes: string[]): boolean {
	return codes.some((c) => permissions.includes(c));
}

export function hasRole(roles: string[], name: string): boolean {
	return roles.includes(name);
}
