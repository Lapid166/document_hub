<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	interface ModalProps {
		open?: boolean;
		title?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl' | '80';
		children?: Snippet;
		footer?: Snippet;
		onclose?: () => void;
		overflowVisible?: boolean;
	}

	let {
		open = $bindable(false),
		title,
		size = 'md',
		children,
		footer,
		onclose,
		overflowVisible = false
	}: ModalProps = $props();

	const sizeClass: Record<NonNullable<ModalProps['size']>, string> = {
		sm: 'max-w-sm',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl',
		'80': 'max-w-[80vw] w-[80vw] h-[80vh] md:h-[80vh] flex flex-col justify-between'
	};

	function close() {
		open = false;
		onclose?.();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (open && event.key === 'Escape') close();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<!-- Backdrop -->
		<button
			type="button"
			aria-label="Close modal"
			class="absolute inset-0 bg-zinc-950/30 backdrop-blur-sm transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] dark:bg-zinc-950/60"
			onclick={close}
		></button>

		<!-- Dialog Body -->
		<div
			role="dialog"
			aria-modal="true"
			aria-label={title}
			tabindex="-1"
			class="relative z-10 w-full {sizeClass[
				size
			]} {overflowVisible ? 'overflow-visible' : 'overflow-hidden'} rounded-2xl border border-zinc-200/30 bg-white shadow-xl dark:border-zinc-800/30 dark:bg-zinc-900 transition-all duration-300"
		>
			{#if title}
				<header
					class="border-b border-zinc-200/30 px-6 py-4 dark:border-zinc-800/30 flex justify-between items-center"
				>
					<h2 class="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
						{title}
					</h2>
					<button
						onclick={close}
						class="text-zinc-400 hover:text-zinc-650 dark:hover:text-white transition-colors cursor-pointer"
					>
						<span class="icon-[lucide--x] w-5 h-5"></span>
					</button>
				</header>
			{/if}

			<!-- Content Area (flex-grow for '80' size) -->
			<div class="p-6 text-sm text-zinc-600 dark:text-zinc-300 flex-grow {overflowVisible ? 'overflow-visible' : 'overflow-y-auto'}">
				{#if children}{@render children()}{/if}
			</div>

			{#if footer}
				<footer
					class="flex justify-end gap-2 border-t border-zinc-200/30 bg-zinc-50/70 px-6 py-4 dark:border-zinc-800/30 dark:bg-zinc-950/30 rounded-b-2xl"
				>
					{@render footer()}
				</footer>
			{/if}
		</div>
	</div>
{/if}
