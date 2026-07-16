<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Badge from '$lib/components/Badge.svelte';

	let { data, form } = $props();

	let searchQuery = $state('');
	let editingCategory = $state<any | null>(null);

	let formName = $state('');
	let formSlug = $state('');
	let formDescription = $state('');

	let filteredCategories = $derived(
		data.categories.filter((cat: any) =>
			cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	function openEdit(category: any) {
		editingCategory = category;
		formName = category.name;
		formSlug = category.slug;
		formDescription = category.description || '';
	}

	function cancelEdit() {
		editingCategory = null;
		formName = '';
		formSlug = '';
		formDescription = '';
	}
</script>

<svelte:head>
	<title>Quản lý Danh mục - Admin Panel</title>
</svelte:head>

<div class="flex flex-col gap-6 w-full font-sans">
	<!-- Top Stats/Overview Card -->
	<div
		class="relative rounded-3xl border border-zinc-200/50 bg-white/60 p-6 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/60 shadow-sm"
	>
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
			<div>
				<h1 class="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
					Quản Lý Danh Mục
				</h1>
				<p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
					Phân loại các sản phẩm và plugin theo danh mục đặc thù (Giao diện cấu trúc WordPress).
				</p>
			</div>
			<div class="flex items-center gap-2">
				<Badge variant="success" class="py-1 px-3 font-bold">Tổng số: {data.categories.length}</Badge>
			</div>
		</div>
	</div>

	<!-- Main 2-Column Layout -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
		<!-- Left Column: WordPress Style Add/Edit Category Form (col-span-4) -->
		<div class="lg:col-span-4 flex flex-col gap-6">
			<Card hover={false} span="flex flex-col gap-4 p-5 border border-zinc-200/60 dark:border-zinc-800/80 shadow-sm">
				<h2 class="text-sm font-bold text-zinc-900 dark:text-white">
					{editingCategory ? `Chỉnh Sửa Danh Mục: ${editingCategory.name}` : 'Thêm Danh Mục Mới'}
				</h2>

				<form
					method="POST"
					action={editingCategory ? '?/update' : '?/create'}
					use:enhance={() => {
						return ({ result }) => {
							if (result.type === 'success') {
								cancelEdit();
							}
						};
					}}
					class="flex flex-col gap-4 mt-2"
				>
					{#if editingCategory}
						<input type="hidden" name="id" value={editingCategory.id} />
					{/if}

					<div class="flex flex-col gap-1">
						<label for="cat-name" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
							>Tên danh mục <span class="text-rose-500">*</span></label
						>
						<Input
							id="cat-name"
							name="name"
							placeholder="Ví dụ: WordPress Plugin"
							bind:value={formName}
							required
						/>
					</div>

					<div class="flex flex-col gap-1">
						<label for="cat-slug" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
							>Đường dẫn Slug (Tùy chọn)</label
						>
						<Input
							id="cat-slug"
							name="slug"
							placeholder="Ví dụ: wordpress-plugin"
							bind:value={formSlug}
						/>
						<span class="text-[10px] text-zinc-450 dark:text-zinc-500"
							>“slug” là đường dẫn URL của danh mục, thường là chữ thường không dấu cách.</span
						>
					</div>

					<div class="flex flex-col gap-1">
						<label for="cat-desc" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
							>Mô tả chi tiết</label
						>
						<textarea
							id="cat-desc"
							name="description"
							rows="4"
							placeholder="Mô tả tóm tắt nội dung danh mục..."
							bind:value={formDescription}
							class="w-full rounded-xl border border-zinc-200 bg-white/50 px-4 py-2.5 text-sm outline-none transition-all duration-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white"
						></textarea>
					</div>

					{#if form?.message}
						<div class="text-xs text-rose-500 mt-1 font-bold">{form.message}</div>
					{/if}

					<div class="flex gap-2.5 mt-2">
						{#if editingCategory}
							<Button type="button" variant="secondary" size="md" class="flex-grow cursor-pointer" onclick={cancelEdit}>
								Hủy bỏ
							</Button>
							<Button type="submit" variant="primary" size="md" class="flex-grow cursor-pointer">
								Cập nhật
							</Button>
						{:else}
							<Button type="submit" variant="primary" size="md" class="w-full cursor-pointer">
								Thêm Danh Mục
							</Button>
						{/if}
					</div>
				</form>
			</Card>
		</div>

		<!-- Right Column: Categories List Table (col-span-8) -->
		<div class="lg:col-span-8 flex flex-col gap-4">
			<div
				class="rounded-3xl border border-zinc-200/50 bg-white/60 p-5 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/60 shadow-sm"
			>
				<!-- Table Header with Search -->
				<div class="flex items-center justify-between gap-4 mb-4">
					<h2 class="text-sm font-bold text-zinc-900 dark:text-white">Danh sách Danh mục</h2>
					<div class="w-64">
						<Input
							id="search-cat"
							placeholder="Tìm kiếm danh mục..."
							bind:value={searchQuery}
						/>
					</div>
				</div>

				<!-- Categories Table -->
				<div class="overflow-x-auto w-full">
					<table class="w-full border-collapse text-left text-sm text-zinc-600 dark:text-zinc-300">
						<thead>
							<tr class="border-b border-zinc-200/50 dark:border-zinc-800/60">
								<th class="pb-3 font-bold text-zinc-900 dark:text-white">Tên</th>
								<th class="pb-3 font-bold text-zinc-900 dark:text-white">Mô tả</th>
								<th class="pb-3 font-bold text-zinc-900 dark:text-white">Slug</th>
								<th class="pb-3 font-bold text-zinc-900 dark:text-white text-right">Thao tác</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-zinc-200/30 dark:divide-zinc-800/40">
							{#if filteredCategories.length === 0}
								<tr>
									<td colspan="4" class="py-6 text-center text-zinc-400">
										Không tìm thấy danh mục nào phù hợp.
									</td>
								</tr>
							{:else}
								{#each filteredCategories as category}
									{@const isEditingThis = editingCategory?.id === category.id}
									<tr class="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 {isEditingThis ? 'bg-emerald-500/5 dark:bg-emerald-500/10' : ''}">
										<td class="py-3.5 font-semibold text-zinc-900 dark:text-white">
											{category.name}
											{#if isEditingThis}
												<span class="ml-1 text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-md">Đang sửa</span>
											{/if}
										</td>
										<td class="py-3.5 max-w-[300px] truncate text-xs text-zinc-450">
											{category.description || '—'}
										</td>
										<td class="py-3.5 font-mono text-xs">{category.slug}</td>
										<td class="py-3.5 text-right">
											<div class="flex items-center justify-end gap-1.5 opacity-80">
												<button
													onclick={() => openEdit(category)}
													class="p-1.5 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all cursor-pointer"
													title="Chỉnh sửa (Đổ dữ liệu sang form trái)"
												>
													<span class="icon-[lucide--edit-2] h-4 w-4"></span>
												</button>

												<form method="POST" action="?/delete" use:enhance>
													<input type="hidden" name="id" value={category.id} />
													<button
														type="submit"
														onclick={(e) => {
															if (
																!confirm(
																	`Bạn có chắc chắn muốn xóa danh mục "${category.name}"?`
																)
															) {
																e.preventDefault();
															}
														}}
														class="p-1.5 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
														title="Xóa"
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
	</div>
</div>
