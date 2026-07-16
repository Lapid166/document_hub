<script lang="ts">
	let { data } = $props();
	const initialAllowedDomains = data.allowedDomains;
	const initialStorageSettings = data.storageSettings;

	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import Input from '$lib/components/Input.svelte';
	import Select from '$lib/components/Select.svelte';
	import Modal from '$lib/components/Modal.svelte';

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

	const rbacRoleOptions = [
		{ value: 'super_admin', label: 'Super Admin' },
		{ value: 'content_editor', label: 'Content Editor' },
		{ value: 'ai_ops', label: 'AI Ops' },
		{ value: 'viewer', label: 'Viewer / Auditor' }
	];

	const userRoleOptions = [
		{ value: 'super_admin', label: 'Super Admin (Toàn quyền hệ thống)' },
		{ value: 'content_editor', label: 'Content Editor (Duyệt/Quản lý tài liệu)' },
		{ value: 'ai_ops', label: 'AI Ops (Cấu hình Prompt & RAG)' },
		{ value: 'viewer', label: 'Viewer / Auditor (Chỉ đọc nhật ký & Báo cáo)' }
	];

	let allowedDomains = $state([...initialAllowedDomains]);
	let newDomainInput = $state('');

	async function addDomain() {
		const domain = newDomainInput.trim().toLowerCase();
		if (!domain) return;
		if (!domain.startsWith('@')) {
			triggerToast('Domain pattern phải bắt đầu bằng @ (Ví dụ: @company.com)', 'error');
			return;
		}
		if (allowedDomains.includes(domain)) {
			triggerToast('Domain này đã tồn tại trong allowlist', 'error');
			return;
		}

		const formData = new FormData();
		formData.append('domainPattern', domain);
		const response = await fetch('?/addDomain', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			allowedDomains = [...allowedDomains, domain];
			newDomainInput = '';
			triggerToast('Đã thêm domain allowlist thành công');
		} else {
			triggerToast('Lỗi khi thêm domain vào cơ sở dữ liệu', 'error');
		}
	}

	async function removeDomain(domain: string) {
		const formData = new FormData();
		formData.append('domainPattern', domain);
		const response = await fetch('?/removeDomain', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			allowedDomains = allowedDomains.filter((d) => d !== domain);
			triggerToast('Đã xoá domain khỏi allowlist', 'info');
		} else {
			triggerToast('Lỗi khi xoá domain khỏi cơ sở dữ liệu', 'error');
		}
	}

	// Storage settings state
	let storageType = $state(initialStorageSettings?.type || 'local');
	let s3Endpoint = $state(initialStorageSettings?.s3?.endpoint || '');
	let s3AccessKey = $state(initialStorageSettings?.s3?.accessKey || '');
	let s3SecretKey = $state(initialStorageSettings?.s3?.secretKey || '');
	let s3Bucket = $state(initialStorageSettings?.s3?.bucket || '');
	let s3Region = $state(initialStorageSettings?.s3?.region || 'us-east-1');
	let isSyncing = $state(false);

	async function saveStorageConfig() {
		const formData = new FormData();
		formData.append('type', storageType);
		formData.append('endpoint', s3Endpoint);
		formData.append('accessKey', s3AccessKey);
		formData.append('secretKey', s3SecretKey);
		formData.append('bucket', s3Bucket);
		formData.append('region', s3Region);

		const response = await fetch('?/updateStorageSettings', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			triggerToast('Lưu cấu hình lưu trữ thành công');
		} else {
			triggerToast('Lỗi khi lưu cấu hình lưu trữ', 'error');
		}
	}

	async function syncFilesToS3() {
		if (isSyncing) return;
		isSyncing = true;
		triggerToast('Bắt đầu đồng bộ tệp lên S3...');

		try {
			const response = await fetch('?/syncToS3', {
				method: 'POST'
			});
			if (response.ok) {
				triggerToast('Đồng bộ hoàn tất!');
			} else {
				triggerToast('Đồng bộ tệp lên S3 thất bại', 'error');
			}
		} catch (e) {
			const err = e as Error;
			triggerToast(`Lỗi: ${err.message || 'Đồng bộ thất bại'}`, 'error');
		} finally {
			isSyncing = false;
		}
	}

	// 2FA TOTP State
	let twoFactorEnabled = $state(false);
	let show2FAQrCode = $state(false);
	const recoveryCodes = [
		'DC-HUB-A19F-B67D',
		'DC-HUB-2C4E-7890',
		'DC-HUB-5E90-1B2F',
		'DC-HUB-FF4D-938C'
	];

	function handle2FAToggle() {
		if (twoFactorEnabled) {
			show2FAQrCode = true;
		} else {
			show2FAQrCode = false;
			triggerToast('Đã tắt xác thực 2 lớp (2FA)', 'info');
		}
	}

	function confirm2FA() {
		show2FAQrCode = false;
		triggerToast('Đã bật xác thực 2 lớp (2FA) thành công');
	}

	// Users & RBAC Mock
	let users = $state([
		{
			id: 'u-1',
			name: 'Linh Nguyễn',
			email: 'linh.nguyen@minigameshub.com',
			role: 'super_admin',
			status: 'Active'
		},
		{
			id: 'u-2',
			name: 'Minh Hoàng',
			email: 'hoang.minh@company.com',
			role: 'content_editor',
			status: 'Active'
		},
		{
			id: 'u-3',
			name: 'Bảo Khánh',
			email: 'khanh.bao@minigameshub.com',
			role: 'ai_ops',
			status: 'Active'
		},
		{
			id: 'u-4',
			name: 'Thu Thảo',
			email: 'thao.thu@company.com',
			role: 'viewer',
			status: 'Inactive'
		}
	]);

	let isUserModalOpen = $state(false);
	let userFormName = $state('');
	let userFormEmail = $state('');
	let userFormRole = $state('viewer');

	function openAddUserModal() {
		userFormName = '';
		userFormEmail = '';
		userFormRole = 'viewer';
		isUserModalOpen = true;
	}

	function saveUser() {
		if (!userFormName.trim() || !userFormEmail.trim()) {
			triggerToast('Tên và Email không được để trống', 'error');
			return;
		}
		const parts = userFormEmail.split('@');
		if (parts.length < 2) {
			triggerToast('Email không đúng định dạng', 'error');
			return;
		}
		const domain = '@' + parts[1].toLowerCase();
		if (!allowedDomains.includes(domain)) {
			triggerToast(
				`Email không thuộc các domain được phép đăng ký: ${allowedDomains.join(', ')}`,
				'error'
			);
			return;
		}
		users = [
			...users,
			{
				id: 'u-' + Date.now(),
				name: userFormName,
				email: userFormEmail,
				role: userFormRole,
				status: 'Active'
			}
		];
		isUserModalOpen = false;
		triggerToast('Thêm thành viên quản trị thành công');
	}

	function updateUserRole(id: string, role: string) {
		users = users.map((u) => (u.id === id ? { ...u, role } : u));
		triggerToast('Cập nhật phân quyền thành công');
	}

	function toggleUserStatus(id: string) {
		users = users.map((u) =>
			u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u
		);
		triggerToast('Cập nhật trạng thái thành công');
	}
