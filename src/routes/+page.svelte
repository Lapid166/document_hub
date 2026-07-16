<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';

	let { data } = $props();
	let products = $derived(data.products);

	// Dark mode state
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

	// Extract unique categories dynamically from database
	let categories = $derived(['Tất Cả', ...new Set(products.map((p) => p.category || 'Uncategorized'))]);

	let activeCategory = $state('Tất Cả');

	// Extract tags dynamically based on selected category
	let availableTags = $derived([
		...new Set(
			(activeCategory === 'Tất Cả'
				? products
				: products.filter((p) => (p.category || 'Uncategorized') === activeCategory)
			).flatMap((p) => p.tags)
		)
	]);

	let activeTag = $state<string | null>(null);

	// Reset active tag if category changes
	$effect(() => {
		const currentCategory = activeCategory;
		activeTag = null; // Reset tag filter on category change
	});

	// Filtered products list
	let filteredProducts = $derived(
		products.filter((p) => {
			const matchesCategory = activeCategory === 'Tất Cả' || (p.category || 'Uncategorized') === activeCategory;
			const matchesTag = !activeTag || p.tags.includes(activeTag);
			return matchesCategory && matchesTag;
		})
	);

	// Stats array
	const stats = [
		{ value: '3+', label: 'Sản Phẩm', icon: 'icon-[lucide--package]', color: 'text-emerald-500' },
		{ value: '24/7', label: 'Tự Động', icon: 'icon-[lucide--cpu]', color: 'text-sky-500' },
		{ value: '100%', label: 'Mã Nguồn', icon: 'icon-[lucide--code-2]', color: 'text-amber-500' },
		{ value: '∞', label: 'Cập Nhật', icon: 'icon-[lucide--history]', color: 'text-rose-500' }
	];

	// Why Choose Us array (Customized for product showcase)
	const features = [
		{
			title: 'Tài Liệu Hướng Dẫn',
			description:
				'Mỗi công cụ/plugin đều đi kèm tài liệu hướng dẫn cài đặt và sử dụng chi tiết step-by-step.',
			icon: 'icon-[lucide--book-open]',
			color: 'text-emerald-500 bg-emerald-500/10'
		},
		{
			title: 'Tải Về & Tích Hợp',
			description: 'Cung cấp trực tiếp file ZIP mã nguồn sạch sẽ, không chứa quảng cáo hay mã độc.',
			icon: 'icon-[lucide--download]',
			color: 'text-amber-500 bg-amber-500/10'
		},
		{
			title: 'Trợ Lý AI Tích Hợp',
			description:
				'Mỗi sản phẩm có riêng một chatbot AI chuyên sâu am hiểu tài liệu để trợ giúp kỹ thuật.',
			icon: 'icon-[lucide--sparkles]',
			color: 'text-sky-500 bg-sky-500/10'
		},
		{
			title: 'Hiệu Suất Cao',
			description:
				'Tối ưu hóa mã nguồn tối đa để đảm bảo website/hệ thống của bạn vận hành nhanh nhất.',
			icon: 'icon-[lucide--zap]',
			color: 'text-orange-500 bg-orange-500/10'
		},
		{
			title: 'Hỏi/Đáp & Changelog',
			description:
				'Hỗ trợ phần hỏi đáp trực tiếp và nhật ký cập nhật để bạn luôn có thông tin mới nhất.',
			icon: 'icon-[lucide--help-circle]',
			color: 'text-rose-500 bg-rose-500/10'
		},
		{
			title: 'Dễ Dàng Tùy Biến',
			description:
				'Các danh mục và thẻ tag sản phẩm có thể được thay đổi động trực tiếp từ trang Admin CMS.',
			icon: 'icon-[lucide--settings-2]',
			color: 'text-purple-500 bg-purple-500/10'
		}
	];
</script>

<!-- SEO Title & Meta -->
<svelte:head>
	<title>Mini Games Hub - Kho sản phẩm công nghệ & Plugin tiện ích</title>
	<meta
		name="description"
		content="Khám phá các plugin WordPress chất lượng cao, các công cụ CMS hữu ích và mã nguồn game mini đỉnh cao. Tải về và tích hợp tức thì!"
	/>
