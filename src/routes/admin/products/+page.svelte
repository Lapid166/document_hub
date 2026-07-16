<script lang="ts">
	let { data } = $props();
	const initialProducts = data.products;

	import Button from '$lib/components/Button.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import Table from '$lib/components/Table.svelte';
	import type { TableColumn } from '$lib/components/Table.svelte';

	let adminProducts = $state<any[]>([...initialProducts]);

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

	function openAddModal() {
		window.location.href = '/admin/products/create';
	}

	function openEditModal(product: any) {
		window.location.href = `/admin/products/${product.id}/edit`;
	}

	async function confirmDeleteProduct(product: any) {
		if (confirm(`Bạn chắc chắn muốn xóa sản phẩm "${product.name}"?`)) {
			const formData = new FormData();
			formData.append('id', product.id);
			const response = await fetch('?/deleteProduct', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				adminProducts = adminProducts.filter((p) => p.id !== product.id);
				triggerToast(`Đã xóa sản phẩm ${product.name}`, 'info');
			} else {
				triggerToast('Không thể xóa sản phẩm. Chỉ người tạo hoặc Super Admin mới được xóa.', 'error');
			}
		}
	}

	const columns: TableColumn[] = [
		{ key: 'name', label: 'Tên Sản Phẩm' },
		{ key: 'category', label: 'Danh Mục', align: 'center', width: '180px' },
		{ key: 'downloadsCount', label: 'Lượt Tải', align: 'right', width: '120px' },
		{ key: 'lastUpdated', label: 'Cập Nhật', align: 'center', width: '150px' },
		{ key: 'actions', label: 'Thao Tác', align: 'center', width: '140px' }
	];
</script>

<div class="flex flex-col gap-4 w-full">
	<div class="flex items-center justify-between">
		<div class="flex flex-col">
			<h2 class="text-base font-bold text-zinc-900 dark:text-white">
				Danh sách sản phẩm & công cụ nội bộ
			</h2>
			<p class="text-xs text-zinc-400 dark:text-zinc-500">
				Thêm, sửa đổi hoặc loại bỏ WordPress Plugins, CMS Tools và Mini Games hiển thị công khai
			</p>
		</div>

		<Button variant="primary" size="md" onclick={openAddModal}>
			<span class="icon-[lucide--plus] h-4 w-4"></span>
			<span>Thêm Sản Phẩm</span>
		</Button>
	</div>

	<!-- Dynamic Table -->
	<Table {columns} rows={adminProducts} emptyText="Không có sản phẩm nào trong hệ thống.">
		{#snippet cell({ value, row, column })}
			{#if column.key === 'name'}
				<div class="flex items-center gap-3">
					<div
						class="h-10 w-10 rounded-xl flex items-center justify-center text-zinc-900 dark:text-white shrink-0 {row.iconColor}"
					>
						<span class="{row.icon} h-5 w-5"></span>
					</div>
					<div class="flex flex-col">
						<span class="font-semibold text-zinc-900 dark:text-zinc-100 leading-tight"
							>{row.name}</span
						>
						<div class="flex flex-wrap gap-1 mt-1">
							{#each row.tags as tag}
								<Badge variant="neutral">{tag}</Badge>
							{/each}
						</div>
					</div>
				</div>
			{:else if column.key === 'category'}
				<Badge
					variant={row.category === 'WordPress Plugin'
						? 'success'
						: row.category === 'CMS Tool'
							? 'info'
							: 'warning'}
				>
					{row.category}
				</Badge>
			{:else if column.key === 'downloadsCount'}
				<span class="font-mono text-zinc-900 dark:text-zinc-300 font-semibold">
					{(value as number).toLocaleString('vi-VN')}
				</span>
			{:else if column.key === 'lastUpdated'}
				<span class="text-xs font-medium text-zinc-500 dark:text-zinc-400">
					{value}
				</span>
			{:else if column.key === 'actions'}
				<div class="flex items-center justify-center gap-1.5">
					<button
						onclick={() => openEditModal(row as any)}
						class="p-1.5 rounded-lg border border-zinc-200/50 bg-white/50 text-zinc-500 hover:text-emerald-500 dark:border-zinc-800/50 dark:bg-zinc-900/30 dark:text-zinc-400 dark:hover:text-emerald-400 hover:border-emerald-500/20 zen-transition cursor-pointer"
						title="Sửa"
					>
						<span class="icon-[lucide--edit-3] h-4 w-4 block"></span>
					</button>
					<button
						onclick={() => confirmDeleteProduct(row as any)}
						class="p-1.5 rounded-lg border border-zinc-200/50 bg-white/50 text-zinc-500 hover:text-rose-500 dark:border-zinc-800/50 dark:bg-zinc-900/30 dark:text-zinc-400 dark:hover:text-rose-400 hover:border-rose-500/20 zen-transition cursor-pointer"
						title="Xóa"
					>
						<span class="icon-[lucide--trash-2] h-4 w-4 block"></span>
					</button>
				</div>
			{/if}
		{/snippet}
	</Table>
</div>

<!-- Toast System Alert Popup -->
{#if toast.show}
	<div
		class="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl backdrop-blur-lg border border-zinc-200/50 bg-white/90 dark:border-zinc-800/50 dark:bg-zinc-900/90 transition-all duration-300 animate-slide-in"
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
