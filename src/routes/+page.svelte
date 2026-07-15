<script lang="ts">
	import { Button, Accordion, AccordionItem } from 'flowbite-svelte';
</script>

<main class="max-w-4xl mx-auto p-8 flex flex-col gap-8 relative overflow-hidden">
	<!-- Background Blobs -->
	<div class="zen-glow-emerald w-72 h-72 top-10 left-10"></div>
	<div class="zen-glow-sky w-72 h-72 bottom-10 right-10"></div>

	<header class="flex flex-col gap-2">
		<h1 class="text-4xl font-bold tracking-tight zen-gradient-text font-sans">DocumentHub</h1>
		<p class="text-zinc-500 dark:text-zinc-400">
			Dự án đã được cấu hình thành công với SvelteKit, Tailwind CSS v4, Montserrat và Flowbite
			Svelte.
		</p>
	</header>

	<section class="flex flex-wrap gap-4 items-center">
		<!-- Test Flowbite Svelte Button with Iconify Lucide Icon -->
		<Button color="emerald" class="inline-flex items-center gap-2 rounded-xl zen-transition">
			<span class="icon-[lucide--sparkles] w-5 h-5"></span>
			<span>Khởi động dự án</span>
		</Button>

		<Button
			color="alternative"
			class="inline-flex items-center gap-2 rounded-xl border-zinc-200 dark:border-zinc-800 zen-transition"
		>
			<span class="icon-[lucide--settings] w-5 h-5"></span>
			<span>Cấu hình MCP</span>
		</Button>
	</section>

	<section
		class="border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-sm"
	>
		<h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
			<span class="icon-[lucide--info] text-sky-500 w-5 h-5"></span>
			<span>Kiểm thử Accordion (Flowbite)</span>
		</h2>

		<Accordion>
			<AccordionItem open>
				{#snippet header()}
					<span>Montserrat & Styles</span>
				{/snippet}
				<p class="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans font-light">
					Phông chữ Montserrat đã được tích hợp trực tiếp vào tài sản cục bộ thông qua
					`@fontsource/montserrat`. Hãy kiểm tra tab Network để xem tệp tin font `.woff2` được tải
					từ localhost.
				</p>
			</AccordionItem>
			<AccordionItem>
				{#snippet header()}
					<span>Iconify CSS Icons</span>
				{/snippet}
				<p class="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
					Các biểu tượng được kết xuất trực tiếp dưới dạng lớp CSS thông qua plugin
					`@iconify/tailwind4`. Chỉ các biểu tượng được sử dụng mới được đưa vào bundle CSS của ứng
					dụng.
				</p>
			</AccordionItem>
		</Accordion>
	</section>
</main>
