# SvelteKit Project Initialization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Initialize a new SvelteKit skeleton project configured with Tailwind CSS v4, Montserrat local fonts, Flowbite Svelte components, Iconify Lucide icons, and workspace MCP configurations.

**Architecture:** Initialize a standard SvelteKit TypeScript skeleton, then install Tailwind CSS v4 alongside its official Vite plugin. Configure the global `src/app.css` to manage Montserrat fonts locally (via `@fontsource/montserrat`), use `@iconify/tailwind4` for CSS-only Lucide icons, and use `@plugin "flowbite/plugin"` and `@source` for Flowbite Svelte compilation.

**Tech Stack:** SvelteKit 2, Svelte 5, TypeScript, Tailwind CSS v4, Flowbite Svelte, `@iconify/tailwind4`, `@fontsource/montserrat`.

## Global Constraints

*   Use Svelte 5 runes (`$state`, `$derived`, `$props`) instead of Svelte 4 reactivity syntax.
*   Do not create any `tailwind.config.js` or `postcss.config.js` file; use Tailwind v4 CSS-native imports and configuration.
*   Montserrat fonts must be loaded locally from `@fontsource/montserrat` (injected during bundle time) rather than external CDNs.
*   All file links in the final outputs must use valid clickable `file://` URLs.

---

### Task 1: SvelteKit Project Scaffolding

**Files:**
*   Create: SvelteKit project skeleton in `c:/Users/lopi/Documents/DocumentHub/`
*   Modify: `c:/Users/lopi/Documents/DocumentHub/package.json`

**Interfaces:**
*   Produces: Core SvelteKit workspace folder, tsconfig, svelte.config.js, and package.json.

- [ ] **Step 1: Scaffolding the project**

Run Svelte CLI to create a skeleton TypeScript project with ESLint and Prettier, bypassing interactive prompts and checking empty directory status:
Run:
```powershell
npx -y sv create ./ --template minimal --types ts --add eslint prettier --install npm --no-add-ons --no-dir-check
```
Expected: The workspace is populated with SvelteKit files and directories, and `package.json` is created.

- [ ] **Step 2: Run npm install to verify clean installation**

Run:
```powershell
npm install
```
Expected: Installs all baseline devDependencies without errors.

- [ ] **Step 3: Initial Commit**

Run:
```powershell
git add .
git commit -m "chore: scaffold initial sveltekit typescript skeleton with eslint and prettier"
```
Expected: Files successfully committed to the git repository.

---

### Task 2: Install Styling, UI, and Icon Dependencies

**Files:**
*   Modify: `c:/Users/lopi/Documents/DocumentHub/package.json`

**Interfaces:**
*   Consumes: Package manager workspace created in Task 1.
*   Produces: Dependencies and devDependencies for Tailwind v4, Montserrat, and Flowbite Svelte.

- [ ] **Step 1: Install production dependencies**

Install Flowbite Svelte, Flowbite, and Montserrat fontsource packages:
Run:
```powershell
npm install @fontsource/montserrat flowbite-svelte flowbite
```
Expected: Packages installed successfully.

- [ ] **Step 2: Install development dependencies**

Install Tailwind CSS v4, Tailwind Vite plugin, Iconify Tailwind plugin, and Lucide icons set:
Run:
```powershell
npm install -D tailwindcss @tailwindcss/vite @iconify/tailwind4 @iconify-json/lucide
```
Expected: Tailwind CSS v4 and plugins installed successfully.

- [ ] **Step 3: Commit dependency changes**

Run:
```powershell
git add package.json package-lock.json
git commit -m "chore: add tailwindcss v4, flowbite svelte, montserrat local fonts, and iconify dependencies"
```
Expected: Commit success.

---

### Task 3: Configure Tailwind CSS v4 and Flowbite Svelte

**Files:**
*   Modify: `c:/Users/lopi/Documents/DocumentHub/vite.config.ts`
*   Create: `c:/Users/lopi/Documents/DocumentHub/src/app.css`
*   Create: `c:/Users/lopi/Documents/DocumentHub/src/routes/+layout.svelte`

**Interfaces:**
*   Consumes: Installed libraries from Task 2.
*   Produces: Tailwind CSS v4 processor hooked into Vite, importing custom font definitions, custom plugins, and style assets.

- [ ] **Step 1: Configure Vite Plugin**

Modify `c:/Users/lopi/Documents/DocumentHub/vite.config.ts` to integrate Tailwind CSS:
Change:
```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()]
});
```
To:
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

- [ ] **Step 2: Create global CSS file**

