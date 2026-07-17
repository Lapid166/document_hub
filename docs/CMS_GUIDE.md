# Hướng Dẫn Vận Hành CMS & Bàn Điều Khiển AI Console (CMS_GUIDE.md)

Tài liệu này cung cấp hướng dẫn vận hành chi tiết dành cho **Content Editor (Biên tập viên nội dung)**, **AI Ops (Quản trị AI)**, và **Super Admin (Quản trị hệ thống)** trên phân hệ quản trị của **DocumentHub (HUB-SYSTEM)**.

---

## 1. Phân Vai Hệ Thống & Phạm Vi Công Việc

Hệ thống phân chia quyền hạn dựa trên hành động thực tế (RBAC Permissions) để đảm bảo tính an toàn dữ liệu:

*   **Super Admin:**
    *   Toàn quyền kiểm soát hệ thống.
    *   Quản lý tài khoản người dùng, phân vai trò, Enforce chính sách 2FA.
    *   Cấu hình các API Providers (OpenAI/Anthropic) và mã hóa API Keys.
    *   Thực hiện sao lưu (Backup) và khôi phục (Restore) cơ sở dữ liệu.
*   **Content Editor:**
    *   Tải tài liệu thô lên hệ thống (Markdown, PDF, TXT).
    *   Soạn thảo tài liệu thông qua trình soạn thảo Markdown tích hợp.
    *   Sử dụng giao diện **Diff Viewer** để so sánh và phê duyệt các nội dung do AI tự động sinh ra (Giới thiệu, Hướng dẫn chi tiết, danh sách FAQs).
    *   Thực hiện xuất bản (Publish) hoặc hoàn tác phiên bản (Rollback) nội dung công khai.
*   **AI Ops (Quản trị AI):**
    *   Cấu hình Prompts hệ thống cho các Agent con trong Multi-Agent Topology.
    *   Tinh chỉnh các tham số kỹ thuật: `temperature`, `similarity_threshold` (ngưỡng recall tìm kiếm ngữ nghĩa).
    *   Giám sát FinOps: theo dõi lưu lượng token tiêu thụ và chi phí USD phát sinh thực tế.
    *   Quản lý bộ nhớ Vector: theo dõi các index và xử lý các Dead Letter Jobs.

---

## 2. Quy Trình Vòng Đời Nội Dung (Content Lifecycle Workflow)

Mọi nội dung xuất bản lên DocumentHub bắt buộc phải đi qua quy trình kiểm duyệt nghiêm ngặt "Draft-First" để loại bỏ hoàn toàn các lỗi sai lệch tri thức (AI Hallucinations):

```text
[Tải tài liệu lên] ──► [AI quét rò rỉ Keys & Malware] ──► [AI Ops tạo bản Draft tự động]
                                                                    │
┌───────────────────────────────────────────────────────────────────┘
▼
[Giao diện Diff Viewer] ──► [Content Editor duyệt/sửa] ──► [Atomic Transaction Publish]
                                                                    │
                                                                    ▼
                                                       [Cập nhật Trang Public & Index Vector]
```

### Các Bước Thực Hiện Chi Tiết:

1.  **Bước 1: Tải tài liệu nguồn lên:** Content Editor vào mục **Document Library**, chọn tải lên file Markdown, Text hoặc PDF của công cụ tương ứng. Hệ thống tự động quét virus và quét rò rỉ API Keys (Secret Scan).
2.  **Bước 2: AI đề xuất nội dung:** Designer Agent tự động sinh Icon SVG, Content Creator Agent tự tạo phần giới thiệu ngắn, hướng dẫn sử dụng và bộ câu hỏi thường gặp (FAQ). Toàn bộ nội dung này được ghi vào bảng `tool_contents` dưới trạng thái `DRAFT`.
3.  **Bước 3: Đối chiếu qua Diff Viewer:** Biên tập viên vào trang `cms/edit/[id]` để xem giao diện split-view. Phía bên trái hiển thị nội dung đang active trên production (nếu có), phía bên phải hiển thị bản nháp do AI đề xuất. Biên tập viên chỉnh sửa thủ công các chi tiết sai lệch trực tiếp trên giao diện.
4.  **Bước 4: Xuất bản đồng bộ (Atomic Publish):** Khi nhấn "Publish", hệ thống thực hiện một transaction duy nhất trong cơ sở dữ liệu:
    *   Cập nhật phiên bản hoạt động hiện tại (`is_current_active = true`).
    *   Kích hoạt các vector embeddings tương ứng của phiên bản mới trong bảng `tool_knowledge_vectors`.
    *   Đánh dấu các vector của phiên bản cũ là `is_deprecated = true`.
    *   Nếu có bất kỳ lỗi nào xảy ra trong quá trình index hoặc lưu trữ, toàn bộ tiến trình sẽ được rollback để tránh tình trạng hiển thị lỗi trên trang công khai.

