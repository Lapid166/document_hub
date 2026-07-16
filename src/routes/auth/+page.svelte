<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';

	// Toggle mode: 'login' | 'register'
	let mode = $state<'login' | 'register'>('login');

	// Form values
	let email = $state('');
	let username = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let rememberMe = $state(false);
	let agreeTerms = $state(false);

	// Error states
	let emailError = $state('');
	let passwordError = $state('');
	let confirmPasswordError = $state('');

	// Dark mode sync
	let isDark = $state(false);

	$effect(() => {
		const theme =
			localStorage.getItem('theme') ||
			(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
		isDark = theme === 'dark';
		document.documentElement.classList.toggle('dark', isDark);

		// Parse search params for mode
		const searchParams = new URLSearchParams(window.location.search);
		const paramMode = searchParams.get('mode');
		if (paramMode === 'register' || paramMode === 'login') {
			mode = paramMode;
		}
	});

	function toggleDarkMode() {
		isDark = !isDark;
		localStorage.setItem('theme', isDark ? 'dark' : 'light');
		document.documentElement.classList.toggle('dark', isDark);
	}

	async function handleAuthSubmit(e: SubmitEvent) {
		e.preventDefault();

		emailError = '';
		passwordError = '';
		confirmPasswordError = '';

		if (!email.includes('@')) {
			emailError = 'Địa chỉ email không hợp lệ';
			return;
		}

		if (password.length < 6) {
			passwordError = 'Mật khẩu phải có ít nhất 6 ký tự';
			return;
		}

		if (mode === 'register') {
			if (password !== confirmPassword) {
				confirmPasswordError = 'Mật khẩu xác nhận không trùng khớp';
				return;
			}
			alert('Đăng ký chưa được hỗ trợ. Vui lòng liên hệ Admin.');
			return;
		}

		const res = await fetch('/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: email.trim(), password })
		});

		const result = await res.json();

		if (result.success) {
			window.location.href = result.redirect || '/admin';
		} else {
			const msg =
				result.code === 'ACCOUNT_LOCKED'
					? 'Quá nhiều lần thử. Vui lòng thử lại sau 15 phút.'
					: result.code === 'ACCOUNT_DISABLED'
						? 'Tài khoản đã bị vô hiệu hóa.'
						: 'Email hoặc mật khẩu không đúng.';
			passwordError = msg;
		}
	}
</script>

<svelte:head>
	<title>{mode === 'login' ? 'Đăng Nhập' : 'Đăng Ký'} - Mini Games Hub</title>
</svelte:head>

<div
	class="relative min-h-screen flex flex-col justify-between overflow-hidden bg-zinc-50 dark:bg-zinc-950 transition-colors duration-500 font-sans"
