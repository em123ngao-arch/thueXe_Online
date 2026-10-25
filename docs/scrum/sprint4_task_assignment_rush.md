# BẢNG PHÂN CHIA NHIỆM VỤ SPRINT THẦN TỐC (HOÀN THÀNH TRONG NGÀY)
> **Dự án**: DriveShare - Nền tảng chia sẻ và cho thuê xe trực tuyến (Spring Boot 3 & Modern Web)  
> **Phiên bản**: Sprint 4 - Shopee-Style Tracking, Asset Protection & Full Responsive  
> **Tech Lead phê duyệt**: Nguyễn Duy Bảo (`@em123ngao-arch`)  
> **Nhân sự thực hiện**: 4 thành viên (Bảo, Tín, Vĩ, Quân). *Hai thành viên Phát và Khiêm không giao việc do bận dự án khác.*

---

## 📌 QUY TẮC BẮT BUỘC TRONG NGÀY (READ FIRST)
1. **Làm trên nhánh riêng**: Tuyệt đối không commit trực tiếp vào `develop` hoặc `main`.
2. **Kiểm thử chi tiết tại máy cá nhân**: 
   - Backend: Bắt buộc chạy `cd backend; .\mvnw.cmd test` (phải đạt 100% pass, không làm vỡ 188 bài test cũ).
   - Frontend: F12 Console phải sạch sẽ 0 lỗi đỏ, kiểm tra giao diện trên cả màn hình điện thoại (375px/430px) và máy tính (1280px+).
3. **Mở Pull Request vào `develop`**: Gửi kèm ảnh chụp màn hình nghiệm thu thực tế.

---

## 📊 BẢNG MA TRẬN NHIỆM VỤ TỔNG THỂ

| STT | Thành Viên | Trọng Tâm Nhiệm Vụ | Nhánh Git | Tiêu Chí Nghiệm Thu (DoD) |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Chí Tín**<br>`@CTnn1001` | **Frontend UI/UX & Responsive Chuẩn Chỉ**<br>- Nút & Modal Hành trình chuẩn Shopee<br>- Responsive Mobile (Bottom Nav, Cards Table)<br>- Luồng Đánh giá hoàn tất đơn | `feature/responsive-and-shopee-ui` | - Bật F12 Mobile 375px không tràn cuộn ngang.<br>- Modal Shopee mở mượt, hiện Stepper 5 bước.<br>- Console 0 lỗi đỏ. |
| **2** | **Lâm Chí Vĩ**<br>`@technology-web` | **Backend Rental Core & Scheduler**<br>- Thêm Enum `OVERDUE`<br>- `@Scheduled` quét trễ hạn & tính phạt x1.5<br>- Khép kín vòng đời: Đánh giá xong mới `COMPLETED` | `feature/overdue-scheduler-and-review` | - Tối thiểu 6 Unit/MockMvc tests pass 100%.<br>- Scheduler tự động tính đúng tiền phạt trễ hạn.<br>- Review xong đổi đơn thành `COMPLETED`. |
| **3** | **Duy Quân**<br>`@nguyenduyquan0609-cyber` | **Backend Admin, Blacklist & Hồ Sơ Pháp Lý**<br>- Admin xem danh sách đơn quá hạn<br>- API xuất hồ sơ pháp lý 1-click (Dossier)<br>- Tự động kích hoạt Blacklist khóa đặt xe | `feature/admin-overdue-dossier-blacklist` | - Tối thiểu 5 Unit tests pass 100%.<br>- API Dossier gom đủ CCCD, GPLX, Hợp đồng, Cọc.<br>- Khách bị Blacklist tạo đơn mới bị chặn ngay. |
| **4** | **Duy Bảo**<br>`@em123ngao-arch` *(Lead)* | **Kiến Trúc DB V8, Trang Điều Khoản & CI/CD**<br>- Viết Migration V8 vào DB PostgreSQL<br>- Xây dựng Trang Điều khoản pháp lý (Điều 175 BLHS)<br>- Giám sát CI/CD, Test Concurrency & Merge | `feature/V8-db-and-rental-terms` | - Chạy toàn bộ 188+ tests pass 100%.<br>- GitHub Actions CI/CD báo tích xanh.<br>- Squash Merge vào `develop`. |

