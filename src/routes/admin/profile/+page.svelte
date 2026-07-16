<script lang="ts">
	let { data } = $props();

	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import Input from '$lib/components/Input.svelte';

	// Toast System Alert
	let toast = $state({ show: false, text: '', type: 'success' as 'success' | 'info' | 'error' });
	function triggerToast(text: string, type: 'success' | 'info' | 'error' = 'success') {
		toast.text = text;
		toast.type = type;
		toast.show = true;
		setTimeout(() => {
			toast.show = false;
		}, 3000);
	}

	let profileDisplayName = $state(data.profile?.displayName || 'Linh Nguyễn');
	let profileAvatarUrl = $state(
		data.profile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
	);
	let profileBio = $state(
		data.profile?.bio || 'Super Admin of Mini Games Hub & DocumentHub. Managing systems and multi-agent topology since 2026.'
	);

	let profilePasswordOld = $state('');
	let profilePasswordNew = $state('');
	let profilePasswordConfirm = $state('');
	let profileActiveSubTab = $state('resources'); // resources | settings

	async function saveProfileInfo() {
		if (!profileDisplayName.trim()) {
			triggerToast('Tên hiển thị không được để trống', 'error');
			return;
		}

		const formData = new FormData();
		formData.append('displayName', profileDisplayName);
		formData.append('avatarUrl', profileAvatarUrl);
		formData.append('bio', profileBio);

		const response = await fetch('?/updateProfile', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			triggerToast('Cập nhật thông tin hồ sơ thành công');
		} else {
			triggerToast('Lỗi khi cập nhật hồ sơ', 'error');
		}
	}

	function changeProfilePassword() {
		if (!profilePasswordOld || !profilePasswordNew || !profilePasswordConfirm) {
			triggerToast('Vui lòng điền đầy đủ các thông tin mật khẩu', 'error');
			return;
		}
		if (profilePasswordNew !== profilePasswordConfirm) {
			triggerToast('Mật khẩu mới và xác nhận mật khẩu không khớp', 'error');
			return;
		}
		profilePasswordOld = '';
		profilePasswordNew = '';
		profilePasswordConfirm = '';
		triggerToast('Đổi mật khẩu thành công');
	}
</script>

