<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';

	let { children, data } = $props();

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

	// Navigation menu items
	const menuItems = [
		{ name: 'Tổng Quan', href: '/admin', icon: 'icon-[lucide--layout-dashboard]' },
		{ name: 'Sản Phẩm', href: '/admin?tab=products', icon: 'icon-[lucide--package]' },
		{ name: 'Thống Kê', href: '/admin?tab=analytics', icon: 'icon-[lucide--bar-chart-3]' },
		{ name: 'API & Chatbots', href: '/admin?tab=api', icon: 'icon-[lucide--key-round]' },
		{
			name: 'Hỗ Trợ / Feedback',
			href: '/admin?tab=tickets',
			icon: 'icon-[lucide--message-square]'
		},
		{ name: 'Cấu Hình', href: '/admin?tab=settings', icon: 'icon-[lucide--settings]' }
	];

	// Get active tab from URL search parameters to sync layout links
	let currentTab = $derived(page.url.searchParams.get('tab') || 'overview');
	let currentPath = $derived(page.url.pathname);
	let isProductsActive = $derived(
		currentTab === 'products' ||
		currentPath.startsWith('/admin/products') ||
		currentPath.startsWith('/admin/categories') ||
		currentPath.startsWith('/admin/tags')
	);
	let isProductMenuOpen = $state(true);

	let allProdActive = $derived((currentPath === '/admin' && currentTab === 'products') || currentPath.includes('/edit'));
	let createProdActive = $derived(currentPath === '/admin/products/create');
	let categoriesActive = $derived(currentPath.startsWith('/admin/categories'));
	let tagsActive = $derived(currentPath.startsWith('/admin/tags'));

	function isLinkActive(item: (typeof menuItems)[0]) {
		if (item.name === 'Sản Phẩm') {
			return isProductsActive;
		}
		if (item.href === '/admin') {
			return currentTab === 'overview' && currentPath === '/admin';
		}
		return item.href.includes(`tab=${currentTab}`);
	}
</script>

<svelte:head>
	<title>Admin Panel - Mini Games Hub</title>
</svelte:head>

<div
	class="relative min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-500 flex font-sans"
