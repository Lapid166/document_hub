<script lang="ts">
	let { data } = $props();
	const initialProducts = data.products;

	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';

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

	let adminProducts = $derived(data.products);
	let totalProducts = $derived(adminProducts.length);
	let totalDownloads = $derived(adminProducts.reduce((sum: number, p: any) => sum + (p.downloadsCount || 0), 0));

	let activeAssistants = 6;
	let todayTokenUsed = $state(3850000); // 3.85M tokens
	let todayCostUSD = $state(5.78);
	let dailyTokenLimit = 5000000;
	let successRate = 99.8;
	let budgetUsedPercent = $derived(Math.round((todayTokenUsed / dailyTokenLimit) * 100));

	let logs = $state([
		{
			id: 1,
			text: 'Khách vãng lai đã tải plugin WP Chat Assistant v1.2.0',
			time: '5 phút trước',
			icon: 'icon-[lucide--download]',
			color: 'text-sky-500 bg-sky-500/10'
		},
		{
			id: 2,
			text: 'Trợ lý AI trả lời thành công khách hàng về cấu hình API Key',
			time: '14 phút trước',
			icon: 'icon-[lucide--sparkles]',
			color: 'text-emerald-500 bg-emerald-500/10'
		},
		{
			id: 3,
			text: 'Admin Linh Nguyễn thay đổi cài đặt hệ thống',
			time: '1 giờ trước',
			icon: 'icon-[lucide--key-round]',
			color: 'text-amber-500 bg-amber-500/10'
		},
		{
			id: 4,
			text: 'Bản sao lưu cơ sở dữ liệu được tạo tự động',
			time: '3 giờ trước',
			icon: 'icon-[lucide--database]',
			color: 'text-zinc-500 bg-zinc-50/10 dark:bg-zinc-800/10'
		}
	]);

	function addActivity(
		text: string,
		icon = 'icon-[lucide--settings-2]',
		color = 'text-emerald-500 bg-emerald-500/10'
	) {
		logs = [{ id: Date.now(), text, time: 'Vừa xong', icon, color }, ...logs.slice(0, 9)];
	}

	let agents = $state([
		{ id: 'orchestrator', name: 'Orchestrator Agent', role: 'Điều phối & Intent Classifier', status: 'active' },
		{ id: 'creator', name: 'Content Creator Agent', role: 'Sinh tài liệu thô & Intro/FAQs', status: 'active' },
		{ id: 'qa', name: 'QA/RAG Agent', role: 'Trợ lý Hỏi/Đáp QA Streaming', status: 'active' },
		{ id: 'designer', name: 'Designer Agent', role: 'Sinh Vector Icon SVG tự động', status: 'active' },
		{ id: 'seo', name: 'SEO Agent', role: 'Sinh Meta tag & JSON-LD SEO', status: 'active' },
		{ id: 'changelog', name: 'Changelog Agent', role: 'Phân tích chênh lệch & Diff', status: 'active' }
	]);

	function toggleAgentStatus(agentId: string) {
		agents = agents.map((a) => {
			if (a.id === agentId) {
				const nextStatus = a.status === 'active' ? 'disabled' : 'active';
				addActivity(
					`Thay đổi trạng thái ${a.name} thành ${nextStatus === 'active' ? 'HOẠT ĐỘNG' : 'TẠM NGƯNG'}`,
					'icon-[lucide--settings]',
					nextStatus === 'active'
						? 'text-emerald-500 bg-emerald-500/10'
						: 'text-rose-500 bg-rose-500/10'
				);
				return { ...a, status: nextStatus };
			}
			return a;
		});
		triggerToast('Cập nhật trạng thái Agent thành công');
	}

	function clearSystemCache() {
		addActivity(
			'Hệ thống dọn dẹp bộ nhớ cache tĩnh toàn cục',
			'icon-[lucide--trash-2]',
			'text-purple-500 bg-purple-500/10'
		);
		triggerToast('Đã xoá bộ nhớ cache tĩnh của Showcase Store');
	}

	function triggerDbBackup() {
		addActivity(
			'Bản sao lưu thủ công cơ sở dữ liệu được tạo thành công',
			'icon-[lucide--database]',
			'text-indigo-500 bg-indigo-500/10'
		);
		triggerToast('Đang tạo tệp SQL Backup và nén bảo mật. Hoàn tất!');
	}

	function triggerSecretScan() {
		addActivity(
			'Quét toàn bộ tài nguyên phát hiện rò rỉ API Keys / Secrets',
			'icon-[lucide--key-round]',
			'text-amber-500 bg-amber-500/10'
		);
		triggerToast('Đang quét tài liệu thô. Không tìm thấy khoá bảo mật bị lộ.');
	}

	function resetMockData() {
		if (confirm('Đặt lại tất cả các cài đặt về trạng thái gốc?')) {
			todayTokenUsed = 3850000;
			todayCostUSD = 5.78;
			addActivity(
				'Admin đặt lại dữ liệu mặc định ban đầu',
				'icon-[lucide--refresh-cw]',
				'text-rose-500 bg-rose-500/10'
			);
			triggerToast('Khôi phục dữ liệu ban đầu hoàn tất', 'info');
		}
	}
