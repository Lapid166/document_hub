<script lang="ts">
	import { resolveRoute } from '$app/paths';
	let { data } = $props();
	let users = $derived(data.users || []);

	async function forceLogout(userId: string) {
		if (!confirm('Force logout this user?')) return;
		await fetch(`/admin/users/${userId}/force-logout`, { method: 'POST' });
		location.reload();
	}

	async function toggleStatus(userId: string, currentActive: boolean) {
		await fetch(`/admin/users/${userId}/status`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ isActive: !currentActive })
		});
		location.reload();
	}

	async function resetPassword(userId: string) {
		if (!confirm('Reset password? New password will be shown once.')) return;
		const res = await fetch(`/admin/users/${userId}/reset-password`, { method: 'POST' });
		const result = await res.json();
		if (result.success) {
			navigator.clipboard.writeText(result.newPassword);
			alert(`New password copied to clipboard:\n${result.newPassword}`);
		}
	}
</script>

<div class="p-6">
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-xl font-bold">User Management</h1>
		<a
			href={resolveRoute('/admin/users/create')}
			class="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold"
		>
			+ Create User
		</a>
	</div>

	<div class="overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b">
					<th class="text-left py-2">Name</th>
					<th class="text-left py-2">Email</th>
					<th class="text-left py-2">Role</th>
					<th class="text-left py-2">Status</th>
					<th class="text-right py-2">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each users as user (user.id)}
					<tr class="border-b">
						<td class="py-2">{user.displayName}</td>
						<td class="py-2">{user.email}</td>
						<td class="py-2">{user.roleName}</td>
						<td class="py-2">
							<span class={user.isActive ? 'text-emerald-500' : 'text-rose-500'}>
								{user.isActive ? 'Active' : 'Inactive'}
							</span>
						</td>
						<td class="py-2 text-right space-x-2">
							<button
								onclick={() => resetPassword(user.id)}
								class="text-xs text-amber-500 hover:underline">Reset PW</button
							>
							<button
								onclick={() => forceLogout(user.id)}
								class="text-xs text-rose-500 hover:underline">Force Logout</button
							>
							<button
								onclick={() => toggleStatus(user.id, user.isActive ?? false)}
								class="text-xs text-zinc-500 hover:underline"
							>
								{user.isActive ? 'Deactivate' : 'Activate'}
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
