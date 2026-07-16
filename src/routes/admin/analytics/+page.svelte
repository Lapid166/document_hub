<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	import Input from '$lib/components/Input.svelte';

	let dailyTokenLimit = $state(5000000); // 5M tokens
	let todayTokenUsed = $state(3850000); // 3.85M tokens
	let todayCostUSD = $state(5.78);
	let monthlyLimitUSD = $state(150);
	let monthlyCostUSD = $state(84.5);
	let circuitBreakerEnabled = $state(true);

	// Derived percentage for circuit breaker alert
	let budgetUsedPercent = $derived(Math.round((todayTokenUsed / dailyTokenLimit) * 100));

	const dailyTokenData = [
		{ date: '10/07', tokens: 1200000, cost: 1.8 },
		{ date: '11/07', tokens: 1540000, cost: 2.31 },
		{ date: '12/07', tokens: 2100000, cost: 3.15 },
		{ date: '13/07', tokens: 1850000, cost: 2.78 },
		{ date: '14/07', tokens: 2900000, cost: 4.35 },
		{ date: '15/07', tokens: 3400000, cost: 5.1 },
		{ date: '16/07', tokens: 3850000, cost: 5.78 } // Today
	];

	// Token usage by Agent & Tool
	const tokenUsageBreakdown = [
		{ tool: 'WP Chat Assistant', agent: 'QA/RAG Agent', tokens: 1850000, cost: 2.78 },
		{ tool: 'WP Chat Assistant', agent: 'Content Creator Agent', tokens: 820000, cost: 1.23 },
		{ tool: 'Digital Card Builder', agent: 'Designer Agent', tokens: 680000, cost: 1.02 },
		{ tool: 'Digital Card Builder', agent: 'SEO Agent', tokens: 320000, cost: 0.48 },
		{ tool: 'WP Sudoku Game', agent: 'Changelog Agent', tokens: 180000, cost: 0.27 }
	];
</script>

