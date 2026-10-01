## 📌 Thông Tin Pull Request
- **Mã Task / User Story Jira:** CRP-XX
- **Người thực hiện:** @username
- **Nhánh đích (Base branch):** `develop`

---

## 🛠️ Chi Tiết Thay Đổi (Changes)
<!-- Mô tả ngắn gọn 2-4 gạch đầu dòng những gì bạn đã làm -->
- [ ] Thêm mới / cập nhật API: `METHOD /api/v1/...`
- [ ] Thêm / cập nhật DTO hoặc Entity
- [ ] Cập nhật phân quyền trong `SecurityConfig` (nếu có)
- [ ] Cập nhật giao diện Frontend (nếu có)

---

## 🧪 Kết Quả Kiểm Thử (Testing & Verification)
<!-- Đánh dấu kiểm tra trước khi gửi PR -->
- [ ] Đã chạy `cd backend; .\mvnw.cmd test` và đạt **BUILD SUCCESS (103/103 tests pass)**
- [ ] Đã kiểm thử chức năng trực tiếp qua Postman hoặc Web giao diện (port 3000)

---

## ⚠️ Checklist An Toàn (Bắt Buộc)
- [ ] Đã kéo `develop` mới nhất về nhánh trước khi tạo PR (`git pull origin develop`)
- [ ] Không có file rác, file `.log`, file cache IDE (`.idea/`, `.vscode/`)
- [ ] Không commit mật khẩu, JWT Secret hay thông tin bảo mật nhạy cảm
