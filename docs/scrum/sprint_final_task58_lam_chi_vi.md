# BÁO CÁO HOÀN THÀNH NHIỆM VỤ LAMCHIVI

## 📌 THÔNG TIN NHIỆM VỤ
- **Người thực hiện:** Lâm Chí Vĩ (@technology-web)
- **Vai trò:** Backend & UI Handover Lead
- **Nhiệm vụ:** Nâng cấp Quy trình Biên bản Bàn giao xe 2 Chiều (Hai bên đồng thuận Check-in / Check-out - Two-Way Handover Consensus)
- **GitHub Issue:** [#58](https://github.com/em123ngao-arch/thueXe_Online/issues/58)
- **Nhánh phát triển:** `feature/58-two-way-inspection`

---

## 🎯 CÁC NỘI DUNG ĐÃ THỰC HIỆN

### 1. Cơ sở dữ liệu & Entity:
- **Enum `EInspectionStatus`**:
  - `PENDING_RENTER_CONFIRMATION`: Chủ xe đã lập biên bản, đang chờ khách kiểm tra và ký nhận.
  - `CONFIRMED`: Khách đã đồng ý và ký nhận biên bản bàn giao.
  - `DISPUTED`: Khách từ chối và khiếu nại sai lệch hiện trạng.
- **Entity `RentalInspection`**:
  - Bổ sung trường `@Enumerated(EnumType.STRING) private EInspectionStatus status = EInspectionStatus.CONFIRMED;`
- **Flyway Migration V9**:
  - `V9__inspection_two_way_consensus.sql`: Bổ sung cột `status VARCHAR(40) DEFAULT 'CONFIRMED'` vào bảng `rental_inspections` chuẩn hoá tập trung theo chỉ đạo Tech Lead.

### 2. Nghiệp vụ Backend (`RentalInspectionServiceImpl` & `RentalController`):
- **Cơ chế 2 chiều Check-in & Check-out**:
  - Khi chủ xe lập biên bản Check-in hoặc Check-out: Lưu biên bản ở trạng thái `PENDING_RENTER_CONFIRMATION`, đơn thuê chưa chuyển trạng thái ngay.
- **Endpoint Xác nhận của Khách thuê**:
  - `POST /api/v1/rentals/{rentalId}/inspections/{inspectionId}/confirm` (Bảo vệ bởi RBAC `@PreAuthorize("hasRole('RENTER')")`).
  - **Khách chọn ĐỒNG Ý (`agreed = true`)**:
    - Biên bản chuyển sang `CONFIRMED`.
    - Check-in: Đơn chuyển sang `IN_PROGRESS` (chính thức bắt đầu chuyến đi).
    - Check-out: Đơn chuyển sang `COMPLETED` (ghi nhận thời gian trả thực tế và mở quyền đánh giá review).
  - **Khách chọn TỪ CHỐI / KHIẾU NẠI (`agreed = false`)**:
    - Biên bản chuyển sang `DISPUTED`.
    - Đơn chuyển sang trạng thái `DISPUTED`.
    - Tự động sinh bản ghi khiếu nại trong bảng `rental_disputes` với `reporterId = customerId`, `status = PENDING`, lý do sai lệch và ảnh đối chứng chuyển lên Admin phân xử.

### 3. Giao diện Người dùng (Frontend Modal & Action Buttons):
- **API Client (`api.js`)**:
  - Thêm hàm `RentalAPI.confirmInspection(rentalId, inspectionId, payload)`.
- **Nút hành động nổi bật (`render.js`)**:
  - Thẻ đơn `CONFIRMED` và `IN_PROGRESS` có nút nổi bật: `[📋 Kiểm tra & Ký nhận bàn giao xe]`.
- **Modal Kiểm tra & Ký nhận 2 Chiều (`app.js`)**:
  - Hiển thị đầy đủ: Số ODO đồng hồ, vạch xăng/pin (%), phụ phí phát sinh (nếu Check-out), ghi chú của chủ xe.
  - Danh sách 4 góc ảnh xe ngoại quan do Chủ xe tải lên (có tính năng click phóng to).
  - Nút bấm trực quan: `[✅ Đồng ý nhận/trả xe]` và `[⚠️ Khiếu nại sai lệch]`.
  - Khung nhập lý do khiếu nại sai lệch hiện trạng (ODO, xăng, trầy xước) gửi trực tiếp lên Ban Quản Trị.

---

## 🧪 MA TRẬN KIỂM THỬ TỰ ĐỘNG (SELF-TEST MATRIX)

| Mã Test | Mô tả Kịch bản | Kết quả |
| :--- | :--- | :---: |
| **TC-I01** | Chủ xe tạo Check-in -> Biên bản mang trạng thái `PENDING_RENTER_CONFIRMATION`, đơn chưa chuyển `IN_PROGRESS`. | **PASSED** |
| **TC-I02** | Khách bấm xác nhận biên bản Check-in -> Đơn chính thức chuyển sang `IN_PROGRESS`. | **PASSED** |
| **TC-I03** | Chủ xe tạo Check-out -> Khách xem ảnh và số ODO lúc trả xe -> Bấm xác nhận -> Đơn chuyển sang `COMPLETED`. | **PASSED** |
| **TC-I04** | Khách bấm "Khiếu nại sai lệch" trên biên bản -> Tự động sinh bản ghi Dispute trong bảng `rental_disputes` với lý do chính xác và chuyển đơn sang `DISPUTED`. | **PASSED** |
| **TC-I05** | Chạy `mvnw test -Dtest=RentalInspection*Test` và toàn bộ test suite hệ thống (207 tests). | **PASSED (207/207)** |
| **TC-I06** | Kiểm tra cú pháp JavaScript toàn bộ thư mục `frontend/js/` bằng Node.js. | **PASSED (0 errors)** |
