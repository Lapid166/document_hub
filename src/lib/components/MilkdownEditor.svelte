<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		id: string;
		value?: string;
		placeholder?: string;
	}

	let {
		id,
		value = $bindable(''),
		placeholder = 'Nhập mô tả chi tiết sản phẩm của bạn ở đây...'
	}: Props = $props();

	let editorContainer = $state<HTMLDivElement | null>(null);
	let editorInstance: any = null;
	let loading = $state(true);
	let commandsObj = $state<any>(null);

	onMount(async () => {
		if (!editorContainer) return;

		try {
			// Dynamic local imports of npm packages
			const { Editor, rootCtx, defaultValueCtx, commandsCtx } = await import('@milkdown/core');
			const { 
				commonmark,
				toggleStrongCommand, 
				toggleEmphasisCommand, 
				wrapInHeadingCommand, 
				wrapInBulletListCommand, 
				insertHrCommand 
			} = await import('@milkdown/preset-commonmark');
			const { gfm } = await import('@milkdown/preset-gfm');
			const { listener, listenerCtx } = await import('@milkdown/plugin-listener');
			const { history, undoCommand, redoCommand } = await import('@milkdown/plugin-history');
			const { nord } = await import('@milkdown/theme-nord');
			await import('@milkdown/theme-nord/style.css');

			// Custom css styling variables setup
			const root = document.documentElement;
			root.style.setProperty('--milkdown-bg-color', 'transparent');
			root.style.setProperty('--milkdown-border-color', 'transparent');

			// Create Milkdown Editor
			const editor = await Editor.make()
				.config((ctx: any) => {
					ctx.set(rootCtx, editorContainer);
					ctx.set(defaultValueCtx, value || placeholder);
					
					// Listen to markdown updates and bind back to value
					ctx.get(listenerCtx).markdownUpdated((ctx2: any, markdown: string) => {
						// Filter out default placeholder if user started typing
						if (markdown === placeholder) {
							value = '';
						} else {
							value = markdown;
						}
					});

					// Clear placeholder on focus if it is equal to placeholder
					ctx.get(listenerCtx).focus((ctx3: any) => {
						if (value === placeholder) {
							value = '';
						}
					});
				})
				.config(nord)
				.use(commonmark)
				.use(gfm)
				.use(listener)
				.use(history)
				.create();

			editorInstance = editor;
			
			// Store command keys and context for external toolbar control
			commandsObj = {
				strong: toggleStrongCommand.key,
				emphasis: toggleEmphasisCommand.key,
				heading: wrapInHeadingCommand.key,
				bulletList: wrapInBulletListCommand.key,
				hr: insertHrCommand.key,
				undo: undoCommand.key,
				redo: redoCommand.key,
				commandsCtx
			};

			loading = false;
		} catch (err) {
			console.error('Lỗi khi tải biên tập viên Milkdown:', err);
			loading = false;
		}
	});

	// Trigger command execution on editor instance
	function executeCommand(cmdName: string, payload?: any) {
		if (!editorInstance || !commandsObj) return;
		editorInstance.action((ctx: any) => {
			const commands = ctx.get(commandsObj.commandsCtx);
			commands.call(commandsObj[cmdName], payload);
		});
	}
</script>

