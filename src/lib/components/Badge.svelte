<script lang="ts">
	import type { Snippet } from 'svelte';

	type BadgeVariant = 'neutral' | 'success' | 'info' | 'warning' | 'danger';

	interface BadgeProps {
		variant?: BadgeVariant;
		class?: string;
		children?: Snippet;
	}

	let { variant = 'neutral', class: className = '', children }: BadgeProps = $props();

	const variantClass: Record<BadgeVariant, string> = {
		neutral: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800/70 dark:text-zinc-300',
		success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
		info: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
		warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
		danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
	};
</script>

<span
	class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium {variantClass[
		variant
	]} {className}"
>
	{#if children}{@render children()}{/if}
</span>
