<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import Modal from '$lib/components/Modal.svelte';

	let { data } = $props();

	// Fetch current product dynamically based on routing load
	let product = $derived(data.product);

	// Tab states
	let enabledTabs = $derived.by(() => {
		const list = [{ id: 'intro', label: 'Giới Thiệu', icon: 'icon-[lucide--info]' }];
		if (product?.enableGuides && product.guides && (product.guides as any[]).length > 0) {
			list.push({ id: 'guide', label: 'Hướng Dẫn', icon: 'icon-[lucide--book-open]' });
		}
		if (product?.enableFaqs && product.faqs && (product.faqs as any[]).length > 0) {
			list.push({ id: 'faq', label: 'Hỏi / Đáp', icon: 'icon-[lucide--help-circle]' });
		}
		if (product?.enableDownload) {
			list.push({ id: 'changelog', label: 'Cập Nhật', icon: 'icon-[lucide--history]' });
		}
		list.push({ id: 'chatbot', label: 'Trợ Lý AI', icon: 'icon-[lucide--sparkles]' });
		return list;
	});

	let activeTab = $state('intro');

	// Slideshow & Lightbox state
	let currentSlideIndex = $state(0);
	let isZoomOpen = $state(false);

	// Contextual AI chatbot states
	let chatMessages = $state<{ sender: 'user' | 'bot'; text: string; time: string }[]>([]);
	let chatInput = $state('');
	let chatTyping = $state(false);

	// FAQ toggle index tracking
	let openFaqIndex = $state<number | null>(0);

	// Dark Mode sync
	let isDark = $state(false);

	$effect(() => {
		const theme =
			localStorage.getItem('theme') ||
			(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
		isDark = theme === 'dark';
		document.documentElement.classList.toggle('dark', isDark);
	});

	function toggleDarkMode() {
		isDark = !isDark;
		localStorage.setItem('theme', isDark ? 'dark' : 'light');
		document.documentElement.classList.toggle('dark', isDark);
	}

	onMount(() => {
		// Sync active tab with URL Hash immediately on load
		syncTabWithHash();

		// Listen to URL hash change events
		window.addEventListener('hashchange', syncTabWithHash);

		// Initialize bot welcome message
		if (product) {
			chatMessages = [
				{
					sender: 'bot',
					text: `Xin chào! Tôi là trợ lý AI chuyên biệt cho **${product.name}**. Bạn có thắc mắc nào về cách cài đặt, các câu hỏi FAQ hay nhật ký cập nhật của sản phẩm này không?`,
					time: getFormattedTime()
				}
			];
		}

		return () => {
			window.removeEventListener('hashchange', syncTabWithHash);
		};
	});

	function syncTabWithHash() {
		if (typeof window !== 'undefined') {
			const hash = window.location.hash.replace('#', '');
			const validTabIds = enabledTabs.map((t) => t.id);
			if (validTabIds.includes(hash)) {
				activeTab = hash;
			} else {
				// If no hash or invalid hash, write default '#intro' in URL
				activeTab = 'intro';
				window.location.hash = 'intro';
			}

			// Safe auto scroll active tab into view without shifting the entire window
			setTimeout(() => {
				const tabContainer = document.getElementById('tab-container-scroll');
				const tabButton = document.getElementById(`tab-btn-${activeTab}`);
				if (tabContainer && tabButton) {
					const containerWidth = tabContainer.clientWidth;
					const buttonLeft = tabButton.offsetLeft;
					const buttonWidth = tabButton.clientWidth;
					tabContainer.scrollTo({
						left: buttonLeft - containerWidth / 2 + buttonWidth / 2,
						behavior: 'smooth'
					});
				}
			}, 50);
		}
	}

	function handleTabClick(tabId: string) {
		activeTab = tabId;
		if (typeof window !== 'undefined') {
			window.location.hash = tabId;
		}
	}

	function getFormattedTime() {
		const now = new Date();
		return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
	}

	// AI chatbot contextual response generator (streaming SSE RAG chatbot)
	async function handleSendMessage() {
		if (!chatInput.trim() || !product) return;

		const userMsg = chatInput.trim();
		const time = getFormattedTime();
		chatMessages = [...chatMessages, { sender: 'user', text: userMsg, time }];
		chatInput = '';

		chatTyping = true;

		// Add an empty bot message to append stream chunks to
		const botMessageIndex = chatMessages.length;
		chatMessages = [...chatMessages, { sender: 'bot', text: '', time: getFormattedTime() }];

		try {
			const res = await fetch(`/api/products/${product.id}/chat`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ message: userMsg })
			});

			chatTyping = false;

			if (!res.ok) {
				const errText = await res.text();
				chatMessages[botMessageIndex].text = 'Lỗi kết nối với máy chủ chatbot.';
				chatMessages = [...chatMessages];
				return;
			}

			const reader = res.body?.getReader();
			const decoder = new TextDecoder();
			if (!reader) {
				chatMessages[botMessageIndex].text = 'Không thể tạo bộ đọc luồng dữ liệu.';
				chatMessages = [...chatMessages];
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
								chatMessages[botMessageIndex].text = streamText;
								chatMessages = [...chatMessages]; // Trigger Svelte reactivity
							}
						} catch (err) {
							// Incomplete JSON
						}
					}
				}
			}
		} catch (err) {
			chatTyping = false;
			chatMessages[botMessageIndex].text = 'Không thể gửi tin nhắn. Vui lòng kiểm tra kết nối mạng của bạn.';
			chatMessages = [...chatMessages];
		}
	}

	// Slide functions
	function nextSlide() {
		if (product) {
			currentSlideIndex = (currentSlideIndex + 1) % product.slideshowImages.length;
		}
	}

	function prevSlide() {
		if (product) {
			currentSlideIndex =
				(currentSlideIndex - 1 + product.slideshowImages.length) % product.slideshowImages.length;
		}
	}
