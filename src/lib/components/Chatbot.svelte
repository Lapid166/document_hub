<script lang="ts">
	import { onMount } from 'svelte';
	import Modal from '$lib/components/Modal.svelte';

	// Chatbot Modal state
	let isModalOpen = $state(false);

	// Chatbot Open state
	let isOpen = $state(false);
	let messages = $state<{ sender: 'user' | 'bot'; text: string; time: string }[]>([
		{
			sender: 'bot',
			text: 'Xin chào! Tôi là trợ lý AI của Mini Games Hub. Tôi có thể giúp gì cho bạn?',
			time: '08:00'
		}
	]);
	let newMessage = $state('');
	let isTyping = $state(false);

	// Scroll and position states
	let showScrollTop = $state(false);
	let isAtBottom = $state(false);
	let hasDragged = $state(false);

	// Coordinate states (used only after drag starts)
	let posX = $state(0);
	let posY = $state(0);
	let anchorSide = $state<'left' | 'right'>('right');

	// Temp drag states
	let isDragging = $state(false);
	let dragDistance = 0;
	let startX = 0;
	let startY = 0;

	onMount(() => {
		handleScroll(); // Initial check
		window.addEventListener('scroll', handleScroll);
		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('scroll', handleScroll);
			window.removeEventListener('resize', handleResize);
		};
	});

	function handleScroll() {
		if (typeof window !== 'undefined') {
			const scrollY = window.scrollY;
			showScrollTop = scrollY > 300;

			const threshold = 160; // px close to page bottom
			const totalHeight = document.documentElement.scrollHeight;
			const scrolled = window.innerHeight + scrollY;
			isAtBottom = totalHeight - scrolled < threshold;

			// If already dragged, bound posY based on bottom constraints
			if (hasDragged && isAtBottom) {
				const maxAllowedY = window.innerHeight - 130;
				if (posY > maxAllowedY) {
					posY = maxAllowedY;
				}
			}
		}
	}

	function handleResize() {
		if (hasDragged && typeof window !== 'undefined') {
			// Recalculate snap edge on resize if dragged
			if (anchorSide === 'right') {
				posX = window.innerWidth - 76;
			} else {
				posX = 16;
			}
			const maxAllowedY = window.innerHeight - (isAtBottom ? 130 : 80);
			posY = Math.min(posY, maxAllowedY);
		}
	}

	// Mouse & Touch Drag Logic
	function startDrag(e: MouseEvent | TouchEvent) {
		if (isOpen) return; // Disable drag when chat is open
		isDragging = true;
		dragDistance = 0;

		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

		// If first time dragging, initialize coordinates from current visual place
		if (!hasDragged && typeof window !== 'undefined') {
			const currentBottom = isAtBottom ? 136 : showScrollTop ? 88 : 24;
			posX = window.innerWidth - 76;
			posY = window.innerHeight - currentBottom - 56; // 56px is height of button
			hasDragged = true;
		}

		startX = clientX - posX;
		startY = clientY - posY;

		if (typeof window !== 'undefined') {
			window.addEventListener('mousemove', onDrag);
			window.addEventListener('touchmove', onDrag, { passive: false });
			window.addEventListener('mouseup', stopDrag);
			window.addEventListener('touchend', stopDrag);
		}
	}

	function onDrag(e: MouseEvent | TouchEvent) {
		if (!isDragging) return;
		if (e.cancelable) e.preventDefault();

		const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
		const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

		const nextX = clientX - startX;
		const nextY = clientY - startY;

		const dx = nextX - posX;
		const dy = nextY - posY;
		dragDistance += Math.sqrt(dx * dx + dy * dy);

		posX = nextX;
		posY = nextY;
	}

	function stopDrag() {
		if (!isDragging) return;
		isDragging = false;

		if (typeof window !== 'undefined') {
			window.removeEventListener('mousemove', onDrag);
			window.removeEventListener('touchmove', onDrag);
			window.removeEventListener('mouseup', stopDrag);
			window.removeEventListener('touchend', stopDrag);

			// Snap to left or right screen edges
			const halfWidth = window.innerWidth / 2;
			const buttonCenter = posX + 28;

			if (buttonCenter < halfWidth) {
				anchorSide = 'left';
				posX = 16;
			} else {
				anchorSide = 'right';
				posX = window.innerWidth - 76;
			}

			// Bound Y
			const minY = 80;
			const maxY = window.innerHeight - (isAtBottom ? 130 : 80);
			posY = Math.max(minY, Math.min(posY, maxY));
		}
	}

	function handleButtonClick() {
		if (dragDistance < 10) {
			isOpen = !isOpen;
		}
	}

	function scrollToTop() {
		if (typeof window !== 'undefined') {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	function getFormattedTime() {
		const now = new Date();
		return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
	}

	// Chat message handlers (streaming SSE RAG chatbot)
	async function sendMessage() {
		if (!newMessage.trim()) return;

		const userMsg = newMessage.trim();
		const time = getFormattedTime();
		messages = [...messages, { sender: 'user', text: userMsg, time }];
		newMessage = '';

		isTyping = true;

		// Add an empty bot message to append stream chunks to
		const botMessageIndex = messages.length;
		messages = [...messages, { sender: 'bot', text: '', time: getFormattedTime() }];

		try {
			const res = await fetch('/api/ai/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ message: userMsg })
			});

			isTyping = false;

			if (!res.ok) {
				messages[botMessageIndex].text = 'Lỗi kết nối với máy chủ chatbot.';
				messages = [...messages];
				return;
			}

			const reader = res.body?.getReader();
			const decoder = new TextDecoder();
			if (!reader) {
				messages[botMessageIndex].text = 'Không thể tạo bộ đọc luồng dữ liệu.';
				messages = [...messages];
				return;
			}

			let streamText = '';
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					const cleanLine = line.trim();
					if (!cleanLine) continue;
					if (cleanLine.startsWith('data: ')) {
						const dataStr = cleanLine.slice(6);
						if (dataStr === '[DONE]') {
							break;
						}
						try {
							const parsed = JSON.parse(dataStr);
							if (parsed.text) {
								streamText += parsed.text;
								messages[botMessageIndex].text = streamText;
								messages = [...messages]; // Trigger Svelte reactivity
							}
						} catch (err) {
							// Incomplete JSON
						}
					}
				}
			}
		} catch (err) {
			isTyping = false;
			messages[botMessageIndex].text = 'Không thể gửi tin nhắn. Vui lòng kiểm tra kết nối mạng của bạn.';
			messages = [...messages];
		}
	}
