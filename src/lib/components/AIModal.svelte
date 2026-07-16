<script lang="ts">
	import Modal from './Modal.svelte';
	import Button from './Button.svelte';

	interface AIModalProps {
		open: boolean;
		title?: string;
		fieldName: 'detailedDescription' | 'guides' | 'faqs' | 'changelog';
		productName: string;
		layoutType?: string;
		currentValue?: string;
		onapply: (generatedContent: string, mode: 'replace' | 'append') => void;
	}

	let {
		open = $bindable(false),
		title = 'Trợ lý AI sinh nội dung',
		fieldName,
		productName,
		layoutType = 'other',
		currentValue = '',
		onapply
	}: AIModalProps = $props();

	let rawContent = $state('');
	let isGenerating = $state(false);
	let generatedResult = $state('');
	let errorMessage = $state('');
	let fileInput: HTMLInputElement | null = $state(null);

	function handleFileUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const text = e.target?.result;
			if (typeof text === 'string') {
				rawContent = text;
			}
		};
		reader.readAsText(file);
	}

	async function startGeneration() {
		if (!rawContent.trim()) {
			errorMessage = 'Vui lòng nhập tài liệu thô hoặc tải lên tệp tin trước.';
			return;
		}

		isGenerating = true;
		errorMessage = '';
		generatedResult = '';

		try {
			const res = await fetch('/api/admin/products/generate-section', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					fieldName,
					productName,
					layoutType,
					rawContent,
					currentContent: currentValue
				})
			});

			const data = await res.json();
			if (!res.ok || !data.success) {
				throw new Error(data.message || 'Lỗi hệ thống khi gọi AI');
			}

			generatedResult = data.result;
		} catch (err: any) {
			errorMessage = err.message || 'Có lỗi xảy ra khi kết nối tới AI.';
		} finally {
			isGenerating = false;
		}
	}

	function apply(mode: 'replace' | 'append') {
		onapply(generatedResult, mode);
		close();
	}

	function close() {
		open = false;
		rawContent = '';
		generatedResult = '';
		errorMessage = '';
	}

	// Parse lists helper
	let parsedList = $derived.by(() => {
		if (!generatedResult) return null;
		if (fieldName === 'guides' || fieldName === 'faqs') {
			try {
				const data = JSON.parse(generatedResult);
				return Array.isArray(data) ? data : null;
			} catch (e) {
				return null;
			}
		}
		return null;
	});
</script>

<Modal bind:open title="{title} ({fieldName === 'detailedDescription' ? 'Mô tả' : fieldName === 'guides' ? 'Hướng dẫn' : fieldName === 'faqs' ? 'FAQ' : 'Changelog'})" size="lg" onclose={close}>
	<div class="flex flex-col gap-5">
		<!-- Step 1: Input Area -->
		<div class="flex flex-col gap-2">
			<div class="flex items-center justify-between">
				<label for="ai-raw-doc" class="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
					Dán tài liệu thô (txt, md, log, ghi chú...)
				</label>
				<button
					type="button"
					onclick={() => fileInput?.click()}
					class="flex items-center gap-1.5 text-xs text-emerald-500 hover:text-emerald-600 transition-colors font-medium cursor-pointer"
				>
					<span class="icon-[lucide--upload] w-4 h-4"></span>
					Tải lên file văn bản
				</button>
				<input
					type="file"
					accept=".txt,.md,.json,.log"
					bind:this={fileInput}
					onchange={handleFileUpload}
					class="hidden"
				/>
			</div>

			<textarea
				id="ai-raw-doc"
				bind:value={rawContent}
				placeholder="Nhập thông tin thô liên quan đến sản phẩm, các bước hướng dẫn hoặc nhật ký cập nhật thô để AI phân tích và biên soạn lại..."
				rows="5"
				class="w-full text-xs font-sans p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none"
			></textarea>
		</div>

		<!-- Action Trigger -->
		<div class="flex justify-end">
			<Button
				type="button"
				variant="primary"
				onclick={startGeneration}
				disabled={isGenerating || !rawContent.trim()}
				class="cursor-pointer"
			>
				{#if isGenerating}
					<span class="icon-[lucide--loader-2] w-4 h-4 animate-spin mr-2"></span>
					AI đang phân tích & biên soạn...
				{:else}
					<span class="icon-[lucide--sparkles] w-4 h-4 mr-2"></span>
					Sinh bản nháp bằng AI
				{/if}
			</Button>
		</div>

		{#if errorMessage}
			<div class="p-3 border border-rose-500/10 rounded-xl bg-rose-500/5 text-xs text-rose-500 font-medium">
				{errorMessage}
			</div>
		{/if}

		<!-- Step 2: Preview generated result -->
		{#if generatedResult}
			<div class="flex flex-col gap-3 border-t border-zinc-100 dark:border-zinc-800/60 pt-4">
				<h3 class="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
					<span class="icon-[lucide--sparkles] text-emerald-500"></span>
					Bản nháp AI đề xuất
				</h3>

				<div class="max-h-80 overflow-y-auto border border-zinc-200/50 dark:border-zinc-800 rounded-xl bg-zinc-50/20 p-4">
					{#if parsedList}
						{#if fieldName === 'guides'}
							<div class="flex flex-col gap-3">
								{#each parsedList as step, i}
									<div class="p-3 border border-emerald-500/10 rounded-xl bg-emerald-500/5">
										<div class="text-xs font-bold text-zinc-800 dark:text-zinc-200">Bước {i + 1}: {step.title}</div>
										<div class="text-xs text-zinc-650 dark:text-zinc-400 mt-1 whitespace-pre-wrap">{step.content}</div>
									</div>
								{/each}
							</div>
						{:else if fieldName === 'faqs'}
							<div class="flex flex-col gap-3">
								{#each parsedList as faq}
									<div class="p-3 border border-zinc-150 dark:border-zinc-850 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20">
										<div class="text-xs font-bold text-zinc-800 dark:text-zinc-200">Hỏi: {faq.question}</div>
										<div class="text-xs text-zinc-650 dark:text-zinc-400 mt-1 whitespace-pre-wrap">Đáp: {faq.answer}</div>
									</div>
								{/each}
							</div>
						{/if}
					{:else}
						<!-- Detailed description or Changelog fallback -->
						<pre class="text-xs font-mono text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-all">{generatedResult}</pre>
					{/if}
				</div>

				<!-- Application controls -->
				<div class="flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800/60 pt-3">
					<Button type="button" variant="ghost" size="sm" onclick={() => apply('append')} class="text-zinc-600 dark:text-zinc-300 cursor-pointer">
						<span class="icon-[lucide--plus] w-4 h-4 mr-1.5"></span>
						Chèn vào cuối
					</Button>
					<Button type="button" variant="primary" size="sm" onclick={() => apply('replace')} class="cursor-pointer">
						<span class="icon-[lucide--check] w-4 h-4 mr-1.5"></span>
						Thay thế hoàn toàn
					</Button>
				</div>
			</div>
		{/if}
	</div>
</Modal>
