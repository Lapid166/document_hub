<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Select from '$lib/components/Select.svelte';
	import MilkdownEditor from '$lib/components/MilkdownEditor.svelte';

	let { data, form } = $props();

	// Tabs: details vs versions
	let currentSubTab = $state('details');

	let name = $state(data.product.name);
	let slug = $state(data.product.slug);
	let categoryId = $state(data.product.categoryId || '');
	let description = $state(data.product.description || '');
	let detailedDescription = $state(data.product.detailedDescription || '');
	let icon = $state(data.product.icon || 'icon-[lucide--package]');
	let iconColor = $state(data.product.iconColor || 'text-emerald-500 bg-emerald-500/10');

	let liveDemoUrl = $state(data.product.liveDemoUrl || '');
	let wpVersion = $state(data.product.wpVersion || '');
	let phpVersion = $state(data.product.phpVersion || '');
	let author = $state(data.product.author || '');

	let enableDownload = $state(data.product.enableDownload || false);

	// Selected tags
	let selectedTagIds = $state<string[]>([...data.selectedTagIds]);

	// Custom fields (load from JSON)
	let customFields = $state<{ key: string; value: string }[]>(
		Object.entries((data.product.customFields as any) || {}).map(([key, value]) => ({
			key,
			value: value as string
		}))
	);

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
						categoryId = insertedCat.id;
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

	// Modal add version state
	let isVersionModalOpen = $state(false);
	let newVersionNumber = $state('');
	let newChangelogRaw = $state('');
	let makeActive = $state(true);

	function openVersionModal() {
		newVersionNumber = '';
		newChangelogRaw = '';
		makeActive = true;
		isVersionModalOpen = true;
	}

	function closeVersionModal() {
		isVersionModalOpen = false;
	}

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
	<title>Chỉnh Sửa Sản Phẩm: {name} - Admin Panel</title>
</svelte:head>

