## 📌 Thông Tin Pull Request
- **Mã Task / User Story:** US-XX / CRP-XX
- **Người thực hiện:** @username
- **Nhánh xuất phát (Head branch):** `feature/...` hoặc `fix/...`
- **Nhánh đích (Base branch):** `develop` *(Chỉ chọn `main` khi tạo PR Release từ develop)*
- **Loại thay đổi (Type of change):**
  - [ ] `feat`: Tính năng mới
  - [ ] `fix`: Sửa lỗi (Bug fix)
  - [ ] `refactor`: Tái cấu trúc mã nguồn (không đổi logic)
  - [ ] `test`: Thêm hoặc cập nhật bài kiểm thử
  - [ ] `docs` / `chore`: Tài liệu hoặc cấu hình hệ thống

---

## 🛠️ Chi Tiết Thay Đổi (Changes)
<!-- Tóm tắt ngắn gọn 3-5 gạch đầu dòng những điểm chính đã thay đổi -->
- Thêm/Sửa API: `METHOD /api/v1/...`
- Thay đổi DTO / Entity / Repository: `...`
- Cập nhật phân quyền `SecurityConfig` (nếu có): `...`
- Cập nhật logic giao diện Web Frontend: `...`

---

## 🧪 Kết Quả Kiểm Thử (Testing & Verification)
<!-- Đánh dấu hoàn thành sau khi đã kiểm tra tại máy local -->
- [ ] **Backend Unit Tests:** Đã chạy `cd backend; .\mvnw.cmd test` và đạt **BUILD SUCCESS (150/150 tests PASS)**.
- [ ] **Frontend Syntax Check:** Đã kiểm tra không có lỗi cú pháp JavaScript trên Console trình duyệt (`node -c frontend/js/*.js`).
- [ ] **Manual E2E Test:** Đã test thực tế trên giao diện (`http://localhost:3000`) và API hoạt động đúng kịch bản.

### 📸 Bằng Chứng Hoạt Động (Screenshots / Evidence)
<!-- BẮT BUỘC: Đính kèm 1-2 ảnh chụp màn hình UI hoặc kết quả Postman / Test Console minh chứng tính năng đã chạy thành công -->
> *(Kéo thả ảnh hoặc dán link ảnh vào đây)*

---

## ⚠️ Checklist An Toàn & Chống Ghi Đè Code (BẮT BUỘC)
- [ ] **Đồng bộ nhánh:** Đã kéo code mới nhất từ `develop` về nhánh của mình trước khi push (`git pull origin develop`).
- [ ] **Giải quyết xung đột:** Nếu có merge conflict, đã tự giải quyết cẩn thận và **tuyệt đối không ghi đè/xóa mất code của đồng đội**.
- [ ] **Đúng phạm vi:** Không sửa đổi các tệp ngoài phạm vi nhiệm vụ được phân công.
- [ ] **Dọn dẹp mã nguồn:** Đã xóa các lệnh `console.log` debug rác, không commit file `.log` hoặc cache IDE (`.idea/`, `.vscode/`).
- [ ] **Bảo mật:** Không commit API Key, Google OAuth Secret, JWT Secret hoặc mật khẩu cơ sở dữ liệu.
