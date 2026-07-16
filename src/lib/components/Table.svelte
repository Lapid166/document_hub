<script lang="ts">
	import type { Snippet } from 'svelte';

	export type TableColumn = {
		key: string;
		label: string;
		align?: 'left' | 'right' | 'center';
		width?: string;
	};

	interface TableProps {
		columns: TableColumn[];
		rows: Record<string, any>[];
		emptyText?: string;
		cell?: Snippet<[{ value: any; row: Record<string, any>; column: TableColumn }]>;
	}

	let { columns, rows = [], emptyText = 'Không có dữ liệu', cell }: TableProps = $props();

	const alignClasses = {
		left: 'text-left',
		right: 'text-right',
		center: 'text-center'
	};
</script>

<div
	class="w-full overflow-x-auto rounded-2xl border border-zinc-200/30 bg-white shadow-sm dark:border-zinc-800/30 dark:bg-zinc-900/50 backdrop-blur-md"
>
	<table class="w-full border-collapse text-left text-sm">
		<thead>
			<tr class="border-b border-zinc-200/30 dark:border-zinc-800/30">
				{#each columns as col}
					<th
						style={col.width ? `width: ${col.width}` : ''}
						class="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 {alignClasses[
							col.align || 'left'
						]}"
					>
						{col.label}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody class="divide-y divide-zinc-200/30 dark:divide-zinc-800/30">
			{#if rows.length === 0}
				<tr>
					<td
						colspan={columns.length}
						class="px-6 py-8 text-center text-sm text-zinc-400 dark:text-zinc-500"
					>
						{emptyText}
					</td>
				</tr>
			{:else}
				{#each rows as row}
					<tr class="transition-colors duration-200 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
						{#each columns as col}
							<td
								class="px-6 py-4 text-zinc-700 dark:text-zinc-300 {alignClasses[
									col.align || 'left'
								]}"
							>
								{#if cell}
									{@render cell({ value: row[col.key], row, column: col })}
								{:else}
									{row[col.key] ?? ''}
								{/if}
							</td>
						{/each}
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>