</script>

<!-- Scroll To Top Button -->
{#if showScrollTop}
	<button
		onclick={scrollToTop}
		class="fixed z-45 flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-650 shadow-lg hover:-translate-y-0.5 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 transition-all duration-300 cursor-pointer right-6
		{isAtBottom ? 'bottom-20' : 'bottom-6'}"
		aria-label="Scroll to top"
	>
		<span class="icon-[lucide--arrow-up] h-5 w-5"></span>
	</button>
{/if}

<!-- Chatbot Floating Button Container -->
<div
	class="fixed z-50 transition-all duration-300"
	style={hasDragged
		? `left: ${posX}px; top: ${posY}px;`
		: `right: 24px; bottom: ${isAtBottom ? '136px' : showScrollTop ? '88px' : '24px'};`}
>
	<!-- Chatbot Floating Toggle Button -->
	<button
		onmousedown={startDrag}
		ontouchstart={startDrag}
		onclick={handleButtonClick}
		class="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-500 to-sky-500 text-white shadow-xl hover:scale-105 active:scale-95 cursor-grab active:cursor-grabbing select-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
		aria-label="Open Chat Assistant"
	>
		{#if isOpen}
			<span class="icon-[lucide--x] h-6 w-6 animate-spin-once"></span>
		{:else}
			<span class="icon-[lucide--message-square] h-6 w-6"></span>
			<!-- Glowing Badge Notification -->
			<span class="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
				<span
					class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"
				></span>
				<span
					class="relative inline-flex rounded-full h-3.5 w-3.5 bg-sky-500 border border-white dark:border-zinc-950"
				></span>
			</span>
		{/if}
	</button>

	<!-- Popup Chat Window -->
	{#if isOpen}
		<div
			class="absolute bottom-16 w-[20rem] sm:w-[22rem] overflow-hidden rounded-2xl border border-zinc-200/30 bg-white/90 shadow-2xl backdrop-blur-xl dark:border-zinc-800/30 dark:bg-zinc-900/95 transition-all duration-300 transform origin-bottom-right"
			style={hasDragged && anchorSide === 'left' ? 'left: 0;' : 'right: 0;'}
		>
			<!-- Chat Header -->
			<header
				class="flex items-center justify-between border-b border-zinc-200/30 bg-gradient-to-r from-emerald-500/10 to-sky-500/10 px-4 py-3.5 dark:border-zinc-800/30"
			>
				<div class="flex items-center gap-2.5">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-500 to-sky-500 text-white shadow-sm"
					>
						<span class="icon-[lucide--sparkles] h-4.5 w-4.5"></span>
					</div>
					<div>
						<h4 class="text-xs font-bold tracking-tight text-zinc-900 dark:text-white">
							AI Assistant
						</h4>
						<span
							class="text-[9px] text-emerald-500 font-semibold uppercase tracking-wider flex items-center gap-1"
						>
							<span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
							Online
						</span>
					</div>
				</div>
				<div class="flex items-center gap-2.5">
					<button
						onclick={() => {
							isModalOpen = true;
							isOpen = false;
						}}
						class="text-zinc-400 hover:text-zinc-650 dark:hover:text-white focus:outline-none cursor-pointer"
						title="Mở rộng"
					>
						<span class="icon-[lucide--maximize-2] h-4 w-4"></span>
					</button>
					<button
						onclick={() => (isOpen = false)}
						class="text-zinc-400 hover:text-zinc-650 dark:hover:text-white focus:outline-none cursor-pointer"
					>
						<span class="icon-[lucide--x] h-4 w-4"></span>
					</button>
				</div>
			</header>

			<!-- Messages Log Area -->
			<div
				class="flex flex-col gap-3 h-72 overflow-y-auto p-4 zen-scrollbar bg-zinc-50/50 dark:bg-zinc-950/20"
			>
				{#each messages as msg}
					<div
						class={`flex flex-col max-w-[80%] ${msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
					>
						<div
							class={`px-3 py-2 text-xs rounded-2xl leading-relaxed ${
								msg.sender === 'user'
									? 'bg-gradient-to-r from-emerald-500 to-sky-500 text-white rounded-br-none'
									: 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200/20 dark:border-zinc-800/30 rounded-bl-none shadow-xs'
							}`}
						>
							{msg.text}
						</div>
						<span class="text-[9px] text-zinc-400 dark:text-zinc-500 mt-1 px-1">{msg.time}</span>
					</div>
				{/each}

				<!-- Bot is Typing Indicator -->
				{#if isTyping}
					<div class="flex flex-col max-w-[80%] self-start items-start">
						<div
							class="px-3 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200/20 dark:border-zinc-800/30 rounded-2xl rounded-bl-none shadow-xs flex items-center gap-1"
						>
							<span
								class="h-1.5 w-1.5 bg-zinc-400 rounded-full animate-bounce"
								style="animation-delay: 0ms"
							></span>
							<span
								class="h-1.5 w-1.5 bg-zinc-400 rounded-full animate-bounce"
								style="animation-delay: 150ms"
							></span>
							<span
								class="h-1.5 w-1.5 bg-zinc-400 rounded-full animate-bounce"
								style="animation-delay: 300ms"
							></span>
						</div>
					</div>
				{/if}
			</div>

			<!-- Message Input Form -->
			<form
				onsubmit={(e) => {
					e.preventDefault();
					sendMessage();
				}}
				class="flex items-center gap-2 border-t border-zinc-200/30 p-3 dark:border-zinc-800/30 bg-white dark:bg-zinc-900"
			>
				<input
					type="text"
					bind:value={newMessage}
					placeholder="Nhập tin nhắn..."
					class="flex-grow rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 transition-colors duration-200 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-50"
				/>
				<button
					type="submit"
					disabled={!newMessage.trim()}
					class="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 text-white shadow-xs disabled:opacity-40 zen-transition cursor-pointer"
				>
					<span class="icon-[lucide--send] h-4 w-4"></span>
				</button>
			</form>
		</div>
	{/if}
</div>

<!-- Expanded Chat Modal -->
<Modal bind:open={isModalOpen} title="AI Assistant - Trợ Lý Thông Minh" size="80">
	<div class="flex flex-col h-full justify-between gap-4">
		<!-- Expanded Messages Area -->
		<div
			class="flex-grow flex flex-col gap-4 overflow-y-auto pr-2 min-h-[50vh] max-h-[55vh] zen-scrollbar bg-zinc-50/50 dark:bg-zinc-950/20 p-4 rounded-xl border border-zinc-200/20 dark:border-zinc-800/30"
		>
			{#each messages as msg}
				<div
					class={`flex flex-col max-w-[70%] ${msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
				>
					<div
						class={`px-4 py-2.5 text-sm rounded-2xl leading-relaxed ${
							msg.sender === 'user'
								? 'bg-gradient-to-r from-emerald-500 to-sky-500 text-white rounded-br-none'
								: 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200/20 dark:border-zinc-800/30 rounded-bl-none shadow-xs'
						}`}
					>
						{msg.text}
					</div>
					<span class="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 px-1">{msg.time}</span>
				</div>
			{/each}

			{#if isTyping}
				<div class="flex flex-col max-w-[70%] self-start items-start">
					<div
						class="px-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200/20 dark:border-zinc-800/30 rounded-2xl rounded-bl-none shadow-xs flex items-center gap-1.5"
					>
						<span
							class="h-2 w-2 bg-zinc-400 rounded-full animate-bounce"
							style="animation-delay: 0ms"
						></span>
						<span
							class="h-2 w-2 bg-zinc-400 rounded-full animate-bounce"
							style="animation-delay: 150ms"
						></span>
						<span
							class="h-2 w-2 bg-zinc-400 rounded-full animate-bounce"
							style="animation-delay: 300ms"
						></span>
					</div>
				</div>
			{/if}
		</div>

		<!-- Expanded Message Input Form -->
		<form
			onsubmit={(e) => {
				e.preventDefault();
				sendMessage();
			}}
			class="flex items-center gap-3 mt-2"
		>
			<input
				type="text"
				bind:value={newMessage}
				placeholder="Nhập câu hỏi của bạn cho trợ lý AI..."
				class="flex-grow rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 transition-colors duration-200 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-50"
			/>
			<button
				type="submit"
				disabled={!newMessage.trim()}
				class="flex h-12 px-6 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 text-white shadow-md disabled:opacity-40 hover:from-emerald-400 hover:to-sky-400 transition-all cursor-pointer font-semibold"
			>
				<span class="icon-[lucide--send] h-5 w-5"></span>
				<span>Gửi câu hỏi</span>
			</button>
		</form>
	</div>
</Modal>

<style>
	.animate-spin-once {
		animation: spin 0.3s ease-out 1;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(180deg);
		}
	}
</style>