>
	<!-- Glow Blobs for Zen Vibe -->
	<div class="absolute inset-0 overflow-hidden pointer-events-none z-0">
		<div class="zen-glow-emerald w-96 h-96 top-[-10%] left-[20%] opacity-60"></div>
		<div class="zen-glow-sky w-[32rem] h-[32rem] bottom-[-5%] right-[10%] opacity-40"></div>
	</div>

	<!-- Sidebar Panel -->
	<aside
		class="w-72 fixed inset-y-0 left-0 z-30 border-r border-zinc-200/30 bg-white/70 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/60 flex flex-col justify-between p-6 zen-transition"
	>
		<!-- Top Part: Logo & Brand -->
		<div class="flex flex-col gap-8">
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-sky-500 text-white shadow-md"
				>
					<span class="icon-[lucide--gamepad-2] h-6 w-6"></span>
				</div>
				<div class="flex flex-col">
					<span
						class="text-base font-bold tracking-tight text-zinc-900 dark:text-white leading-none"
					>
						Mini Games <span
							class="bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent"
							>Hub</span
						>
					</span>
					<span
						class="text-[10px] font-semibold text-emerald-500 uppercase tracking-widest mt-1"
						>Admin Panel</span
					>
				</div>
			</div>

			<!-- Divider -->
			<div class="h-[1px] w-full bg-zinc-200/30 dark:bg-zinc-800/60"></div>

			<!-- Navigation Links -->
			<nav class="flex flex-col gap-1.5">
				{#each menuItems as item}
					{@const active = isLinkActive(item)}
					{#if item.name === 'Sản Phẩm'}
						<div class="flex flex-col gap-1">
							<button
								type="button"
								onclick={() => (isProductMenuOpen = !isProductMenuOpen)}
								class="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 group cursor-pointer
								{active || isProductMenuOpen
									? 'bg-gradient-to-r from-emerald-500/10 to-sky-500/10 text-emerald-600 dark:text-emerald-400'
									: 'text-zinc-500 hover:bg-zinc-100/50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-50'}"
							>
								<div class="flex items-center gap-3">
									<span
										class="{item.icon} h-5 w-5 zen-transition {active
											? 'text-emerald-500'
											: 'text-zinc-400 group-hover:text-zinc-600'}"
									></span>
									<span>{item.name}</span>
								</div>
								<span
									class="icon-[lucide--chevron-down] h-4 w-4 transition-transform duration-300 {isProductMenuOpen
										? 'rotate-180'
										: ''}"
								></span>
							</button>

							{#if isProductMenuOpen}
								<div class="flex flex-col gap-1 pl-9 pr-2 mt-1 animate-slide-in">
									<a
										href="/admin?tab=products"
										class="px-3 py-2 text-xs font-semibold transition-all
										{allProdActive
											? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border-l-2 border-emerald-500 rounded-l-none pl-2.5'
											: 'rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}"
									>
										• Tất cả sản phẩm
									</a>
									
									<a
										href="/admin/products/create"
										class="px-3 py-2 text-xs font-semibold transition-all
										{createProdActive
											? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border-l-2 border-emerald-500 rounded-l-none pl-2.5'
											: 'rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}"
									>
										• Thêm sản phẩm mới
									</a>
									
									<a
										href="/admin/categories"
										class="px-3 py-2 text-xs font-semibold transition-all
										{categoriesActive
											? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border-l-2 border-emerald-500 rounded-l-none pl-2.5'
											: 'rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-855 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}"
									>
										• Danh mục
									</a>
									
									<a
										href="/admin/tags"
										class="px-3 py-2 text-xs font-semibold transition-all
										{tagsActive
											? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border-l-2 border-emerald-500 rounded-l-none pl-2.5'
											: 'rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-855 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'}"
									>
										• Thẻ tag
									</a>
								</div>
							{/if}
						</div>
					{:else}
						<a
							href={item.href}
							class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 group
					{active
								? 'bg-gradient-to-r from-emerald-500/10 to-sky-500/10 text-emerald-600 dark:text-emerald-400 border-r-2 border-emerald-500'
								: 'text-zinc-500 hover:bg-zinc-100/50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-50'}"
						>
							<span
								class="{item.icon} h-5 w-5 zen-transition {active
									? 'text-emerald-500'
									: 'text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'}"
							></span>
							<span>{item.name}</span>
						</a>
					{/if}
				{/each}
			</nav>
		</div>

		<!-- Bottom Part: User Card & Sign Out -->
		<div class="flex flex-col gap-4">
			<a
				href="/"
				class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-zinc-200/50 bg-white/50 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300 zen-transition"
			>
				<span class="icon-[lucide--arrow-left] h-4 w-4"></span>
				<span>Quay lại trang chủ</span>
			</a>

			<div class="h-[1px] w-full bg-zinc-200/30 dark:bg-zinc-800/60"></div>

			<div class="flex items-center justify-between gap-3">
				<div class="flex items-center gap-3">
					<div
						class="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-sky-500 p-[1.5px] shadow-sm"
					>
						<a href="/admin/profile">
							<div
								class="h-full w-full flex items-center justify-center rounded-[10px] bg-zinc-100 dark:bg-zinc-900 text-zinc-500 text-sm font-bold"
							>
								{(data.user?.displayName || 'U')[0]}
							</div>
						</a>
					</div>
					<div class="flex flex-col">
						<span class="text-xs font-bold text-zinc-900 dark:text-zinc-100"
							>{data.user?.displayName || 'User'}</span
						>
						<span class="text-[10px] text-zinc-400 dark:text-zinc-400"
							>{data.roles?.[0] || 'user'}</span
						>
					</div>
				</div>

				<form action="/auth/logout" method="POST">
					<button
						type="submit"
						class="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl zen-transition"
						title="Đăng xuất"
					>
						<span class="icon-[lucide--log-out] h-5 w-5"></span>
					</button>
				</form>
			</div>
		</div>
	</aside>

	<!-- Main Workspace Area -->
	<div class="flex-grow pl-72 flex flex-col min-h-screen relative z-10">
		<!-- Topbar Header -->
		<header
			class="h-20 border-b border-zinc-200/30 bg-white/40 backdrop-blur-md dark:border-zinc-800/60 dark:bg-zinc-950/60 sticky top-0 z-20 flex items-center justify-between px-8"
		>
			<!-- Breadcrumbs / Page Title -->
			<div class="flex flex-col">
				<div
					class="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest"
				>
					<span>Quản trị</span>
					<span class="icon-[lucide--chevron-right] h-3 w-3"></span>
					<span class="text-emerald-500">
						{#if currentTab === 'overview'}Overview{:else}{currentTab}{/if}
					</span>
				</div>
				<h1 class="text-lg font-bold text-zinc-900 dark:text-white tracking-tight mt-0.5">
					{#if currentTab === 'overview'}
						Bảng Điều Khiển Tổng Quan
					{:else if currentTab === 'products'}
						Quản Lý Sản Phẩm
					{:else if currentTab === 'analytics'}
						Thống Kê Chi Tiết
					{:else if currentTab === 'api'}
						Quản Lý API & Assistants
					{:else if currentTab === 'tickets'}
						Hộp Thư Hỗ Trợ & Yêu Cầu
					{:else if currentTab === 'settings'}
						Cấu Hình Hệ Thống
					{:else if currentTab === 'profile'}
						Hồ Sơ Cá Nhân & Cài Đặt
					{/if}
				</h1>
			</div>

			<!-- Right Side Controls -->
			<div class="flex items-center gap-4">
				<!-- System Health Indicator -->
				<div
					class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/10 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
				>
					<span class="relative flex h-2 w-2">
						<span
							class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
						></span>
						<span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
					</span>
					<span class="text-[10px] font-bold uppercase tracking-wider">Hệ thống ổn định</span>
				</div>

				<!-- Theme Toggle -->
				<button
					onclick={toggleDarkMode}
					class="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200/50 bg-white text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800/50 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 zen-transition cursor-pointer"
					aria-label="Toggle Dark Mode"
				>
					{#if isDark}
						<span class="icon-[lucide--sun] h-5 w-5"></span>
					{:else}
						<span class="icon-[lucide--moon] h-5 w-5"></span>
					{/if}
				</button>
			</div>
		</header>

		<!-- Content main -->
		<main class="flex-grow p-8">
			{@render children()}
		</main>
	</div>
</div>