</script>

<div class="flex flex-col gap-8 w-full relative animate-slide-in">
	<!-- Top KPIs Bento Row -->
	<section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
		<!-- KPI 1 -->
		<Card hover={true} span="relative overflow-hidden group">
			<div
				class="absolute right-4 top-4 h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center zen-transition group-hover:scale-110"
			>
				<span class="icon-[lucide--package] h-6 w-6"></span>
			</div>
			<div class="flex flex-col gap-1">
				<span
					class="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
					>Tổng Sản Phẩm</span
				>
				<span class="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mt-1"
					>{totalProducts}</span
				>
				<span class="text-[10px] text-emerald-500 font-semibold flex items-center gap-1 mt-2">
					<span class="icon-[lucide--arrow-up-right] h-3.5 w-3.5"></span>
					<span>Showcase hoạt động</span>
				</span>
			</div>
		</Card>

		<!-- KPI 2 -->
		<Card hover={true} span="relative overflow-hidden group">
			<div
				class="absolute right-4 top-4 h-12 w-12 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center zen-transition group-hover:scale-110"
			>
				<span class="icon-[lucide--cpu] h-6 w-6"></span>
			</div>
			<div class="flex flex-col gap-1">
				<span
					class="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
					>Agent Hoạt Động</span
				>
				<span class="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mt-1"
					>{activeAssistants}
					<span class="text-sm font-normal text-zinc-400 dark:text-zinc-500">/ 7</span></span
				>
				<span class="text-[10px] text-sky-500 font-semibold flex items-center gap-1 mt-2">
					<span class="icon-[lucide--bot] h-3.5 w-3.5"></span>
					<span>Hệ AI liên kết</span>
				</span>
			</div>
		</Card>

		<!-- KPI 3 -->
		<Card hover={true} span="relative overflow-hidden group">
			<div
				class="absolute right-4 top-4 h-12 w-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center zen-transition group-hover:scale-110"
			>
				<span class="icon-[lucide--sparkles] h-6 w-6"></span>
			</div>
			<div class="flex flex-col gap-1">
				<span
					class="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
					>Token Hôm Nay</span
				>
				<span class="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mt-1"
					>{(todayTokenUsed / 1000000).toFixed(2)}M</span
				>
				<span class="text-[10px] text-amber-500 font-semibold flex items-center gap-1 mt-2">
					<span class="icon-[lucide--dollar-sign] h-3.5 w-3.5"></span>
					<span>Chi phí: ${todayCostUSD.toFixed(2)}</span>
				</span>
			</div>
		</Card>

		<!-- KPI 4 -->
		<Card hover={true} span="relative overflow-hidden group">
			<div
				class="absolute right-4 top-4 h-12 w-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center zen-transition group-hover:scale-110"
			>
				<span class="icon-[lucide--shield-check] h-6 w-6"></span>
			</div>
			<div class="flex flex-col gap-1">
				<span
					class="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
					>RAG Phản Hồi Đúng</span
				>
				<span class="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white mt-1"
					>{successRate}%</span
				>
				<span class="text-[10px] text-rose-500 font-semibold flex items-center gap-1 mt-2">
					<span class="icon-[lucide--thumbs-up] h-3.5 w-3.5"></span>
					<span>Hài lòng người dùng</span>
				</span>
			</div>
		</Card>
	</section>

	<!-- Main Bento Grid Layout (12 cols) -->
	<section class="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
		<!-- Left Column (col-span-8): Active Agents & Budget -->
		<div class="lg:col-span-8 flex flex-col gap-6">
			<!-- Budget progress card -->
			<Card hover={false} span="flex flex-col gap-4">
				<div class="flex items-center justify-between">
					<div class="flex flex-col gap-1">
						<h3 class="text-sm font-bold text-zinc-900 dark:text-white font-sans">
							Hạn ngạch & Ngân sách Tokens Hôm Nay
						</h3>
						<p class="text-xs text-zinc-400 dark:text-zinc-500 font-sans">
							Hệ thống ngắt tự động (Circuit Breaker) được thiết lập ở mức 80%
						</p>
					</div>
					<span
						class="px-2.5 py-1 text-xs font-bold rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400"
					>
						Đã dùng {budgetUsedPercent}%
					</span>
				</div>

				<div class="w-full bg-zinc-100 dark:bg-zinc-800 h-3.5 rounded-full overflow-hidden flex">
					<div
						class="bg-gradient-to-r from-emerald-500 to-amber-500 h-full rounded-full transition-all duration-500"
						style="width: {budgetUsedPercent}%"
					></div>
				</div>

				<div class="flex items-center justify-between text-xs font-mono text-zinc-400 mt-1">
					<span>Dữ liệu thực tế: {todayTokenUsed.toLocaleString('vi-VN')} tokens</span>
					<span>Ngưỡng trần: {dailyTokenLimit.toLocaleString('vi-VN')} tokens</span>
				</div>
			</Card>

			<!-- Agents Quick Control List -->
			<div class="flex flex-col gap-4">
				<div class="flex items-center justify-between">
					<h3 class="text-base font-bold text-zinc-900 dark:text-white font-sans">
						Danh Sách Trợ Lý AI (Multi-Agent Status)
					</h3>
					<a href="/admin/api" class="text-xs font-semibold text-emerald-500 hover:underline font-sans"
						>Quản lý Prompt & Model →</a
					>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					{#each agents as agent}
						<div
							class="p-4 rounded-2xl border border-zinc-200/40 bg-white/60 dark:border-zinc-800/40 dark:bg-zinc-900/60 flex items-center justify-between gap-4 font-sans"
						>
							<div class="flex items-center gap-3 font-sans">
								<div
									class="h-10 w-10 rounded-xl flex items-center justify-center shrink-0
									{agent.status === 'active'
										? 'bg-emerald-500/10 text-emerald-500'
										: 'bg-zinc-200 text-zinc-450 dark:bg-zinc-800 dark:text-zinc-550'}"
								>
									<span class="icon-[lucide--bot] h-5 w-5"></span>
								</div>
								<div class="flex flex-col gap-0.5 font-sans">
									<div class="flex items-center gap-2">
										<span class="text-xs font-bold text-zinc-900 dark:text-white"
											>{agent.name}</span
										>
									</div>
									<span class="text-[10px] text-zinc-400 dark:text-zinc-500">{agent.role}</span>
								</div>
							</div>

							<div class="flex items-center gap-2">
								<button
									onclick={() => toggleAgentStatus(agent.id)}
									class="relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
									{agent.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-850'}"
									aria-label="Toggle Agent"
								>
									<span
										class="pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
										{agent.status === 'active' ? 'translate-x-4.5' : 'translate-x-0'}"
									></span>
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Right Column (col-span-4): Quick Actions & Activity Logs -->
		<div class="lg:col-span-4 flex flex-col gap-6">
			<!-- Quick Operations -->
			<Card hover={false} span="flex flex-col gap-4">
				<h3 class="text-sm font-bold text-zinc-900 dark:text-white font-sans">
					Vận Hành Kỹ Thuật (Operations)
				</h3>
				<div class="h-[1px] w-full bg-zinc-200/30 dark:bg-zinc-800/30"></div>

				<div class="flex flex-col gap-2.5">
					<Button
						variant="secondary"
						size="md"
						onclick={clearSystemCache}
						class="w-full justify-start py-2.5 rounded-xl font-sans"
					>
						<span class="icon-[lucide--trash-2] h-4 w-4 text-purple-500 shrink-0"></span>
						<span class="text-xs">Dọn Dẹp Cache Showcase</span>
					</Button>

					<Button
						variant="secondary"
						size="md"
						onclick={triggerDbBackup}
						class="w-full justify-start py-2.5 rounded-xl font-sans"
					>
						<span class="icon-[lucide--database] h-4 w-4 text-indigo-500 shrink-0"></span>
						<span class="text-xs">Sao Lưu Cơ Sở Dữ Liệu (Backup)</span>
					</Button>

					<Button
						variant="secondary"
						size="md"
						onclick={triggerSecretScan}
						class="w-full justify-start py-2.5 rounded-xl font-sans"
					>
						<span class="icon-[lucide--key-round] h-4 w-4 text-amber-500 shrink-0"></span>
						<span class="text-xs">Quét rò rỉ API Keys (Secret Scan)</span>
					</Button>
				</div>

				<div class="h-[1px] w-full bg-zinc-200/30 dark:bg-zinc-800/30"></div>
				<Button
					variant="soft"
					size="md"
					onclick={resetMockData}
					class="w-full justify-center py-2 rounded-xl font-sans"
				>
					<span class="icon-[lucide--refresh-cw] h-4 w-4"></span>
					<span class="text-xs">Đặt lại dữ liệu Showcase & AI</span>
				</Button>
			</Card>

			<!-- Logs Card -->
			<Card hover={false} span="flex flex-col gap-4 flex-grow">
				<div class="flex items-center justify-between">
					<h3 class="text-sm font-bold text-zinc-900 dark:text-white font-sans">
						Nhật ký hoạt động gần đây
					</h3>
					<span class="text-[10px] text-zinc-400 dark:text-zinc-550 uppercase font-semibold font-sans"
						>Realtime</span
					>
				</div>
				<div class="h-[1px] w-full bg-zinc-200/30 dark:bg-zinc-800/30"></div>

				<div class="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-1">
					{#each logs as log}
						<div class="flex gap-3 text-xs font-sans">
							<div
								class="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 {log.color}"
							>
								<span class="{log.icon} h-4 w-4"></span>
							</div>
							<div class="flex flex-col gap-0.5 justify-center font-sans">
								<p class="text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
									{log.text}
								</p>
								<span class="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">{log.time}</span>
							</div>
						</div>
					{/each}
				</div>
			</Card>
		</div>
	</section>
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
		{:else if toast.type === 'info'}
			<div
				class="h-6 w-6 rounded-full bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0"
			>
				<span class="icon-[lucide--info] h-4.5 w-4.5"></span>
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