<div class="flex flex-col gap-6 w-full animate-slide-in">
	<!-- Chart and Limit Section -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
		<!-- Token Usage SVG Chart (col-span-8) -->
		<div class="lg:col-span-8 flex flex-col gap-4">
			<Card hover={false} span="flex flex-col gap-4">
				<div class="flex items-center justify-between">
					<div class="flex flex-col gap-0.5">
						<h3 class="text-base font-bold text-zinc-900 dark:text-white">
							Lịch Sử Sử Dụng Token 7 Ngày Qua
						</h3>
						<p class="text-xs text-zinc-400 dark:text-zinc-500">
							Giám sát lượng token tiêu hao từ các mô hình AI
						</p>
					</div>
					<span class="text-xs font-mono text-zinc-400">Đơn vị: Triệu Tokens</span>
				</div>

				<div
					class="w-full bg-zinc-50/50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-200/30 dark:border-zinc-855/40 flex items-center justify-center"
				>
					<svg viewBox="0 0 500 200" class="w-full h-48 overflow-visible">
						<!-- Grid lines -->
						<line
							x1="40"
							y1="20"
							x2="480"
							y2="20"
							stroke="currentColor"
							stroke-dasharray="4 4"
							class="text-zinc-200 dark:text-zinc-800"
							stroke-width="1"
						/>
						<line
							x1="40"
							y1="70"
							x2="480"
							y2="70"
							stroke="currentColor"
							stroke-dasharray="4 4"
							class="text-zinc-200 dark:text-zinc-800"
							stroke-width="1"
						/>
						<line
							x1="40"
							y1="120"
							x2="480"
							y2="120"
							stroke="currentColor"
							stroke-dasharray="4 4"
							class="text-zinc-200 dark:text-zinc-800"
							stroke-width="1"
						/>
						<line
							x1="40"
							y1="170"
							x2="480"
							y2="170"
							stroke="currentColor"
							class="text-zinc-300 dark:text-zinc-700"
							stroke-width="1.5"
						/>

						<!-- Bars -->
						{#each dailyTokenData as day, i}
							{@const barHeight = (day.tokens / 4000000) * 130}
							{@const barWidth = 32}
							{@const x = 50 + i * 62}
							{@const y = 170 - barHeight}
							<!-- Bar container -->
							<g class="group cursor-pointer">
								<defs>
									<linearGradient id="barGrad-{i}" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stop-color="#10b981" />
										<stop offset="100%" stop-color="#0ea5e9" />
									</linearGradient>
								</defs>
								<rect
									{x}
									{y}
									width={barWidth}
									height={barHeight}
									rx="6"
									fill="url(#barGrad-{i})"
									class="transition-all duration-300 hover:opacity-80 hover:stroke-emerald-400 dark:hover:stroke-emerald-300"
									stroke-width="1"
								/>
								<text
									x={x + barWidth / 2}
									y="188"
									text-anchor="middle"
									class="text-[10px] font-bold fill-zinc-400 dark:fill-zinc-500 font-mono"
								>
									{day.date}
								</text>
								<text
									x={x + barWidth / 2}
									y={y - 8}
									text-anchor="middle"
									class="text-[10px] font-extrabold fill-zinc-800 dark:fill-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-mono"
								>
									{(day.tokens / 1000000).toFixed(2)}M
								</text>
							</g>
						{/each}
					</svg>
				</div>
			</Card>
		</div>

		<!-- FinOps Limits & Circuit Breaker (col-span-4) -->
		<div class="lg:col-span-4 flex flex-col gap-4">
			<Card hover={false} span="flex flex-col gap-4 h-full">
				<h3 class="text-sm font-bold text-zinc-900 dark:text-white">
					Cấu Hình Ngăn Ngừa Lạm Dụng Chi Phí
				</h3>
				<div class="h-[1px] w-full bg-zinc-200/30 dark:bg-zinc-800/30"></div>

				<!-- Circuit Breaker Toggle -->
				<div class="flex flex-col gap-2">
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300"
							>Tự động ngắt hệ thống</span
						>
						<button
							onclick={() => (circuitBreakerEnabled = !circuitBreakerEnabled)}
							class="relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
							{circuitBreakerEnabled ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-850'}"
						>
							<span
								class="pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {circuitBreakerEnabled
									? 'translate-x-4.5'
									: 'translate-x-0'}"
							></span>
						</button>
					</div>
					<p class="text-[10px] text-zinc-400 dark:text-zinc-550 leading-normal">
						Tự động ngắt chatbot Q&A công khai của các Tool khi đạt 80% hạn ngạch trong ngày để
						tránh DDoS/VPN bypass token.
					</p>
				</div>

				<div class="h-[1px] w-full bg-zinc-200/30 dark:bg-zinc-800/30"></div>

				<!-- Daily Token Limit Input -->
				<div class="flex flex-col gap-2">
					<Input
						id="limit-daily-tokens"
						label="Hạn ngạch Token hôm nay (Daily)"
						type="number"
						bind:value={dailyTokenLimit as any}
					/>
					<span class="text-[10px] text-zinc-400 dark:text-zinc-500"
						>Đề xuất: 5,000,000 tokens/ngày cho lượng user nội bộ.</span
					>
				</div>

				<!-- Monthly Cost Limit Input -->
				<div class="flex flex-col gap-2 mt-1">
					<Input
						id="limit-monthly-cost"
						label="Ngân sách API tối đa tháng ($USD)"
						type="number"
						bind:value={monthlyLimitUSD as any}
					/>
					<span class="text-[10px] text-zinc-400 dark:text-zinc-500"
						>Chi phí tích lũy hiện tại: <b class="text-zinc-700 dark:text-zinc-300"
							>${monthlyCostUSD.toFixed(2)}</b
						>
						/ ${monthlyLimitUSD}</span
					>
				</div>
			</Card>
		</div>
	</div>

	<!-- Breakdown Table -->
	<div class="flex flex-col gap-4 w-full">
		<h3 class="text-base font-bold text-zinc-900 dark:text-white">
			Chi tiết tiêu thụ Token theo Tác vụ & Agent
		</h3>
		<div
			class="w-full overflow-x-auto rounded-2xl border border-zinc-200/30 bg-white/50 shadow-sm dark:border-zinc-800/30 dark:bg-zinc-900/50 backdrop-blur-md"
		>
			<table class="w-full border-collapse text-left text-sm">
				<thead>
					<tr class="border-b border-zinc-200/30 dark:border-zinc-800/30">
						<th
							class="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
							>Sản phẩm liên kết</th
						>
						<th
							class="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500"
							>Tên Agent xử lý</th
						>
						<th
							class="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 text-right"
							>Lượng Token sử dụng</th
						>
						<th
							class="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 text-right"
							>Chi phí tạm tính ($USD)</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-zinc-200/30 dark:divide-zinc-800/30">
					{#each tokenUsageBreakdown as item}
						<tr class="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
							<td class="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-200"
								>{item.tool}</td
							>
							<td class="px-6 py-4 text-zinc-500 dark:text-zinc-400">
								<span class="inline-flex items-center gap-1.5">
									<span class="icon-[lucide--bot] h-4 w-4 text-emerald-500"></span>
									{item.agent}
								</span>
							</td>
							<td class="px-6 py-4 text-right font-mono text-zinc-700 dark:text-zinc-300"
								>{item.tokens.toLocaleString('vi-VN')}</td
							>
							<td class="px-6 py-4 text-right font-mono text-emerald-500 font-semibold"
								>${item.cost.toFixed(2)}</td
							>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