>
	<!-- Background Glow Blobs -->
	<div class="zen-glow-emerald w-96 h-96 top-[-10%] left-[-10%] opacity-70"></div>
	<div class="zen-glow-sky w-[30rem] h-[30rem] bottom-[-10%] right-[-10%] opacity-60"></div>

	<!-- Simple Top Bar -->
	<header
		class="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between relative z-10"
	>
		<a
			href="/"
			class="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white zen-transition"
		>
			<span class="icon-[lucide--arrow-left] h-4 w-4"></span>
			<span>Quay lại trang chủ</span>
		</a>

		<button
			onclick={toggleDarkMode}
			class="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 zen-transition"
			aria-label="Toggle Dark Mode"
		>
			{#if isDark}
				<span class="icon-[lucide--sun] h-5 w-5"></span>
			{:else}
				<span class="icon-[lucide--moon] h-5 w-5"></span>
			{/if}
		</button>
	</header>

	<!-- Main Auth Card Container -->
	<main class="flex-grow flex items-center justify-center p-6 relative z-10">
		<div class="w-full max-w-md">
			<Card
				hover={false}
				span="p-8 shadow-xl bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 relative overflow-hidden"
			>
				<!-- Logo and Header -->
				<div class="flex flex-col items-center text-center gap-3 mb-8">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-sky-500 text-white shadow-md"
					>
						<span class="icon-[lucide--gamepad-2] h-7 w-7"></span>
					</div>
					<h2
						class="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-sans mt-2"
					>
						Chào mừng tới <span
							class="bg-gradient-to-r from-emerald-500 to-sky-500 bg-clip-text text-transparent"
							>Games Hub</span
						>
					</h2>
					<p class="text-xs text-zinc-400 dark:text-zinc-500">
						{mode === 'login'
							? 'Đăng nhập để lưu lịch sử chơi và nhận thưởng'
							: 'Đăng ký tài khoản mới để tham gia đấu xếp hạng'}
					</p>
				</div>

				<!-- Switch Mode Tab -->
				<div
					class="grid grid-cols-2 gap-1 p-1 bg-zinc-100 dark:bg-zinc-950/60 border border-zinc-200/20 dark:border-zinc-800/30 rounded-xl mb-6"
				>
					<button
						onclick={() => {
							mode = 'login';
						}}
						class={`py-2 text-xs font-semibold rounded-lg zen-transition ${
							mode === 'login'
								? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
								: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
						}`}
					>
						Đăng Nhập
					</button>
					<button
						onclick={() => {
							mode = 'register';
						}}
						class={`py-2 text-xs font-semibold rounded-lg zen-transition ${
							mode === 'register'
								? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs'
								: 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
						}`}
					>
						Đăng Ký
					</button>
				</div>

				<!-- Auth Form -->
				<form onsubmit={handleAuthSubmit} class="flex flex-col gap-4">
					{#if mode === 'register'}
						<Input
							id="username"
							label="Tên hiển thị"
							placeholder="Nhập tên hiển thị của bạn"
							icon="icon-[lucide--user]"
							bind:value={username}
							required
						/>
					{/if}

					<Input
						id="email"
						type="email"
						label="Địa chỉ Email"
						placeholder="email@example.com"
						icon="icon-[lucide--mail]"
						bind:value={email}
						error={emailError}
						required
					/>

					<Input
						id="password"
						type="password"
						label="Mật khẩu"
						placeholder="••••••••"
						icon="icon-[lucide--lock]"
						bind:value={password}
						error={passwordError}
						required
					/>

					{#if mode === 'register'}
						<Input
							id="confirmPassword"
							type="password"
							label="Xác nhận mật khẩu"
							placeholder="••••••••"
							icon="icon-[lucide--lock-keyhole]"
							bind:value={confirmPassword}
							error={confirmPasswordError}
							required
						/>
					{/if}

					<!-- Extra options -->
					{#if mode === 'login'}
						<div class="flex items-center mt-1 mb-2">
							<label class="flex items-center gap-2 cursor-pointer select-none">
								<input
									type="checkbox"
									bind:checked={rememberMe}
									class="rounded border-zinc-300 dark:border-zinc-800 text-emerald-500 focus:ring-emerald-500 h-4 w-4 bg-zinc-50 dark:bg-zinc-950"
								/>
								<span class="text-xs text-zinc-500 dark:text-zinc-400">Ghi nhớ đăng nhập</span>
							</label>
						</div>
					{/if}

					<!-- Submit Button -->
					<Button type="submit" variant="primary" size="lg">
						<span
							class={mode === 'login'
								? 'icon-[lucide--log-in] h-5 w-5'
								: 'icon-[lucide--user-plus] h-5 w-5'}
						></span>
						<span>{mode === 'login' ? 'Đăng Nhập' : 'Đăng Ký Tài Khoản'}</span>
					</Button>
				</form>
			</Card>
		</div>
	</main>

	<!-- Minimal Footer -->
	<footer
		class="w-full max-w-7xl mx-auto px-6 py-6 border-t border-zinc-200/40 dark:border-zinc-800/40 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10"
	>
		<span class="text-[10px] text-zinc-400 dark:text-zinc-500">
			© 2026 Mini Games Hub. Bảo lưu mọi quyền.
		</span>
		<div class="flex gap-4">
			<a
				href="#terms"
				class="text-[10px] text-zinc-400 hover:text-emerald-500 dark:text-zinc-500 zen-transition"
				>Điều khoản</a
			>
			<a
				href="#privacy"
				class="text-[10px] text-zinc-400 hover:text-emerald-500 dark:text-zinc-500 zen-transition"
				>Bảo mật</a
			>
		</div>
	</footer>
</div>