Create `c:/Users/lopi/Documents/DocumentHub/src/app.css` with Tailwind directives, Montserrat imports, Flowbite plugins, and custom utility classes matching [DESIGN.md](file:///c:/Users/lopi/Documents/DocumentHub/DESIGN.md):
Code:
```css
@import "tailwindcss";
@plugin "@iconify/tailwind4";
@plugin "flowbite/plugin";

/* Import local Montserrat font weights */
@import "@fontsource/montserrat/300.css";
@import "@fontsource/montserrat/400.css";
@import "@fontsource/montserrat/500.css";
@import "@fontsource/montserrat/600.css";
@import "@fontsource/montserrat/700.css";

/* Tell Tailwind where to scan for Flowbite Svelte classes */
@source "../node_modules/flowbite-svelte/dist";

@theme {
  --font-sans: 'Montserrat', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --ease-zen: cubic-bezier(0.25, 1, 0.5, 1);
  --shadow-zen: 0 8px 30px rgba(24, 24, 27, 0.06);
}

/* Dark mode configuration for Flowbite */
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

- [ ] **Step 3: Create global Svelte layout**

Create `c:/Users/lopi/Documents/DocumentHub/src/routes/+layout.svelte` to import the CSS file globally:
Code:
```svelte
<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

{@render children()}
```

- [ ] **Step 4: Commit style configurations**

Run:
```powershell
git add vite.config.ts src/app.css src/routes/+layout.svelte
git commit -m "feat: configure tailwind v4, flowbite, and local montserrat in global styles"
```
Expected: Styling setup successfully committed.

---

### Task 4: Configure App HTML Template

**Files:**
*   Modify: `c:/Users/lopi/Documents/DocumentHub/src/app.html`

**Interfaces:**
*   Consumes: Default SvelteKit app.html.
*   Produces: Customized HTML app body container.

- [ ] **Step 1: Modify app.html template**

Overwrite `c:/Users/lopi/Documents/DocumentHub/src/app.html` to apply local layout rules and body styling:
Code:
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

- [ ] **Step 2: Commit template changes**

Run:
```powershell
git add src/app.html
git commit -m "feat: update app.html template with base styling and vietnamese language config"
```
Expected: Commit success.

---

### Task 5: Configure MCP for Google Antigravity & Codex

**Files:**
*   Create: `c:/Users/lopi/Documents/DocumentHub/.agents/mcp_config.json`

**Interfaces:**
*   Produces: Local workspace-specific MCP setup enabling tool access to Flowbite Svelte.

- [ ] **Step 1: Create MCP configuration file**

Create the `.agents` directory and the `mcp_config.json` file at `c:/Users/lopi/Documents/DocumentHub/.agents/mcp_config.json`:
Code:
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

- [ ] **Step 2: Commit MCP configuration**

Run:
```powershell
git add .agents/mcp_config.json
git commit -m "chore: add workspace mcp configuration for flowbite-svelte"
```
Expected: Commit success.

---

### Task 6: Add Sample Component & Verify Project Build

**Files:**
*   Create: `c:/Users/lopi/Documents/DocumentHub/src/routes/+page.svelte`

**Interfaces:**
*   Consumes: Global layout structure.
*   Produces: A working index page demonstrating Flowbite Svelte integration and Iconify Lucide icons.

- [ ] **Step 1: Create testing index page**

Create `c:/Users/lopi/Documents/DocumentHub/src/routes/+page.svelte` containing Flowbite components, Montserrat font styling, and Lucide icons:
Code:
```svelte
<script lang="ts">
	import { Button, Accordion, AccordionItem } from 'flowbite-svelte';
</script>

<main class="max-w-4xl mx-auto p-8 flex flex-col gap-8 relative overflow-hidden">
	<!-- Background Blobs -->
	<div class="zen-glow-emerald w-72 h-72 top-10 left-10"></div>
	<div class="zen-glow-sky w-72 h-72 bottom-10 right-10"></div>

	<header class="flex flex-col gap-2">
		<h1 class="text-4xl font-bold tracking-tight zen-gradient-text font-sans">
			DocumentHub
		</h1>
		<p class="text-zinc-500 dark:text-zinc-400">
			Dự án đã được cấu hình thành công với SvelteKit, Tailwind CSS v4, Montserrat và Flowbite Svelte.
		</p>
	</header>

	<section class="flex flex-wrap gap-4 items-center">
		<!-- Test Flowbite Svelte Button with Iconify Lucide Icon -->
		<Button color="emerald" class="inline-flex items-center gap-2 rounded-xl zen-transition">
			<span class="icon-[lucide--sparkles] w-5 h-5"></span>
			<span>Khởi động dự án</span>
		</Button>
		
		<Button color="alternative" class="inline-flex items-center gap-2 rounded-xl border-zinc-200 dark:border-zinc-800 zen-transition">
			<span class="icon-[lucide--settings] w-5 h-5"></span>
			<span>Cấu hình MCP</span>
		</Button>
	</section>

	<section class="border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-sm">
		<h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
			<span class="icon-[lucide--info] text-sky-500 w-5 h-5"></span>
			<span>Kiểm thử Accordion (Flowbite)</span>
		</h2>
		
		<Accordion>
			<AccordionItem open>
				<span slot="header">Montserrat & Styles</span>
				<p class="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans font-light">
					Phông chữ Montserrat đã được tích hợp trực tiếp vào tài sản cục bộ thông qua `@fontsource/montserrat`. Hãy kiểm tra tab Network để xem tệp tin font `.woff2` được tải từ localhost.
				</p>
			</AccordionItem>
			<AccordionItem>
				<span slot="header">Iconify CSS Icons</span>
				<p class="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
					Các biểu tượng được kết xuất trực tiếp dưới dạng lớp CSS thông qua plugin `@iconify/tailwind4`. Chỉ các biểu tượng được sử dụng mới được đưa vào bundle CSS của ứng dụng.
				</p>
			</AccordionItem>
		</Accordion>
	</section>
</main>
```

- [ ] **Step 2: Run build to verify correct configuration**

Run:
```powershell
npm run build
```
Expected: The SvelteKit application builds successfully into the `.svelte-kit` and output directory without any TypeScript or Tailwind compilation errors.

- [ ] **Step 3: Commit verification page**

Run:
```powershell
git add src/routes/+page.svelte
git commit -m "feat: add index verification page using flowbite svelte and css-only lucide icons"
```
Expected: Verification page committed successfully.