</svelte:head>

<div
	class="relative min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-500 flex flex-col"
>
	<!-- Background Glow Blobs Container -->
	<div class="absolute inset-0 overflow-hidden pointer-events-none z-0">
		<div class="zen-glow-emerald w-72 h-72 sm:w-96 sm:h-96 top-[-10%] left-[-10%] opacity-70"></div>
		<div
			class="zen-glow-sky w-80 h-80 sm:w-[30rem] sm:h-[30rem] top-[40%] right-[-10%] opacity-50"
		></div>
		<div
			class="zen-glow-emerald w-72 h-72 sm:w-[25rem] sm:h-[25rem] bottom-[-5%] left-[20%] opacity-60"
		></div>
	</div>

	<!-- Top Navbar -->
	<nav
		class="sticky top-0 z-40 w-full border-b border-zinc-200/30 bg-white/70 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/70 zen-transition"
	>
		<div class="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-4">
			<!-- Logo -->
			<div class="flex items-center gap-2 sm:gap-3">
				<div
					class="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-tr from-emerald-500 to-sky-500 text-white shadow-md"
				>
					<span class="icon-[lucide--gamepad-2] h-5 w-5 sm:h-6 sm:w-6"></span>
				</div>
				<span
					class="text-base sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-white font-sans"
				>
					Mini Games <span
						class="bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent"
						>Hub</span
					>
				</span>
			</div>

			<!-- Navigation Links (Desktop only) -->
			<div class="hidden md:flex items-center gap-8">
				<a
					href="#showcase-section"
					class="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white zen-transition"
					>Sản Phẩm</a
				>
				<a
					href="#about-section"
					class="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white zen-transition"
					>Về Chúng Tôi</a
				>
				<a
					href="#features-section"
					class="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white zen-transition"
					>Tính Năng</a
				>
				<a
					href="#stats-section"
					class="text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white zen-transition"
					>Số Liệu</a
				>
			</div>

			<!-- Action Controls -->
			<div class="flex items-center gap-2 sm:gap-4">
				<!-- Theme Toggle -->
				<button
					onclick={toggleDarkMode}
					class="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-zinc-200/50 bg-white text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800/50 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 zen-transition cursor-pointer"
					aria-label="Toggle Dark Mode"
				>
					{#if isDark}
						<span class="icon-[lucide--sun] h-4.5 w-4.5"></span>
					{:else}
						<span class="icon-[lucide--moon] h-4.5 w-4.5"></span>
					{/if}
				</button>

				<!-- Auth Button -->
				<Button
					variant="primary"
					size="sm"
					onclick={() => (window.location.href = '/auth?mode=login')}
					class="sm:py-2 sm:px-4"
				>
					<span class="icon-[lucide--log-in] h-3.5 w-3.5"></span>
					<span>Đăng Nhập</span>
				</Button>
			</div>
		</div>
	</nav>

	<main
		class="flex-grow mx-auto max-w-7xl px-4 sm:px-6 py-10 md:py-20 flex flex-col gap-16 md:gap-24 relative w-full"
	>
		<!-- 1. Hero Section -->
		<section class="flex flex-col items-center text-center gap-6 sm:gap-8 py-4 sm:py-8 relative">
			<!-- Studio Tag -->
			<div
				class="inline-flex items-center gap-2 rounded-full border border-zinc-200/30 bg-white/80 px-3.5 py-1 text-[11px] sm:text-xs font-semibold text-zinc-600 dark:border-zinc-800/70 dark:bg-zinc-900/80 dark:text-zinc-300 backdrop-blur-md"
			>
				<span class="icon-[lucide--sparkles] text-emerald-500 h-3.5 w-3.5"></span>
				<span>Mini Games Studio</span>
			</div>

			<!-- Heading -->
			<div class="flex flex-col gap-3 sm:gap-4 max-w-3xl">
				<h1
					class="text-3xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-tight"
				>
					Mini Games <span
						class="bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 bg-clip-text text-transparent"
						>Hub</span
					>
				</h1>
				<p
					class="text-sm sm:text-base md:text-lg text-zinc-500 dark:text-zinc-400 font-light leading-relaxed max-w-xl sm:max-w-2xl mx-auto"
				>
					Khám phá và tải về các plugin WordPress chất lượng cao, các công cụ CMS chuyên nghiệp cùng
					kho game mini độc đáo cho website của bạn.
				</p>
			</div>

			<!-- Action Buttons -->
			<div class="flex flex-wrap justify-center gap-3 mt-2 sm:mt-0">
				<Button
					variant="primary"
					size="lg"
					onclick={() =>
						document.getElementById('showcase-section')?.scrollIntoView({ behavior: 'smooth' })}
					class="py-2.5 px-5 sm:py-3 sm:px-6 text-xs sm:text-sm"
				>
					<span class="icon-[lucide--package] h-4.5 w-4.5"></span>
					<span>Xem Kho Sản Phẩm</span>
				</Button>
				<Button
					variant="secondary"
					size="lg"
					onclick={() => (window.location.href = '/auth?mode=register')}
					class="py-2.5 px-5 sm:py-3 sm:px-6 text-xs sm:text-sm"
				>
					<span class="icon-[lucide--user-plus] h-4.5 w-4.5"></span>
					<span>Đăng Ký Ngay</span>
				</Button>
			</div>

			<!-- Decorative Scroll Indicator -->
			<div
				class="absolute bottom-[-4rem] left-1/2 transform -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-zinc-400"
			>
				<span class="text-[10px] uppercase tracking-widest font-medium">Cuộn Xuống</span>
				<div
					class="w-6 h-10 border-2 border-zinc-200 dark:border-zinc-800 rounded-full flex justify-center p-1.5"
				>
					<div class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
				</div>
			</div>
		</section>

		<!-- 2. Products Showcase Section -->
		<section id="showcase-section" class="scroll-mt-20 flex flex-col gap-8 sm:gap-10">
			<!-- Header and Filters -->
			<div class="flex flex-col items-center text-center gap-5 max-w-3xl mx-auto w-full">
				<div class="flex flex-col items-center gap-2">
					<div
						class="flex items-center gap-2 text-emerald-500 font-semibold text-xs sm:text-sm uppercase tracking-wider"
					>
						<span class="icon-[lucide--layers]"></span>
						<span>Kho Tài Nguyên</span>
					</div>
					<h2
						class="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white"
					>
						Danh Sách <span
							class="bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent"
							>Sản Phẩm</span
						>
					</h2>
					<p
						class="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-light max-w-xl"
					>
						Lọc sản phẩm theo danh mục và từ khóa thẻ tag bên dưới. Tất cả các danh mục và thẻ tag
						này được CMS cập nhật hoàn toàn tự động.
					</p>
				</div>

				<!-- Category Filters (Mobile Horizontal Scroll support) -->
				<div
					class="w-full overflow-x-auto scrollbar-none -webkit-overflow-scrolling-touch pb-2 flex justify-start md:justify-center px-1"
				>
					<div
						class="flex gap-2 p-1 bg-zinc-200/50 dark:bg-zinc-900/60 border border-zinc-200/30 dark:border-zinc-800/60 rounded-xl max-w-max md:w-auto shrink-0"
					>
						{#each categories as cat}
							<button
								onclick={() => (activeCategory = cat)}
								class={`px-3.5 py-2 text-xs font-semibold rounded-lg zen-transition flex items-center gap-1.5 cursor-pointer ${
									activeCategory === cat
										? 'bg-gradient-to-r from-emerald-500 to-sky-500 text-white shadow-sm'
										: 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
								}`}
							>
								{cat}
								<span
									class={`text-[9px] rounded-full px-1.5 py-0.5 ${
										activeCategory === cat
											? 'bg-white/25 text-white'
											: 'bg-zinc-300/50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
									}`}
								>
									{cat === 'Tất Cả'
										? products.length
										: products.filter((p) => p.category === cat).length}
								</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- Sub-Tags Cloud Filter (Mobile Horizontal Scroll support) -->
				{#if availableTags.length > 0}
					<div
						class="w-full overflow-x-auto scrollbar-none -webkit-overflow-scrolling-touch pb-2 flex justify-start md:justify-center px-1 border-t border-zinc-200/10 pt-4 dark:border-zinc-800/10"
					>
						<div class="flex gap-2 shrink-0">
							<button
								onclick={() => (activeTag = null)}
								class={`px-3 py-1 text-xs rounded-full border zen-transition cursor-pointer shrink-0 ${
									activeTag === null
										? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
										: 'border-zinc-200 text-zinc-500 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-white'
								}`}
							>
								Tất cả tag
							</button>
							{#each availableTags as tag}
								<button
									onclick={() => (activeTag = activeTag === tag ? null : tag)}
									class={`px-3 py-1 text-xs rounded-full border zen-transition cursor-pointer shrink-0 ${
										activeTag === tag
											? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
											: 'border-zinc-200/50 text-zinc-500 hover:text-zinc-900 dark:border-zinc-800/30 dark:text-zinc-400 dark:hover:text-white'
									}`}
								>
									#{tag}
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Products Showcase Bento Grid (Responsive columns scaling) -->
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
				{#each filteredProducts as product}
					<Card
						hover={true}
						span="flex flex-col justify-between p-5 sm:p-6 min-h-[15rem] sm:min-h-[16rem] group relative overflow-hidden w-full"
					>
						<!-- Card background glow -->
						<div
							class="absolute inset-0 bg-gradient-to-tr from-emerald-500/[0.02] to-sky-500/[0.02] opacity-0 group-hover:opacity-100 zen-transition pointer-events-none"
						></div>

						<div>
							<!-- Icon & Category -->
							<div class="flex items-center justify-between mb-4 sm:mb-5">
								<div
									class={`h-11 w-11 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shadow-xs ${product.iconColor}`}
								>
									<span class={`${product.icon} h-5.5 w-5.5 sm:h-6 sm:w-6`}></span>
								</div>
								<Badge variant="info" class="text-[9px] py-0.5 px-2">{product.category}</Badge>
							</div>

							<!-- Title & Description -->
							<div class="flex flex-col gap-1.5 sm:gap-2">
								<h3
									class="font-bold text-zinc-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 zen-transition text-base sm:text-lg"
								>
									{product.name}
								</h3>
								<p
									class="text-xs sm:text-sm text-zinc-450 dark:text-zinc-500 leading-relaxed font-light line-clamp-3"
								>
									{product.description}
								</p>
							</div>
						</div>

						<!-- Tags and Actions Footer -->
						<div
							class="flex flex-col gap-3.5 mt-5 sm:mt-6 pt-4 border-t border-zinc-200/20 dark:border-zinc-800/60"
						>
							<!-- Tags list -->
							<div class="flex flex-wrap gap-1.5">
								{#each product.tags as tag}
									<span
										class="text-[8px] sm:text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-950 px-2 py-0.5 rounded-md uppercase tracking-wider"
									>
										#{tag}
									</span>
								{/each}
							</div>

							<!-- Action Details button -->
							<div class="flex justify-between items-center">
								{#if product.downloadUrl}
									<span
										class="text-[9px] sm:text-[10px] text-zinc-400 uppercase tracking-wider font-normal"
									>
										{product.fileSize}
									</span>
								{:else}
									<span
										class="text-[9px] sm:text-[10px] text-zinc-400 uppercase tracking-wider font-normal"
									>
										SaaS Tool
									</span>
								{/if}

								<!-- Direct hash link fallback to intro tab -->
								<a
									href={`/products/${product.id}#intro`}
									class="text-xs font-semibold text-emerald-500 dark:text-emerald-400 inline-flex items-center gap-1 hover:underline"
								>
									<span>Chi tiết</span>
									<span class="icon-[lucide--chevron-right] w-3 h-3"></span>
								</a>
							</div>
						</div>
					</Card>
				{/each}
			</div>
		</section>

		<!-- 3. About Section -->
		<section
			id="about-section"
			class="scroll-mt-20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
		>
			<!-- Left Info Column -->
			<div class="lg:col-span-7 flex flex-col gap-5 sm:gap-6">
				<div
					class="flex items-center gap-2 text-emerald-500 font-semibold text-xs sm:text-sm uppercase tracking-wider"
				>
					<span class="icon-[lucide--info]"></span>
					<span>Về Chúng Tôi</span>
				</div>
				<h2
					class="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight"
				>
					Tạo Ra Trải Nghiệm <br class="hidden md:block" />
					<span class="bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent"
						>Công Nghệ Tối Ưu</span
					>
				</h2>
				<p
					class="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-light max-w-xl"
				>
					Chúng tôi chuyên thiết kế và phát triển các giải pháp mã nguồn, plugin và công cụ CMS gọn
					nhẹ, an toàn và dễ sử dụng nhất. Mỗi sản phẩm được phát triển để giải quyết các vấn đề kỹ
					thuật thực tế cho website.
				</p>
				<p
					class="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-light max-w-xl"
				>
					Với tài liệu hướng dẫn đầy đủ, hệ thống hỏi đáp phong phú và trợ lý AI thông minh hỗ trợ
					trực tiếp, chúng tôi cam kết mang lại sự an tâm tuyệt đối cho bạn khi tích hợp sản phẩm.
				</p>

				<!-- Bullet points -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-2">
					<div class="flex items-center gap-2.5 sm:gap-3">
						<span
							class="icon-[lucide--check-circle-2] text-emerald-500 h-4.5 w-4.5 sm:h-5 sm:w-5 shrink-0"
						></span>
						<span class="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300"
							>Tải Về & Tích Hợp Nhanh</span
						>
					</div>
					<div class="flex items-center gap-2.5 sm:gap-3">
						<span
							class="icon-[lucide--check-circle-2] text-emerald-500 h-4.5 w-4.5 sm:h-5 sm:w-5 shrink-0"
						></span>
						<span class="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300"
							>Tài Liệu Hướng Dẫn Kỹ Lưỡng</span
						>
					</div>
					<div class="flex items-center gap-2.5 sm:gap-3">
						<span
							class="icon-[lucide--check-circle-2] text-emerald-500 h-4.5 w-4.5 sm:h-5 sm:w-5 shrink-0"
						></span>
						<span class="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300"
							>Trợ Lý AI Am Hiểu Sản Phẩm</span
						>
					</div>
					<div class="flex items-center gap-2.5 sm:gap-3">
						<span
							class="icon-[lucide--check-circle-2] text-emerald-500 h-4.5 w-4.5 sm:h-5 sm:w-5 shrink-0"
						></span>
						<span class="text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300"
							>Nhật Ký Cập Nhật Rõ Ràng</span
						>
					</div>
				</div>
			</div>

			<!-- Right Bento Stats Column -->
			<div class="lg:col-span-5 grid grid-cols-2 gap-3 sm:gap-4">
				<div
					class="p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-zinc-200/30 dark:border-zinc-800 rounded-2xl flex flex-col justify-between h-[9rem] sm:h-[10rem] shadow-sm"
				>
					<span class="text-2xl sm:text-3xl font-extrabold text-emerald-500">3+</span>
					<div>
						<h5 class="font-bold text-zinc-900 dark:text-white text-xs sm:text-sm">Sản Phẩm</h5>
						<p class="text-[10px] sm:text-xs text-zinc-400 mt-1">Đã được phát hành rộng rãi</p>
					</div>
				</div>

				<div
					class="p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-zinc-200/30 dark:border-zinc-800 rounded-2xl flex flex-col justify-between h-[9rem] sm:h-[10rem] shadow-sm"
				>
					<span class="text-2xl sm:text-3xl font-extrabold text-amber-500">100%</span>
					<div>
						<h5 class="font-bold text-zinc-900 dark:text-white text-xs sm:text-sm">
							Mã Nguồn Sạch
						</h5>
						<p class="text-[10px] sm:text-xs text-zinc-400 mt-1">An toàn tuyệt đối, sạch sẽ</p>
					</div>
				</div>

				<div
					class="p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-zinc-200/30 dark:border-zinc-800 rounded-2xl flex flex-col justify-between h-[9rem] sm:h-[10rem] shadow-sm"
				>
					<span class="text-2xl sm:text-3xl font-extrabold text-sky-500">24/7</span>
					<div>
						<h5 class="font-bold text-zinc-900 dark:text-white text-xs sm:text-sm">Tự Động Hóa</h5>
						<p class="text-[10px] sm:text-xs text-zinc-400 mt-1">Chatbot AI sẵn sàng hỗ trợ</p>
					</div>
				</div>

				<div
					class="p-5 sm:p-6 bg-white dark:bg-zinc-900 border border-zinc-200/30 dark:border-zinc-800 rounded-2xl flex flex-col justify-between h-[9rem] sm:h-[10rem] shadow-sm"
				>
					<span class="text-2xl sm:text-3xl font-extrabold text-rose-500">∞</span>
					<div>
						<h5 class="font-bold text-zinc-900 dark:text-white text-xs sm:text-sm">Cập Nhật</h5>
						<p class="text-[10px] sm:text-xs text-zinc-400 mt-1">Bảo trì và sửa lỗi trọn đời</p>
					</div>
				</div>

				<div
					class="col-span-2 p-5 sm:p-6 bg-zinc-900 dark:bg-zinc-900/40 border border-zinc-800/80 rounded-2xl flex flex-col gap-2 shadow-sm text-white"
				>
					<div
						class="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider"
					>
						<span class="icon-[lucide--target]"></span>
						<span>Sứ Mệnh Của Chúng Tôi</span>
					</div>
					<p
						class="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-550 leading-relaxed font-light"
					>
						Đóng vai trò là cổng cung cấp tài nguyên lập trình tối giản, hiện đại và chất lượng cao,
						giúp lập trình viên và quản trị web tối ưu hóa tiến trình phát triển dự án.
					</p>
				</div>
			</div>
		</section>

		<!-- 4. Features Section -->
		<section id="features-section" class="scroll-mt-20 flex flex-col gap-10 md:gap-12">
			<!-- Header -->
			<div class="text-center flex flex-col items-center gap-2.5 sm:gap-3">
				<div
					class="flex items-center gap-2 text-emerald-500 font-semibold text-xs sm:text-sm uppercase tracking-wider"
				>
					<span class="icon-[lucide--zap]"></span>
					<span>Tính Năng Nổi Bật</span>
				</div>
				<h2
					class="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight"
				>
					Tại Sao Chọn <span
						class="bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent"
						>Tài Nguyên</span
					> Của Chúng Tôi?
				</h2>
				<p class="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-light max-w-xl">
					Chúng tôi cam kết cung cấp các plugin và công cụ tối ưu nhất, giúp website của bạn chạy
					nhanh hơn và thông minh hơn.
				</p>
			</div>

			<!-- Features Grid (Tablet responsive 2-column fallback, desktop 3-column) -->
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each features as feat}
					<Card
						hover={true}
						span="flex flex-col gap-4 p-5 sm:p-6 relative overflow-hidden group w-full"
					>
						<div
							class="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.01] to-sky-500/[0.01] pointer-events-none"
						></div>

						<!-- Icon -->
						<div
							class={`h-11 w-11 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shadow-xs shrink-0 ${feat.color}`}
						>
							<span class={`${feat.icon} h-5.5 w-5.5 sm:h-6 sm:w-6`}></span>
						</div>

						<!-- Content -->
						<div class="flex flex-col gap-2">
							<h4
								class="font-bold text-zinc-900 dark:text-white text-sm sm:text-base group-hover:text-emerald-500 dark:group-hover:text-emerald-400 zen-transition"
							>
								{feat.title}
							</h4>
							<p
								class="text-xs sm:text-sm text-zinc-550 dark:text-zinc-400 leading-relaxed font-light"
							>
								{feat.description}
							</p>
						</div>
					</Card>
				{/each}
			</div>
		</section>

		<!-- 5. Impressive Stats Section -->
		<section
			id="stats-section"
			class="scroll-mt-20 flex flex-col gap-10 md:gap-12 bg-gradient-to-br from-zinc-100 via-white to-zinc-50 dark:from-zinc-900/40 dark:via-zinc-950 dark:to-zinc-900/60 border border-zinc-200/30 dark:border-zinc-800/70 rounded-3xl p-6 sm:p-8 md:p-12 relative overflow-hidden w-full"
		>
			<div class="zen-glow-sky w-72 h-72 top-[-20%] right-[-10%] opacity-40"></div>

			<div class="text-center flex flex-col items-center gap-2.5 sm:gap-3 relative z-10">
				<div
					class="flex items-center gap-2 text-emerald-500 font-semibold text-xs sm:text-sm uppercase tracking-wider"
				>
					<span class="icon-[lucide--bar-chart-3]"></span>
					<span>Thống Kê</span>
				</div>
				<h2
					class="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight"
				>
					Số Liệu <span
						class="bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent"
						>Ấn Tượng</span
					>
				</h2>
				<p class="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-light max-w-xl">
					Tự hào chia sẻ các cột mốc phát triển vững chắc của Mini Games Studio.
				</p>
			</div>

			<!-- Stats Grid (Responsive 2x2 on mobile, 4 columns on large screens) -->
			<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative z-10">
				{#each stats as item}
					<div
						class="flex flex-col items-center text-center p-5 sm:p-6 bg-white/50 dark:bg-zinc-900/30 backdrop-blur-md border border-zinc-200/30 dark:border-zinc-800/60 rounded-2xl"
					>
						<span class={`${item.icon} ${item.color} h-6.5 w-6.5 sm:h-8 sm:w-8 mb-3 sm:mb-4`}
						></span>
						<span
							class="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-950 dark:text-white bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent"
						>
							{item.value}
						</span>
						<span
							class="text-[9px] sm:text-xs text-zinc-400 mt-2 uppercase tracking-wider font-semibold"
						>
							{item.label}
						</span>
					</div>
				{/each}
			</div>
		</section>
	</main>

	<!-- Footer -->
	<footer
		class="border-t border-zinc-200/30 bg-white dark:border-zinc-800/50 dark:bg-zinc-950/80 pt-12 sm:pt-16 pb-8 zen-transition mt-auto"
	>
		<div class="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col gap-10 sm:gap-12">
			<div class="grid grid-cols-1 md:grid-cols-12 gap-8">
				<!-- Brand -->
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
						Khám phá các plugin và công cụ mã nguồn tối giản, hữu ích cho website của bạn.
					</p>
				</div>

				<!-- Quick Links -->
				<div class="md:col-span-3 flex flex-col gap-3">
					<h5
						class="text-xs font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider"
					>
						Liên Kết Nhanh
					</h5>
					<ul class="flex flex-col gap-2">
						<li>
							<a
								href="#showcase-section"
								class="text-xs text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 zen-transition"
								>Sản Phẩm</a
							>
						</li>
						<li>
							<a
								href="#about-section"
								class="text-xs text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 zen-transition"
								>Về Chúng Tôi</a
							>
						</li>
						<li>
							<a
								href="#features-section"
								class="text-xs text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 zen-transition"
								>Tính Năng</a
							>
						</li>
					</ul>
				</div>

				<!-- Social / Support -->
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

			<!-- Copyright / Bottom -->
			<div
				class="border-t border-zinc-100 dark:border-zinc-800/40 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
			>
				<p class="text-[10px] text-zinc-400 dark:text-zinc-500">
					© 2026 Mini Games Hub. Bảo lưu mọi quyền.
				</p>
				<p class="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1 font-light">
					<span>Được xây dựng với</span>
					<span class="icon-[lucide--heart] text-rose-500 h-3 w-3 animate-pulse"></span>
					<span>dành cho Game thủ</span>
				</p>
			</div>
		</div>
	</footer>
</div>

<style>
	/* Ẩn thanh cuộn cho các danh mục cuộn ngang */
	.scrollbar-none::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-none {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
</style>
