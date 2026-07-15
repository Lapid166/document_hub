# Zen Minimalist x Fresh Tech - Design System Specification
> **Dự án gốc**: `document_hub_v2`
> **Phiên bản tài liệu**: 1.0.0
> **Định dạng**: Hướng dẫn đồng bộ UI/UX (Đọc và tuân thủ tự động bởi AI và Coder)

Tài liệu này đặc tả toàn bộ triết lý thiết kế, thông số kỹ thuật (Tokens), bố cục Layout và mã nguồn của các thành phần giao diện (UI Components) đang được sử dụng trong hệ thống. Bạn có thể sử dụng file này làm đầu vào duy nhất để hướng dẫn bất kỳ AI nào xây dựng một dự án mới có cùng ngôn ngữ thiết kế và cấu trúc giao diện.

---

## 1. Triết Lý Thiết Kế Cốt Lõi (Design Philosophy)

Ngôn ngữ thiết kế được đặt tên là **Zen Minimalist x Fresh Tech (Tinh tế Tối giản & Công nghệ Tươi mới)**:
1. **Zen (Sự Tĩnh Lặng)**: Sử dụng các gam màu trung tính của đá (Zinc), khoảng trắng rộng rãi (Generous whitespace) và bố cục lưới Bento rõ ràng, không rối rắm.
2. **Komorebi (Ánh sáng luồn qua kẽ lá)**: Sử dụng các vầng sáng mờ nhạt ở hậu cảnh (Background Glow Blobs) kết hợp kính mờ (Backdrop-blur) tạo chiều sâu tự nhiên.
3. **Kintsugi (Gắn kết bằng vàng)**: Các điểm nhấn tương tác (Active states) hoặc đường viền định vị được chăm chút tỉ mỉ bằng các vạch màu chuyển sắc mảnh nhưng sắc nét.
4. **Zen Easing (Chuyển động mượt mà)**: Hiệu ứng chuyển động (transitions) sử dụng đường cong bezier tùy chỉnh, tạo cảm giác mượt mà và êm ái khi tương tác.

---

## 2. Hệ Thống Token Thiết Kế (Design Tokens)

Dự án sử dụng **Tailwind CSS v4** với cấu hình chủ đề và các lớp base/utilities như sau:

### 2.1 Cấu hình Theme (`app.css`)
```css
@import "tailwindcss";

@theme {
  /* Typography */
  --font-sans: Inter, sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  /* Easing & Motion */
  --ease-zen: cubic-bezier(0.25, 1, 0.5, 1);

  /* Shadows */
  --shadow-zen: 0 8px 30px rgba(24, 24, 27, 0.06);
}
```

### 2.2 Bảng Màu (Color Palette)
- **Nền (Background)**:
  - Light mode: `bg-zinc-50` (Màu cát nhạt)
  - Dark mode: `bg-zinc-950` (Màu đá phiến tối)
- **Chữ (Typography)**:
  - Light mode: `text-zinc-900` (Đen đá), phụ trợ: `text-zinc-400` / `text-zinc-500`
  - Dark mode: `text-zinc-50` (Trắng tuyết), phụ trợ: `text-zinc-400` / `text-zinc-500`
- **Điểm nhấn Công nghệ (Fresh Tech Accents)**:
  - Xanh lục (Emerald): `emerald-500` (`#10b981`) - Đại diện cho sự ổn định, an sau, trạng thái Thành công.
  - Xanh dương (Sky): `sky-500` (`#06b6d4`) - Đại diện cho thông tin, tiến trình, trạng thái Đang xử lý.
  - Chuyển sắc (Gradient): Kết hợp từ Emerald sang Sky (`from-emerald-500 to-sky-500`) hoặc qua Teal (`from-emerald-500 via-teal-500 to-sky-500`).
- **Trạng thái Cảnh báo & Lỗi**:
  - Hổ phách (Amber): `amber-500` (`#f59e0b`) - Cảnh báo.
  - Hoa hồng (Rose): `rose-500` (`#f43f5e`) - Lỗi / Nguy hiểm.

