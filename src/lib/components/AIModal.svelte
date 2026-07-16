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

	// Canvas fingerprinting helper
	function getCanvasFingerprint() {
		try {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');
			if (!ctx) return 'canvas-not-supported';
			ctx.textBaseline = 'top';
			ctx.font = "14px 'Arial'";
			ctx.fillStyle = '#f60';
			ctx.fillRect(125, 1, 62, 20);
			ctx.fillStyle = '#069';
			ctx.fillText('DocumentHub, AI Antigravity 2026', 2, 15);
			ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
			ctx.fillText('DocumentHub, AI Antigravity 2026', 4, 17);
			const txt = canvas.toDataURL();
			let hash = 0;
			for (let i = 0; i < txt.length; i++) {
				hash = (hash << 5) - hash + txt.charCodeAt(i);
				hash = hash & hash;
			}
			return 'fp-' + Math.abs(hash).toString(16);
		} catch {
			return 'fp-fallback-local';
		}
	}

	// Client-side Proof of Work (PoW) solver
	async function solvePoW(fingerprint: string, difficulty = '000') {
		const currentHour = new Date().toISOString().slice(0, 13); // changes hourly
		const challenge = `${fingerprint}-${currentHour}`;
		let nonce = 0;
		while (true) {
			const str = challenge + nonce;
			const msgBuffer = new TextEncoder().encode(str);
			const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
			const hashArray = Array.from(new Uint8Array(hashBuffer));
			const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
			if (hashHex.startsWith(difficulty)) {
				return nonce.toString();
			}
			nonce++;
			if (nonce % 500 === 0) {
				// Yield to main thread to keep browser responsive
				await new Promise((r) => setTimeout(r, 0));
			}
		}
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
			const fingerprint = getCanvasFingerprint();
			const powNonce = await solvePoW(fingerprint, '000');

			const featureCodeMap = {
				detailedDescription: 'product_detailed_desc',
				guides: 'product_guide',
				faqs: 'product_faq',
				changelog: 'product_changelog'
			};
			const featureCode = featureCodeMap[fieldName];

			const res = await fetch('/api/ai/generate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					productId: '',
					featureCode,
					canvasFingerprint: fingerprint,
					powNonce,
					inputData: {
						productName,
						rawContent,
						currentText: currentValue
					}
				})
			});

			const data = await res.json();
			if (!res.ok || !data.success) {
				throw new Error(data.error || data.message || 'Lỗi hệ thống khi gọi AI');
			}

			generatedResult = data.text;
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

		<!-- Step 2: Preview generated result and Diff Viewer -->
		{#if generatedResult}
			<div class="flex flex-col gap-3 border-t border-zinc-200/40 dark:border-zinc-800/60 pt-4">
				<h3 class="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
					<span class="icon-[lucide--diff] text-emerald-500"></span>
					Bản nháp & Đối chiếu nội dung (Draft-First Preview)
				</h3>

				{#if parsedList}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<!-- Original JSON view -->
						<div class="flex flex-col gap-1">
							<span class="text-[10px] font-semibold text-zinc-400 uppercase">Danh sách hiện tại (Original)</span>
							<textarea
								readonly
								rows="10"
								class="w-full text-xs font-mono p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 rounded-xl resize-none outline-none text-zinc-500"
								value={currentValue || "[]"}
							></textarea>
						</div>

						<!-- AI generated formatted preview -->
						<div class="flex flex-col gap-1">
							<span class="text-[10px] font-semibold text-emerald-500 uppercase">Cấu trúc đề xuất từ AI (Draft)</span>
							<div class="max-h-60 overflow-y-auto border border-emerald-500/20 rounded-xl bg-emerald-500/[0.01] p-3 flex flex-col gap-2">
								{#if fieldName === 'guides'}
									{#each parsedList as step, i}
										<div class="p-2 border border-emerald-500/10 rounded-lg bg-emerald-500/5">
											<div class="text-xs font-bold text-zinc-800 dark:text-zinc-200">Bước {i + 1}: {step.title}</div>
											<div class="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 whitespace-pre-wrap">{step.content}</div>
										</div>
									{/each}
								{:else if fieldName === 'faqs'}
									{#each parsedList as faq}
										<div class="p-2 border border-zinc-200/50 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-950/20">
											<div class="text-xs font-bold text-zinc-800 dark:text-zinc-200">Q: {faq.question}</div>
											<div class="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5 whitespace-pre-wrap">A: {faq.answer}</div>
										</div>
									{/each}
								{/if}
							</div>
							<textarea
								rows="4"
								class="w-full text-xs font-mono p-3 border border-emerald-500/20 bg-emerald-500/[0.01] rounded-xl focus:outline-none focus:border-emerald-500 mt-2"
								bind:value={generatedResult}
								placeholder="Chỉnh sửa JSON thô nếu cần..."
							></textarea>
						</div>
					</div>
				{:else}
					<!-- Plain text detailedDescription / Changelog diff -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="flex flex-col gap-1">
							<span class="text-[10px] font-semibold text-zinc-400 uppercase">Nội dung hiện tại (Original)</span>
							<textarea
								readonly
								rows="12"
								class="w-full text-xs font-mono p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 rounded-xl resize-none outline-none text-zinc-500"
								value={currentValue || "(Trống)"}
							></textarea>
						</div>
						<div class="flex flex-col gap-1">
							<span class="text-[10px] font-semibold text-emerald-500 uppercase">Bản nháp AI đề xuất (Draft - Có thể chỉnh sửa)</span>
							<textarea
								rows="12"
								class="w-full text-xs font-mono p-3 border border-emerald-500/30 bg-emerald-500/[0.01] rounded-xl focus:outline-none focus:border-emerald-500"
								bind:value={generatedResult}
							></textarea>
						</div>
					</div>
				{/if}

				<!-- Application controls -->
				<div class="flex items-center justify-end gap-2 border-t border-zinc-150/40 dark:border-zinc-800/60 pt-3">
					<Button type="button" variant="ghost" size="sm" onclick={() => apply('append')} class="text-zinc-650 dark:text-zinc-300 cursor-pointer">
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
