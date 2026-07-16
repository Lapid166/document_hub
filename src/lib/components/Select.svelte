<script lang="ts">
	export type SelectOption = { value: string; label: string; icon?: string; disabled?: boolean };

	interface SelectProps {
		id: string;
		label?: string;
		placeholder?: string;
		options: SelectOption[];
		value?: string;
		disabled?: boolean;
		error?: string;
		onchange?: (value: string) => void;
	}

	let {
		id,
		label,
		placeholder = 'Chọn một lựa chọn',
		options,
		value = $bindable(''),
		disabled = false,
		error,
		onchange
	}: SelectProps = $props();

	let open = $state(false);
	let highlightedIndex = $state(0);

	let enabledOptions = $derived(options.filter((option) => !option.disabled));
	let selectedOption = $derived(options.find((option) => option.value === value));
	let activeOption = $derived(enabledOptions[highlightedIndex]);

	function clampHighlight() {
		if (highlightedIndex >= enabledOptions.length)
			highlightedIndex = Math.max(enabledOptions.length - 1, 0);
	}

	function openList() {
		if (disabled) return;
		open = true;
		const selectedIndex = enabledOptions.findIndex((option) => option.value === value);
		highlightedIndex = selectedIndex >= 0 ? selectedIndex : 0;
	}

	function selectOption(option: SelectOption | undefined) {
		if (!option || option.disabled) return;
		value = option.value;
		open = false;
		if (onchange) onchange(option.value);
	}

	function handleTriggerKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			if (!open) openList();
			else highlightedIndex = Math.min(highlightedIndex + 1, enabledOptions.length - 1);
		}

		if (event.key === 'ArrowUp' && open) {
			event.preventDefault();
			highlightedIndex = Math.max(highlightedIndex - 1, 0);
		}

		if (event.key === 'Enter' && open) {
			event.preventDefault();
			selectOption(activeOption);
		}

		if (event.key === 'Escape') {
			open = false;
		}
	}

	// Close when clicking outside
	function clickOutside(node: HTMLElement) {
		const handleClick = (event: MouseEvent) => {
			if (node && !node.contains(event.target as Node) && !event.defaultPrevented) {
				open = false;
			}
		};

		document.addEventListener('click', handleClick, true);

		return {
			destroy() {
				document.removeEventListener('click', handleClick, true);
			}
		};
	}

	$effect(clampHighlight);
</script>

<div class="relative" use:clickOutside>
	{#if label}
		<label
			class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
			for={id}>{label}</label
		>
	{/if}

	<button
		{id}
		type="button"
		{disabled}
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-describedby={error ? `${id}-error` : undefined}
		class="flex min-h-10 w-full items-center justify-between gap-2 rounded-xl border bg-zinc-50/50 px-3 py-2 text-left text-sm text-zinc-900 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-950/40 dark:text-zinc-50 {error
			? 'border-rose-400 dark:border-rose-500/60 focus:border-rose-500 focus:ring-rose-500/20'
			: 'border-zinc-200 hover:border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20 dark:border-zinc-800/80 dark:hover:border-emerald-500/50'} focus:outline-none focus:ring-2 cursor-pointer"
		onclick={() => (open ? (open = false) : openList())}
		onkeydown={handleTriggerKeydown}
	>
		<span class="flex min-w-0 items-center gap-2">
			{#if selectedOption?.icon}<span class="{selectedOption.icon} h-4.5 w-4.5 text-emerald-500"
				></span>{/if}
			<span
				class={selectedOption
					? 'truncate text-zinc-900 dark:text-zinc-50 font-medium'
					: 'truncate text-zinc-400'}
			>
				{selectedOption?.label ?? placeholder}
			</span>
		</span>
		<span class="icon-[lucide--chevron-down] text-zinc-400 h-4.5 w-4.5"></span>
	</button>

	{#if open}
		<div
			role="listbox"
			aria-labelledby={id}
			class="absolute z-40 mt-1.5 max-h-60 w-full overflow-auto rounded-xl border border-zinc-200/70 bg-white/95 p-1 shadow-xl shadow-zinc-950/5 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/95"
		>
			{#each options as option}
				<button
					type="button"
					role="option"
					aria-selected={option.value === value}
					disabled={option.disabled}
					class="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer {activeOption?.value ===
					option.value
						? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
						: 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50'}"
					onmouseenter={() => {
						const index = enabledOptions.findIndex((enabled) => enabled.value === option.value);
						if (index >= 0) highlightedIndex = index;
					}}
					onclick={() => selectOption(option)}
				>
					<span class="flex min-w-0 items-center gap-2">
						{#if option.icon}<span class="{option.icon} h-4 w-4"></span>{/if}
						<span class="truncate">{option.label}</span>
					</span>
					{#if option.value === value}<span class="icon-[lucide--check] h-4 w-4 text-sky-500"
						></span>{/if}
				</button>
			{/each}
		</div>
	{/if}

	{#if error}
		<p id={`${id}-error`} class="mt-1 text-xs text-rose-500">{error}</p>
	{/if}
</div>
