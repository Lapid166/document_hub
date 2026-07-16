<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import Select from '$lib/components/Select.svelte';
	import MilkdownEditor from '$lib/components/MilkdownEditor.svelte';

	let { data, form } = $props();

	let name = $state('');
	let slug = $state('');
	let categoryId = $state('');
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
					Đăng tải sản phẩm, thiết lập thông tin kỹ thuật, và upload các tệp tin phiên bản đính kèm.
				</p>
			</div>
		</div>
	</div>

	<!-- Main Form -->
	<form method="POST" action="?/create" enctype="multipart/form-data" use:enhance>
		<!-- hidden helper inputs -->
		<input type="hidden" name="customFieldsJson" value={customFieldsJson} />
		<input type="hidden" name="enableDownload" value={enableDownload.toString()} />
		{#each selectedTagIds as tagId}
			<input type="hidden" name="tagIds" value={tagId} />
		{/each}

		<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
			<!-- Left column: Main fields (col-span-8) -->
			<div class="lg:col-span-8 flex flex-col gap-6">
				<!-- Basic Details Card -->
				<Card hover={false} span="flex flex-col gap-4 p-6">
					<h3 class="text-sm font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800/60 pb-2">
						Thông Tin Cơ Bản
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

				<!-- Media Upload Card -->
				<Card hover={false} span="flex flex-col gap-4 p-6">
					<h3 class="text-sm font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800/60 pb-2">
						Ảnh Slideshow Showcase
					</h3>

					<div class="flex flex-col gap-1">
						<label for="slideshow-files" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
							>Tải lên nhiều ảnh sản phẩm</label
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

				<!-- Technical specifications -->
				<Card hover={false} span="flex flex-col gap-4 p-6">
					<h3 class="text-sm font-bold text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800/60 pb-2">
						Thông Số Kỹ Thuật (Fixed specs)
					</h3>

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

						<div class="flex flex-col gap-1">
							<label for="spec-demo" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
								>Live Demo URL</label
							>
							<Input id="spec-demo" name="liveDemoUrl" placeholder="Ví dụ: https://demo.wpchat.com" bind:value={liveDemoUrl} />
						</div>

						<div class="flex flex-col gap-1">
							<label for="spec-auth" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
								>Tác giả (Author)</label
							>
							<Input id="spec-auth" name="author" placeholder="Ví dụ: Mini Games Hub Team" bind:value={author} />
						</div>
					</div>
				</Card>

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

				<!-- Version & Download Settings (If checked) -->
				<Card hover={false} span="flex flex-col gap-4 p-6">
					<div class="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-2">
						<h3 class="text-sm font-bold text-zinc-900 dark:text-white">
							Cấu Hình Tải Về & Phiên Bản Đính Kèm
						</h3>
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

					{#if enableDownload}
						<div class="flex flex-col gap-4 animate-slide-in">
							<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div class="flex flex-col gap-1">
									<label for="ver-num" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
										>Số phiên bản (Version Number)</label
									>
									<Input
										id="ver-num"
										name="versionNumber"
										placeholder="Ví dụ: v1.0.0"
										bind:value={versionNumber}
										required
									/>
								</div>

								<div class="flex flex-col gap-1">
									<label for="ver-file" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
										>Tệp ZIP sản phẩm</label
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

							<div class="flex flex-col gap-1">
								<label for="ver-changelog" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
									>Nhật ký cập nhật (Changelog Raw)</label
								>
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
					{/if}
				</Card>
			</div>

			<!-- Right Column: Category & Tags selection (col-span-4) -->
			<div class="lg:col-span-4 flex flex-col gap-6">
				<!-- Category Card (WordPress Checklist style) -->
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

				<!-- Tags Card (WordPress checklist style) -->
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
								<div class="flex gap-2 justify-end">
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
						<Button type="submit" variant="primary" size="md" class="w-full">
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
