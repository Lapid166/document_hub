<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/Card.svelte';
	import Button from '$lib/components/Button.svelte';
	import Input from '$lib/components/Input.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import Modal from '$lib/components/Modal.svelte';

	let { data, form } = $props();

	let searchQuery = $state('');
	let editingTag = $state<any | null>(null);
	let editName = $state('');
	let editSlug = $state('');
	let editDescription = $state('');
	let isEditModalOpen = $state(false);

	let formName = $state('');
	let formSlug = $state('');
	let formDescription = $state('');

	let filteredTags = $derived(
		data.tags.filter((tag: any) =>
			tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			tag.slug.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	function openEdit(tag: any) {
		editingTag = tag;
		editName = tag.name;
		editSlug = tag.slug;
		editDescription = tag.description || '';
		isEditModalOpen = true;
	}

	function closeEdit() {
		editingTag = null;
		isEditModalOpen = false;
	}
</script>

<svelte:head>
	<title>Quản lý Thẻ Tag - Admin Panel</title>
</svelte:head>

<div class="flex flex-col gap-6 w-full">
	<!-- Top Stats/Overview Card -->
	<div
		class="relative rounded-3xl border border-zinc-200/50 bg-white/60 p-6 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/60 shadow-sm"
	>
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
			<div>
				<h1 class="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
					Quản Lý Thẻ Tag
				</h1>
				<p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
					Quản lý và gán các nhãn từ khóa ngắn cho sản phẩm của bạn (WordPress Style).
				</p>
			</div>
			<div class="flex items-center gap-2">
				<Badge variant="success" class="py-1 px-3">Tổng số: {data.tags.length}</Badge>
			</div>
		</div>
	</div>

	<!-- Main 2-Column Layout -->
	<div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
		<!-- Left Column: Add New Tag Form (col-span-4) -->
		<div class="lg:col-span-4 flex flex-col gap-6">
			<Card hover={false} span="flex flex-col gap-4 p-5">
				<h2 class="text-sm font-bold text-zinc-900 dark:text-white">Thêm Thẻ Tag Mới</h2>

				<form
					method="POST"
					action="?/create"
					use:enhance={() => {
						return ({ result }) => {
							if (result.type === 'success') {
								formName = '';
								formSlug = '';
								formDescription = '';
							}
						};
					}}
					class="flex flex-col gap-4 mt-2"
				>
					<div class="flex flex-col gap-1">
						<label for="tag-name" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
							>Tên thẻ <span class="text-rose-500">*</span></label
						>
						<Input
							id="tag-name"
							name="name"
							placeholder="Ví dụ: helpdesk"
							bind:value={formName}
							required
						/>
					</div>

					<div class="flex flex-col gap-1">
						<label for="tag-slug" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
							>Đường dẫn Slug (Tùy chọn)</label
						>
						<Input id="tag-slug" name="slug" placeholder="Ví dụ: helpdesk" bind:value={formSlug} />
						<span class="text-[10px] text-zinc-450 dark:text-zinc-500"
							>“slug” là phiên bản thân thiện với URL của tên. Nó thường là chữ thường và chỉ chứa
							chữ cái, số và dấu gạch ngang.</span
						>
					</div>

					<div class="flex flex-col gap-1">
						<label for="tag-desc" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
							>Mô tả chi tiết</label
						>
						<textarea
							id="tag-desc"
							name="description"
							rows="4"
							placeholder="Mô tả tóm tắt nội dung của thẻ..."
							bind:value={formDescription}
							class="w-full rounded-xl border border-zinc-200 bg-white/50 px-4 py-2.5 text-sm outline-none transition-all duration-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-white"
						></textarea>
					</div>

					{#if form?.message}
						<div class="text-xs text-rose-500 mt-1">{form.message}</div>
					{/if}

					<div class="mt-2">
						<Button type="submit" variant="primary" size="md" class="w-full">
							Thêm Thẻ Tag
						</Button>
					</div>
				</form>
			</Card>
		</div>

		<!-- Right Column: Tags List Table (col-span-8) -->
		<div class="lg:col-span-8 flex flex-col gap-4">
			<div
				class="rounded-3xl border border-zinc-200/50 bg-white/60 p-5 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/60 shadow-sm"
			>
				<!-- Table Header with Search -->
				<div class="flex items-center justify-between gap-4 mb-4">
					<h2 class="text-sm font-bold text-zinc-900 dark:text-white">Danh sách Thẻ Tag</h2>
					<div class="w-64">
						<Input
							id="search-tag"
							placeholder="Tìm kiếm thẻ..."
							bind:value={searchQuery}
						/>
					</div>
				</div>

				<!-- Tags Table -->
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
							{#if filteredTags.length === 0}
								<tr>
									<td colspan="4" class="py-6 text-center text-zinc-400">
										Không tìm thấy thẻ tag nào phù hợp.
									</td>
								</tr>
							{:else}
								{#each filteredTags as tag}
									<tr class="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
										<td class="py-3.5 font-semibold text-zinc-900 dark:text-white">
											{tag.name}
										</td>
										<td class="py-3.5 max-w-[300px] truncate text-xs text-zinc-450">
											{tag.description || '—'}
										</td>
										<td class="py-3.5 font-mono text-xs">{tag.slug}</td>
										<td class="py-3.5 text-right">
											<div class="flex items-center justify-end gap-1.5 opacity-80">
												<button
													onclick={() => openEdit(tag)}
													class="p-1.5 text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"
													title="Chỉnh sửa"
												>
													<span class="icon-[lucide--edit-2] h-4 w-4"></span>
												</button>

												<form method="POST" action="?/delete" use:enhance>
													<input type="hidden" name="id" value={tag.id} />
													<button
														type="submit"
														onclick={(e) => {
															if (
																!confirm(`Bạn có chắc chắn muốn xóa thẻ tag "${tag.name}"?`)
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

<!-- Modal Edit Tag -->
<Modal bind:open={isEditModalOpen} title="Chỉnh sửa Thẻ Tag" onclose={closeEdit}>
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
		<input type="hidden" name="id" value={editingTag?.id} />

		<div class="flex flex-col gap-1">
			<label for="edit-tag-name" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
				>Tên thẻ <span class="text-rose-500">*</span></label
			>
			<Input id="edit-tag-name" name="name" bind:value={editName} required />
		</div>

		<div class="flex flex-col gap-1">
			<label for="edit-tag-slug" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
				>Đường dẫn Slug</label
			>
			<Input id="edit-tag-slug" name="slug" bind:value={editSlug} />
		</div>

		<div class="flex flex-col gap-1">
			<label for="edit-tag-desc" class="text-xs font-bold text-zinc-650 dark:text-zinc-300"
				>Mô tả chi tiết</label
			>
			<textarea
				id="edit-tag-desc"
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
