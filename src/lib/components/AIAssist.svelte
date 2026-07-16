<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';
	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';

	interface Props {
		productId?: string;
		featureCode: string;
		currentValue: string;
		labelName: string;
		productNameContext?: string; // Optional context like name of the product
		onApply: (newValue: string) => void;
	}

	let {
		productId = '',
		featureCode,
		currentValue,
		labelName,
		productNameContext = '',
		onApply
	}: Props = $props();

	let isOpen = $state(false);
	let loading = $state(false);
	let error = $state('');
	let aiDraft = $state('');
	let currentPoWNonce = $state('');

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

	async function handleAIAssist() {
		isOpen = true;
		loading = true;
		error = '';
		aiDraft = '';

		try {
			const fingerprint = getCanvasFingerprint();
			
			// Solve PoW puzzle to verify transaction
			const powNonce = await solvePoW(fingerprint, '000');

			const response = await fetch('/api/ai/generate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					productId,
					featureCode,
					canvasFingerprint: fingerprint,
					powNonce,
					inputData: {
						productName: productNameContext,
						currentText: currentValue
					}
				})
			});

			const result = await response.json();
			if (result.success) {
				aiDraft = result.text;
			} else {
				error = result.error || 'Lỗi không xác định khi gọi AI.';
			}
		} catch (err: any) {
			error = err.message || 'Lỗi kết nối mạng khi xử lý AI.';
		} finally {
			loading = false;
		}
	}

	function handleApply() {
		onApply(aiDraft);
		isOpen = false;
	}
</script>

<button
	type="button"
	onclick={handleAIAssist}
	class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 hover:text-emerald-600 cursor-pointer transition-colors"
	title="Tự động sinh hoặc cải tiến bằng trí tuệ nhân tạo (AI)"
>
	<span class="icon-[lucide--sparkles] h-3.5 w-3.5 animate-pulse"></span>
	<span>AI Assist</span>
</button>

<Modal open={isOpen} title={`AI Trợ Lý - Thiết lập ${labelName}`} size="lg" overflowVisible={true}>
	<div class="flex flex-col gap-4 py-1 font-sans">
		<p class="text-xs text-zinc-500">
			Hệ thống đang tiến hành phân tích và sinh đề xuất nháp. Vui lòng xem và duyệt trước khi áp dụng vào form.
		</p>

		{#if loading}
			<div class="flex flex-col items-center justify-center py-12 gap-3">
				<span class="h-8 w-8 animate-spin rounded-full border-3 border-emerald-500 border-t-transparent"></span>
				<span class="text-xs text-zinc-450 animate-pulse">Đang giải mã Proof of Work & thực hiện sinh nội dung qua 9Router...</span>
			</div>
		{:else if error}
			<div class="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-500 text-xs flex flex-col gap-1">
				<span class="font-bold flex items-center gap-1.5">
					<span class="icon-[lucide--alert-triangle]"></span>
					Lỗi xử lý AI
				</span>
				<p>{error}</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
				<!-- Original Value Column -->
				<div class="flex flex-col gap-1.5">
					<span class="font-semibold uppercase tracking-wider text-[9px] text-zinc-400">Văn bản hiện tại (Original)</span>
					<textarea
						readonly
						rows="12"
						class="w-full font-sans text-xs rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40"
						value={currentValue || "(Trống)"}
					></textarea>
				</div>

				<!-- AI Draft Value Column -->
				<div class="flex flex-col gap-1.5">
					<div class="flex justify-between items-center">
						<span class="font-semibold uppercase tracking-wider text-[9px] text-emerald-500">Bản nháp đề xuất từ AI (DRAFT - Có thể chỉnh sửa)</span>
						<Badge variant="warning">Chờ duyệt</Badge>
					</div>
					<textarea
						rows="12"
						class="w-full font-sans text-xs rounded-xl border border-emerald-500/30 bg-emerald-500/[0.01] p-3 text-zinc-850 dark:text-zinc-100 focus:border-emerald-500 focus:outline-none dark:border-zinc-800/80 dark:bg-zinc-950/40"
						bind:value={aiDraft}
					></textarea>
				</div>
			</div>
		{/if}
	</div>

	{#snippet footer()}
		<div class="flex gap-2">
			<Button variant="secondary" size="md" onclick={() => (isOpen = false)}>
				<span>Hủy Bỏ</span>
			</Button>
			<Button variant="primary" size="md" disabled={loading || !!error || !aiDraft} onclick={handleApply}>
				<span>Phê Duyệt & Áp Dụng</span>
			</Button>
		</div>
	{/snippet}
</Modal>