### 2.3 Các Lớp Tiện Ích Tùy Chỉnh (Custom Utility Classes)
- **Chuyển động mượt mà**: `.zen-transition { transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1); }`
- **Hiệu ứng chữ chuyển sắc**: `.zen-gradient-text { @apply bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 bg-clip-text text-transparent; }`
- **Vòng tròn phát sáng hậu cảnh (Glow Blobs)**:
  ```css
  .zen-glow-emerald {
    @apply pointer-events-none absolute rounded-full bg-emerald-400/5 blur-[140px] dark:bg-emerald-500/[0.01];
  }
  .zen-glow-sky {
    @apply pointer-events-none absolute rounded-full bg-sky-400/5 blur-[140px] dark:bg-sky-500/[0.01];
  }
  ```
- **Thanh cuộn tĩnh lặng**: `.zen-scrollbar` tùy chỉnh nhỏ gọn (5px), bo tròn, chìm vào nền.

---

## 3. Kiến Trúc Bố Cục Lớp Lưới (Layout Architecture)

### 3.1 Giao Diện Admin Tổng Quan (AdminShell Layout)
Giao diện quản trị được chia làm hai khu vực chính:
1. **Sidebar bên trái** (`w-72`, cố định):
   - Nền bán trong suốt (`bg-white/70` hoặc `bg-zinc-950/70`) kết hợp hiệu ứng kính mờ (`backdrop-blur-xl`).
   - Đường viền mỏng (`border-r border-zinc-200/50` hoặc `dark:border-zinc-800/50`).
   - Danh sách menu được phân nhóm, trạng thái Active có vạch định vị bên phải (`border-r-2 border-emerald-500`) và nền gradient nhạt (`bg-gradient-to-r from-emerald-500/10 to-sky-500/10`).
2. **Không gian làm việc bên phải** (Cuộn dọc, chiếm trọn màn hình còn lại):
   - Nền chính `bg-zinc-50` / `bg-zinc-950`.
   - Có hai vầng sáng `zen-glow-emerald` (trên bên trái) và `zen-glow-sky` (dưới bên phải) để tạo chiều sâu.
   - Thanh TopBar cố định hoặc nằm trên cùng hiển thị Tiêu đề trang (`title`) và Mô tả ngắn (`description`).
   - Nội dung chính (`main`) được bọc trong `max-w-7xl mx-auto p-8`.

### 3.2 Bố Cục Bento Multi-Grid (Bento Grid)
Sử dụng lưới Tailwind để gom cụm các khối thông tin độc lập:
```html
<main class="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-6 w-full">
  <!-- Thẻ KPI nhỏ (chiếm 4 cột trên màn hình lớn) -->
  <div class="lg:col-span-4 md:col-span-2">...</div>
  <!-- Biểu đồ hoặc Danh sách lớn (chiếm 8 cột trên màn hình lớn) -->
  <div class="lg:col-span-8 md:col-span-4">...</div>
</main>
```

---

## 4. Nguyên Tắc Tương Tác (UX Interactions)

- **Độ khả dụng và Tiêu cự**: Interactive elements phải có focus rõ ràng:
  ```css
  :focus-visible {
    @apply outline-none ring-2 ring-emerald-500/60 ring-offset-2 ring-offset-zinc-50 dark:ring-offset-zinc-950;
  }
  ```
- **Phản hồi di chuột (Hover)**: Card và Button khi hover sẽ nhấc nhẹ lên (`hover:-translate-y-0.5` hoặc `hover:-translate-y-1`), đường viền chuyển màu sáng hơn, bóng đổ sâu hơn (`shadow-zen`).
- **Icons**: Sử dụng bộ font **Google Material Symbols Outlined** với cấu hình mảnh:
  ```css
  .material-symbols-outlined {
    font-variation-settings: 'wght' 300, 'opsz' 24;
    font-size: 20px;
    line-height: 1;
  }
  ```

---

## 5. Đặc Tả Chi Tiết Component UI (Svelte 5 + Runes)

Dưới đây là mã nguồn chuẩn hóa của các UI Component cốt lõi bằng Svelte 5. Các component này giao tiếp hoàn toàn qua hệ thống Runes (`$props`, `$bindable`, `$derived`, `$effect`) và các Snippet (`{#snippet ...}`, `{@render ...}`).

### 5.1 Thẻ Chứa (Card.svelte)
```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		span?: string;
		hover?: boolean;
		children?: Snippet;
	}

	let { span = '', hover = false, children }: Props = $props();
</script>

<section class="rounded-2xl border border-zinc-200/50 bg-white p-6 shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] dark:border-zinc-800/50 dark:bg-zinc-900 {hover ? 'hover:-translate-y-0.5 hover:border-emerald-500/20 hover:shadow-[0_8px_30px_rgba(24,24,27,0.06)]' : ''} {span}">
	{#if children}{@render children()}{/if}
</section>
```

