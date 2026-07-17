# Changelog

Tất cả các thay đổi quan trọng đối với dự án **DocumentHub (HUB-SYSTEM)** sẽ được tài liệu hóa chi tiết trong tệp này. Định dạng tuân thủ các nguyên tắc của [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) và tuân thủ định dạng Semantic Versioning [SemVer](https://semver.org/spec/v2.0.0.html).

---

## [2.3.0] - 2026-07-17
### 🚀 Cải Tiến & Bảo Mật Hệ Thống (Production Hardening)
Bản cập nhật này tập trung thắt chặt an ninh hệ thống, kiểm soát chi phí gọi AI, nâng cao độ tin cậy của luồng RAG và bổ sung bộ kiểm thử nghiệm thu nâng cao cho môi trường sản xuất.

#### 🛡️ Xác Thực & Quản Lý Quyền Hạn (Identity & Access Control)
*   **TOTP 2FA:** Tích hợp cơ chế xác thực hai lớp dựa trên mã TOTP thông qua Google Authenticator hoặc Authy, hỗ trợ bật/tắt trong User Profile và hiển thị mã phục hồi (Recovery Codes) một lần.
*   **Domain Allowlist:** Ràng buộc đăng ký tài khoản bắt buộc phải có email thuộc danh sách tên miền được phê duyệt (`allowed_email_domains`).
*   **Mã Hóa API Key:** Toàn bộ API Key của nhà cung cấp LLM đều được mã hóa bằng thuật toán AES-256-GCM ở tầng ứng dụng trước khi ghi vào cơ sở dữ liệu.
*   **Permission-based RBAC:** Chuyển đổi mô hình phân quyền dạng vai trò (Role) cứng sang hệ thống quyền chi tiết dựa trên chuỗi định danh (e.g., `users:create`, `tools:publish`, `ai:prompt:deploy`).

#### 📦 Vận Hành RAG & AI Safety
*   **Hạn Ngạch Chat Hàng Ngày (Chat Daily Quota):** Áp dụng giới hạn cứng đối với người dùng cuối, tối đa cho phép thực hiện 20 câu hỏi/ngày để ngăn ngừa spam bot và lạm dụng chi phí token.
*   **RAG Safety Defense:** Cấu hình System Prompt của QA Agent chặn hoàn toàn các nỗ lực tấn công "RAG prompt injection" (ví dụ: tài liệu chứa câu lệnh ẩn ép buộc bỏ qua lệnh trước đó). Hệ thống chỉ coi văn bản truy xuất là dữ liệu thô để tham chiếu thông tin.
*   **Citation-first Policy:** Mọi câu trả lời của AI bắt buộc phải đính kèm trích dẫn đường dẫn tiêu đề Markdown (`heading_path`) hoặc số thứ tự chunk văn bản.
*   **Vector Search & Reranking:** Bổ sung bước Rerank qua Cross-Encoder API sau khi thực hiện tìm kiếm ANN trên `pgvector`, cải thiện độ chính xác và giảm thiểu hiện tượng Under-return khi tài liệu của namespace có quy mô nhỏ.

#### ⚙️ Hạ Tầng & Quy Trình Bất Đồng Bộ
*   **S3 Storage Gateway:** Xây dựng cổng trung gian Gateway API điều phối tệp tin tải lên, hỗ trợ ký URL tải lên và lưu trữ an toàn. Tránh tương tác trực tiếp từ client lên S3.
*   **Job Queue Idempotency:** Áp dụng cơ chế khoá trùng lặp (idempotency key) dựa trên mã băm (`chunk_hash`) trong các job xử lý vector, loại bỏ tình trạng nhân bản vector khi các Worker thực hiện thử lại (retry).
*   **Dead Letter Queue (DLQ):** Tách biệt các tác vụ nền bị lỗi vượt quá số lần cấu hình tối đa (`max_attempts`) sang bảng quản lý riêng biệt (`dead_letter_jobs`) để AI Ops dễ dàng theo dõi.
*   **Bộ Kiểm Thử Nghiệm Thu (QA Suite):** Bổ sung 32 bài kiểm thử tự động và thủ công bao quát toàn bộ các kịch bản lỗi, bypass RBAC, rò rỉ secret và rollback dữ liệu.

---

## [2.0.0] - 2026-06-25
### 🤖 Tích Hợp AI Agent & Cơ Sở Dữ Liệu Vector (Agentic RAG Release)
Bản cập nhật lớn đánh dấu bước chuyển mình của DocumentHub từ một cổng thông tin tĩnh thành hệ thống hỗ trợ thông minh với kiến trúc RAG tích hợp sâu.

#### 🧠 Tích Hợp PostgreSQL + pgvector
*   **pgvector Extension:** Tích hợp trực tiếp pgvector vào cơ sở dữ liệu PostgreSQL hiện hữu.
*   **HNSW Indexing:** Thiết lập thuật toán chỉ mục Hierarchical Navigable Small World trên cột embedding để tăng tốc truy vấn tương đồng ngữ nghĩa.
*   **Structural Chunking:** Áp dụng chiến lược cắt nhỏ văn bản dựa trên phân đoạn logic (Heading, Code Block) của Markdown thay vì cắt thô theo ký tự. Thiết lập độ gối đầu overlap ngữ cảnh 10-15%.

#### 👥 Hệ Thống Đa Agent (Multi-Agent Topology)
*   **Orchestrator Agent:** Tiếp nhận yêu cầu của người dùng để phân tích ý định và điều hướng đến Agent con.
*   **QA/RAG Agent:** Trợ lý ảo trả lời câu hỏi trực tiếp trên giao diện công khai thông qua luồng Server-Sent Events (SSE) streaming.
*   **Designer Agent:** Tự động thiết kế Icon SVG đại diện cho dự án dựa trên mô tả ngắn.
*   **SEO Agent & Changelog Agent:** Tối ưu hoá dữ liệu JSON-LD cấu trúc cho SEO và sinh tự động bản so sánh thay đổi văn bản.
*   **Knowledge Refresh Agent:** Chạy nền bất đồng bộ để phân tích và số hóa tài liệu được duyệt thành các vector embeddings.

#### 🖥️ Giao Diện Biên Tập Viên (CMS Enhancements)
*   **Diff Viewer:** Giao diện so sánh song song split-view giúp Content Editor đối chiếu nội dung cũ và bản nháp do AI đề xuất.
*   **Milkdown Editor:** Tích hợp trình soạn thảo WYSIWYG chuyên nghiệp dành cho tài liệu Markdown kỹ thuật.

---

## [1.0.0] - 2026-05-10
### 🎉 Khởi Tạo Dự Án (Initial Release)
Phát hành phiên bản đầu tiên của dự án DocumentHub với các cấu trúc nền tảng cho hệ thống giới thiệu công cụ nội bộ doanh nghiệp.

*   **SvelteKit Stack:** Thiết lập khung ứng dụng với SvelteKit 5, TypeScript và Tailwind CSS v4.
*   **Zen Minimalist Design System:** Định nghĩa hệ thống design tokens với tông Zinc chủ đạo, điểm nhấn Emerald/Sky và cấu trúc đường viền mờ (30-50% opacity).
*   **CMS Administration:** Trang quản trị cơ bản (AdminShell) sử dụng bố cục Bento Grid để quản lý danh sách công cụ và danh mục.
*   **Database Schema:** Thiết lập cấu trúc cơ bản cho bảng `tools`, `users`, `roles`, `sessions` thông qua Drizzle ORM.
