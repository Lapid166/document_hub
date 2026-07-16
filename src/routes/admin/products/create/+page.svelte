<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import Select from '$lib/components/Select.svelte';
	import MilkdownEditor from '$lib/components/MilkdownEditor.svelte';
	import AIModal from '$lib/components/AIModal.svelte';

	import { PRODUCT_LAYOUTS } from '$lib/data/layouts';

	let { data, form } = $props();

	let name = $state('');
	let slug = $state('');
	let selectedCategoryIds = $state<string[]>([]);
	let categoryId = $derived(selectedCategoryIds[0] || '');

	function toggleCategory(catId: string) {
		if (selectedCategoryIds.includes(catId)) {
			selectedCategoryIds = selectedCategoryIds.filter((id) => id !== catId);
		} else {
			selectedCategoryIds = [...selectedCategoryIds, catId];
		}
	}
	let description = $state('');
	let detailedDescription = $state('');
	let icon = $state('icon-[lucide--package]');
	let iconColor = $state('text-emerald-500 bg-emerald-500/10');

	let liveDemoUrl = $state('');
	let wpVersion = $state('');
	let phpVersion = $state('');
	let author = $state('Mini Games Hub Team');

	let enableDownload = $state(false);
	let versionNumber = $state('v1.0.0');
	let changelogRaw = $state('Phiên bản đầu tiên.');

	// Toggles
	let enableSlideshow = $state(true);
	let enableGuides = $state(true);
	let enableFaqs = $state(true);

	// Left column tab control
	let activeTab = $state('basic');

	// Fallback mechanism when tabs are toggled off
	$effect(() => {
		if (activeTab === 'slideshow' && !enableSlideshow) {
			activeTab = 'basic';
		}
		if (activeTab === 'guides' && !enableGuides) {
			activeTab = 'basic';
		}
		if (activeTab === 'faqs' && !enableFaqs) {
			activeTab = 'basic';
		}
	});

	// AI Modal State
	let aiModalOpen = $state(false);
	let aiModalField = $state<'detailedDescription' | 'guides' | 'faqs' | 'changelog'>('detailedDescription');

	function openAIModal(field: typeof aiModalField) {
		aiModalField = field;
		aiModalOpen = true;
	}

	function handleAIApply(generatedContent: string, mode: 'replace' | 'append') {
		if (aiModalField === 'detailedDescription') {
			if (mode === 'replace') {
				detailedDescription = generatedContent;
			} else {
				detailedDescription = (detailedDescription ? detailedDescription + '\n\n' : '') + generatedContent;
			}
		} else if (aiModalField === 'guides') {
			try {
				const parsed = JSON.parse(generatedContent);
				if (Array.isArray(parsed)) {
					if (mode === 'replace') {
						guidesList = parsed;
					} else {
						guidesList = [...guidesList, ...parsed];
					}
				}
			} catch (e) {
				console.error('Failed to parse AI guides:', e);
			}
		} else if (aiModalField === 'faqs') {
			try {
				const parsed = JSON.parse(generatedContent);
				if (Array.isArray(parsed)) {
					if (mode === 'replace') {
						faqsList = parsed;
					} else {
						faqsList = [...faqsList, ...parsed];
					}
				}
			} catch (e) {
				console.error('Failed to parse AI faqs:', e);
			}
		}
	}

	// Guides state
	let guidesList = $state<{ title: string; content: string }[]>([]);
	function addGuideStep() {
		guidesList = [...guidesList, { title: '', content: '' }];
	}
	function removeGuideStep(index: number) {
		guidesList = guidesList.filter((_, i) => i !== index);
	}
	let guidesJson = $derived(JSON.stringify(guidesList));

	// FAQs state
	let faqsList = $state<{ question: string; answer: string }[]>([]);
	function addFaqItem() {
		faqsList = [...faqsList, { question: '', answer: '' }];
	}
	function removeFaqItem(index: number) {
		faqsList = faqsList.filter((_, i) => i !== index);
	}
	let faqsJson = $derived(JSON.stringify(faqsList));

	// Find active layout config based on selected categoryId
	let activeLayout = $derived.by(() => {
		const cat = data.categories.find((c: any) => c.id === categoryId);
		return PRODUCT_LAYOUTS[cat?.layoutType || 'other'] || PRODUCT_LAYOUTS.other;
	});

	// Selected tags tracking
	let selectedTagIds = $state<string[]>([]);

	// Custom fields editor state
	let customFields = $state<{ key: string; value: string }[]>([]);

	let customFieldsJson = $derived(
		JSON.stringify(
			customFields.reduce((acc: any, curr) => {
				if (curr.key.trim()) acc[curr.key.trim()] = curr.value.trim();
				return acc;
			}, {})
		)
	);

	function addCustomField() {
		customFields = [...customFields, { key: '', value: '' }];
	}

	function removeCustomField(index: number) {
		customFields = customFields.filter((_, i) => i !== index);
	}

	function toggleTag(tagId: string) {
		if (selectedTagIds.includes(tagId)) {
			selectedTagIds = selectedTagIds.filter((id) => id !== tagId);
		} else {
			selectedTagIds = [...selectedTagIds, tagId];
		}
	}

	// Quick Category creation
	let showQuickCategory = $state(false);
	let quickCategoryName = $state('');

	async function submitQuickCategory() {
		const name = quickCategoryName.trim();
		if (!name) return;

		const formData = new FormData();
		formData.append('name', name);

		const response = await fetch('/admin/categories?/create', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			const text = await response.text();
			try {
				const resData = JSON.parse(text);
				if (resData.type === 'success') {
					let insertedCat: any = null;
					if (resData.data) {
						const parsedData = typeof resData.data === 'string' ? JSON.parse(resData.data) : resData.data;
						if (Array.isArray(parsedData)) {
							const catTuple = parsedData.find(item => item[0] === 'category');
							if (catTuple) insertedCat = catTuple[1];
						} else {
							insertedCat = parsedData.category;
						}
					}
					
					if (insertedCat) {
						data.categories = [...data.categories, insertedCat];
						selectedCategoryIds = [...selectedCategoryIds, insertedCat.id];
						quickCategoryName = '';
						showQuickCategory = false;
					} else {
						window.location.reload();
					}
				}
			} catch (err) {
				window.location.reload();
			}
		}
	}

	// Quick Tag creation
	let showQuickTag = $state(false);
	let quickTagName = $state('');

	async function submitQuickTag() {
		const name = quickTagName.trim();
		if (!name) return;

		const formData = new FormData();
		formData.append('name', name);

		const response = await fetch('/admin/tags?/create', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			const text = await response.text();
			try {
				const resData = JSON.parse(text);
				if (resData.type === 'success') {
					let insertedTag: any = null;
					if (resData.data) {
						const parsedData = typeof resData.data === 'string' ? JSON.parse(resData.data) : resData.data;
						if (Array.isArray(parsedData)) {
							const tagTuple = parsedData.find(item => item[0] === 'tag');
							if (tagTuple) insertedTag = tagTuple[1];
						} else {
							insertedTag = parsedData.tag;
						}
					}
					
					if (insertedTag) {
						data.tags = [...data.tags, insertedTag];
						selectedTagIds = [...selectedTagIds, insertedTag.id];
						quickTagName = '';
						showQuickTag = false;
					} else {
						window.location.reload();
					}
				}
			} catch (err) {
				window.location.reload();
			}
		}
	}

	// Auto generate slug from name
	$effect(() => {
		if (name) {
			slug = name
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/(^-|-$)/g, '');
		}
	});

	const iconColors = [
		{ name: 'Emerald Green', value: 'text-emerald-500 bg-emerald-500/10' },
		{ name: 'Sky Blue', value: 'text-sky-500 bg-sky-500/10' },
		{ name: 'Amber Orange', value: 'text-amber-500 bg-amber-500/10' },
		{ name: 'Rose Red', value: 'text-rose-500 bg-rose-500/10' },
		{ name: 'Purple Indigo', value: 'text-purple-500 bg-purple-500/10' },
		{ name: 'Orange', value: 'text-orange-500 bg-orange-500/10' }
	];
	const commonIcons = [
		'icon-[lucide--package]',
		'icon-[lucide--cpu]',
		'icon-[lucide--gamepad-2]',
		'icon-[lucide--message-square-text]',
		'icon-[lucide--contact-2]',
		'icon-[lucide--grid-3x3]',
		'icon-[lucide--sparkles]',
		'icon-[lucide--code-2]',
		'icon-[lucide--download]',
		'icon-[lucide--help-circle]'
	];

	const iconOptions = $derived(
		commonIcons.map((ic) => ({
			value: ic,
			label: ic.replace('icon-[lucide--', '').replace(']', ''),
			icon: ic
		}))
	);

	const iconColorOptions = $derived(
		iconColors.map((col) => ({
			value: col.value,
			label: col.name
		}))
	);