<div class="w-full flex flex-col gap-6">
	<!-- Top Header Card -->
	<div
		class="relative rounded-3xl border border-zinc-200/50 bg-white/60 p-6 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/60 shadow-sm"
	>
		<div class="flex items-center justify-between gap-4">
			<div class="flex items-center gap-3">
				<a
					href="/admin?tab=products"
					class="p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-zinc-500 zen-transition"
					title="Quay lại"
				>
					<span class="icon-[lucide--arrow-left] h-5 w-5"></span>
				</a>
				<div>
					<h1 class="text-xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
						Sửa: {data.product.name}
						<Badge variant="success" class="text-[10px] font-bold">
							{data.product.wpVersion ? 'WordPress' : 'Standalone'}
						</Badge>
					</h1>
					<p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
						Cập nhật cấu hình sản phẩm, sửa đổi slideshow showcase, và tạo phiên bản cập nhật tải về.
					</p>
				</div>
			</div>

			<!-- Sub Tab Controls -->
			<div class="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-2xl">
				<button
					onclick={() => (currentSubTab = 'details')}
					class="px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer
					{currentSubTab === 'details' ? 'bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-450 hover:text-zinc-700 dark:hover:text-zinc-300'}"
				>
					Thông Tin
				</button>
				{#if enableDownload}
					<button
						onclick={() => (currentSubTab = 'versions')}
						class="px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer
						{currentSubTab === 'versions' ? 'bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-450 hover:text-zinc-700 dark:hover:text-zinc-300'}"
					>
						Phiên Bản ({data.versions.length})
					</button>
				{/if}
			</div>
		</div>
	</div>

	<!-- TAB 1: PRODUCT DETAILS -->
	{#if currentSubTab === 'details'}
		<form method="POST" action="?/update" enctype="multipart/form-data" use:enhance>
			<!-- Hidden helper inputs -->
			<input type="hidden" name="customFieldsJson" value={customFieldsJson} />
			<input type="hidden" name="enableDownload" value={enableDownload.toString()} />
			{#each selectedTagIds as tagId}
				<input type="hidden" name="tagIds" value={tagId} />
			{/each}

			<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
				<!-- Left columns (col-span-8) -->
				<div class="lg:col-span-8 flex flex-col gap-6">
					<!-- Basic Specs -->
					<Card hover={false} span="flex flex-col gap-4 p-6">
						<h3 class="text-sm font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800/60 pb-2">
							Cấu Hình Cơ Bản
						</h3>

						<div class="flex flex-col gap-1">
							<label for="prod-name" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
								>Tên sản phẩm <span class="text-rose-500">*</span></label
							>
							<Input id="prod-name" name="name" bind:value={name} required />
						</div>

						<div class="flex flex-col gap-1">
							<label for="prod-slug" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
								>Slug Đường dẫn</label
							>
							<Input id="prod-slug" name="slug" bind:value={slug} required />
						</div>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div class="flex flex-col gap-1">
								<label for="prod-icon" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
									>Icon</label
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
									>Màu Icon</label
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
								bind:value={description}
								class="w-full rounded-xl border border-zinc-200 bg-white/50 px-4 py-2.5 text-sm outline-none transition-all duration-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white"
							></textarea>
						</div>

						<div class="flex flex-col gap-1">
							<label for="prod-detailed-desc" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
								>Mô tả chi tiết</label
							>
							<MilkdownEditor
								id="prod-detailed-desc"
								bind:value={detailedDescription}
								placeholder="Mô tả đầy đủ, chi tiết cấu trúc hoạt động sản phẩm..."
							/>
							<input type="hidden" name="detailedDescription" value={detailedDescription} />
						</div>
					</Card>

					<!-- Media Showcase Slideshow Card -->
					<Card hover={false} span="flex flex-col gap-4 p-6">
						<h3 class="text-sm font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800/60 pb-2">
							 Showcase Images & Slideshow
						</h3>

						<!-- Existing Slideshow Images list -->
						{#if data.product.slideshowImages && data.product.slideshowImages.length > 0}
							<div class="flex items-center gap-3 overflow-x-auto py-1">
								{#each data.product.slideshowImages as image}
									<div class="relative h-20 w-32 border border-zinc-200 dark:border-zinc-850 rounded-xl overflow-hidden shrink-0 shadow-sm">
										<img src={image} alt="slideshow" class="h-full w-full object-cover" />
									</div>
								{/each}
							</div>
						{/if}

						<div class="flex flex-col gap-1">
							<label for="slideshow-files" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
								>Thay thế ảnh Slideshow (Tùy chọn)</label
							>
							<input
								type="file"
								id="slideshow-files"
								name="slideshowFiles"
								multiple
								accept="image/*"
								class="w-full pl-1 text-sm text-zinc-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500/10 file:text-emerald-600 hover:file:bg-emerald-500/20 dark:file:bg-emerald-500/10 dark:file:text-emerald-400 cursor-pointer"
							/>
							<span class="text-[10px] text-zinc-450 dark:text-zinc-500"
								>Tải lên ảnh mới sẽ thay thế hoàn toàn bộ ảnh cũ hiện tại của slideshow.</span
							>
						</div>
					</Card>

					<!-- Tech specs -->
					<Card hover={false} span="flex flex-col gap-4 p-6">
						<h3 class="text-sm font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800/60 pb-2">
							Thông Số Kỹ Thuật
						</h3>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div class="flex flex-col gap-1">
								<label for="spec-wp" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
									>Yêu cầu WordPress</label
								>
								<Input id="spec-wp" name="wpVersion" bind:value={wpVersion} />
							</div>

							<div class="flex flex-col gap-1">
								<label for="spec-php" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
									>Yêu cầu PHP</label
								>
								<Input id="spec-php" name="phpVersion" bind:value={phpVersion} />
							</div>

							<div class="flex flex-col gap-1">
								<label for="spec-demo" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
									>Live Demo URL</label
								>
								<Input id="spec-demo" name="liveDemoUrl" bind:value={liveDemoUrl} />
							</div>

							<div class="flex flex-col gap-1">
								<label for="spec-auth" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
									>Tác giả (Author)</label
								>
								<Input id="spec-auth" name="author" bind:value={author} />
							</div>
						</div>
					</Card>

					<!-- Custom fields -->
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
									Chưa có trường tùy biến nào.
								</div>
							{:else}
								{#each customFields as field, index}
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

				<!-- Right column: Save actions, categories and tags (col-span-4) -->
				<div class="lg:col-span-4 flex flex-col gap-6">
					<!-- Toggle Download Option -->
					<Card hover={false} span="flex flex-col gap-4 p-5">
						<div class="flex items-center justify-between">
							<div class="flex flex-col gap-0.5">
								<span class="text-xs font-bold text-zinc-900 dark:text-white"
									>Cho phép tải về</span
								>
								<span class="text-[10px] text-zinc-400"
									>Người dùng có thể download tệp ZIP</span
								>
							</div>
							<button
								type="button"
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
					</Card>

					<!-- Category checklist -->
					<Card hover={false} span="flex flex-col gap-4 p-5">
						<h3 class="text-sm font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800/60 pb-2">
							Danh Mục
						</h3>

						<div class="max-h-60 overflow-y-auto flex flex-col gap-2.5 pl-1 pr-2">
							{#each data.categories as category}
								<label class="flex items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
									<input
										type="radio"
										name="categoryId"
										value={category.id}
										bind:group={categoryId}
										class="rounded border-zinc-350 dark:border-zinc-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
									/>
									<span>{category.name}</span>
								</label>
							{/each}
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

					<!-- Tag checklist -->
					<Card hover={false} span="flex flex-col gap-4 p-5">
						<h3 class="text-sm font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800/60 pb-2">
							Thẻ Tag
						</h3>

						<div class="max-h-60 overflow-y-auto flex flex-wrap gap-2 pl-1 pr-2">
							{#each data.tags as tag}
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
						</div>

						<div class="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 w-full">
							{#if !showQuickTag}
								<button type="button" onclick={() => showQuickTag = true} class="text-xs text-emerald-500 hover:text-emerald-600 font-bold flex items-center gap-1 cursor-pointer">
									+ Thêm nhanh thẻ mới
								</button>
							{:else}
								<div class="flex flex-col gap-2 w-full animate-slide-in">
									<Input id="quick-tag-name" placeholder="Tên thẻ mới" bind:value={quickTagName} />
									<div class="flex gap-2 justify-end">
										<Button type="button" variant="ghost" size="sm" onclick={() => showQuickTag = false}>Hủy</Button>
										<Button type="button" variant="primary" size="sm" onclick={submitQuickTag}>Thêm</Button>
									</div>
								</div>
							{/if}
						</div>
					</Card>

					<!-- Action Buttons -->
					<Card hover={false} span="flex flex-col gap-4 p-5 bg-gradient-to-tr from-emerald-500/5 to-sky-500/5 border border-emerald-500/10">
						<h3 class="text-sm font-bold text-zinc-900 dark:text-white">
							Lưu Cập Nhật
						</h3>
						<p class="text-[10px] text-zinc-450 dark:text-zinc-500">
							Cập nhật sản phẩm sẽ thay đổi ngay thông tin hiển thị của sản phẩm trên trang công khai.
						</p>

						{#if form?.message}
							<div class="text-xs text-rose-500 font-bold">{form.message}</div>
						{/if}

						<div class="flex flex-col gap-2 mt-2">
							<Button type="submit" variant="primary" size="md" class="w-full">
								Lưu sản phẩm
							</Button>
							<a
								href="/admin?tab=products"
								class="py-2.5 text-center text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:hover:text-white rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/40 zen-transition"
							>
								Quay lại Dashboard
							</a>
						</div>
					</Card>
				</div>
			</div>
		</form>
	{/if}

	<!-- TAB 2: VERSION MANAGEMENT -->
	{#if currentSubTab === 'versions' && enableDownload}
		<div class="flex flex-col gap-6">
			<!-- Versions List Card -->
			<div
				class="rounded-3xl border border-zinc-200/50 bg-white/60 p-6 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/60 shadow-sm"
			>
				<div class="flex items-center justify-between gap-4 mb-4">
					<h3 class="text-sm font-bold text-zinc-900 dark:text-white">
						Lịch Sử Phiên Bản Sản Phẩm
					</h3>
					<Button variant="primary" size="sm" onclick={openVersionModal}>
						+ Thêm Phiên Bản
					</Button>
				</div>

				<div class="overflow-x-auto w-full">
					<table class="w-full border-collapse text-left text-sm text-zinc-600 dark:text-zinc-300">
						<thead>
							<tr class="border-b border-zinc-200/50 dark:border-zinc-800/65">
								<th class="pb-3 font-bold text-zinc-900 dark:text-white">Phiên bản</th>
								<th class="pb-3 font-bold text-zinc-900 dark:text-white">Kích thước</th>
								<th class="pb-3 font-bold text-zinc-900 dark:text-white">Kiểu file</th>
								<th class="pb-3 font-bold text-zinc-900 dark:text-white">Ngày tạo</th>
								<th class="pb-3 font-bold text-zinc-900 dark:text-white">Trạng thái</th>
								<th class="pb-3 font-bold text-zinc-900 dark:text-white text-right">Hành động</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-zinc-200/30 dark:divide-zinc-800/40">
							{#if data.versions.length === 0}
								<tr>
									<td colspan="6" class="py-6 text-center text-zinc-400">
										Chưa có phiên bản nào cho sản phẩm này. Hãy tạo phiên bản đầu tiên.
									</td>
								</tr>
							{:else}
								{#each data.versions.sort((a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime()) as version}
									<tr class="group hover:bg-zinc-50/40 dark:hover:bg-zinc-800/10">
										<td class="py-3.5 font-bold text-zinc-900 dark:text-white flex items-center gap-2">
											{version.versionNumber}
											{#if version.isCurrentActive}
												<Badge variant="success" class="text-[9px] py-0.5 px-1.5">Active</Badge>
											{/if}
										</td>
										<td class="py-3.5 text-xs font-mono">{version.fileSize || '—'}</td>
										<td class="py-3.5 text-xs text-zinc-450">{version.fileType || '—'}</td>
										<td class="py-3.5 text-xs text-zinc-500">
											{new Date(version.createdAt ?? '').toLocaleDateString('vi-VN')}
										</td>
										<td class="py-3.5 text-xs">
											{#if version.isCurrentActive}
												<span class="text-emerald-500 font-bold">Hiện hành</span>
											{:else}
												<span class="text-zinc-400">Lưu trữ</span>
											{/if}
										</td>
										<td class="py-3.5 text-right">
											<div class="flex items-center justify-end gap-2">
												{#if !version.isCurrentActive}
													<form method="POST" action="?/setActiveVersion" use:enhance>
														<input type="hidden" name="versionId" value={version.id} />
														<Button type="submit" variant="secondary" size="sm">
															Kích hoạt
														</Button>
													</form>
												{/if}

												<form method="POST" action="?/deleteVersion" use:enhance>
													<input type="hidden" name="versionId" value={version.id} />
													<button
														type="submit"
														onclick={(e) => {
															if (
																!confirm(
																	`Bạn có chắc muốn xóa phiên bản "${version.versionNumber}"?`
																)
															) {
																e.preventDefault();
															}
														}}
														class="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
														title="Xóa phiên bản"
													>
														<span class="icon-[lucide--trash-2] h-4 w-4"></span>
													</button>
												</form>
											</div>
										</td>
									</tr>
								{/each}
							{/if}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Modal: Add New Version -->
<Modal bind:open={isVersionModalOpen} title="Tải Lên Phiên Bản Mới" onclose={closeVersionModal}>
	<form
		method="POST"
		action="?/addVersion"
		enctype="multipart/form-data"
		use:enhance={() => {
			return ({ result }) => {
				if (result.type === 'success') {
					closeVersionModal();
				}
			};
		}}
		class="flex flex-col gap-4 mt-2 text-left"
	>
		<div class="flex flex-col gap-1">
			<label for="new-ver-num" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
				>Số phiên bản (Version Number) <span class="text-rose-500">*</span></label
			>
			<Input id="new-ver-num" name="versionNumber" placeholder="Ví dụ: v1.3.0" bind:value={newVersionNumber} required />
		</div>

		<div class="flex flex-col gap-1">
			<label for="new-ver-file" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
				>Tệp ZIP phiên bản <span class="text-rose-500">*</span></label
			>
			<input
				type="file"
				id="new-ver-file"
				name="downloadFile"
				accept=".zip"
				required
				class="w-full pl-1 text-sm text-zinc-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500/10 file:text-emerald-600 hover:file:bg-emerald-500/20 dark:file:bg-emerald-500/10 dark:file:text-emerald-400 cursor-pointer"
			/>
		</div>

		<div class="flex flex-col gap-1">
			<label for="new-ver-changelog" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
				>Nhật ký cập nhật (Changelog Raw) <span class="text-rose-500">*</span></label
			>
			<textarea
				id="new-ver-changelog"
				name="changelogRaw"
				rows="5"
				required
				placeholder="Nhập nhật ký các thay đổi trong phiên bản mới..."
				bind:value={newChangelogRaw}
				class="w-full rounded-xl border border-zinc-200 bg-white/50 px-4 py-2.5 text-sm outline-none transition-all duration-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white"
			></textarea>
		</div>

		<label class="flex items-center gap-2.5 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer mt-1">
			<input
				type="checkbox"
				name="makeActive"
				value="true"
				bind:checked={makeActive}
				class="rounded border-zinc-350 dark:border-zinc-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
			/>
			<span>Đặt làm phiên bản hiện hành (Kích hoạt công khai)</span>
		</label>

		<div class="flex justify-end gap-3 mt-5">
			<Button type="button" variant="secondary" size="md" onclick={closeVersionModal}>Hủy bỏ</Button>
			<Button type="submit" variant="primary" size="md">Tải lên</Button>
		</div>
	</form>
</Modal>
