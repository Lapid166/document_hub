# Project-Scoped Rules (DocumentHub)

## Tối ưu hóa Superpowers & Tiết kiệm Token / Thời gian

Để tránh việc hao phí Token quá lớn, thực hiện kiểm thử liên tục làm mất thời gian và gây gián đoạn phiên làm việc, mọi coding agent phải tuân thủ các quy tắc ghi đè (override rules) sau khi làm việc trong dự án này:

1. **Không tự ý sử dụng Subagents**:
   - Tuyệt đối không tự động tạo subagent mới (`invoke_subagent`) trừ khi người dùng yêu cầu trực tiếp. Tất cả các sửa đổi, kiểm tra hoặc lập kế hoạch đều thực hiện trực tiếp trên luồng trò chuyện (conversation) chính.

2. **Tối giản quy trình Test-Driven Development (TDD)**:
   - Không áp dụng chu trình TDD khắt khe (RED-GREEN-REFACTOR) của superpowers một cách bắt buộc.
   - Không tự động chạy lại toàn bộ test suite nhiều lần. Chỉ thực hiện viết test hoặc chạy test một lần duy nhất trước khi hoàn thành tác vụ (bước Verification cuối cùng) hoặc khi người dùng yêu cầu cụ thể.

3. **Bỏ qua Planning Mode cho thay đổi nhỏ**:
   - Đối với các thay đổi nhỏ, sửa đổi giao diện, cấu hình hoặc các tác vụ đơn giản/mang tính chất tìm hiểu, hãy thực hiện trực tiếp vào mã nguồn mà không cần chuyển sang chế độ lập kế hoạch (Planning Mode), không cần viết tệp `implementation_plan.md` hay `task.md`.

4. **Tối ưu hóa các công cụ thao tác tệp**:
   - Hạn chế việc đọc hoặc ghi đè toàn bộ nội dung tệp tin lớn. Ưu tiên sử dụng công cụ `replace_file_content` hoặc `multi_replace_file_content` để chỉnh sửa cục bộ tại những vị trí cần thiết nhằm giữ cho kích thước ngữ cảnh hội thoại (Context Window) luôn nhỏ gọn.
