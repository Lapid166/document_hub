# Tài Liệu Đặc Tả Các Cơ Chế Bảo Mật & Chi Phí (SECURITY.md)

Tài liệu này đặc tả chi tiết các giải pháp kỹ thuật và chính sách an ninh thông tin được áp dụng trong **DocumentHub (HUB-SYSTEM)** để bảo vệ hệ thống trước các mối đe dọa an ninh, ngăn ngừa rò rỉ dữ liệu nhạy cảm và kiểm soát chặt chẽ chi phí gọi API của mô hình AI.

---

## 1. Xác Thực & Phân Quyền Chi Tiết (Identity & RBAC)

Hệ thống triển khai mô hình phân quyền dựa trên quyền hạn chi tiết (Permission-based RBAC) kết hợp bảo mật phiên làm việc nghiêm ngặt:

*   **Chính Sách Domain Allowlist:** Người dùng chỉ được phép đăng ký/đăng nhập tài khoản nếu email thuộc danh sách tên miền được cấu hình trong bảng `allowed_email_domains` (ví dụ: `@company.com`).
*   **Bảo Mật Mật Khẩu:** Sử dụng thuật toán `bcrypt` với cost >= 10 để băm mật khẩu. Tuyệt đối không lưu mật khẩu ở dạng plaintext dưới bất kỳ hình thức nào.
*   **Quyền Hạn Dạng String (String-based Permissions):** Mỗi quyền hạn được định nghĩa cụ thể bằng chuỗi ký tự độc lập (e.g., `users:create`, `tools:publish`, `ai:prompt:deploy`, `chat:use`). Quyền hạn được gán vào Vai trò (Role) và có thể được ghi đè (override) trực tiếp cho từng người dùng cụ thể.
*   **Bảo Vệ Phiên Làm Việc (Session Security):**
    *   Session Cookies được thiết lập với các thuộc tính bắt buộc: `HttpOnly` (chống đánh cắp cookie qua mã độc JS), `Secure` (chỉ truyền qua HTTPS) và `SameSite=Lax` hoặc `Strict` (chống tấn công CSRF).
    *   Bắt buộc có token chống tấn công CSRF cho mọi hành động ghi/sửa đổi dữ liệu (Mutation Routes) ở cả Client và Server.
    *   Áp dụng Rate Limiting tại endpoint đăng nhập, tự động khóa tài khoản tạm thời (lockout) trong 15 phút nếu nhập sai mật khẩu 5 lần liên tiếp.

---

## 2. Xác Thực Hai Lớp (Two-Factor Authentication - 2FA)

Hệ thống cung cấp lớp bảo vệ thứ hai cho tất cả các tài khoản quản trị và biên tập viên thông qua mã TOTP:

```text
[Yêu cầu Đăng nhập] ─► [Mật khẩu chính xác?] ─► [Kiểm tra cấu hình 2FA]
                                                      │
                       ┌──────────────────────────────┴───────────────┐
                       ▼ (Đã bật)                                     ▼ (Chưa bật)
             [Yêu cầu nhập mã TOTP]                              [Đăng nhập thành công]
                       │
         ┌─────────────┴─────────────┐
         ▼ (Mã đúng)                 ▼ (Mã sai)
[Đăng nhập thành công]      [Từ chối truy cập]
```

*   **Thuật Toán:** TOTP (Time-based One-time Password) tương thích với Google Authenticator, Authy, Microsoft Authenticator.
*   **Mã Phục Hồi (Recovery Codes):** Khi người dùng kích hoạt 2FA, hệ thống sinh ngẫu nhiên 8 mã phục hồi một lần. Các mã này được băm bằng thuật toán bảo mật trước khi lưu vào bảng `user_recovery_codes` và chỉ hiển thị một lần duy nhất cho người dùng khi thiết lập.
*   **Chính Sách Enforce:** Super Admin có thể cấu hình bắt buộc bật 2FA đối với một số vai trò nhạy cảm (e.g., `super_admin`, `ai_ops`) thông qua cài đặt hệ thống.

---

## 3. Mã Hóa Dữ Liệu Nhạy Cảm (API Key Encryption)

API Keys của các nhà cung cấp mô hình ngôn ngữ lớn (OpenAI, Anthropic) là tài sản nhạy cảm và có chi phí sử dụng cao. Hệ thống áp dụng quy trình mã hóa tầng ứng dụng (Application-Layer Encryption):