### 5.2 Nút Bấm (Button.svelte)
```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';

	type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft';
	type ButtonSize = 'sm' | 'md' | 'lg';

	interface Props {
		variant?: ButtonVariant;
		size?: ButtonSize;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		loading?: boolean;
		children?: Snippet;
		onclick?: (event: MouseEvent) => void;
	}

	let {
		variant = 'primary',
		size = 'md',
		type = 'button',
		disabled = false,
		loading = false,
		children,
		onclick
	}: Props = $props();

	const variantClass: Record<ButtonVariant, string> = {
		primary: 'bg-gradient-to-r from-emerald-500 to-sky-500 text-white shadow-sm hover:from-emerald-400 hover:to-sky-400',
		secondary: 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800/60',
		ghost: 'text-zinc-500 hover:bg-zinc-100/70 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50',
		danger: 'bg-rose-500 text-white shadow-sm hover:bg-rose-400',
		soft: 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-400'
	};

	const sizeClass: Record<ButtonSize, string> = {
		sm: 'px-3 py-1.5 text-xs',
		md: 'px-4 py-2 text-sm',
		lg: 'px-5 py-2.5 text-base'
	};
</script>

<button {type} disabled={disabled || loading} class="inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] disabled:pointer-events-none disabled:opacity-50 {variantClass[variant]} {sizeClass[size]}" {onclick}>
	{#if loading}
		<span class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
	{/if}
	{#if children}{@render children()}{/if}
</button>
```

### 5.3 Trường Nhập Liệu (Input.svelte)
```svelte
<script lang="ts">
	interface InputProps {
		id: string;
		name?: string;
		label?: string;
		value?: string;
		placeholder?: string;
		required?: boolean;
		disabled?: boolean;
		error?: string;
		type?: string;
	}

	let {
		id,
		name,
		label,
		value = $bindable(''),
		placeholder,
		required = false,
		disabled = false,
		error,
		type = 'text'
	}: InputProps = $props();
</script>

<div>
	{#if label}
		<label class="mb-1 block text-[10px] font-medium uppercase tracking-wider text-zinc-400" for={id}>{label}</label>
	{/if}
	<input
		{id}
		{name}
		{type}
		bind:value
		{placeholder}
		{required}
		{disabled}
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={error ? `${id}-error` : undefined}
		class="w-full rounded-xl border bg-zinc-50 px-3 py-2 text-sm text-zinc-900 transition-colors duration-200 placeholder:text-zinc-400 focus:border-emerald-500 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-50 focus:outline-none {error ? 'border-rose-400 focus:border-rose-500 dark:border-rose-500/60' : 'border-zinc-200 focus:border-emerald-500'}"
	/>
	{#if error}
		<p id="{id}-error" class="mt-1 text-xs text-rose-500">{error}</p>
	{/if}
</div>
```

### 5.4 Bảng Dữ Liệu (Table.svelte)
```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';

	export type TableColumn = { key: string; label: string; align?: 'left' | 'right' | 'center'; width?: string };

	interface TableProps {
		columns: TableColumn[];
		rows: Record<string, unknown>[];
		emptyText?: string;
		cell?: Snippet<[{ value: unknown; row: Record<string, unknown>; column: TableColumn }]>;
	}

	let {
		columns,
		rows = [],
		emptyText = 'Không có dữ liệu',
		cell
	}: TableProps = $props();

	const alignClasses = {
		left: 'text-left',
		right: 'text-right',
		center: 'text-center'
	};
</script>

<div class="w-full overflow-x-auto rounded-2xl border border-zinc-200/50 bg-white shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900">
	<table class="w-full border-collapse text-left text-sm">
		<thead>
			<tr class="border-b border-zinc-200/50 dark:border-zinc-800/50">
				{#each columns as col}
					<th
						style={col.width ? `width: ${col.width}` : ''}
						class="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 {alignClasses[col.align || 'left']}"
					>
						{col.label}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody class="divide-y divide-zinc-200/50 dark:divide-zinc-800/50">
			{#if rows.length === 0}
				<tr>
					<td colspan={columns.length} class="px-6 py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
						{emptyText}
					</td>
				</tr>
			{:else}
				{#each rows as row}
					<tr class="transition-colors duration-200 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
						{#each columns as col}
							<td class="px-6 py-4 text-zinc-700 dark:text-zinc-300 {alignClasses[col.align || 'left']}">
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
```