---

## 🛠️ CHI TIẾT NHIỆM VỤ TỪNG THÀNH VIÊN

---

### 1. CHÍ TÍN (`@CTnn1001`) - Chuyên Trách Frontend & Responsive
* **Nhánh Git**: `feature/responsive-and-shopee-ui`
* **File phụ trách**:
  - `frontend/css/base.css`, `frontend/css/components.css`, `frontend/css/portals.css`
  - `frontend/js/render.js`, `frontend/js/owner.js`, `frontend/js/app.js`

#### Công việc cụ thể:
1. **Chuẩn hóa Responsive Đa Thiết Bị**:
   - **Màn hình Mobile (360px - 430px)**:
     - Header chuyển thành **Bottom Navigation Bar** dưới đáy màn hình gồm: `[Trang chủ]`, `[Chuyến đi]`, `[Xe của tôi]`, `[Tài khoản]`.
     - Danh sách xe của Chủ xe và Lịch sử chuyến đi của Khách: Chuyển bảng ngang (`<table>`) thành dạng **Thẻ dọc (Cards View)**, loại bỏ triệt để thanh cuộn ngang gây lỗi vỡ khung.
     - Đảm bảo toàn bộ nút bấm có chiều cao tối thiểu **44px** để bấm ngón tay dễ dàng.
   - **Màn hình Tablet (768px - 1024px)**: Chia layout 2 cột cân đối, không bể font.
2. **Nút "Theo Dõi Hành Trình" Cố Định**:
   - Thêm nút cố định: `[📍 Theo dõi hành trình & Trạng thái xe]` trên mọi card đơn ở cả trang Khách thuê (`render.js`) và trang Chủ xe (`owner.js`).
   - Nút này **luôn luôn hiển thị** ở các trạng thái: `WAITING_PAYMENT`, `CONFIRMED`, `IN_PROGRESS`, `OVERDUE`, `COMPLETED`.
3. **Xây Dựng Modal Hành Trình Phong Cách Shopee**:
   - Khi bấm vào nút, mở Modal Timeline Shopee gồm:
     - **Thanh tiến trình 5 bước (Stepper)**: Có chấm tròn nối line:  
       `[1. Đặt xe]` $\rightarrow$ `[2. Cọc 30%]` $\rightarrow$ `[3. Giao xe]` $\rightarrow$ `[4. Đang đi]` $\rightarrow$ `[5. Hoàn tất]`.
     - **Đồng hồ đếm ngược**: Đang đi hiện `⏳ Còn lại: XX giờ YY phút`. Nếu quá hạn đổi sang màu đỏ nhấp nháy `⚠️ ĐÃ QUÁ HẠN: XX giờ YY phút (Đang phạt trễ hạn)`.
     - **Biên bản bàn giao**: Hiển thị số ODO lúc nhận xe, vạch xăng/pin và gallery 4 ảnh xe bàn giao.
     - **Chi tiết tiền tệ**: Tổng tiền, tiền đã cọc VietQR 30%, tiền còn lại cần trả khi trả xe, và tiền phạt quá hạn (nếu có).
4. **Luồng Đánh Giá Hoàn Tất Đơn**:
   - Khi trả xe xong, hiển thị nút kêu gọi khách đánh giá: *"Vui lòng gửi đánh giá để chính thức hoàn tất đơn thuê"*. Đánh giá xong đơn mới chuyển sang `ĐÃ HOÀN TẤT`.

---

### 2. LÂM CHÍ VĨ (`@technology-web`) - Chuyên Trách Backend Rental & Scheduler
* **Nhánh Git**: `feature/overdue-scheduler-and-review`
* **File phụ trách**:
  - `backend/src/main/java/com/driveshare/common/enums/ERentalStatus.java`
  - `backend/src/main/java/com/driveshare/modules/rental/scheduler/RentalExpirationScheduler.java`
  - `backend/src/main/java/com/driveshare/modules/rental/service/impl/ReviewServiceImpl.java`
  - `backend/src/test/java/com/driveshare/modules/rental/`

