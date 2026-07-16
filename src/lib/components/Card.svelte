<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		span?: string;
		hover?: boolean;
		children?: Snippet;
	}

	let { span = '', hover = false, children }: Props = $props();
</script>

<section
	class="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] dark:border-zinc-800 dark:bg-zinc-900 {hover
		? 'hover:-translate-y-0.5 hover:border-emerald-500/20 hover:shadow-[0_8px_30px_rgba(24,24,27,0.06)]'
		: ''} {span}"
>
	{#if children}{@render children()}{/if}
</section>