</script>

{#if !product}
	<div class="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
		<div class="text-center flex flex-col gap-4 p-6">
			<span class="icon-[lucide--alert-triangle] text-rose-500 w-12 h-12 mx-auto animate-pulse"
			></span>
			<h1 class="text-xl font-bold text-zinc-900 dark:text-white">Không tìm thấy sản phẩm</h1>
			<p class="text-sm text-zinc-500">Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
			<a href="/">
				<Button variant="secondary">Quay lại trang chủ</Button>
			</a>
		</div>
	</div>
{:else}
	<div
		class="relative min-h-screen flex flex-col justify-between bg-zinc-50 dark:bg-zinc-950 transition-colors duration-500 font-sans"
	>
		<!-- Background Glow Blobs Container -->
		<div class="absolute inset-0 overflow-hidden pointer-events-none z-0">
			<div class="zen-glow-emerald w-72 h-72 sm:w-96 sm:h-96 top-[-5%] left-[-5%] opacity-60"></div>
			<div
				class="zen-glow-sky w-80 h-80 sm:w-[30rem] sm:h-[30rem] bottom-[-5%] right-[-5%] opacity-50"
			></div>
		</div>

		<!-- Navbar -->
		<nav
			class="sticky top-0 z-40 w-full border-b border-zinc-200/30 bg-white/70 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/70 zen-transition"
		>
			<div class="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-4">
				<div class="flex items-center gap-3 sm:gap-4.5">
					<!-- Nút Quay lại -->
					<a
						href="/"
						class="flex items-center justify-center h-9 w-9 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 text-zinc-650 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/80 dark:text-zinc-400 transition-colors"
						aria-label="Quay lại trang chủ"
					>
						<span class="icon-[lucide--arrow-left] h-4.5 w-4.5"></span>
					</a>
					<!-- Logo thương hiệu -->
					<a href="/" class="flex items-center gap-2.5 sm:gap-3 group shrink-0">
						<div
							class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-sky-500 text-white shadow-md shadow-emerald-500/10 group-hover:scale-[1.02] transition-transform"
						>
							<span class="icon-[lucide--gamepad-2] h-5 w-5"></span>
						</div>
						<span
							class="font-sans text-sm sm:text-base font-extrabold tracking-tight text-zinc-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors"
						>
							Mini Games <span
								class="bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent"
								>Hub</span
							>
						</span>
					</a>
				</div>

				<div class="flex items-center gap-3">
					<button
						onclick={toggleDarkMode}
						class="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-zinc-200/50 bg-white text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800/50 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 zen-transition cursor-pointer"
						aria-label="Toggle Dark Mode"
					>
						{#if isDark}
							<span class="icon-[lucide--sun] h-4.5 w-4.5 sm:h-5 sm:w-5"></span>
						{:else}
							<span class="icon-[lucide--moon] h-4.5 w-4.5 sm:h-5 sm:w-5"></span>
						{/if}
					</button>

					<a href="/auth?mode=login">
						<Button variant="secondary" size="sm" class="sm:py-2 sm:px-4">
							<span class="icon-[lucide--log-in] h-3.5 w-3.5 sm:h-4 sm:w-4"></span>
							<span>Đăng Nhập</span>
						</Button>
					</a>
				</div>
			</div>
		</nav>

		<!-- Product Container -->
		<main
			class="flex-grow mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8 sm:gap-12 relative w-full z-10"
		>
			<!-- Product Header Section (Responsive Grid & Flex combination) -->
			<section
				class="flex flex-col w-full lg:flex-row justify-between items-start lg:items-center border-b border-zinc-200/30 gap-8 pb-8 sm:pb-10"
			>
				<!-- Product Info Area -->
				<div class="flex gap-4 sm:gap-6 items-start grow max-w-3xl">
					<div
						class={`h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-2xl flex items-center justify-center shadow-md ${product.iconColor}`}
					>
						<span class={`${product.icon} h-8 w-8 sm:h-10 sm:w-10`}></span>
					</div>
					<div class="flex flex-col gap-2">
						<div class="flex flex-wrap items-center gap-2">
							<h1
								class="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white"
							>
								{product.name}
							</h1>
							<Badge variant="success" class="text-[10px] py-0.5 px-2">{product.category}</Badge>
						</div>
						<p
							class="text-xs sm:text-sm text-zinc-550 dark:text-zinc-400 leading-relaxed font-light"
						>
							{product.description}
						</p>

						<!-- Tags list -->
						<div class="flex flex-wrap gap-1.5 mt-1">
							{#each product.tags as tag}
								<span
									class="text-[9px] font-semibold text-zinc-400 bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-500 rounded-lg px-2 py-0.5 uppercase tracking-wider"
								>
									#{tag}
								</span>
							{/each}
						</div>
					</div>
				</div>
			</section>

			<!-- Main Layout Grid (2 Columns: Left content, Right specs & ratings sidebar) -->
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full relative z-10">
				<!-- Left Column: Tab switcher and active content details -->
				<div class="lg:col-span-8 flex flex-col gap-6 w-full">
					<!-- Tabs Switcher Bar (Responsive Horizontal Scroll, touch-friendly) -->
					<section
						id="tab-container-scroll"
						class="w-full overflow-x-auto scrollbar-none -webkit-overflow-scrolling-touch pb-2 flex justify-start"
					>
						<div
							class="flex gap-2 p-1 bg-zinc-200/50 dark:bg-zinc-900/60 border border-zinc-200/30 dark:border-zinc-800/60 rounded-2xl w-full max-w-max shrink-0"
						>
							{#each enabledTabs as tab}
								<button
									id={`tab-btn-${tab.id}`}
									onclick={() => handleTabClick(tab.id)}
									class={`px-4 sm:px-5 py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shrink-0 zen-transition cursor-pointer ${
										activeTab === tab.id
											? 'bg-gradient-to-r from-emerald-500 to-sky-500 text-white shadow-sm'
											: 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
									}`}
								>
									<span class={`${tab.icon} h-4 w-4`}></span>
									<span>{tab.label}</span>
								</button>
							{/each}
						</div>
					</section>

					<!-- Tabs Content Layout -->
					<section class="flex flex-col gap-6 w-full min-h-[48vh]">
						<!-- TAB 1: INTRO (Stacked layout: Slideshow top, description bottom) -->
						{#if activeTab === 'intro'}
							<div class="flex flex-col gap-6 w-full">
								{#if product.enableSlideshow && product.slideshowImages && product.slideshowImages.length > 0}
									<!-- Slideshow container -->
									<div class="flex flex-col gap-4 w-full">
										<div
											class="relative overflow-hidden rounded-2xl border border-zinc-200/30 dark:border-zinc-800/80 bg-zinc-100 dark:bg-zinc-900 aspect-video group shadow-xs flex items-center justify-center w-full flex-grow"
										>
											<!-- Main Image Triggering zoom -->
											<button
												onclick={() => (isZoomOpen = true)}
												class="w-full h-full cursor-zoom-in flex items-center justify-center"
												aria-label="Zoom image"
											>
												<img
													src={product.slideshowImages[currentSlideIndex]}
													alt={`Demo screen ${currentSlideIndex + 1}`}
													class="w-full h-full object-cover transition-transform duration-500"
												/>
											</button>

											<!-- Zoom Hover indicator -->
											<div
												class="absolute top-3 right-3 bg-zinc-950/60 backdrop-blur-md text-white rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-xs"
											>
												<span class="icon-[lucide--maximize-2] w-4 h-4"></span>
											</div>

											<!-- Direction Arrows -->
											<button
												onclick={prevSlide}
												class="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/20 dark:border-zinc-800/20 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-850 shadow-md md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer active:scale-95"
												aria-label="Previous Slide"
											>
												<span class="icon-[lucide--chevron-left] h-5 w-5"></span>
											</button>
											<button
												onclick={nextSlide}
												class="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/20 dark:border-zinc-800/20 text-zinc-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-850 shadow-md md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer active:scale-95"
												aria-label="Next Slide"
											>
												<span class="icon-[lucide--chevron-right] h-5 w-5"></span>
											</button>

											<!-- Counter Badge -->
											<div
												class="absolute bottom-3 left-3 bg-zinc-950/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider"
											>
												{currentSlideIndex + 1} / {product.slideshowImages.length}
											</div>
										</div>

										<!-- Thumbnails row -->
										<div class="flex gap-2 overflow-x-auto pb-1 scrollbar-none shrink-0">
											{#each product.slideshowImages as img, idx}
												<button
													onclick={() => (currentSlideIndex = idx)}
													class={`h-12 w-20 sm:h-14 sm:w-24 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
														currentSlideIndex === idx
															? 'border-emerald-500 scale-[0.98]'
															: 'border-transparent hover:border-zinc-300/50'
													}`}
												>
													<img src={img} alt="Thumb" class="w-full h-full object-cover" />
												</button>
											{/each}
										</div>
									</div>
								{/if}

								<!-- Detailed info card (Stacked below) -->
								<Card
									hover={false}
									span="flex flex-col p-5 sm:p-6 justify-start w-full border border-zinc-200/30 dark:border-zinc-800/30"
								>
									<h3
										class="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-white mb-3 sm:mb-4 shrink-0"
									>
										Giới Thiệu Sản Phẩm
									</h3>
									<div
										class="text-xs sm:text-sm text-zinc-550 dark:text-zinc-400 leading-relaxed font-light"
									>
										<p>{product.detailedDescription}</p>
									</div>
								</Card>
							</div>
						{/if}

						<!-- TAB 2: GUIDE (Timeline with optimized margins) -->
						{#if activeTab === 'guide'}
							<div class="flex flex-col gap-6 max-w-full w-full">
								<div class="flex items-center gap-2 border-b border-zinc-200/30 pb-3">
									<span class="icon-[lucide--book-open] text-emerald-500 w-5 h-5"></span>
									<h3 class="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
										Tài Liệu Hướng Dẫn Sử Dụng
									</h3>
								</div>

								<div class="flex flex-col gap-5">
									{#each product.guides as step, idx}
										<div class="flex gap-3 sm:gap-4 items-start relative group">
											<!-- Vertical connecting line -->
											{#if idx < product.guides.length - 1}
												<div
													class="absolute left-5 sm:left-6 top-10 sm:top-12 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-800"
												></div>
											{/if}

											<!-- Number bullet -->
											<div
												class="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 font-bold text-sm sm:text-base border border-emerald-500/20 shadow-xs"
											>
												{idx + 1}
											</div>

											<!-- Card Details -->
											<Card
												hover={true}
												span="w-full p-4 sm:p-5 flex flex-col gap-1.5 sm:gap-2 border border-zinc-200/30 dark:border-zinc-800/30"
											>
												<h4 class="font-bold text-zinc-950 dark:text-white text-xs sm:text-sm">
													{step.title}
												</h4>
												<p
													class="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed font-light"
												>
													{step.content}
												</p>
											</Card>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- TAB 3: FAQ (Responsive accordion) -->
						{#if activeTab === 'faq'}
							<div class="flex flex-col gap-6 max-w-full w-full">
								<div class="flex items-center gap-2 border-b border-zinc-200/30 pb-3">
									<span class="icon-[lucide--help-circle] text-sky-500 w-5 h-5"></span>
									<h3 class="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
										Câu Hỏi Thường Gặp (FAQs)
									</h3>
								</div>

								<div class="flex flex-col gap-3">
									{#each product.faqs as faq, idx}
										<div
											class="border border-zinc-200/30 dark:border-zinc-800/80 rounded-2xl bg-white dark:bg-zinc-900 shadow-xs overflow-hidden"
										>
											<!-- Accordion Trigger Button -->
											<button
												onclick={() => (openFaqIndex = openFaqIndex === idx ? null : idx)}
												class="flex w-full items-center justify-between p-4 sm:p-5 text-left text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer gap-4"
											>
												<span>{faq.question}</span>
												<span
													class={`icon-[lucide--chevron-down] w-4.5 h-4.5 shrink-0 text-zinc-400 transition-transform duration-300 ${
														openFaqIndex === idx ? 'rotate-180 text-emerald-500' : ''
													}`}
												></span>
											</button>

											<!-- Accordion Content -->
											{#if openFaqIndex === idx}
												<div
													class="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed font-light border-t border-zinc-200/20 dark:border-zinc-800/20 bg-zinc-50/30 dark:bg-zinc-950/10"
												>
													{faq.answer}
												</div>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- TAB 4: CHANGELOG (Bento blocks) -->
						{#if activeTab === 'changelog'}
							<div class="flex flex-col gap-6 max-w-full w-full">
								<div class="flex items-center gap-2 border-b border-zinc-200/30 pb-3">
									<span class="icon-[lucide--history] text-amber-500 w-5 h-5"></span>
									<h3 class="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
										Nhật Ký Cập Nhật Phiên Bản
									</h3>
								</div>

								<div class="flex flex-col gap-5">
									{#each product.changelogs as log}
										<Card
											hover={false}
											span="p-5 sm:p-6 relative overflow-hidden w-full border border-zinc-200/30 dark:border-zinc-800/30"
										>
											<!-- Background marker -->
											<div
												class="absolute top-0 right-0 h-14 w-14 bg-gradient-to-bl from-amber-500/10 to-transparent pointer-events-none"
											></div>

											<div class="flex flex-col gap-3">
												<!-- Header Version & Date -->
												<div
													class="flex justify-between items-center border-b border-zinc-200/20 pb-2.5 dark:border-zinc-800/30"
												>
													<span class="text-sm sm:text-base font-extrabold text-amber-500"
														>{log.version}</span
													>
													<span class="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500"
														>{log.date}</span
													>
												</div>

												<!-- Changes list -->
												<ul class="flex flex-col gap-1.5">
													{#each log.changes as change}
														<li
															class="flex gap-2 items-start text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 leading-normal font-light"
														>
															<span class="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5"
															></span>
															<span>{change}</span>
														</li>
													{/each}
												</ul>
											</div>
										</Card>
									{/each}
								</div>
							</div>
						{/if}

						<!-- TAB 5: CHATBOT (Responsive, standalone layout chatbot) -->
						{#if activeTab === 'chatbot'}
							<div class="w-full">
								<Card
									hover={false}
									span="p-0 border border-zinc-200/30 dark:border-zinc-800/30 overflow-hidden shadow-md w-full"
								>
									<!-- Chat Header -->
									<header
										class="flex items-center justify-between border-b border-zinc-200/30 bg-gradient-to-r from-emerald-500/10 to-sky-500/10 px-4 sm:px-5 py-3.5 dark:border-zinc-800/30"
									>
										<div class="flex items-center gap-3">
											<div
												class="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-sky-500 text-white shadow-sm"
											>
												<span class="icon-[lucide--sparkles] h-4.5 w-4.5 sm:h-5 sm:w-5"></span>
											</div>
											<div>
												<h4
													class="text-xs sm:text-sm font-bold tracking-tight text-zinc-900 dark:text-white"
												>
													AI Assistant ({product.name})
												</h4>
												<span
													class="text-[9px] sm:text-[10px] text-emerald-500 font-semibold uppercase tracking-wider flex items-center gap-1.5"
												>
													<span class="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"
													></span>
													Cơ sở dữ liệu sẵn sàng
												</span>
											</div>
										</div>
									</header>

									<!-- Message log area (Responsive height) -->
									<div
										class="flex flex-col gap-3.5 h-[18rem] sm:h-[22rem] overflow-y-auto p-4 sm:p-5 bg-zinc-50/50 dark:bg-zinc-950/20 zen-scrollbar"
									>
										{#each chatMessages as msg}
											<div
												class={`flex flex-col max-w-[85%] sm:max-w-[75%] ${msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
											>
												<div
													class={`px-3.5 py-2 text-[11px] sm:text-xs rounded-2xl leading-relaxed ${
														msg.sender === 'user'
															? 'bg-gradient-to-r from-emerald-500 to-sky-500 text-white rounded-br-none'
															: 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200/20 dark:border-zinc-800/30 rounded-bl-none shadow-xs'
													}`}
												>
													{msg.text}
												</div>
												<span
													class="text-[8px] sm:text-[9px] text-zinc-400 dark:text-zinc-500 mt-1 px-1"
													>{msg.time}</span
												>
											</div>
										{/each}

										<!-- Bot is typing spinner -->
										{#if chatTyping}
											<div class="flex flex-col max-w-[75%] self-start items-start">
												<div
													class="px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200/20 dark:border-zinc-800/30 rounded-2xl rounded-bl-none shadow-xs flex items-center gap-1"
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

									<!-- Message inputs -->
									<form
										onsubmit={(e) => {
											e.preventDefault();
											handleSendMessage();
										}}
										class="flex items-center gap-2 border-t border-zinc-200/30 p-3 sm:p-4 dark:border-zinc-800/30 bg-white dark:bg-zinc-900"
									>
										<input
											type="text"
											bind:value={chatInput}
											placeholder="Hỏi về cài đặt, FAQs, update..."
											class="flex-grow rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-[11px] sm:text-xs text-zinc-900 transition-colors duration-200 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-50"
										/>
										<button
											type="submit"
											disabled={!chatInput.trim()}
											class="flex h-9 px-4 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 text-white shadow-xs disabled:opacity-40 hover:from-emerald-400 hover:to-sky-400 transition-all cursor-pointer font-bold text-[11px] shrink-0"
										>
											<span class="icon-[lucide--send] h-3.5 w-3.5"></span>
											<span>Gửi</span>
										</button>
									</form>
								</Card>
							</div>
						{/if}
					</section>
				</div>

				<!-- Right Column: Sticky Sidebar specs, ratings and action triggers -->
				<div class="lg:col-span-4 flex flex-col gap-6 w-full lg:sticky lg:top-24">
					<!-- Actions Card (Equal Width Symmetrical buttons) -->
					<Card
						hover={false}
						span="p-5 sm:p-6 flex flex-col gap-3.5 border border-zinc-200/30 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-xs rounded-2xl w-full"
					>
						{#if product.downloadUrl}
							<a href={product.downloadUrl} class="w-full">
								<Button
									variant="primary"
									size="lg"
									class="w-full justify-center bg-gradient-to-r from-emerald-500 to-sky-500 text-white border-0 shadow-md py-3.5 text-sm cursor-pointer"
								>
									<span class="icon-[lucide--download] h-4.5 w-4.5"></span>
									<span class="font-bold">Tải Về</span>
								</Button>
							</a>
						{/if}

						{#if product.liveDemoUrl}
							<a href={product.liveDemoUrl} target="_blank" rel="noopener" class="w-full">
								<Button
									variant="secondary"
									size="lg"
									class="w-full justify-center py-3.5 text-sm cursor-pointer"
								>
									<span class="icon-[lucide--external-link] h-4.5 w-4.5"></span>
									<span>Xem Demo</span>
								</Button>
							</a>
						{/if}
					</Card>

					<!-- Technical Specifications Card -->
					<Card
						hover={false}
						span="p-5 sm:p-6 border border-zinc-200/30 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-xs rounded-2xl w-full flex flex-col gap-4"
					>
						<h3
							class="text-sm sm:text-base font-bold text-zinc-900 dark:text-white border-b border-zinc-200/30 pb-2"
						>
							Thông Số Kỹ Thuật
						</h3>
						<div class="flex flex-col gap-3.5">
							<div
								class="flex justify-between items-center text-xs font-light text-zinc-550 dark:text-zinc-400"
							>
								<span>Phiên bản hiện tại</span>
								<span class="font-bold text-zinc-900 dark:text-white"
									>{product.changelogs[0]?.version || 'v1.0.0'}</span
								>
							</div>
							<div
								class="flex justify-between items-center text-xs font-light text-zinc-550 dark:text-zinc-400"
							>
								<span>Cập nhật lần cuối</span>
								<span class="font-bold text-zinc-900 dark:text-white">{product.lastUpdated}</span>
							</div>
							<div
								class="flex justify-between items-center text-xs font-light text-zinc-550 dark:text-zinc-400"
							>
								<span>Nhà phát triển</span>
								<span class="font-bold text-zinc-900 dark:text-white">{product.author}</span>
							</div>
							<div
								class="flex justify-between items-center text-xs font-light text-zinc-550 dark:text-zinc-400"
							>
								<span>Tổng lượt tải</span>
								<span class="font-bold text-zinc-900 dark:text-white"
									>{product.downloadsCount?.toLocaleString() || '0'}</span
								>
							</div>
							<div
								class="flex justify-between items-center text-xs font-light text-zinc-550 dark:text-zinc-400"
							>
								<span>Định dạng tệp tin</span>
								<span class="font-bold text-zinc-900 dark:text-white"
									>{product.fileType} ({product.fileSize})</span
								>
							</div>
							<div
								class="flex justify-between items-center text-xs font-light text-zinc-550 dark:text-zinc-400"
							>
								<span>Yêu cầu WordPress</span>
								<span class="font-bold text-zinc-900 dark:text-white">{product.wpVersion}</span>
							</div>
							<div
								class="flex justify-between items-center text-xs font-light text-zinc-550 dark:text-zinc-400"
							>
								<span>Yêu cầu PHP</span>
								<span class="font-bold text-zinc-900 dark:text-white">{product.phpVersion}</span>
							</div>
						</div>
					</Card>
				</div>
			</div>
		</main>

		<!-- Lightbox Image zoom modal (Optimized mobile layout) -->
		{#if product}
			<Modal bind:open={isZoomOpen} title={`Demo - ${product.name}`} size="80">
				<div
					class="w-full h-full flex flex-col justify-center items-center relative overflow-hidden bg-black/95 p-3 rounded-xl min-h-[50vh] max-h-[60vh] sm:min-h-[60vh] sm:max-h-[70vh]"
				>
					<!-- Main image -->
					<img
						src={product.slideshowImages[currentSlideIndex]}
						alt="Zoomed screen"
						class="max-w-full max-h-[42vh] sm:max-h-[55vh] object-contain rounded-lg shadow-2xl"
					/>

					<!-- Navigation Buttons inside modal (Smaller on mobile) -->
					<button
						onclick={prevSlide}
						class="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 shadow-md transition-all cursor-pointer"
						aria-label="Previous image"
					>
						<span class="icon-[lucide--chevron-left] h-6 w-6 sm:h-8 sm:w-8"></span>
					</button>
					<button
						onclick={nextSlide}
						class="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 shadow-md transition-all cursor-pointer"
						aria-label="Next image"
					>
						<span class="icon-[lucide--chevron-right] h-6 w-6 sm:h-8 sm:w-8"></span>
					</button>

					<!-- Bottom dots indicator -->
					<div class="flex gap-2 mt-4 sm:mt-6 z-10">
						{#each product.slideshowImages as _, idx}
							<button
								onclick={() => (currentSlideIndex = idx)}
								class={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full transition-all cursor-pointer ${
									currentSlideIndex === idx
										? 'bg-emerald-500 scale-125'
										: 'bg-white/40 hover:bg-white/60'
								}`}
								aria-label={`Slide ${idx + 1}`}
							></button>
						{/each}
					</div>
				</div>
			</Modal>
		{/if}

		<!-- Footer -->
		<footer
			class="border-t border-zinc-200/50 bg-white dark:border-zinc-800/60 dark:bg-zinc-950/80 pt-12 pb-8 sm:pt-16 zen-transition relative z-10"
		>
			<div class="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col gap-10 sm:gap-12">
				<div class="grid grid-cols-1 md:grid-cols-12 gap-8">
					<div class="md:col-span-6 flex flex-col gap-4">
						<div class="flex items-center gap-3">
							<div
								class="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-500 to-sky-500 text-white shadow-xs"
							>
								<span class="icon-[lucide--gamepad-2] h-5 w-5"></span>
							</div>
							<span
								class="text-base sm:text-lg font-bold tracking-tight text-zinc-900 dark:text-white"
							>
								Mini Games <span
									class="bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent"
									>Hub</span
								>
							</span>
						</div>
						<p class="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed max-w-sm font-light">
							Khám phá thế giới trò chơi và các công cụ mini tiện ích độc đáo, mượt mà và hoàn toàn
							miễn phí.
						</p>
					</div>

					<div class="md:col-span-3 flex flex-col gap-3">
						<h5
							class="text-xs font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider"
						>
							Liên Kết Nhanh
						</h5>
						<ul class="flex flex-col gap-2">
							<li>
								<a
									href="/"
									class="text-xs text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 zen-transition"
									>Quay Lại Trang Chủ</a
								>
							</li>
						</ul>
					</div>

					<div class="md:col-span-3 flex flex-col gap-3">
						<h5
							class="text-xs font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider"
						>
							Thông Tin
						</h5>
						<ul class="flex flex-col gap-2 text-xs text-zinc-400">
							<li class="flex items-center gap-2">
								<span class="icon-[lucide--send] text-sky-500 h-3.5 w-3.5"></span>
								<span>Kênh Telegram</span>
							</li>
							<li class="flex items-center gap-2">
								<span class="icon-[lucide--mail] text-emerald-500 h-3.5 w-3.5"></span>
								<span>support@minigameshub.com</span>
							</li>
						</ul>
					</div>
				</div>

				<div
					class="border-t border-zinc-100 dark:border-zinc-800/40 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
				>
					<p class="text-[10px] text-zinc-400 dark:text-zinc-500">
						© 2026 Mini Games Hub. Bảo lưu mọi quyền.
					</p>
					<p
						class="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1 font-light"
					>
						<span>Được xây dựng với</span>
						<span class="icon-[lucide--heart] text-rose-500 h-3 w-3 animate-pulse"></span>
						<span>dành cho Game thủ</span>
					</p>
				</div>
			</div>
		</footer>
	</div>
{/if}

<style>
	/* Ẩn thanh cuộn của trình duyệt để tab cuộn ngang mượt mà */
	.scrollbar-none::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-none {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.animate-fade-in {
		animation: fadeIn 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
