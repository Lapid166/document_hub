# DocumentHub (HUB-SYSTEM)

[![Version](https://img.shields.io/badge/version-2.3.0-emerald.svg)](CHANGELOG.md)
[![License](https://img.shields.io/badge/license-Enterprise-blue.svg)](#)
[![Stack](https://img.shields.io/badge/tech-SvelteKit%205%20%7C%20Tailwind%20v4%20%7C%20Postgres-sky.svg)](#)

DocumentHub (HUB-SYSTEM) là giải pháp cổng thông tin (Portal) và hệ thống quản trị nội dung (CMS) thông minh, được thiết kế để quản lý tập trung, giới thiệu và tương tác trực quan với các công cụ/dự án nội bộ của doanh nghiệp. Hệ thống tích hợp các tác vụ AI tự động (RAG, Agentic Workflows) và cơ chế kiểm duyệt nghiêm ngặt để tối ưu hóa quy trình vận hành và nâng cao trải nghiệm người dùng cuối.

---

## 🚀 Các Tính Năng Cốt Lõi

*   **Showcase Store (Khám Phá Công Cụ):** Giao diện hiển thị danh mục dự án nội bộ trực quan (phong cách WordPress Plugin Store), hỗ trợ tìm kiếm toàn văn (full-text search), lọc phân loại (category chips), phân trang và kiểm soát hiển thị (public, internal, restricted).
*   **Hỏi Đáp RAG AI Thông Minh:** Mỗi dự án có một trợ lý ảo riêng hỗ trợ giải đáp thắc mắc của người dùng cuối dựa trên cơ sở tài liệu được số hóa vào Vector Database.
*   **Vòng Đời Nội Dung An Toàn (Draft-First):** Cơ chế chống ghi đè tự động của AI. Mọi nội dung do AI sinh ra (tóm tắt, hướng dẫn, SEO, SVG Icon) đều được lưu ở dạng bản nháp (`DRAFT`) và hiển thị qua giao diện so sánh trực quan (`Diff Viewer`) chờ Content Editor phê duyệt thủ công trước khi xuất bản.
*   **Hệ Thống Đa Agent (Multi-Agent Topology):** Sự phối hợp nhịp nhàng giữa các Agent chuyên biệt (Orchestrator, Content Creator, QA/RAG, Designer, SEO, Changelog, Knowledge Refresh) để tự động hóa tối đa quy trình xử lý nội dung.
*   **Bảo Mật Hạng Doanh Nghiệp:** Phân quyền chi tiết dạng Permission-based (RBAC), chính sách Email Domain Allowlist, xác thực hai lớp TOTP (2FA), quét phát hiện mã độc/API Keys nhạy cảm (Secret Scan) và lớp bảo vệ chống lạm dụng chi phí Token (Token Circuit Breaker).

---

## 🛠️ Công Nghệ Sử Dụng

Hệ thống được phát triển trên nền tảng các công nghệ hiện đại và tối ưu nhất:

*   **Framework:** [SvelteKit 5](https://svelte.dev/) (sử dụng cơ chế Runes `$state`, `$derived`, `$effect` và Snippets).
*   **Styling & Design System:** [Tailwind CSS v4](https://tailwindcss.com/) (Triết lý thiết kế **Zen Minimalist x Fresh Tech**).
*   **Cơ Sở Dữ Liệu:** [PostgreSQL](https://www.postgresql.org/) kết hợp extension [pgvector](https://github.com/pgvector/pgvector) để lưu trữ và truy vấn vector tương đồng phục vụ RAG.
*   **ORM:** [Drizzle ORM](https://orm.drizzle.team/) và `drizzle-kit` cho việc quản lý migrations.
*   **AI Integration:** OpenAI/Anthropic SDKs với cơ chế **Native Tool Calling** (MCP-inspired Context Router).
*   **Text Editor:** [Milkdown](https://milkdown.dev/) WYSIWYG Markdown Editor dành cho CMS.

---

## 📁 Cấu Trúc Thư Mục Dự Án

```text
document-hub/
├── db/                       # Cấu hình database, schemas & migrations Drizzle
├── docs/                     # Tài liệu hướng dẫn & tài liệu thiết kế hệ thống
│   ├── ARCHITECTURE.md       # Tài liệu chi tiết kiến trúc kỹ thuật & RAG
│   ├── SECURITY.md           # Đặc tả các cơ chế bảo mật & chống lạm dụng chi phí
│   └── CMS_GUIDE.md          # Hướng dẫn vận hành CMS dành cho Admin & AI Ops
├── src/
│   ├── lib/                  # Các thư viện dùng chung cho toàn dự án
│   │   ├── components/       # Các UI Components dùng chung (Card, Button, Table, ChatWidget...)
│   │   └── server/           # Logic backend (Crypto, Sanitizer, Secret Scanner, Context Router)
│   └── routes/               # Cấu trúc Routing của SvelteKit
│       ├── (client)/         # Routing trang công khai (SSR tối ưu SEO)
│       └── (admin)/          # Routing trang quản trị CMS & AI Console (CSR + Auth)
├── static/                   # Assets tĩnh (logo, fonts, icons)
├── tests/                    # Bộ kiểm thử tích hợp & Unit Tests
├── docker-compose.yml        # Cấu hình khởi chạy môi trường sản xuất qua Docker
├── package.json              # Khai báo dependencies và các scripts điều khiển
└── tsconfig.json             # Cấu hình TypeScript của dự án
```

---

## ⚙️ Hướng Dẫn Cài Đặt & Chạy Dự Án

### Yêu Cầu Hệ Thống
*   Node.js v20+ hoặc v22+
*   PostgreSQL v16+ (đã kích hoạt extension `pgvector`)
*   Hoặc Docker & Docker Compose

### 1. Khởi Tạo Môi Trường
Sao chép file cấu hình môi trường và cập nhật các thông số cần thiết (API Keys, Database Credentials, S3 Configurations):
```bash
cp .env.example .env
```

Các biến môi trường quan trọng cần cấu hình:
*   `DATABASE_URL`: Đường dẫn kết nối PostgreSQL.
*   `ENCRYPTION_KEY`: Khóa AES-256-GCM dùng để mã hóa API Keys của các Provider.
*   `JWT_SECRET`: Khóa ký JWT cho các sessions.
*   `S3_GATEWAY_PRIVATE_KEY`: Khóa bảo vệ API Storage Gateway.

### 2. Cài Đặt Dependencies
```bash
npm install
```

### 3. Đồng Bộ Cơ Sở Dữ Liệu
Chạy migrations để tạo các bảng dữ liệu:
```bash
npx drizzle-kit push
```

### 4. Khởi Chạy Chế Độ Phát Triển (Local Development)
```bash
npm run dev
```
Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:5173`.

### 5. Khởi Chạy Môi Trường Sản Xuất (Docker Compose)
Dự án được khuyến cáo khởi chạy trên hạ tầng Docker self-hosted để đảm bảo luồng streaming SSE (Server-Sent Events) hoạt động ổn định không bị timeout:
```bash
docker-compose up -d --build
```

---

## 📚 Bộ Tài Liệu Kỹ Thuật Chi Tiết

Để hiểu rõ hơn về hệ thống, hãy tham khảo các tài liệu chuyên sâu dưới đây:

*   📖 **[Kiến Trúc Hệ Thống (ARCHITECTURE.md)](docs/ARCHITECTURE.md):** Luồng dữ liệu, Context Router, pgvector HNSW, Multi-Agent Topology.
*   🛡️ **[Chính Sách Bảo Mật & Chi Phí (SECURITY.md)](docs/SECURITY.md):** RBAC, 2FA, Secret Scanning, SVG Sanitization, Token Circuit Breaker.
*   💻 **[Hướng Dẫn Vận Hành CMS (CMS_GUIDE.md)](docs/CMS_GUIDE.md):** Content Lifecycle, Diff Viewer, Prompts Management, Incident Response.
*   📝 **[Lịch Sử Phiên Bản (CHANGELOG.md)](CHANGELOG.md):** Lịch sử các đợt phát hành và hardening hệ thống.

---

## 📄 Bản Quyền & Giấy Phép
Dự án được bảo hộ và phân phối nội bộ dưới dạng **Enterprise Proprietary License**. Mọi sao chép hoặc phân phối ra ngoài hệ thống doanh nghiệp khi chưa được phê duyệt đều bị nghiêm cấm.
