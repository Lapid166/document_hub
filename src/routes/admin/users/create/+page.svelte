<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolveRoute } from '$app/paths';
	import Select from '$lib/components/Select.svelte';

	let { data } = $props();
	let roles = $derived(data.roles || []);

	let email = $state('');
	let displayName = $state('');
	let roleId = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);
	let createdUser = $state<{ userId: string; generatedPassword: string } | null>(null);

	function generatePassword() {
		const prefix = email.split('@')[0].replace(/[^a-zA-Z0-9.]/g, '');
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
		const length = 3 + Math.floor(Math.random() * 3);
		let suffix = '';
		for (let i = 0; i < length; i++) {
			suffix += chars.charAt(Math.floor(Math.random() * chars.length));
		}
		password = prefix + suffix;
	}

	async function handleSubmit() {
		error = '';
		loading = true;
		try {
			const formData = new FormData();
			formData.append('email', email);
			formData.append('displayName', displayName);
			formData.append('roleId', roleId);
			formData.append('password', password);

			const res = await fetch('/admin/users/create', { method: 'POST', body: formData });
			const result = await res.json();

			if (result.success) {
				createdUser = { userId: result.userId, generatedPassword: password };
			} else {
				error = result.error || 'Failed to create user';
			}
		} catch {
			error = 'Network error';
		} finally {
			loading = false;
		}
	}

	function copyAccountInfo() {
		const text = `**Username**: ${displayName}\n**Email**: ${email}\n**Password**: ${createdUser!.generatedPassword}`;
		navigator.clipboard.writeText(text);
	}
</script>

<div class="p-6 max-w-lg">
	<h1 class="text-xl font-bold mb-6">Create User</h1>

	{#if createdUser}
		<div class="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200">
			<h2 class="font-bold text-emerald-700 dark:text-emerald-300 mb-2">
				User Created Successfully
			</h2>
			<div class="text-sm space-y-1 mb-3">
				<p><strong>Email:</strong> {email}</p>
				<p><strong>Display Name:</strong> {displayName}</p>
				<p>
					<strong>Password:</strong>
					<code class="bg-zinc-100 dark:bg-zinc-800 px-1 rounded"
						>{createdUser.generatedPassword}</code
					>
				</p>
			</div>
			<button
				onclick={copyAccountInfo}
				class="px-3 py-1 bg-emerald-500 text-white text-xs rounded-lg"
			>
				Copy Account Info
			</button>
			<button
				onclick={() => goto(resolveRoute('/admin/users'))}
				class="ml-2 px-3 py-1 text-xs text-zinc-500 hover:underline"
			>
				Back to Users
			</button>
		</div>
	{:else}
		<form onsubmit={handleSubmit} class="space-y-4">
			{#if error}
				<p class="text-rose-500 text-sm">{error}</p>
			{/if}

			<label class="block">
				<span class="text-sm font-medium">Email</span>
				<input
					type="email"
					bind:value={email}
					class="mt-1 block w-full rounded-lg border p-2"
					required
				/>
			</label>

			<label class="block">
				<span class="text-sm font-medium">Display Name</span>
				<input
					type="text"
					bind:value={displayName}
					class="mt-1 block w-full rounded-lg border p-2"
					required
				/>
			</label>

			<div class="block">
				<span class="text-sm font-medium">Role</span>
				<div class="mt-1">
					<Select
						id="user-role-create"
						placeholder="Select role..."
						options={roles.map(role => ({ value: role.id, label: role.name }))}
						bind:value={roleId}
					/>
				</div>
			</div>

			<label class="block">
				<span class="text-sm font-medium">Password</span>
				<div class="flex gap-2">
					<input
						type="text"
						bind:value={password}
						class="mt-1 block flex-1 rounded-lg border p-2"
						required
						minlength="8"
					/>
					<button
						type="button"
						onclick={generatePassword}
						class="mt-1 px-3 py-1 bg-zinc-200 dark:bg-zinc-700 rounded-lg text-sm"
					>
						Generate
					</button>
				</div>
			</label>

			<button
				type="submit"
				disabled={loading}
				class="w-full py-2 bg-emerald-500 text-white rounded-lg font-semibold disabled:opacity-50"
			>
				{loading ? 'Creating...' : 'Create User'}
			</button>
		</form>
	{/if}
</div>