#### Công việc cụ thể:
1. **Bổ sung Enum `OVERDUE`**:
   - Khai báo giá trị `OVERDUE` trong `ERentalStatus.java`.
2. **Lập trình Scheduled Job Quét Đơn Quá Hạn**:
   - Trong `RentalExpirationScheduler.java`, viết method:
     ```java
     @Scheduled(cron = "${app.rental.overdue-check-cron:0 0 * * * *}") // Chạy định kỳ mỗi tiếng
     @Transactional
     public void autoCheckOverdueRentals() { ... }
     ```
   - Quét các đơn đang `IN_PROGRESS` mà `endDate < now()`:
     - Đổi trạng thái đơn sang `OVERDUE`.
     - Tính số giờ trễ: `overdueHours = now - endDate`.
     - Tính tiền phạt trễ hạn: `penaltyFee = overdueHours * (hourlyRate * 1.5)`. Nếu trễ trên 24 giờ: phạt gấp đôi đơn giá ngày thuê.
3. **Khép Kín Vòng Đời: Đánh Giá Xong Mới Hoàn Tất**:
   - Trong `ReviewServiceImpl.createReview(...)`:
     - Khách đánh giá sao và nhận xét thành công $\rightarrow$ Chuyển `rental.setStatus(ERentalStatus.COMPLETED)`.
4. **Viết Bộ Kiểm Thử (Unit Tests)**:
   - Viết tối thiểu 6 tests kiểm tra: quét đúng đơn quá hạn, tính đúng tiền phạt, và chuyển trạng thái `COMPLETED` sau khi review.

---

### 3. DUY QUÂN (`@nguyenduyquan0609-cyber`) - Chuyên Trách Backend Admin, Hồ Sơ & Blacklist
* **Nhánh Git**: `feature/admin-overdue-dossier-blacklist`
* **File phụ trách**:
  - `backend/src/main/java/com/driveshare/modules/admin/controller/AdminRentalController.java`
  - `backend/src/main/java/com/driveshare/modules/admin/service/AdminRentalService.java`
  - `backend/src/main/java/com/driveshare/modules/rental/service/impl/RentalServiceImpl.java`
  - `backend/src/test/java/com/driveshare/modules/admin/`

#### Công việc cụ thể:
1. **API Admin Quản Lý Đơn Quá Hạn**:
   - `GET /api/v1/admin/rentals/overdue`: Trả về danh sách đơn quá hạn kèm số giờ trễ, số tiền phạt, thông tin xe và thông tin khách thuê.
2. **API Xuất Hồ Sơ Pháp Lý 1-Click (Violation Dossier)**:
   - `GET /api/v1/admin/rentals/{id}/dossier`:
   - Trả về cấu trúc JSON/Báo cáo tổng hợp đầy đủ tài liệu để nộp cơ quan công an / bảo hiểm:
     - Thông tin khách thuê: Họ tên, SĐT, Số CCCD, GPLX, ảnh 2 mặt bằng lái.
     - Thông tin xe & Chủ xe: Biển số, số khung, hãng xe, thông tin chủ xe hợp pháp.
     - Hợp đồng điện tử, lịch sử chuyển khoản cọc VietQR 30%, ảnh biên bản bàn giao ODO lúc nhận xe.
     - Số giờ chiếm dụng xe quá hạn và số tiền phạt tích lũy.
3. **Cơ Chế Danh Sách Đen (Blacklist Chặn Đặt Xe)**:
   - Khi đơn bị `OVERDUE` quá 24h: Tự động chuyển `user.status = BLOCKED`.
   - Tại `RentalServiceImpl.createRental()`: Kiểm tra nếu khách hàng có status `BLOCKED` hoặc đang có đơn `OVERDUE` chưa hoàn trả $\rightarrow$ ném ngoại lệ `USER_BLOCKED_OVERDUE_VIOLATION` (chặn không cho đặt xe mới).
