<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolveRoute } from '$app/paths';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let loading = $state(false);

	// Dark mode sync
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

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';

		if (newPassword !== confirmPassword) {
			error = 'Mật khẩu xác nhận không trùng khớp';
			return;
		}
		if (newPassword.length < 8) {
			error = 'Mật khẩu mới phải có ít nhất 8 ký tự';
			return;
		}

		loading = true;
		try {
			const res = await fetch('/auth/change-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ currentPassword, newPassword })
			});
			const data = await res.json();
			if (data.success) {
				goto(resolveRoute('/admin'));
			} else {
				error = data.message || 'Thay đổi mật khẩu thất bại';
			}
		} catch {
			error = 'Lỗi kết nối mạng';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Đổi Mật Khẩu - Mini Games Hub</title>
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
			href="/auth/login"
			class="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white zen-transition"
		>
			<span class="icon-[lucide--arrow-left] h-4 w-4"></span>
			<span>Quay lại đăng nhập</span>
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
						<span class="icon-[lucide--shield-alert] h-7 w-7"></span>
					</div>
					<h2
						class="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white font-sans mt-2"
					>
						Đổi mật khẩu
					</h2>
					<p class="text-xs text-zinc-400 dark:text-zinc-500">
						Bạn phải thay đổi mật khẩu của mình trước khi tiếp tục.
					</p>
				</div>

				<!-- Error message -->
				{#if error}
					<div
						class="p-3 mb-4 rounded-xl bg-rose-500/10 text-rose-500 text-xs border border-rose-500/20 text-center"
					>
						{error}
					</div>
				{/if}

				<!-- Auth Form -->
				<form onsubmit={handleSubmit} class="flex flex-col gap-4">
					<Input
						id="currentPassword"
						type="password"
						label="Mật khẩu hiện tại"
						placeholder="••••••••"
						icon="icon-[lucide--lock]"
						bind:value={currentPassword}
						required
					/>

					<Input
						id="newPassword"
						type="password"
						label="Mật khẩu mới"
						placeholder="••••••••"
						icon="icon-[lucide--lock-keyhole]"
						bind:value={newPassword}
						required
					/>

					<Input
						id="confirmPassword"
						type="password"
						label="Xác nhận mật khẩu mới"
						placeholder="••••••••"
						icon="icon-[lucide--lock-keyhole-open]"
						bind:value={confirmPassword}
						required
					/>

					<!-- Submit Button -->
					<div class="mt-2">
						<Button type="submit" variant="primary" size="lg" class="w-full" disabled={loading} {loading}>
							<span>Đổi Mật Khẩu</span>
						</Button>
					</div>
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
	</footer>
</div>
