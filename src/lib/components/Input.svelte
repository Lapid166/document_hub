<script lang="ts">
	interface InputProps {
		id: string;
		name?: string;
		label?: string;
		value?: string;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		error?: string;
		type?: string;
		icon?: string; // Iconify class e.g., 'icon-[lucide--mail]'
	}

	let {
		id,
		name,
		label,
		value = $bindable(''),
		placeholder,
		required = false,
		disabled = false,
		error,
		type = 'text',
		icon = ''
	}: InputProps = $props();

	// Password visibility toggle state
	let showPassword = $state(false);

	// Derived type for input element
	let inputType = $derived(type === 'password' ? (showPassword ? 'text' : 'password') : type);
</script>

<div>
	{#if label}
		<label
			class="mb-1 block text-[10px] font-medium uppercase tracking-wider text-zinc-400"
			for={id}>{label}</label
		>
	{/if}

	<div class="relative flex items-center">
		<!-- Left Icon -->
		{#if icon}
			<span
				class="absolute left-3 text-zinc-400 dark:text-zinc-500 pointer-events-none {icon} w-5 h-5"
			></span>
		{/if}

		<!-- Input Element -->
		<input
			{id}
			{name}
			type={inputType}
			bind:value
			{placeholder}
			{required}
			{disabled}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={error ? `${id}-error` : undefined}
			class="w-full rounded-xl border bg-zinc-50 py-2 text-sm text-zinc-900 transition-colors duration-200 placeholder:text-zinc-400 focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-50 focus:outline-none
			{icon ? 'pl-10' : 'pl-3'} 
			{type === 'password' ? 'pr-10' : 'pr-3'}
			{error
				? 'border-rose-400 focus:border-rose-500 dark:border-rose-500/60'
				: 'border-zinc-200 focus:border-emerald-500'}"
		/>

		<!-- Right Eye Toggle (Only for password type) -->
		{#if type === 'password'}
			<button
				type="button"
				onclick={() => (showPassword = !showPassword)}
				class="absolute right-3 text-zinc-400 hover:text-zinc-650 dark:text-zinc-500 dark:hover:text-zinc-300 focus:outline-none cursor-pointer"
				aria-label={showPassword ? 'Hide password' : 'Show password'}
			>
				{#if showPassword}
					<span class="icon-[lucide--eye-off] w-5 h-5 block"></span>
				{:else}
					<span class="icon-[lucide--eye] w-5 h-5 block"></span>
				{/if}
			</button>
		{/if}
	</div>

	{#if error}
		<p id="{id}-error" class="mt-1 text-xs text-rose-500">{error}</p>
	{/if}
</div>
