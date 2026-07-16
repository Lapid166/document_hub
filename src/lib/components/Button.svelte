<script lang="ts">
	import type { Snippet } from 'svelte';

	type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft';
	type ButtonSize = 'sm' | 'md' | 'lg';

	interface Props {
		variant?: ButtonVariant;
		size?: ButtonSize;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		loading?: boolean;
		class?: string;
		children?: Snippet;
		onclick?: (event: MouseEvent) => void;
	}

	let {
		variant = 'primary',
		size = 'md',
		type = 'button',
		disabled = false,
		loading = false,
		class: className = '',
		children,
		onclick
	}: Props = $props();

	const variantClass: Record<ButtonVariant, string> = {
		primary:
			'bg-gradient-to-r from-emerald-500 to-sky-500 text-white shadow-sm hover:from-emerald-400 hover:to-sky-400',
		secondary:
			'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800/60',
		ghost:
			'text-zinc-500 hover:bg-zinc-100/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50',
		danger: 'bg-rose-500 text-white shadow-sm hover:bg-rose-400',
		soft: 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-400'
	};

	const sizeClass: Record<ButtonSize, string> = {
		sm: 'px-3 py-1.5 text-xs',
		md: 'px-4 py-2 text-sm',
		lg: 'px-5 py-2.5 text-base'
	};
</script>

<button
	{type}
	disabled={disabled || loading}
	class="inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] disabled:pointer-events-none disabled:opacity-50 {variantClass[
		variant
	]} {sizeClass[size]} {className}"
	{onclick}
>
	{#if loading}
		<span class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
		></span>
	{/if}
	{#if children}{@render children()}{/if}
</button>