<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full animate-slide-in">
	<!-- Left panel: Info Summary (col-span-4) -->
	<div class="lg:col-span-4 flex flex-col gap-6">
		<!-- Profile Card -->
		<Card hover={false} span="flex flex-col gap-6 items-center text-center">
			<div class="relative">
				<div
					class="h-28 w-28 rounded-full bg-gradient-to-tr from-emerald-500 to-sky-500 p-[3px] shadow-md"
				>
					<img
						src={profileAvatarUrl}
						alt="Profile avatar"
						class="h-full w-full object-cover rounded-full bg-zinc-100 dark:bg-zinc-900"
					/>
				</div>
				<div
					class="absolute bottom-1 right-1 h-7 w-7 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-sm"
				>
					<span class="icon-[lucide--shield-check] h-4 w-4"></span>
				</div>
			</div>

			<div class="flex flex-col gap-1">
				<h2 class="text-base font-bold text-zinc-900 dark:text-white leading-tight">
					{profileDisplayName}
				</h2>
				<span class="text-xs font-mono text-zinc-400 dark:text-zinc-500"
					>{data.profile?.email || 'linh.nguyen@minigameshub.com'}</span
				>
				<div class="mt-2.5">
					<Badge variant="success">SUPER ADMIN</Badge>
				</div>
			</div>

			<p class="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
				{profileBio}
			</p>

			<div class="h-[1px] w-full bg-zinc-200/30 dark:bg-zinc-800/30"></div>

			<!-- Stats Grid -->
			<div class="grid grid-cols-3 gap-4 w-full">
				<div class="flex flex-col gap-0.5">
					<span class="text-xs font-extrabold text-zinc-900 dark:text-white">3</span>
					<span
						class="text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-semibold"
						>Tài liệu</span
					>
				</div>
				<div class="flex flex-col gap-0.5">
					<span class="text-xs font-extrabold text-zinc-900 dark:text-white">2</span>
					<span
						class="text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-semibold"
						>Plugins</span
					>
				</div>
				<div class="flex flex-col gap-0.5">
					<span class="text-xs font-extrabold text-zinc-900 dark:text-white">2,460</span>
					<span
						class="text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-semibold"
						>Tải về</span
					>
				</div>
			</div>
		</Card>
	</div>

	<!-- Right panel: Sub-tabs and forms (col-span-8) -->
	<div class="lg:col-span-8 flex flex-col gap-6">
		<!-- Sub-tabs navigation card -->
		<div
			class="rounded-2xl border border-zinc-200/30 bg-white/40 p-1.5 shadow-sm dark:border-zinc-800/30 dark:bg-zinc-900/40 backdrop-blur-md flex gap-2 font-sans"
		>
			<button
				onclick={() => (profileActiveSubTab = 'resources')}
				class="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer
				{profileActiveSubTab === 'resources'
					? 'bg-white dark:bg-zinc-900 text-emerald-500 shadow-sm border border-zinc-200/50 dark:border-zinc-800/50'
					: 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}"
			>
				Tài nguyên đã tải lên / quản lý
			</button>
			<button
				onclick={() => (profileActiveSubTab = 'settings')}
				class="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer
				{profileActiveSubTab === 'settings'
					? 'bg-white dark:bg-zinc-900 text-emerald-500 shadow-sm border border-zinc-200/50 dark:border-zinc-800/50'
					: 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'}"
			>
				Cài đặt tài khoản & Bảo mật
			</button>
		</div>

		<!-- Sub-tab: Resources -->
		{#if profileActiveSubTab === 'resources'}
			<div class="flex flex-col gap-6 w-full animate-slide-in">
				<!-- Uploaded Documents -->
				<Card hover={false} span="flex flex-col gap-4 font-sans">
					<h3 class="text-xs font-bold uppercase tracking-wider text-zinc-400">
						Tài liệu thô đã tải lên (Documents)
					</h3>
					<div class="h-[1px] w-full bg-zinc-200/30 dark:bg-zinc-800/30"></div>

					<div class="flex flex-col gap-3">
						<!-- Doc 1 -->
						<div
							class="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200/30 bg-zinc-50/50 dark:border-zinc-850/40 dark:bg-zinc-950/20 text-xs"
						>
							<div class="flex items-center gap-3">
								<div
									class="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0"
								>
									<span class="icon-[lucide--file-text] h-4.5 w-4.5"></span>
								</div>
								<div class="flex flex-col gap-0.5 font-sans">
									<span class="font-bold text-zinc-800 dark:text-zinc-200"
										>HUB-SYSTEM-MASTER-SPEC.md</span
									>
									<span class="text-[10px] text-zinc-400 font-mono"
										>Size: 61.1 KB | Tags: RAG, Core Contract</span
									>
								</div>
							</div>
							<div class="flex items-center gap-4">
								<span class="text-[10px] text-zinc-400 dark:text-zinc-550 font-mono"
									>16/07/2026</span
								>
								<Badge variant="success">INDEXED</Badge>
							</div>
						</div>

						<!-- Doc 2 -->
						<div
							class="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200/30 bg-zinc-50/50 dark:border-zinc-850/40 dark:bg-zinc-950/20 text-xs"
						>
							<div class="flex items-center gap-3">
								<div
									class="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0"
								>
									<span class="icon-[lucide--file-text] h-4.5 w-4.5"></span>
								</div>
								<div class="flex flex-col gap-0.5">
									<span class="font-bold text-zinc-850 dark:text-zinc-200"
										>WP-CHAT-ASSISTANT-GUIDE.pdf</span
									>
									<span class="text-[10px] text-zinc-400 font-mono"
										>Size: 2.4 MB | Tags: User Guide, Install</span
									>
								</div>
							</div>
							<div class="flex items-center gap-4">
								<span class="text-[10px] text-zinc-400 dark:text-zinc-550 font-mono"
									>10/07/2026</span
								>
								<Badge variant="success">INDEXED</Badge>
							</div>
						</div>

						<!-- Doc 3 -->
						<div
							class="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200/30 bg-zinc-50/50 dark:border-zinc-850/40 dark:bg-zinc-950/20 text-xs text-zinc-400 dark:text-zinc-500"
						>
							<div class="flex items-center gap-3 opacity-60">
								<div
									class="h-8 w-8 rounded-lg bg-zinc-200 text-zinc-400 flex items-center justify-center shrink-0 dark:bg-zinc-800 dark:text-zinc-500"
								>
									<span class="icon-[lucide--file-text] h-4.5 w-4.5"></span>
								</div>
								<div class="flex flex-col gap-0.5">
									<span class="font-bold">DIGITAL-CARD-BUILDER-V2.md</span>
									<span class="text-[10px] font-mono"
										>Size: 15.2 KB | Tags: Changelog, Older version</span
									>
								</div>
							</div>
							<div class="flex items-center gap-4">
								<span class="text-[10px] font-mono">05/07/2026</span>
								<Badge variant="neutral">DEPRECATED</Badge>
							</div>
						</div>
					</div>
				</Card>

				<!-- Published Plugins & Tools -->
				<Card hover={false} span="flex flex-col gap-4 font-sans">
					<h3 class="text-xs font-bold uppercase tracking-wider text-zinc-400">
						Plugins & Công cụ đang quản lý (Tools)
					</h3>
					<div class="h-[1px] w-full bg-zinc-200/30 dark:bg-zinc-800/30"></div>

					<div class="flex flex-col gap-3">
						<div
							class="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200/30 bg-white dark:border-zinc-800/50 dark:bg-zinc-900/50 text-xs"
						>
							<div class="flex items-center gap-3">
								<div
									class="h-9 w-9 rounded-xl flex items-center justify-center text-emerald-500 bg-emerald-500/10 shrink-0"
								>
									<span class="icon-[lucide--message-square] h-5 w-5"></span>
								</div>
								<div class="flex flex-col gap-0.5">
									<span class="font-bold text-zinc-800 dark:text-zinc-250"
										>WP Chat Assistant</span
									>
									<span class="text-[10px] text-zinc-400"
										>WordPress Plugin | Active Version: v1.2.0</span
									>
								</div>
							</div>
							<div class="flex items-center gap-4 font-sans">
								<span class="text-xs font-bold text-zinc-900 dark:text-zinc-200"
									>1,540 downloads</span
								>
								<Badge variant="success">PUBLIC</Badge>
							</div>
						</div>

						<div
							class="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200/30 bg-white dark:border-zinc-800/50 dark:bg-zinc-900/50 text-xs"
						>
							<div class="flex items-center gap-3">
								<div
									class="h-9 w-9 rounded-xl flex items-center justify-center text-sky-500 bg-sky-500/10 shrink-0"
								>
									<span class="icon-[lucide--contact-2] h-5 w-5"></span>
								</div>
								<div class="flex flex-col gap-0.5">
									<span class="font-bold text-zinc-800 dark:text-zinc-250"
										>Digital Card Builder</span
									>
									<span class="text-[10px] text-zinc-400"
										>CMS Tool | Active Version: v2.0.1</span
									>
								</div>
							</div>
							<div class="flex items-center gap-4 font-sans">
								<span class="text-xs font-bold text-zinc-900 dark:text-zinc-200"
									>920 downloads</span
								>
								<Badge variant="success">PUBLIC</Badge>
							</div>
						</div>
					</div>
				</Card>
			</div>
		{/if}

		<!-- Sub-tab: Settings -->
		{#if profileActiveSubTab === 'settings'}
			<div class="flex flex-col gap-6 w-full animate-slide-in">
				<!-- Personal Info Edit -->
				<Card hover={false} span="flex flex-col gap-4 font-sans">
					<h3 class="text-xs font-bold uppercase tracking-wider text-zinc-400">
						Thông tin cá nhân & Ảnh đại diện
					</h3>
					<div class="h-[1px] w-full bg-zinc-200/30 dark:bg-zinc-800/30"></div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Input
							id="profile-name"
							label="Tên hiển thị (Display Name)"
							bind:value={profileDisplayName}
						/>
						<Input
							id="profile-avatar"
							label="Ảnh đại diện (Avatar URL)"
							bind:value={profileAvatarUrl}
						/>
					</div>

					<div>
						<label
							class="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-zinc-450 dark:text-zinc-550"
							for="profile-bio-ta">Mô tả giới thiệu (Bio)</label
						>
						<textarea
							id="profile-bio-ta"
							bind:value={profileBio}
							rows="3"
							class="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm text-zinc-900 transition-colors duration-200 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200"
						></textarea>
					</div>

					<div class="flex justify-end mt-1">
						<Button variant="primary" size="md" onclick={saveProfileInfo}>Lưu thông tin</Button>
					</div>
				</Card>

				<!-- Change Password -->
				<Card hover={false} span="flex flex-col gap-4 font-sans">
					<h3 class="text-xs font-bold uppercase tracking-wider text-zinc-400">
						Đổi mật khẩu tài khoản
					</h3>
					<div class="h-[1px] w-full bg-zinc-200/30 dark:bg-zinc-800/30"></div>

					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Input
							id="profile-pass-old"
							type="password"
							label="Mật khẩu hiện tại"
							placeholder="••••••••"
							bind:value={profilePasswordOld}
						/>
						<Input
							id="profile-pass-new"
							type="password"
							label="Mật khẩu mới"
							placeholder="Tối thiểu 8 ký tự..."
							bind:value={profilePasswordNew}
						/>
						<Input
							id="profile-pass-confirm"
							type="password"
							label="Xác nhận mật khẩu mới"
							placeholder="••••••••"
							bind:value={profilePasswordConfirm}
						/>
					</div>

					<div class="flex justify-end mt-1">
						<Button variant="primary" size="md" onclick={changeProfilePassword}
							>Cập nhật mật khẩu</Button
						>
					</div>
				</Card>
			</div>
		{/if}
	</div>
</div>

<!-- Toast System Alert Popup -->
{#if toast.show}
	<div
		class="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl backdrop-blur-lg border border-zinc-200/50 bg-white/90 dark:border-zinc-800/50 dark:bg-zinc-900/90 transition-all duration-300 animate-slide-in font-sans"
	>
		{#if toast.type === 'success'}
			<div
				class="h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0"
			>
				<span class="icon-[lucide--check-circle-2] h-4.5 w-4.5"></span>
			</div>
		{:else}
			<div
				class="h-6 w-6 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0"
			>
				<span class="icon-[lucide--alert-triangle] h-4.5 w-4.5"></span>
			</div>
		{/if}
		<span class="text-xs font-semibold text-zinc-800 dark:text-zinc-100">{toast.text}</span>
	</div>
{/if}
