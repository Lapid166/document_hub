# Spec: Khởi tạo dự án SvelteKit với Flowbite Svelte, Tailwind CSS v4, Montserrat & Hướng dẫn tích hợp MCP

## 1. Mục tiêu (Goals)
Thiết lập nền móng kỹ thuật cho dự án **DocumentHub** sử dụng hệ sinh thái SvelteKit và Svelte 5 mới nhất, đồng bộ hóa hoàn toàn với hệ thống thiết kế *Zen Minimalist x Fresh Tech* quy định tại [DESIGN.md](file:///c:/Users/lopi/Documents/DocumentHub/DESIGN.md), kết hợp thư viện thành phần **Flowbite Svelte** và chuẩn bị cấu hình **MCP (Model Context Protocol)** cho các môi trường AI như Codex và Antigravity.

---

## 2. Đặc tả kỹ thuật (Technical Specifications)

### 2.1 Thành phần dự án
* **Framework**: SvelteKit (Svelte 5 + Runes + TypeScript).
* **UI Component Library**: Flowbite Svelte.
* **Styling**: Tailwind CSS v4 tích hợp trực tiếp qua plugin Vite (`@tailwindcss/vite`).
* **Fonts**: Montserrat (Tải cục bộ, đóng gói trực tiếp vào assets qua gói `@fontsource/montserrat`).
* **Icons**: Iconify Tailwind plugin (`@iconify/tailwind4`) kết hợp gói Lucide (`@iconify-json/lucide`).
* **Linting & Formatting**: ESLint + Prettier.

### 2.2 Tích hợp Flowbite Svelte & Tailwind CSS v4
Vì Tailwind CSS v4 loại bỏ tệp `tailwind.config.js` truyền thống, việc cấu hình thư viện UI như Flowbite Svelte được khai báo trực tiếp trong tệp CSS chính (`src/app.css`) bằng từ khóa `@plugin` và `@source`.

---

## 3. Danh sách thư viện (Dependencies)

### Dependencies chính:
* `svelte` (v5)
* `@sveltejs/kit`
* `@fontsource/montserrat`
* `flowbite-svelte`
* `flowbite`

### devDependencies:
* `tailwindcss` (v4)
* `@tailwindcss/vite`
* `@iconify/tailwind4`
* `@iconify-json/lucide`
* `typescript`, `tslib`
* `eslint`, `prettier`

---

## 4. Cấu trúc cấu hình dự án (Project Configuration)

### 4.1 Cấu hình Vite (`vite.config.ts`)
```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit()
	]
});
```

### 4.2 Cấu hình CSS chính (`src/app.css`)
```css
@import "tailwindcss";
@plugin "@iconify/tailwind4";
@plugin "flowbite/plugin";

/* Nhập phông Montserrat cục bộ */
@import "@fontsource/montserrat/300.css";
@import "@fontsource/montserrat/400.css";
@import "@fontsource/montserrat/500.css";
@import "@fontsource/montserrat/600.css";
@import "@fontsource/montserrat/700.css";

/* Quét các lớp CSS của Flowbite Svelte */
@source "../node_modules/flowbite-svelte/dist";

@theme {
  --font-sans: 'Montserrat', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --ease-zen: cubic-bezier(0.25, 1, 0.5, 1);
  --shadow-zen: 0 8px 30px rgba(24, 24, 27, 0.06);
}

/* Biến thể Dark Mode của Flowbite */
@custom-variant dark (&:where(.dark, .dark *));

/* Custom Utility Classes */
.zen-transition {
  transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}

.zen-gradient-text {
  @apply bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 bg-clip-text text-transparent;
}

.zen-glow-emerald {
  @apply pointer-events-none absolute rounded-full bg-emerald-400/5 blur-[140px] dark:bg-emerald-500/[0.01];
}

.zen-glow-sky {
  @apply pointer-events-none absolute rounded-full bg-sky-400/5 blur-[140px] dark:bg-sky-500/[0.01];
}

/* Custom Scrollbar */
.zen-scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.zen-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.zen-scrollbar::-webkit-scrollbar-thumb {
  @apply rounded-full bg-zinc-200 dark:bg-zinc-800;
}

/* Focus state */
:focus-visible {
  @apply outline-none ring-2 ring-emerald-500/60 ring-offset-2 ring-offset-zinc-50 dark:ring-offset-zinc-950;
}
```

### 4.3 Cấu hình Khung HTML chính (`src/app.html`)
```html
<!DOCTYPE html>
<html lang="vi">
	<head>
		<meta charset="utf-8" />
		<link rel="icon" href="%sveltekit.assets%/favicon.png" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		%sveltekit.head%
	</head>
	<body data-sveltekit-preload-data="hover" class="bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 font-sans antialiased min-h-screen">
		<div style="display: contents">%sveltekit.body%</div>
	</body>
</html>
```

### 4.4 Layout Gốc (`src/routes/+layout.svelte`)
```svelte
<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

{@render children()}
```

---

## 5. Hướng dẫn cấu hình tích hợp MCP cho dự án

Để giúp AI coding assistants hiểu sâu về dự án và thư viện Flowbite Svelte, lập trình viên có thể tích hợp máy chủ MCP (ví dụ: `flowbite-mcp` hoặc `flowbite-svelte-mcp` chính thức) vào các công cụ AI được hỗ trợ:

### 5.1 Tích hợp vào Codex
Codex hỗ trợ tích hợp MCP thông qua tệp cấu hình toàn cục hoặc cấu hình dự án.
* **Cách 1: Tệp cấu hình toàn cục (`~/.codex/config.toml` hoặc `.mcp.json`)**
  Thêm cấu hình máy chủ MCP vào tệp JSON:
  ```json
  {
    "mcpServers": {
      "flowbite-svelte": {
        "command": "npx",
        "args": ["-y", "flowbite-mcp"]
      }
    }
  }
  ```
* **Cách 2: Giao diện trực quan (GUI)**
  1. Vào phần **Settings** (biểu tượng bánh răng) trên Codex.
  2. Chọn tab **Plugins** / **MCP Servers**.
  3. Chọn **Add Server** và điền tên, câu lệnh khởi chạy (`npx`), đối số (`-y flowbite-mcp`).

### 5.2 Tích hợp vào Google Antigravity (Antigravity IDE / App)
Google Antigravity quản lý cấu hình các máy chủ MCP thông qua tệp cấu hình chuyên dụng `mcp_config.json`. Cấu hình này có thể được áp dụng ở cấp độ toàn cục (Global) hoặc cấp độ dự án (Workspace-specific).

* **Cấp độ dự án (Workspace-specific)**:
  Tạo tệp cấu hình `.agents/mcp_config.json` ngay tại thư mục gốc của dự án:
  ```json
  {
    "mcpServers": {
      "flowbite-svelte": {
        "command": "npx",
        "args": ["-y", "flowbite-mcp"]
      }
    }
  }
  ```
* **Cấp độ toàn cục (Global)**:
  Chỉnh sửa trực tiếp tệp cấu hình toàn cục tại đường dẫn:
  * `~/.gemini/config/mcp_config.json` hoặc `~/.gemini/antigravity/mcp_config.json`
* **Cấu hình qua giao diện UI của Antigravity**:
  1. Mở **Agent Panel** hoặc phần cài đặt của Antigravity.
  2. Click vào menu **"..." (ba dấu chấm)** ở góc trên bên phải.
  3. Chọn **"Manage MCP Servers"**.
  4. Chọn **"View raw config"** để mở trực tiếp và chỉnh sửa tệp `mcp_config.json`.

---

## 6. Kế hoạch kiểm chứng (Verification Plan)
1. **Kiểm tra cài đặt**: Đảm bảo toàn bộ dependencies của Flowbite Svelte, `@fontsource/montserrat`, `@iconify/tailwind4` được cài đặt đầy đủ.
2. **Kiểm tra phát triển**: Khởi chạy dự án bằng lệnh `npm run dev` để kiểm tra lỗi biên dịch.
3. **Kiểm tra chức năng giao diện**: Thử nghiệm hiển thị một component từ Flowbite Svelte (ví dụ: `Button` hoặc `Accordion`) để xác thực Tailwind CSS v4 đã quét và biên dịch thành công các lớp CSS từ `node_modules/flowbite-svelte`.