*   **Thuật Toán:** Mã hóa đối xứng **AES-256-GCM** (Advanced Encryption Standard trong chế độ Galois/Counter Mode). Mỗi bản ghi sẽ sử dụng một Initialization Vector (IV) và một Authentication Tag ngẫu nhiên để chống tấn công Replay.
*   **Bảo Vệ Khóa Master:** Khóa chính dùng để mã hóa (`ENCRYPTION_KEY`) được lưu trữ tại biến môi trường hệ thống bên ngoài cơ sở dữ liệu và được bảo vệ nghiêm ngặt.
*   **Nguyên Tắc Trả Dữ Liệu (Masking):** Tuyệt đối không trả API Key dạng plaintext về phía Client qua bất kỳ API Endpoint nào. Trên giao diện quản trị, API Key chỉ hiển thị ở dạng che khuất (`sk-••••••••abcd`).
*   **Nhật Ký Gọi Khóa (Audit Log):** Mỗi khi hệ thống giải mã khóa để thực hiện gọi LLM API, một bản ghi nhật ký hoạt động (Audit Log) được ghi nhận kèm mã định danh request (`request_id`), tuyệt đối không ghi nhận chuỗi key đã giải mã vào file logs.

---

## 4. Kiểm Soát Dữ Liệu Đầu Vào (File Processing Pipeline)

Tất cả các tài liệu kỹ thuật do Content Editor upload lên hệ thống đều phải đi qua quy trình kiểm soát đa tầng để ngăn chặn rò rỉ thông tin mật và mã độc:

```text
[Tệp tin tải lên]
      │
      ▼
[Magic Bytes & MIME Validation] (Kiểm tra định dạng thật của tệp tin, từ chối giả mạo)
      │
      ▼
[Quét Rò Rỉ API Keys (Secret Scan)] (Sử dụng Regex quét sk-*, JWT patterns, AWS keys...)
      │   └── Nhận diện nhạy cảm? ──► [Chặn index, yêu cầu Editor Redact thủ công]
      ▼
[SVG Sanitization (Clean Layer)] (Chỉ áp dụng với mã SVG do Designer Agent sinh ra)
      │   └── Loại bỏ các thẻ <script>, attributes on*, hoặc liên kết xlink:href độc hại
      ▼
[Ghi dữ liệu & Index Vector]
```

*   **Giới Hạn Tải Lên:** Giới hạn mặc định tối đa cho một file tải lên là 10MB và tổng dung lượng tài liệu cho một phiên bản công cụ là 50MB.
*   **Chống Lỗ Hổng Stored XSS trong SVG:** Designer Agent khi tạo Icon SVG có thể bị đánh lừa sinh ra mã độc hại. Lớp lọc `sanitizer.ts` ở phía Backend sẽ bóc tách và loại bỏ hoàn toàn các thẻ nguy hại như `<script>`, `<foreignObject>`, hoặc các sự kiện JS (e.g., `onload`, `onclick`) trước khi render lên giao diện người dùng.

---

## 5. Chống Lạm Dụng Chi Phí Gọi AI (Token Cost Management)

Để tránh tình trạng hóa đơn API LLM tăng đột biến do spam bot hoặc người dùng lạm dụng, hệ thống triển khai bộ lọc phòng thủ đa tầng:

*   **Hạn Ngạch Chat Hàng Ngày (Daily Quota):** Mỗi người dùng cuối sau khi đăng nhập chỉ được phép thực hiện tối đa **20 câu hỏi/ngày** cho mục hỏi đáp RAG. Quota được cộng dồn và lưu trữ tại bảng `chat_daily_quotas` theo ngày thực tế.
*   **Định Danh Thiết Bị (Cookie Fingerprinting):** Kết hợp định danh thiết bị thông qua Cookie ký (Signed Cookies) để ngăn chặn hành vi sử dụng tài khoản ảo hoặc tự động tạo tài khoản hàng loạt để lấy thêm quota.
*   **Cloudflare Turnstile:** Tích hợp mã xác thực Captcha Turnstile của Cloudflare tại Widget Chat để chặn đứng 100% các cuộc tấn công spam bằng bot tự động.
*   **Hệ Thống Ngắt Tự Động (Token Circuit Breaker):** AI Ops có thể cấu hình hạn ngạch chi phí Token tối đa theo từng Tool/ngày trong bảng `ai_rules`. Nếu tổng chi phí trong ngày thực tế (được tính toán từ bảng `ai_token_usages`) vượt quá hạn mức, hệ thống sẽ tự động vô hiệu hóa tính năng Chat và hiển thị thông báo bảo trì.