### 5.5 Nhãn Trạng Thái (Badge.svelte)
```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';

	type BadgeVariant = 'neutral' | 'success' | 'info' | 'warning' | 'danger';

	interface BadgeProps {
		variant?: BadgeVariant;
		children?: Snippet;
	}

	let { variant = 'neutral', children }: BadgeProps = $props();

	const variantClass: Record<BadgeVariant, string> = {
		neutral: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800/70 dark:text-zinc-300',
		success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
		info: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
		warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
		danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
	};
</script>

<span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium {variantClass[variant]}">
	{#if children}{@render children()}{/if}
</span>
```

### 5.6 Hộp Thoại Nổi (Modal.svelte)
```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface ModalProps {
		open?: boolean;
		title?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		children?: Snippet;
		footer?: Snippet;
		onclose?: () => void;
	}

	let {
		open = $bindable(false),
		title,
		size = 'md',
		children,
		footer,
		onclose
	}: ModalProps = $props();

	const sizeClass: Record<NonNullable<ModalProps['size']>, string> = {
		sm: 'max-w-sm',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl'
	};

	function close() {
		open = false;
		onclose?.();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (open && event.key === 'Escape') close();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<!-- Backdrop -->
		<button
			type="button"
			aria-label="Close modal"
			class="absolute inset-0 bg-zinc-950/30 backdrop-blur-sm transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] dark:bg-zinc-950/60"
			onclick={close}
		></button>

		<!-- Dialog Body -->
		<div
			role="dialog"
			aria-modal="true"
			aria-label={title}
			tabindex="-1"
			class="relative z-10 w-full {sizeClass[size]} overflow-hidden rounded-2xl border border-zinc-200/60 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
		>
			{#if title}
				<header class="border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
					<h2 class="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h2>
				</header>
			{/if}

			<div class="p-6 text-sm text-zinc-600 dark:text-zinc-300">
				{#if children}{@render children()}{/if}
			</div>

			{#if footer}
				<footer class="flex justify-end gap-2 border-t border-zinc-100 bg-zinc-50/70 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950/30">
					{@render footer()}
				</footer>
			{/if}
		</div>
	</div>
{/if}
```