4. **Viết Bộ Kiểm Thử (Unit Tests)**:
   - Viết tối thiểu 5 tests kiểm tra: xuất đúng dữ liệu dossier, chặn thành công khách bị blacklist đặt xe.

---

### 4. DUY BẢO (`@em123ngao-arch`) - Tech Lead, Kiến Trúc DB, Điều Khoản & CI/CD
* **Nhánh Git**: `feature/V8-db-and-rental-terms`
* **File phụ trách**:
  - `backend/src/main/resources/db/migration/V8__overdue_and_penalty_tracking.sql`
  - `frontend/index.html` (hoặc modal điều khoản), `backend/pom.xml`, `.github/workflows/ci.yml`

#### Công việc cụ thể:
1. **Viết Migration V8 Vào PostgreSQL**:
   - Thêm các cột vào bảng `rentals`:
     - `overdue_hours INT DEFAULT 0`
     - `penalty_fee NUMERIC(12,2) DEFAULT 0.00`
     - `actual_return_time TIMESTAMP NULL`
     - `is_blacklisted_triggered BOOLEAN DEFAULT FALSE`
2. **Xây Dựng Trang Điều Khoản Thuê Xe & Chế Tài Hình Sự**:
   - Xây dựng nội dung Điều khoản pháp lý minh bạch:
     - Quy định thời hạn trả xe và công thức tính phí phạt trễ hạn.
     - **Nghiêm cấm hành vi cầm cố, mua bán hoặc cho người khác mượn lại xe**.
     - Nêu rõ chế tài xử lý hình sự theo **Điều 175 Bộ luật Hình sự (Tội lạm dụng tín nhiệm chiếm đoạt tài sản)**.
     - Quy định quyền kích hoạt định vị GPS và quyền đơn phương thu hồi xe của Chủ xe.
3. **Giám Sát CI/CD & Hợp Nhất Hệ Thống**:
   - Kiểm tra mọi Pull Request của Tín, Vĩ, Quân: Đảm bảo pass toàn bộ 188+ bài tests và cú pháp JS.
   - Kiểm tra GitHub Actions báo **tích xanh ✔️** trước khi thực hiện **Squash and Merge** vào `develop`.

---

## ⏰ LỊCH TRÌNH TÁC CHIẾN RÚT GỌN TRONG HÔM NAY

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🌅 CA 1 (SÁNG / ĐẦU GIỜ): DỰNG NỀN TẢNG & MIGRATION                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Bảo: Đẩy DB Migration V8 + Viết khung Điều khoản pháp lý                  │
│ • Vĩ: Thêm Enum OVERDUE + Bắt đầu viết Scheduler quét trễ hạn               │
│ • Quân: Thiết kế DTO Dossier + Cơ chế chặn đặt xe Blacklist                 │
│ • Tín: Rà soát CSS base, cấu trúc Breakpoints Mobile/Tablet (Bottom Nav)    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 🌇 CA 2 (CHIỀU): LẮP RÁP TÍNH NĂNG & GIAO DIỆN SHOPEE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Tín: Lắp ráp Nút [📍 Theo dõi hành trình] & Modal Stepper 5 bước Shopee   │
│ • Vĩ: Hoàn thiện Scheduler + Luồng review chuyển COMPLETED                  │
│ • Quân: Hoàn thiện API Xuất hồ sơ pháp lý & API Admin overdue               │
│ • Bảo: Tích hợp API giữa Backend và Frontend                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ 🌙 CA 3 (TỐI): TEST CHI TIẾT & MERGE VÀO DEVELOP                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Tín: F12 Chrome/Edge kiểm tra 0 lỗi đỏ, test co giãn màn hình mượt        │
│ • Vĩ + Quân: Chạy .\mvnw.cmd test đảm bảo 100% bài test vượt qua            │
│ • Bảo: Kiểm tra GitHub Actions CI/CD tích xanh -> Squash Merge vào develop  │
└─────────────────────────────────────────────────────────────────────────────┘
```
