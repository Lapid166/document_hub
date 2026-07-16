<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Select from '$lib/components/Select.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import Modal from '$lib/components/Modal.svelte';

	let { data, form } = $props();

	let searchQuery = $state('');
	let editingCategory = $state<any | null>(null);
	let editName = $state('');
	let editSlug = $state('');
	let editParentId = $state<string>('');
	let editDescription = $state('');
	let isEditModalOpen = $state(false);

	let formName = $state('');
	let formSlug = $state('');
	let formParentId = $state('');
	let formDescription = $state('');

	let filteredCategories = $derived(
		data.categories.filter((cat: any) =>
			cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	let parentCategoryOptions = $derived([
		{ value: '', label: 'Không có (Danh mục gốc)' },
		...data.categories.map((c: any) => ({
			value: c.id,
			label: c.name
		}))
	]);

	function getParentName(parentId: string | null) {
		if (!parentId) return '—';
		const parent = data.categories.find((c: any) => c.id === parentId);
		return parent ? parent.name : '—';
	}

	function openEdit(category: any) {
		editingCategory = category;
		editName = category.name;
		editSlug = category.slug;
		editParentId = category.parentId || '';
		editDescription = category.description || '';
		isEditModalOpen = true;
	}

	function closeEdit() {
		editingCategory = null;
		isEditModalOpen = false;
	}
</script>

<svelte:head>
	<title>Quản lý Danh mục - Admin Panel</title>
</svelte:head>

<div class="flex flex-col gap-6 w-full">
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
					Phân loại sản phẩm/plugin của bạn theo các danh mục chuyên biệt (WordPress Style).
				</p>
			</div>
			<div class="flex items-center gap-2">
				<Badge variant="success" class="py-1 px-3">Tổng số: {data.categories.length}</Badge>
			</div>
		</div>
	</div>

	<!-- Main 2-Column Layout -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
		<!-- Left Column: Add New Category Form (col-span-4) -->
		<div class="lg:col-span-4 flex flex-col gap-6">
			<Card hover={false} span="flex flex-col gap-4 p-5">
				<h2 class="text-sm font-bold text-zinc-900 dark:text-white">Thêm Danh Mục Mới</h2>

				<form
					method="POST"
					action="?/create"
					use:enhance={() => {
						return ({ result }) => {
							if (result.type === 'success') {
								formName = '';
								formSlug = '';
								formParentId = '';
								formDescription = '';
							}
						};
					}}
					class="flex flex-col gap-4 mt-2"
				>
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
							>“slug” là phiên bản thân thiện với URL của tên. Nó thường là chữ thường và chỉ chứa
							chữ cái, số và dấu gạch ngang.</span
						>
					</div>

					<div class="flex flex-col gap-1">
						<label for="cat-parent" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
							>Danh mục cha</label
						>
						<input type="hidden" name="parentId" value={formParentId} />
						<Select
							id="cat-parent"
							options={parentCategoryOptions}
							bind:value={formParentId}
						/>
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
						<div class="text-xs text-rose-500 mt-1">{form.message}</div>
					{/if}

					<div class="mt-2">
						<Button type="submit" variant="primary" size="md" class="w-full">
							Thêm Danh Mục
						</Button>
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
								<th class="pb-3 font-bold text-zinc-900 dark:text-white">Danh mục cha</th>
								<th class="pb-3 font-bold text-zinc-900 dark:text-white text-right">Thao tác</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-zinc-200/30 dark:divide-zinc-800/40">
							{#if filteredCategories.length === 0}
								<tr>
									<td colspan="5" class="py-6 text-center text-zinc-400">
										Không tìm thấy danh mục nào phù hợp.
									</td>
								</tr>
							{:else}
								{#each filteredCategories as category}
									<tr class="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
										<td class="py-3.5 font-semibold text-zinc-900 dark:text-white">
											{category.name}
										</td>
										<td class="py-3.5 max-w-[200px] truncate text-xs text-zinc-450">
											{category.description || '—'}
										</td>
										<td class="py-3.5 font-mono text-xs">{category.slug}</td>
										<td class="py-3.5 text-xs text-zinc-500">
											{getParentName(category.parentId)}
										</td>
										<td class="py-3.5 text-right">
											<div class="flex items-center justify-end gap-1.5 opacity-80">
												<button
													onclick={() => openEdit(category)}
													class="p-1.5 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"
													title="Chỉnh sửa"
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
														class="p-1.5 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
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

<!-- Modal Edit Category -->
<Modal bind:open={isEditModalOpen} title="Chỉnh sửa Danh mục" onclose={closeEdit}>
	<form
		method="POST"
		action="?/update"
		use:enhance={() => {
			return ({ result }) => {
				if (result.type === 'success') {
					closeEdit();
				}
			};
		}}
		class="flex flex-col gap-4 mt-2 text-left"
	>
		<input type="hidden" name="id" value={editingCategory?.id} />

		<div class="flex flex-col gap-1">
			<label for="edit-cat-name" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
				>Tên danh mục <span class="text-rose-500">*</span></label
			>
			<Input id="edit-cat-name" name="name" bind:value={editName} required />
		</div>

		<div class="flex flex-col gap-1">
			<label for="edit-cat-slug" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
				>Đường dẫn Slug</label
			>
			<Input id="edit-cat-slug" name="slug" bind:value={editSlug} />
		</div>

		<div class="flex flex-col gap-1">
			<label for="edit-cat-parent" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
				>Danh mục cha</label
			>
			<input type="hidden" name="parentId" value={editParentId} />
			<Select
				id="edit-cat-parent"
				options={parentCategoryOptions.filter((opt) => opt.value !== editingCategory?.id)}
				bind:value={editParentId}
			/>
		</div>

		<div class="flex flex-col gap-1">
			<label for="edit-cat-desc" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
				>Mô tả chi tiết</label
			>
			<textarea
				id="edit-cat-desc"
				name="description"
				rows="4"
				bind:value={editDescription}
				class="w-full rounded-xl border border-zinc-200 bg-white/50 px-4 py-2.5 text-sm outline-none transition-all duration-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white"
			></textarea>
		</div>

		<div class="flex justify-end gap-3 mt-4">
			<Button type="button" variant="secondary" size="md" onclick={closeEdit}>Hủy bỏ</Button>
			<Button type="submit" variant="primary" size="md">Lưu thay đổi</Button>
		</div>
	</form>
</Modal>