### 5.7 Menu Lựa Chọn Tự Thiết Kế (Select.svelte)
```svelte
<script lang="ts">
	export type SelectOption = { value: string; label: string; icon?: string; disabled?: boolean };

	interface SelectProps {
		id: string;
		label?: string;
		placeholder?: string;
		options: SelectOption[];
		value?: string;
		disabled?: boolean;
		error?: string;
	}

	let {
		id,
		label,
		placeholder = 'Chọn một lựa chọn',
		options,
		value = $bindable(''),
		disabled = false,
		error
	}: SelectProps = $props();

	let open = $state(false);
	let highlightedIndex = $state(0);

	let enabledOptions = $derived(options.filter((option) => !option.disabled));
	let selectedOption = $derived(options.find((option) => option.value === value));
	let activeOption = $derived(enabledOptions[highlightedIndex]);

	function clampHighlight() {
		if (highlightedIndex >= enabledOptions.length) highlightedIndex = Math.max(enabledOptions.length - 1, 0);
	}

	function openList() {
		if (disabled) return;
		open = true;
		const selectedIndex = enabledOptions.findIndex((option) => option.value === value);
		highlightedIndex = selectedIndex >= 0 ? selectedIndex : 0;
	}

	function selectOption(option: SelectOption | undefined) {
		if (!option || option.disabled) return;
		value = option.value;
		open = false;
	}

	function handleTriggerKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown') {
			event.preventDefault();
			if (!open) openList();
			else highlightedIndex = Math.min(highlightedIndex + 1, enabledOptions.length - 1);
		}

		if (event.key === 'ArrowUp' && open) {
			event.preventDefault();
			highlightedIndex = Math.max(highlightedIndex - 1, 0);
		}

		if (event.key === 'Enter' && open) {
			event.preventDefault();
			selectOption(activeOption);
		}

		if (event.key === 'Escape') {
			open = false;
		}
	}

	$effect(clampHighlight);
</script>

<div class="relative">
	{#if label}
		<label class="mb-1 block text-[10px] font-medium uppercase tracking-wider text-zinc-400" for={id}>{label}</label>
	{/if}

	<button
		{id}
		type="button"
		{disabled}
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-describedby={error ? `${id}-error` : undefined}
		class="flex min-h-10 w-full items-center justify-between gap-2 rounded-xl border bg-zinc-50 px-3 py-2 text-left text-sm transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-950/60 {error
			? 'border-rose-400 dark:border-rose-500/60'
			: 'border-zinc-200 hover:border-emerald-400 focus:border-emerald-500 dark:border-zinc-800 dark:hover:border-emerald-500/60'} focus:outline-none"
		onclick={() => (open ? (open = false) : openList())}
		onkeydown={handleTriggerKeydown}
	>
		<span class="flex min-w-0 items-center gap-2">
			{#if selectedOption?.icon}<span class="material-symbols-outlined !text-[18px] text-emerald-500">{selectedOption.icon}</span>{/if}
			<span class={selectedOption ? 'truncate text-zinc-900 dark:text-zinc-50' : 'truncate text-zinc-400'}>
				{selectedOption?.label ?? placeholder}
			</span>
		</span>
		<span class="material-symbols-outlined !text-[18px] text-zinc-400">expand_more</span>
	</button>

	{#if open}
		<div
			role="listbox"
			aria-labelledby={id}
			class="absolute z-40 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-zinc-200/70 bg-white p-1 shadow-xl shadow-zinc-950/5 dark:border-zinc-800 dark:bg-zinc-900"
		>
			{#each options as option}
				<button
					type="button"
					role="option"
					aria-selected={option.value === value}
					disabled={option.disabled}
					class="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] disabled:cursor-not-allowed disabled:opacity-40 {activeOption?.value === option.value
						? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
						: 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/60'}"
					onmouseenter={() => {
						const index = enabledOptions.findIndex((enabled) => enabled.value === option.value);
						if (index >= 0) highlightedIndex = index;
					}}
					onclick={() => selectOption(option)}
				>
					<span class="flex min-w-0 items-center gap-2">
						{#if option.icon}<span class="material-symbols-outlined !text-[18px]">{option.icon}</span>{/if}
						<span class="truncate">{option.label}</span>
					</span>
					{#if option.value === value}<span class="material-symbols-outlined !text-[18px] text-sky-500">check</span>{/if}
				</button>
			{/each}
		</div>
	{/if}

	{#if error}
		<p id={`${id}-error`} class="mt-1 text-xs text-rose-500">{error}</p>
	{/if}
</div>
```

---

## 6. Hướng Dẫn Tái Sử Dụng Cho AI Khác (Prompt Ingestion Template)

Khi cung cấp tài liệu này cho một AI mới để bắt đầu code giao diện, hãy sử dụng chỉ dẫn (System Instructions) sau:

> **System Instruction cho AI tiếp theo**:
> "Bạn đang kế thừa ngôn ngữ thiết kế **Zen Minimalist x Fresh Tech** từ file `DESIGN.md`. Hãy tuân thủ nghiêm ngặt các quy tắc sau:
> 1. **Framework & Ngôn ngữ**: Sử dụng Svelte 5 và các Runes chính thức (`$props()`, `$state()`, `$derived()`, `$effect()`).
> 2. **Kiểu dáng CSS**: Chỉ sử dụng Tailwind CSS v4. Không viết các thuộc tính CSS tùy biến ad-hoc ngoài các biến chủ đề đã được khai báo ở mục 2.
> 3. **Bảng màu**: Luôn dùng nền trung tính là `bg-zinc-50` (hoặc `bg-zinc-950` ở chế độ tối). Sử dụng Emerald (`emerald-500`) và Sky (`sky-500`) làm các màu điểm nhấn chính.
> 4. **Trải nghiệm**: Áp dụng `.zen-transition` cho tất cả các nút bấm, thẻ và các khối tương tác khi hover.
> 5. **Cơ chế Layout**: Tạo vùng chứa chính dùng `AdminShell` hoặc sử dụng lưới Bento 12 cột cho các trang Dashboard.
> 6. **Khởi tạo linh kiện**: Hãy xem kỹ mã nguồn đặc tả ở mục 5 của `DESIGN.md` để đảm bảo việc viết các linh kiện con như `Button`, `Card`, `Input`, `Table` kế thừa chuẩn xác các thẻ class, thuộc tính `aria-*` và cấu trúc giao tiếp Runes."