</script>

<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full animate-slide-in">
	<!-- Left side settings: 2FA & Domains Allowlist (col-span-5) -->
	<div class="lg:col-span-5 flex flex-col gap-6">
		<!-- Email Domain Allowlist -->
		<Card hover={false} span="flex flex-col gap-4">
			<h3 class="text-sm font-bold text-zinc-900 dark:text-white font-sans">
				Cho Phép Tên Miền Đăng Ký Đăng Nhập
			</h3>
			<p class="text-xs text-zinc-400 dark:text-zinc-500 font-sans">
				Giới hạn email đăng ký quản trị chỉ thuộc các domain nội bộ doanh nghiệp.
			</p>

			<div class="h-[1px] w-full bg-zinc-200/30 dark:bg-zinc-800/30"></div>

			<div class="flex items-center gap-2">
				<div class="flex-grow">
					<Input id="new-domain" placeholder="Ví dụ: @partner.vn" bind:value={newDomainInput} />
				</div>
				<Button variant="primary" size="md" onclick={addDomain} class="shrink-0 h-10 mt-1"
					>Thêm</Button
				>
			</div>

			<div class="flex flex-wrap gap-2 mt-2">
				{#each allowedDomains as domain}
					<div
						class="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50/70 px-3 py-1.5 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-250"
					>
						<span class="font-mono">{domain}</span>
						<button
							onclick={() => removeDomain(domain)}
							class="text-zinc-400 hover:text-rose-500 cursor-pointer"
						>
							<span class="icon-[lucide--x] h-3.5 w-3.5"></span>
						</button>
					</div>
				{/each}
			</div>
		</Card>

		<!-- 2-Factor Authentication Card -->
		<Card hover={false} span="flex flex-col gap-4">
			<h3 class="text-sm font-bold text-zinc-900 dark:text-white font-sans">
				Bảo Mật Hai Lớp (Two-Factor Authentication)
			</h3>
			<p class="text-xs text-zinc-400 dark:text-zinc-500 font-sans">
				Sử dụng Google Authenticator hoặc ứng dụng TOTP để sinh mã xác thực thứ cấp bảo vệ hệ thống.
			</p>
			<div class="h-[1px] w-full bg-zinc-200/30 dark:bg-zinc-800/30"></div>

			<div class="flex items-center justify-between">
				<div class="flex flex-col gap-0.5">
					<span class="text-xs font-bold text-zinc-800 dark:text-zinc-200 font-sans"
						>TOTP (Google Authenticator)</span
					>
					<span class="text-[10px] text-zinc-400 dark:text-zinc-500"
						>Mã hóa AES-256 khoá key</span
					>
				</div>
				<button
					onclick={() => {
						twoFactorEnabled = !twoFactorEnabled;
						handle2FAToggle();
					}}
					class="relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
					{twoFactorEnabled ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-850'}"
				>
					<span
						class="pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {twoFactorEnabled
							? 'translate-x-4.5'
							: 'translate-x-0'}"
					></span>
				</button>
			</div>

			{#if show2FAQrCode}
				<div
					class="mt-4 p-4 rounded-2xl border border-zinc-200/50 bg-zinc-50 dark:border-zinc-800/50 dark:bg-zinc-950/40 flex flex-col items-center gap-4 text-center animate-slide-in"
				>
					<div
						class="h-32 w-32 border-2 border-zinc-200 rounded-xl bg-white p-2 flex items-center justify-center"
					>
						<svg class="h-full w-full" viewBox="0 0 100 100" fill="none">
							<rect
								x="5"
								y="5"
								width="20"
								height="20"
								fill="currentColor"
								class="text-zinc-900"
							/>
							<rect x="10" y="10" width="10" height="10" fill="white" />
							<rect
								x="75"
								y="5"
								width="20"
								height="20"
								fill="currentColor"
								class="text-zinc-900"
							/>
							<rect x="80" y="10" width="10" height="10" fill="white" />
							<rect
								x="5"
								y="75"
								width="20"
								height="20"
								fill="currentColor"
								class="text-zinc-900"
							/>
							<rect x="10" y="80" width="10" height="10" fill="white" />
							<rect
								x="35"
								y="15"
								width="5"
								height="15"
								fill="currentColor"
								class="text-zinc-900"
							/>
							<rect
								x="50"
								y="5"
								width="15"
								height="5"
								fill="currentColor"
								class="text-zinc-900"
							/>
							<rect
								x="40"
								y="40"
								width="20"
								height="20"
								fill="currentColor"
								class="text-zinc-900"
							/>
							<rect
								x="70"
								y="55"
								width="10"
								height="15"
								fill="currentColor"
								class="text-zinc-900"
							/>
							<rect
								x="15"
								y="45"
								width="15"
								height="10"
								fill="currentColor"
								class="text-zinc-900"
							/>
							<rect
								x="45"
								y="70"
								width="25"
								height="10"
								fill="currentColor"
								class="text-zinc-900"
							/>
							<rect
								x="80"
								y="80"
								width="15"
								height="15"
								fill="currentColor"
								class="text-zinc-900"
							/>
						</svg>
					</div>
					<div class="flex flex-col gap-1">
						<span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300 font-sans"
							>Quét mã QR bằng App Authenticator</span
						>
						<span class="text-[10px] font-mono text-zinc-400"
							>Secret: HUB2FA2026MOCKSECRETKEY</span
						>
					</div>

					<div class="h-[1px] w-full bg-zinc-200/30 dark:bg-zinc-800/30"></div>

					<div class="flex flex-col gap-2 w-full text-left font-sans">
						<span class="text-[10px] font-semibold uppercase tracking-wider text-zinc-450"
							>Mã khôi phục khẩn cấp (Recovery Codes)</span
						>
						<div
							class="grid grid-cols-2 gap-2 text-[10px] font-mono text-zinc-650 dark:text-zinc-400"
						>
							{#each recoveryCodes as code}
								<span class="p-1 rounded bg-zinc-200/50 dark:bg-zinc-800/50 text-center"
									>{code}</span
								>
							{/each}
						</div>
					</div>

					<Button
						variant="primary"
						size="sm"
						onclick={confirm2FA}
						class="w-full mt-2 justify-center">Xác nhận đã cài đặt</Button
					>
				</div>
			{/if}
		</Card>

		<!-- Storage Config Card -->
		<Card hover={false} span="flex flex-col gap-4">
			<h3 class="text-sm font-bold text-zinc-900 dark:text-white font-sans">
				Cấu Hài Lưu Trữ Tệp (Local / S3)
			</h3>
			<p class="text-xs text-zinc-400 dark:text-zinc-500 font-sans">
				Thiết lập vị trí lưu trữ file ZIP của phiên bản sản phẩm và ảnh tải lên.
			</p>
			
			<div class="h-[1px] w-full bg-zinc-200/30 dark:bg-zinc-800/30"></div>

			<div class="flex flex-col gap-3 text-left">
				<div class="flex items-center justify-between">
					<span class="text-xs font-bold text-zinc-700 dark:text-zinc-300 font-sans">Phương thức lưu trữ</span>
					<div class="w-72">
						<Select
							id="storage-type-select"
							options={[
								{ value: 'local', label: 'Local Storage (static/uploads/)' },
								{ value: 's3', label: 'S3 Cloud Storage' }
							]}
							bind:value={storageType}
						/>
					</div>
				</div>

				{#if storageType === 's3'}
					<div class="flex flex-col gap-2.5 mt-2 animate-slide-in">
						<div class="flex flex-col gap-0.5 font-sans">
							<label class="text-[10px] font-bold text-zinc-500">S3 Endpoint API URL</label>
							<Input id="s3-endpoint" placeholder="https://s3.amazonaws.com hoặc http://localhost:9000" bind:value={s3Endpoint} />
						</div>
						<div class="flex flex-col gap-0.5 font-sans">
							<label class="text-[10px] font-bold text-zinc-500">S3 Access Key</label>
							<Input id="s3-access-key" placeholder="Access Key ID" bind:value={s3AccessKey} />
						</div>
						<div class="flex flex-col gap-0.5 font-sans">
							<label class="text-[10px] font-bold text-zinc-500">S3 Secret Key</label>
							<Input id="s3-secret-key" placeholder="Secret Access Key" type="password" bind:value={s3SecretKey} />
						</div>
						<div class="grid grid-cols-2 gap-3 font-sans">
							<div class="flex flex-col gap-0.5">
								<label class="text-[10px] font-bold text-zinc-500">Bucket Name</label>
								<Input id="s3-bucket" placeholder="documenthub-bucket" bind:value={s3Bucket} />
							</div>
							<div class="flex flex-col gap-0.5">
								<label class="text-[10px] font-bold text-zinc-500">Region</label>
								<Input id="s3-region" placeholder="us-east-1" bind:value={s3Region} />
							</div>
						</div>

						<div class="flex gap-2 mt-2 font-sans">
							<Button type="button" variant="secondary" size="sm" onclick={syncFilesToS3} disabled={isSyncing} class="flex-grow justify-center cursor-pointer">
								{isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ file Local lên S3'}
							</Button>
						</div>
					</div>
				{/if}

				<div class="mt-2 font-sans">
					<Button type="button" variant="primary" size="sm" onclick={saveStorageConfig} class="w-full justify-center cursor-pointer">
						Lưu cấu hình
					</Button>
				</div>
			</div>
		</Card>
	</div>

	<!-- Right side: RBAC & User Management (col-span-7) -->
	<div class="lg:col-span-7 flex flex-col gap-4">
		<div class="flex items-center justify-between">
			<div class="flex flex-col">
				<h3 class="text-base font-bold text-zinc-900 dark:text-white font-sans">
					Thành Viên & Phân Quyền (RBAC Check)
				</h3>
				<p class="text-xs text-zinc-400 dark:text-zinc-500 font-sans">
					Chỉ Admin & Super Admin mới được thay đổi phân quyền / reset mật khẩu
				</p>
			</div>

			<Button variant="primary" size="sm" onclick={openAddUserModal}>
				<span class="icon-[lucide--user-plus] h-4 w-4"></span>
				<span>Thêm User</span>
			</Button>
		</div>

		<div
			class="w-full overflow-x-auto rounded-2xl border border-zinc-200/30 bg-white/50 shadow-sm dark:border-zinc-800/30 dark:bg-zinc-900/50 backdrop-blur-md font-sans"
		>
			<table class="w-full border-collapse text-left text-sm">
				<thead>
					<tr class="border-b border-zinc-200/30 dark:border-zinc-800/30">
						<th
							class="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
							>Thành viên</th
						>
						<th
							class="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
							>Quyền hạn (Role)</th
						>
						<th
							class="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 text-center"
							>Trạng thái</th
						>
						<th
							class="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 text-center w-[120px]"
							>Thao tác</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-zinc-200/30 dark:divide-zinc-800/30">
					{#each users as u}
						<tr class="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 text-xs">
							<td class="px-6 py-4">
								<div class="flex flex-col">
									<span class="font-bold text-zinc-800 dark:text-zinc-200">{u.name}</span>
									<span class="text-[10px] text-zinc-400 font-mono">{u.email}</span>
								</div>
							</td>
							<td class="px-6 py-4">
								<Select
									id="user-role-{u.id}"
									options={rbacRoleOptions}
									value={u.role}
									onchange={(val) => updateUserRole(u.id, val)}
									disabled={u.email.includes('linh.nguyen')}
								/>
							</td>
							<td class="px-6 py-4 text-center">
								<Badge variant={u.status === 'Active' ? 'success' : 'neutral'}>{u.status}</Badge
								>
							</td>
							<td class="px-6 py-4 text-center">
								<div class="flex justify-center gap-1.5 font-sans">
									<button
										onclick={() => toggleUserStatus(u.id)}
										disabled={u.email.includes('linh.nguyen')}
										class="p-1 rounded-lg border border-zinc-200 bg-white hover:text-amber-500 dark:border-zinc-800 dark:bg-zinc-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
										title="Bật/Tắt tài khoản"
									>
										<span class="icon-[lucide--power] h-3.5 w-3.5 block"></span>
									</button>
									<button
										onclick={() => {
											triggerToast(`Đã trigger mật khẩu tạm thời cho ${u.name}`);
										}}
										class="p-1 rounded-lg border border-zinc-200 bg-white hover:text-sky-500 dark:border-zinc-800 dark:bg-zinc-900 cursor-pointer"
										title="Reset mật khẩu"
									>
										<span class="icon-[lucide--rotate-ccw] h-3.5 w-3.5 block"></span>
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

<!-- Modal: Add New Admin User -->
<Modal open={isUserModalOpen} title="Thành Viên Quản Trị Mới" size="md" overflowVisible={true}>
	<div class="flex flex-col gap-4 py-2 font-sans">
		<Input
			id="user-name"
			label="Họ và Tên"
			placeholder="Nhập họ tên đầy đủ..."
			bind:value={userFormName}
		/>

		<Input
			id="user-email"
			type="email"
			label="Email liên kết"
			placeholder="Ví dụ: nhanvien@company.com..."
			bind:value={userFormEmail}
		/>

		<Select
			id="user-role-sel"
			label="Phân vai trò quản trị (RBAC)"
			options={userRoleOptions}
			bind:value={userFormRole}
		/>
	</div>

	{#snippet footer()}
		<div class="flex gap-2 font-sans">
			<Button variant="secondary" size="md" onclick={() => (isUserModalOpen = false)}>
				<span>Hủy Bỏ</span>
			</Button>
			<Button variant="primary" size="md" onclick={saveUser}>
				<span>Thêm Người Dùng</span>
			</Button>
		</div>
	{/snippet}
</Modal>

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