</script>

<svelte:head>
	<title>Thêm Sản Phẩm Mới - Admin Panel</title>
</svelte:head>

<div class="w-full flex flex-col gap-6">
	<!-- Top Heading Card -->
	<div
		class="relative rounded-3xl border border-zinc-200/50 bg-white/60 p-6 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/60 shadow-sm"
	>
		<div class="flex items-center gap-3">
			<a
				href="/admin?tab=products"
				class="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-500 zen-transition"
				title="Quay lại"
			>
				<span class="icon-[lucide--arrow-left] h-5 w-5"></span>
			</a>
			<div>
				<h1 class="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
					Thêm Sản Phẩm Mới
				</h1>
				<p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
					Đăng tải sản phẩm và cấu hình các tab nội dung.
				</p>
			</div>
		</div>
	</div>

	<!-- Main Form -->
	<form method="POST" action="?/create" enctype="multipart/form-data" use:enhance>
		<!-- hidden helper inputs -->
		<input type="hidden" name="customFieldsJson" value={customFieldsJson} />
		<input type="hidden" name="enableDownload" value={enableDownload.toString()} />
		<input type="hidden" name="enableSlideshow" value={enableSlideshow.toString()} />
		<input type="hidden" name="enableGuides" value={enableGuides.toString()} />
		<input type="hidden" name="enableFaqs" value={enableFaqs.toString()} />
		<input type="hidden" name="guidesJson" value={guidesJson} />
		<input type="hidden" name="faqsJson" value={faqsJson} />
		{#each selectedTagIds as tagId (tagId)}
			<input type="hidden" name="tagIds" value={tagId} />
		{/each}
		{#each selectedCategoryIds as catId (catId)}
			<input type="hidden" name="categoryIds" value={catId} />
		{/each}

		<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
			<!-- Left column: Dynamic Tabs Content (col-span-8) -->
			<div class="lg:col-span-8 flex flex-col gap-6">
				<!-- Premium Tab Track Container -->
				<div class="flex flex-wrap gap-1.5 bg-zinc-100/80 dark:bg-zinc-800/40 p-1.5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/60 backdrop-blur-md">
					<button
						type="button"
						onclick={() => activeTab = 'basic'}
						class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ease-out cursor-pointer
						{activeTab === 'basic'
							? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-zinc-200/40 dark:border-zinc-800/50 scale-[1.02]'
							: 'text-zinc-450 hover:bg-white/40 dark:hover:bg-zinc-800/20 hover:text-zinc-850 dark:hover:text-white'}"
					>
						<span class="icon-[lucide--info] w-4 h-4 text-emerald-500"></span>
						<span>Thông tin cơ bản</span>
					</button>

					{#if enableSlideshow}
						<button
							type="button"
							onclick={() => activeTab = 'slideshow'}
							class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ease-out cursor-pointer
							{activeTab === 'slideshow'
								? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-zinc-200/40 dark:border-zinc-800/50 scale-[1.02]'
								: 'text-zinc-450 hover:bg-white/40 dark:hover:bg-zinc-800/20 hover:text-zinc-850 dark:hover:text-white'}"
						>
							<span class="icon-[lucide--image] w-4 h-4 text-sky-500"></span>
							<span>Ảnh Showcase</span>
						</button>
					{/if}

					{#if enableGuides}
						<button
							type="button"
							onclick={() => activeTab = 'guides'}
							class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ease-out cursor-pointer
							{activeTab === 'guides'
								? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-zinc-200/40 dark:border-zinc-800/50 scale-[1.02]'
								: 'text-zinc-450 hover:bg-white/40 dark:hover:bg-zinc-800/20 hover:text-zinc-850 dark:hover:text-white'}"
						>
							<span class="icon-[lucide--book-open] w-4 h-4 text-indigo-500"></span>
							<span>Hướng dẫn sử dụng</span>
						</button>
					{/if}

					{#if enableFaqs}
						<button
							type="button"
							onclick={() => activeTab = 'faqs'}
							class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ease-out cursor-pointer
							{activeTab === 'faqs'
								? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-zinc-200/40 dark:border-zinc-800/50 scale-[1.02]'
								: 'text-zinc-450 hover:bg-white/40 dark:hover:bg-zinc-800/20 hover:text-zinc-850 dark:hover:text-white'}"
						>
							<span class="icon-[lucide--help-circle] w-4 h-4 text-amber-500"></span>
							<span>Hỏi đáp FAQ</span>
						</button>
					{/if}

					{#if enableDownload}
						<button
							type="button"
							onclick={() => activeTab = 'versions'}
							class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ease-out cursor-pointer
							{activeTab === 'versions'
								? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-zinc-200/40 dark:border-zinc-800/50 scale-[1.02]'
								: 'text-zinc-450 hover:bg-white/40 dark:hover:bg-zinc-800/20 hover:text-zinc-850 dark:hover:text-white'}"
						>
							<span class="icon-[lucide--history] w-4 h-4 text-rose-500"></span>
							<span>Phiên bản (1)</span>
						</button>
					{/if}
				</div>

				<!-- Tab Contents -->
				<div class="w-full">
					{#if activeTab === 'basic'}
						<!-- Basic Details Card -->
						<Card hover={false} span="flex flex-col gap-5 p-6 tab-content-panel">
							<h3 class="text-sm font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800/60 pb-2">
								Cấu hình cơ bản
							</h3>

							<div class="flex flex-col gap-1">
								<label for="prod-name" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
									>Tên sản phẩm <span class="text-rose-500">*</span></label
								>
								<Input
									id="prod-name"
									name="name"
									placeholder="Ví dụ: WP Sudoku Game"
									bind:value={name}
									required
								/>
							</div>

							<div class="flex flex-col gap-1">
								<label for="prod-slug" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
									>Slug Đường dẫn (Auto-generated)</label
								>
								<Input
									id="prod-slug"
									name="slug"
									placeholder="Ví dụ: wp-sudoku-game"
									bind:value={slug}
									required
								/>
							</div>

							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div class="flex flex-col gap-1">
									<label for="prod-icon" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
										>Icon sản phẩm</label
									>
									<Select
										id="prod-icon"
										options={iconOptions}
										bind:value={icon}
									/>
									<input type="hidden" name="icon" value={icon} />
								</div>

								<div class="flex flex-col gap-1">
									<label for="prod-icon-color" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
										>Màu nền Icon</label
									>
									<Select
										id="prod-icon-color"
										options={iconColorOptions}
										bind:value={iconColor}
									/>
									<input type="hidden" name="iconColor" value={iconColor} />
								</div>
							</div>

							<div class="flex flex-col gap-1">
								<label for="prod-desc" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
									>Mô tả ngắn</label
								>
								<textarea
									id="prod-desc"
									name="description"
									rows="3"
									placeholder="Tóm tắt ngắn gọn tính năng của sản phẩm..."
									bind:value={description}
									class="w-full rounded-xl border border-zinc-200 bg-white/50 px-4 py-2.5 text-sm outline-none transition-all duration-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white"
								></textarea>
							</div>

							<div class="flex flex-col gap-1.5">
								<div class="flex items-center justify-between">
									<label for="prod-detailed-desc" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
										>Mô tả chi tiết</label
									>
									<button
										type="button"
										onclick={() => openAIModal('detailedDescription')}
										class="flex items-center gap-1 text-[11px] text-emerald-500 hover:text-emerald-600 transition-colors font-bold cursor-pointer"
									>
										<span class="icon-[lucide--sparkles] w-3.5 h-3.5"></span>
										Viết bằng AI
									</button>
								</div>
								<MilkdownEditor
									id="prod-detailed-desc"
									bind:value={detailedDescription}
									placeholder="Mô tả đầy đủ, chi tiết cấu trúc hoạt động sản phẩm..."
								/>
								<input type="hidden" name="detailedDescription" value={detailedDescription} />
							</div>
						</Card>
					{/if}

					{#if activeTab === 'slideshow' && enableSlideshow}
						<!-- Slideshow Showcase Card -->
						<Card hover={false} span="flex flex-col gap-4 p-6 tab-content-panel">
							<h3 class="text-sm font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800/60 pb-2">
								Ảnh Showcase Slideshow
							</h3>

							<div class="flex flex-col gap-1">
								<label for="slideshow-files" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
									>Tải lên nhiều ảnh giới thiệu</label
								>
								<input
									type="file"
									id="slideshow-files"
									name="slideshowFiles"
									multiple
									accept="image/*"
									class="w-full pl-1 text-sm text-zinc-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500/10 file:text-emerald-600 hover:file:bg-emerald-500/20 dark:file:bg-emerald-500/10 dark:file:text-emerald-400 cursor-pointer"
								/>
								<span class="text-[10px] text-zinc-400"
									>Chọn nhiều tệp hình ảnh để hiển thị trong slide ảnh giới thiệu sản phẩm.</span
								>
							</div>
						</Card>
					{/if}

					{#if activeTab === 'guides' && enableGuides}
						<!-- Guides Card -->
						<Card hover={false} span="flex flex-col gap-4 p-6 tab-content-panel">
							<div class="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-2">
								<h3 class="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-3">
									<span>Hướng Dẫn Sử Dụng (Guides)</span>
									<button
										type="button"
										onclick={() => openAIModal('guides')}
										class="flex items-center gap-1 text-[11px] text-emerald-500 hover:text-emerald-600 transition-colors font-bold cursor-pointer"
									>
										<span class="icon-[lucide--sparkles] w-3.5 h-3.5"></span>
										Tự tạo các bước từ Tài liệu bằng AI
									</button>
								</h3>
								<Button type="button" variant="secondary" size="sm" onclick={addGuideStep}>
									+ Thêm Bước
								</Button>
							</div>

							<div class="flex flex-col gap-4">
								{#if guidesList.length === 0}
									<div class="text-xs text-zinc-400 text-center py-4">
										Chưa có bước hướng dẫn nào. Nhấn Thêm Bước hoặc dùng Trợ lý AI để tự động tạo.
									</div>
								{:else}
									{#each guidesList as step, index (index)}
										<div class="flex flex-col gap-2 p-3 bg-zinc-50/50 dark:bg-zinc-800/20 border border-zinc-200/50 dark:border-zinc-850 rounded-xl relative animate-slide-in">
											<button
												type="button"
												onclick={() => removeGuideStep(index)}
												class="absolute top-2 right-2 text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
												title="Xóa bước này"
											>
												<span class="icon-[lucide--trash-2] h-4 w-4"></span>
											</button>

											<div class="flex flex-col gap-1 pr-6 font-sans">
												<label for="guide-title-{index}" class="text-[11px] font-bold text-zinc-500">Tiêu đề bước {index + 1}</label>
												<Input id="guide-title-{index}" placeholder="Ví dụ: Bước 1: Khởi tạo và thiết lập" bind:value={step.title} required />
											</div>

											<div class="flex flex-col gap-1">
												<label for="guide-content-{index}" class="text-[11px] font-bold text-zinc-500">Nội dung hướng dẫn</label>
												<textarea
													id="guide-content-{index}"
													rows="3"
													placeholder="Mô tả chi tiết nội dung cần làm ở bước này..."
													bind:value={step.content}
													required
													class="w-full rounded-xl border border-zinc-200 bg-white/50 px-4 py-2.5 text-sm outline-none transition-all duration-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white"
												></textarea>
											</div>
										</div>
									{/each}
								{/if}
							</div>
						</Card>
					{/if}

					{#if activeTab === 'faqs' && enableFaqs}
						<!-- FAQs Card -->
						<Card hover={false} span="flex flex-col gap-4 p-6 tab-content-panel">
							<div class="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-2">
								<h3 class="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-3">
									<span>Câu Hỏi Thường Gặp (FAQs)</span>
									<button
										type="button"
										onclick={() => openAIModal('faqs')}
										class="flex items-center gap-1 text-[11px] text-emerald-500 hover:text-emerald-600 transition-colors font-bold cursor-pointer"
									>
										<span class="icon-[lucide--sparkles] w-3.5 h-3.5"></span>
										Tự tạo các Q&A từ Tài liệu bằng AI
									</button>
								</h3>
								<Button type="button" variant="secondary" size="sm" onclick={addFaqItem}>
									+ Thêm Câu Hỏi
								</Button>
							</div>

							<div class="flex flex-col gap-4 font-sans">
								{#if faqsList.length === 0}
									<div class="text-xs text-zinc-400 text-center py-4">
										Chưa có câu hỏi FAQ nào. Hãy tạo thêm hoặc sử dụng Trợ lý AI để trích xuất nhanh.
									</div>
								{:else}
									{#each faqsList as item, index (index)}
										<div class="flex flex-col gap-2 p-3 bg-zinc-50/50 dark:bg-zinc-800/20 border border-zinc-200/50 dark:border-zinc-850 rounded-xl relative animate-slide-in">
											<button
												type="button"
												onclick={() => removeFaqItem(index)}
												class="absolute top-2 right-2 text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
												title="Xóa câu hỏi này"
											>
												<span class="icon-[lucide--trash-2] h-4 w-4"></span>
											</button>

											<div class="flex flex-col gap-1 pr-6">
												<label for="faq-q-{index}" class="text-[11px] font-bold text-zinc-500">Câu hỏi {index + 1}</label>
												<Input id="faq-q-{index}" placeholder="Ví dụ: Có được cập nhật miễn phí trọn đời không?" bind:value={item.question} required />
											</div>

											<div class="flex flex-col gap-1">
												<label for="faq-a-{index}" class="text-[11px] font-bold text-zinc-500">Câu trả lời</label>
												<textarea
													id="faq-a-{index}"
													rows="3"
													placeholder="Câu trả lời cụ thể..."
													bind:value={item.answer}
													required
													class="w-full rounded-xl border border-zinc-200 bg-white/50 px-4 py-2.5 text-sm outline-none transition-all duration-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white"
												></textarea>
											</div>
										</div>
									{/each}
								{/if}
							</div>
						</Card>
					{/if}

					{#if activeTab === 'versions' && enableDownload}
						<!-- Version & Download Settings -->
						<Card hover={false} span="flex flex-col gap-4 p-6 tab-content-panel">
							<div class="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-2">
								<h3 class="text-sm font-bold text-zinc-900 dark:text-white">
									Cấu hình tải về & Phiên bản đính kèm
								</h3>
							</div>

							<div class="flex flex-col gap-4 font-sans">
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div class="flex flex-col gap-1">
										<label for="ver-number" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
											>Phiên bản đầu tiên (Version Number) <span class="text-rose-500">*</span></label
										>
										<Input
											id="ver-number"
											name="versionNumber"
											placeholder="Ví dụ: v1.0.0"
											bind:value={versionNumber}
											required
										/>
									</div>

									<div class="flex flex-col gap-1">
										<label for="ver-file" class="text-xs font-bold text-zinc-650 dark:text-zinc-350"
											>Tệp tải lên (.zip) <span class="text-rose-500">*</span></label
										>
										<input
											type="file"
											id="ver-file"
											name="downloadFile"
											accept=".zip"
											required
											class="w-full pl-1 text-sm text-zinc-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500/10 file:text-emerald-600 hover:file:bg-emerald-500/20 dark:file:bg-emerald-500/10 dark:file:text-emerald-400 cursor-pointer"
										/>
									</div>
								</div>

								<div class="flex flex-col gap-1.5 font-sans">
									<div class="flex items-center justify-between">
										<label for="ver-changelog" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
											>Nhật ký cập nhật (Changelog Raw)</label
										>
										<button
											type="button"
											onclick={() => openAIModal('changelog')}
											class="flex items-center gap-1 text-[11px] text-emerald-500 hover:text-emerald-600 transition-colors font-bold cursor-pointer"
										>
											<span class="icon-[lucide--sparkles] w-3.5 h-3.5"></span>
											Biên soạn bằng AI
										</button>
									</div>
									<textarea
										id="ver-changelog"
										name="changelogRaw"
										rows="4"
										placeholder="Mô tả các thay đổi trong phiên bản mới này..."
										bind:value={changelogRaw}
										class="w-full rounded-xl border border-zinc-200 bg-white/50 px-4 py-2.5 text-sm outline-none transition-all duration-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white"
									></textarea>
								</div>
							</div>
						</Card>
					{/if}
				</div>

				<!-- Specs, Custom Fields & Download settings are always displayed below the active tab in the left column (or optionally on basic specs card depending on activeLayout) -->
				{#if activeLayout.showWpPhpSpecs || activeLayout.showDemoUrl}
					<!-- Technical specifications -->
					<Card hover={false} span="flex flex-col gap-4 p-6">
						<h3 class="text-sm font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800/60 pb-2">
							Thông Số Kỹ Thuật (Bố cục danh mục)
						</h3>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-in">
							{#if activeLayout.showWpPhpSpecs}
								<div class="flex flex-col gap-1">
									<label for="spec-wp" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
										>Yêu cầu WordPress</label
									>
									<Input id="spec-wp" name="wpVersion" placeholder="Ví dụ: 6.0 hoặc cao hơn" bind:value={wpVersion} />
								</div>

								<div class="flex flex-col gap-1">
									<label for="spec-php" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
										>Yêu cầu PHP</label
									>
									<Input id="spec-php" name="phpVersion" placeholder="Ví dụ: 7.4 hoặc cao hơn" bind:value={phpVersion} />
								</div>
							{/if}

							{#if activeLayout.showDemoUrl}
								<div class="flex flex-col gap-1">
									<label for="spec-demo" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
										>Live Demo URL</label
									>
									<Input id="spec-demo" name="liveDemoUrl" placeholder="Ví dụ: https://demo.wpchat.com" bind:value={liveDemoUrl} />
								</div>
							{/if}

							<div class="flex flex-col gap-1">
								<label for="spec-auth" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
									>Tác giả (Author)</label
								>
								<Input id="spec-auth" name="author" placeholder="Ví dụ: Mini Games Hub Team" bind:value={author} />
							</div>
						</div>
					</Card>
				{/if}

				<!-- Dynamic Custom Fields Card -->
				<Card hover={false} span="flex flex-col gap-4 p-6">
					<div class="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-2">
						<h3 class="text-sm font-bold text-zinc-900 dark:text-white">
							Trường Thông Tin Tùy Biến (Custom Fields)
						</h3>
						<Button type="button" variant="secondary" size="sm" onclick={addCustomField}>
							+ Thêm Trường
						</Button>
					</div>

					<div class="flex flex-col gap-3">
						{#if customFields.length === 0}
							<div class="text-xs text-center text-zinc-400 py-2">
								Chưa có trường tùy biến nào. Nhấn nút thêm để tạo.
							</div>
						{:else}
							{#each customFields as field, index (index)}
								<div class="flex items-center gap-3 animate-slide-in">
									<div class="flex-grow grid grid-cols-2 gap-3">
										<Input
											id="custom-field-key-{index}"
											placeholder="Tên trường (ví dụ: License)"
											bind:value={field.key}
											required
										/>
										<Input
											id="custom-field-val-{index}"
											placeholder="Giá trị (ví dụ: GPLv3)"
											bind:value={field.value}
											required
										/>
									</div>
									<button
										type="button"
										onclick={() => removeCustomField(index)}
										class="p-2.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
										title="Xóa trường"
									>
										<span class="icon-[lucide--x] h-4.5 w-4.5"></span>
									</button>
								</div>
							{/each}
						{/if}
					</div>
				</Card>
			</div>

			<!-- Right Column: Categories, Tags, UI Options & Save Action (col-span-4) -->
			<div class="lg:col-span-4 flex flex-col gap-6">
				<!-- Category Card -->
				<Card hover={false} span="flex flex-col gap-4 p-5">
					<h3 class="text-sm font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800/60 pb-2">
						Danh Mục Phân Loại
					</h3>

					<div class="max-h-60 overflow-y-auto flex flex-col gap-2.5 pl-1 pr-2">
						{#if data.categories.length === 0}
							<div class="text-xs text-zinc-400">
								Chưa có danh mục nào. Hãy tạo danh mục trước ở trang Quản lý Danh mục.
							</div>
						{:else}
							{#each data.categories as category (category.id)}
								<label class="flex items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
									<input
										type="checkbox"
										value={category.id}
										checked={selectedCategoryIds.includes(category.id)}
										onchange={() => toggleCategory(category.id)}
										class="rounded border-zinc-350 dark:border-zinc-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
									/>
									<span>{category.name}</span>
								</label>
							{/each}
						{/if}
					</div>

					<div class="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
						{#if !showQuickCategory}
							<button type="button" onclick={() => showQuickCategory = true} class="text-xs text-emerald-500 hover:text-emerald-600 font-bold flex items-center gap-1 cursor-pointer">
								+ Thêm nhanh danh mục mới
							</button>
						{:else}
							<div class="flex flex-col gap-2 animate-slide-in">
								<Input id="quick-cat-name" placeholder="Tên danh mục mới" bind:value={quickCategoryName} />
								<div class="flex gap-2 justify-end">
									<Button type="button" variant="ghost" size="sm" onclick={() => showQuickCategory = false}>Hủy</Button>
									<Button type="button" variant="primary" size="sm" onclick={submitQuickCategory}>Thêm</Button>
								</div>
							</div>
						{/if}
					</div>
				</Card>

				<!-- UI Feature Config Toggles Card -->
				<Card hover={false} span="flex flex-col gap-4 p-5">
					<h3 class="text-sm font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800/60 pb-2">
						Cấu Hình Tính Năng Giao Diện
					</h3>

					<div class="flex flex-col gap-3.5">
						<!-- Toggle Slideshow -->
						<div class="flex items-center justify-between">
							<div class="flex flex-col gap-0.5 font-sans">
								<span class="text-xs font-bold text-zinc-700 dark:text-zinc-350">Slideshow Showcase</span>
								<span class="text-[10px] text-zinc-400">Hiển thị slide ảnh giới thiệu</span>
							</div>
							<button
								type="button"
								aria-label="Bật tắt slideshow"
								onclick={() => {
									enableSlideshow = !enableSlideshow;
								}}
								class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
								{enableSlideshow ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-850'}"
							>
								<span
									class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {enableSlideshow
										? 'translate-x-4'
										: 'translate-x-0'}"
								></span>
							</button>
						</div>

						<!-- Toggle Guides -->
						<div class="flex items-center justify-between">
							<div class="flex flex-col gap-0.5 font-sans">
								<span class="text-xs font-bold text-zinc-700 dark:text-zinc-350">Hướng Dẫn Cài Đặt</span>
								<span class="text-[10px] text-zinc-400">Hiển thị tab hướng dẫn sử dụng</span>
							</div>
							<button
								type="button"
								aria-label="Bật tắt hướng dẫn cài đặt"
								onclick={() => {
									enableGuides = !enableGuides;
								}}
								class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
								{enableGuides ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-850'}"
							>
								<span
									class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {enableGuides
										? 'translate-x-4'
										: 'translate-x-0'}"
								></span>
							</button>
						</div>

						<!-- Toggle FAQs -->
						<div class="flex items-center justify-between">
							<div class="flex flex-col gap-0.5 font-sans">
								<span class="text-xs font-bold text-zinc-700 dark:text-zinc-350">Hỏi Đáp FAQ</span>
								<span class="text-[10px] text-zinc-400">Hiển thị tab câu hỏi thường gặp</span>
							</div>
							<button
								type="button"
								aria-label="Bật tắt hỏi đáp FAQ"
								onclick={() => {
									enableFaqs = !enableFaqs;
								}}
								class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
								{enableFaqs ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-850'}"
							>
								<span
									class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {enableFaqs
										? 'translate-x-4'
										: 'translate-x-0'}"
								></span>
							</button>
						</div>

						<!-- Toggle Download (Versions) -->
						<div class="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80 pt-3">
							<div class="flex flex-col gap-0.5 font-sans">
								<span class="text-xs font-bold text-zinc-700 dark:text-zinc-350">Tải về sản phẩm</span>
								<span class="text-[10px] text-zinc-400">Có liên kết tải file phiên bản</span>
							</div>
							<button
								type="button"
								aria-label="Bật tắt tải về sản phẩm"
								onclick={() => {
									enableDownload = !enableDownload;
								}}
								class="relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
								{enableDownload ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-850'}"
							>
								<span
									class="pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out {enableDownload
										? 'translate-x-4.5'
										: 'translate-x-0'}"
								></span>
							</button>
						</div>
					</div>
				</Card>

				<!-- Tags Card -->
				<Card hover={false} span="flex flex-col gap-4 p-5">
					<h3 class="text-sm font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800/60 pb-2">
						Thẻ Từ Khóa (Tags)
					</h3>

					<div class="max-h-60 overflow-y-auto flex flex-wrap gap-2 pl-1 pr-2">
						{#if data.tags.length === 0}
							<div class="text-xs text-zinc-400">
								Chưa có thẻ tag nào. Tạo thẻ tag trước ở trang Quản lý Tags.
							</div>
						{:else}
							{#each data.tags as tag (tag.id)}
								{@const isSelected = selectedTagIds.includes(tag.id)}
								<button
									type="button"
									onclick={() => toggleTag(tag.id)}
									class="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-300 cursor-pointer
									{isSelected
										? 'bg-emerald-500/10 text-emerald-600 border-emerald-500 dark:text-emerald-400'
										: 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-zinc-400 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400'}"
								>
									#{tag.name}
								</button>
							{/each}
						{/if}
					</div>

					<div class="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 w-full">
						{#if !showQuickTag}
							<button type="button" onclick={() => showQuickTag = true} class="text-xs text-emerald-500 hover:text-emerald-600 font-bold flex items-center gap-1 cursor-pointer">
								+ Thêm nhanh thẻ mới
							</button>
						{:else}
							<div class="flex flex-col gap-2 w-full animate-slide-in">
								<Input id="quick-tag-name" placeholder="Tên thẻ mới" bind:value={quickTagName} />
								<div class="flex gap-2 justify-end font-sans">
									<Button type="button" variant="ghost" size="sm" onclick={() => showQuickTag = false}>Hủy</Button>
									<Button type="button" variant="primary" size="sm" onclick={submitQuickTag}>Thêm</Button>
								</div>
							</div>
						{/if}
					</div>
				</Card>

				<!-- Save Action Card -->
				<Card hover={false} span="flex flex-col gap-4 p-5 bg-gradient-to-tr from-emerald-500/5 to-sky-500/5 border border-emerald-500/10">
					<h3 class="text-sm font-bold text-zinc-900 dark:text-white">
						Đăng Tải Sản Phẩm
					</h3>
					<p class="text-[11px] text-zinc-500">
						Nhấn nút "Tạo sản phẩm" sẽ lưu trữ sản phẩm vào cơ sở dữ liệu và công khai lên trang chủ.
					</p>

					{#if form?.message}
						<div class="text-xs text-rose-500 font-bold">{form.message}</div>
					{/if}

					<div class="flex flex-col gap-2 mt-2">
						<Button type="submit" variant="primary" size="md" class="w-full cursor-pointer">
							Tạo sản phẩm
						</Button>
						<a
							href="/admin?tab=products"
							class="py-2.5 text-center text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/40 zen-transition"
						>
							Hủy bỏ
						</a>
					</div>
				</Card>
			</div>
		</div>
	</form>
</div>

<!-- Reusable Localized AI Modal -->
<AIModal
	bind:open={aiModalOpen}
	fieldName={aiModalField}
	productName={name || 'Sản phẩm mới'}
	layoutType={activeLayout.id}
	currentValue={aiModalField === 'detailedDescription' ? detailedDescription : aiModalField === 'guides' ? guidesJson : faqsJson}
	onapply={handleAIApply}
/>

<style>
	:global(.tab-content-panel) {
		animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(8px) scale(0.995);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
</style>