<div class="relative w-full rounded-xl border border-zinc-200 bg-white/50 dark:border-zinc-800 dark:bg-zinc-900/50 min-h-[350px] flex flex-col overflow-hidden zen-transition">
	
	<!-- Top Format Toolbar -->
	<div class="flex items-center gap-1 p-2 bg-zinc-100/80 border-b border-zinc-200/50 dark:bg-zinc-900/60 dark:border-zinc-850/80">
		<!-- Undo / Redo -->
		<button
			type="button"
			class="p-2 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer flex items-center justify-center"
			title="Hoàn tác (Ctrl+Z)"
			onclick={() => executeCommand('undo')}
		>
			<span class="icon-[lucide--undo] h-4 w-4"></span>
		</button>
		<button
			type="button"
			class="p-2 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer flex items-center justify-center"
			title="Làm lại (Ctrl+Y)"
			onclick={() => executeCommand('redo')}
		>
			<span class="icon-[lucide--redo] h-4 w-4"></span>
		</button>
		
		<div class="w-[1px] h-4 bg-zinc-200/60 dark:bg-zinc-800/80 mx-1"></div>

		<!-- Bold / Italic -->
		<button
			type="button"
			class="p-2 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer flex items-center justify-center"
			title="In đậm (Bold)"
			onclick={() => executeCommand('strong')}
		>
			<span class="icon-[lucide--bold] h-4 w-4"></span>
		</button>
		<button
			type="button"
			class="p-2 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer flex items-center justify-center"
			title="In nghiêng (Italic)"
			onclick={() => executeCommand('emphasis')}
		>
			<span class="icon-[lucide--italic] h-4 w-4"></span>
		</button>
		
		<div class="w-[1px] h-4 bg-zinc-200/60 dark:bg-zinc-800/80 mx-1"></div>
		
		<!-- Headings -->
		<button
			type="button"
			class="p-2 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer flex items-center justify-center"
			title="Tiêu đề 1"
			onclick={() => executeCommand('heading', 1)}
		>
			<span class="icon-[lucide--heading-1] h-4 w-4"></span>
		</button>
		<button
			type="button"
			class="p-2 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer flex items-center justify-center"
			title="Tiêu đề 2"
			onclick={() => executeCommand('heading', 2)}
		>
			<span class="icon-[lucide--heading-2] h-4 w-4"></span>
		</button>
		
		<div class="w-[1px] h-4 bg-zinc-200/60 dark:bg-zinc-800/80 mx-1"></div>
		
		<!-- Lists / Separators -->
		<button
			type="button"
			class="p-2 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer flex items-center justify-center"
			title="Danh sách Bullet"
			onclick={() => executeCommand('bulletList')}
		>
			<span class="icon-[lucide--list] h-4 w-4"></span>
		</button>
		<button
			type="button"
			class="p-2 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer flex items-center justify-center"
			title="Đường phân cách (Divider)"
			onclick={() => executeCommand('hr')}
		>
			<span class="icon-[lucide--minus] h-4 w-4"></span>
		</button>
	</div>

	<!-- Loading Spinner -->
	{#if loading}
		<div class="absolute inset-0 flex items-center justify-center text-xs font-semibold text-zinc-400 gap-2 bg-white/70 dark:bg-zinc-950/70 z-10">
			<span class="icon-[lucide--loader-2] h-4 w-4 animate-spin text-emerald-500"></span>
			<span>Đang tải trình soạn thảo Milkdown...</span>
		</div>
	{/if}

	<div 
		{id} 
		bind:this={editorContainer} 
		class="p-4 outline-none prose prose-zinc dark:prose-invert max-w-none text-zinc-900 dark:text-zinc-100 min-h-[250px] overflow-y-auto {loading ? 'opacity-0' : 'opacity-100'}"
	></div>
</div>

<style>
	/* Custom styles for Milkdown editor to look premium and match documenthub dark mode */
	:global(.milkdown) {
		background-color: transparent !important;
		box-shadow: none !important;
		border: none !important;
		font-family: inherit !important;
	}

	:global(.milkdown .editor) {
		padding: 0 !important;
		outline: none !important;
		border: none !important;
		box-shadow: none !important;
		min-height: 250px;
	}

	:global(.milkdown .editor:focus),
	:global(.milkdown .editor:focus-within),
	:global(.milkdown:focus),
	:global(.milkdown:focus-within) {
		outline: none !important;
		border: none !important;
		box-shadow: none !important;
	}

	:global(.milkdown .editor p) {
		font-size: 14px;
		line-height: 1.6;
		margin-bottom: 12px;
	}

	:global(.milkdown .editor h1, .milkdown .editor h2, .milkdown .editor h3) {
		font-weight: 700;
		color: var(--color-zinc-900) !important;
	}
	:global(.dark .milkdown .editor h1, .dark .milkdown .editor h2, .dark .milkdown .editor h3) {
		color: #ffffff !important;
	}
</style>