---

## 3. Quản Trị AI Console (Dành Cho AI Ops)

Giao diện **AI Console** cung cấp các công cụ để giám sát và tinh chỉnh hoạt động của mô hình AI:

### 3.1 Tinh Chỉnh Prompts & Cấu Hình Agent
*   AI Ops có thể chỉnh sửa System Prompt của từng Agent thông qua bảng điều khiển.
*   **Version Control cho Prompts:** Hệ thống ghi lại lịch sử chỉnh sửa prompt (`ai_prompt_versions`). Khi deploy một prompt mới, hệ thống sẽ lưu vết phiên bản cũ để cho phép rollback tức thì nếu prompt mới hoạt động không hiệu quả (ví dụ: gây lỗi định dạng hoặc tăng tỷ lệ từ chối trả lời).

### 3.2 Tinh Chỉnh Tham Số RAG (Retrieval-Augmented Generation)
*   **Similarity Threshold (Ngưỡng tương đồng):** Điều chỉnh độ nhạy khi tìm kiếm vector trong database. Nếu đặt ngưỡng quá cao, RAG Agent có thể từ chối trả lời do không tìm thấy chunk phù hợp (Under-recall). Nếu đặt quá thấp, RAG Agent có thể lấy cả các chunk không liên quan gây nhiễu ngữ cảnh (Noise).
*   **Rerank Configurations:** Bật/tắt tầng Cross-Encoder Reranker để tối ưu hóa thứ tự ưu tiên của tài liệu tham chiếu trước khi đưa vào LLM.

---

## 4. Quy Trình Ứng Phó Sự Cố (Incident Response Playbook)

Dành cho Super Admin và AI Ops khi hệ thống gặp các lỗi vận hành hoặc bảo mật khẩn cấp:

### 🛠️ Sự cố 1: Rò rỉ API Key của LLM
1.  **Hành động tức thì:** Vào trang **AI Console > Providers**, xóa API Key hiện tại hoặc nhập API Key rác để ngắt toàn bộ kết nối gọi LLM.
2.  **Thu hồi khóa gốc:** Truy cập bảng điều khiển của nhà cung cấp LLM (OpenAI/Anthropic Console), thực hiện revoke khóa bị rò rỉ.
3.  **Rotate khóa:** Tạo khóa mới tại LLM Console, quay lại DocumentHub Admin Console nhập khóa mới để hệ thống tự động mã hóa AES-256-GCM và cập nhật.
4.  **Kiểm tra logs:** Tra cứu bảng `audit_logs` để tìm kiếm lịch sử giải mã khóa trong thời gian xảy ra rò rỉ để xác định phạm vi ảnh hưởng.

### 💸 Sự cố 2: Chi phí Token tăng đột biến (Spike)
1.  **Hành động tức thì:** Bật cơ chế ngắt tự động (Circuit Breaker) cho các công cụ bị spam bằng cách hạ hạn mức token ngày của Agent đó về 0 trong bảng `ai_rules`.
2.  **Kích hoạt Turnstile:** Kiểm tra và cấu hình Cloudflare Turnstile ở chế độ thách thức cao (High Challenge Mode) để chặn đứng các bot spam vượt qua tầng rate-limit.
3.  **Hạ Quota Người Dùng:** Hạ quota câu hỏi hàng ngày của End User từ 20 câu xuống mức thấp hơn (e.g., 5 câu/ngày) để giảm thiểu chi phí trong thời gian điều tra sự cố.
