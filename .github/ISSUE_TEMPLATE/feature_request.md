---
name: "✨ Đề Xuất Tính Năng Mới (Feature Request)"
description: "Đề xuất tính năng, module hoặc mở rộng API mới cho DriveShare"
title: "[FEATURE] <Tên tính năng ngắn gọn>"
labels: ["feature"]
assignees: ["em123ngao-arch"]
---

## 🎯 1. Bài Toán Nghiệp Vụ & Bối Cảnh
<!-- Tính năng này giải quyết vấn đề gì cho Khách thuê, Chủ xe hoặc Quản trị viên? -->

## 🛠️ 2. Thiết Kế Đề Xuất (Technical Design)
- **Module liên quan:** `car` / `rental` / `payment` / `user` / `ai` / `frontend`
- **Endpoints API dự kiến:**
  - `METHOD /api/v1/...`
- **Bảng CSDL / DTO cần thêm hoặc chỉnh sửa:**

## ✅ 3. Tiêu Chí Hoàn Thành (Acceptance Criteria)
- [ ] Xây dựng hoàn chỉnh API backend trả về chuẩn `ApiResponse<T>`.
- [ ] Viết bài Unit Test kiểm thử (kết quả chạy qua `mvn test`).
- [ ] Tích hợp giao diện Frontend và xử lý các trường hợp thành công / lỗi.
- [ ] Không gây hồi quy (regression) làm hỏng 150 tests hiện tại.
