# 🚀 KẾ HOẠCH TRIỂN KHAI SPRINT 3 (DRIVESHARE)
### Hoàn Thiện Vòng Đời Chuyến Đi, Dịch Vụ Xe Có Tài Xế & Triển Khai Render Cloud

---

## 📌 1. BỐI CẢNH & MỤC TIÊU SPRINT 3 MỞ RỘNG
- **Hiện trạng sau Sprint 2**: Đã có luồng cốt lõi: Tìm xe ➔ Đặt xe ➔ Duyệt đơn ➔ Cọc 30% VietQR (Đơn ở `CONFIRMED`).
- **Nâng cấp toàn diện trong Sprint 3**:
  1. **Luồng Thuê Xe Có Tài Xế (Chauffeur Service)**: Chủ xe cấu hình phụ phí tài xế theo ngày. Khách được chọn "Kèm tài xế" (miễn kiểm tra bằng lái xe GPLX, miễn thủ tục thế chấp xe máy/15 triệu khi nhận xe).
  2. **Bàn giao xe (Check-in)**: Lập biên bản bàn giao điện tử (ghi nhận ODO km, mức xăng/pin %, upload ảnh 4 góc xe, xác nhận thanh toán 70% + thế chấp) ➔ Chuyển đơn sang `IN_PROGRESS`.
  3. **Nghiệm thu trả xe (Check-out)**: Nhập ODO trả xe (tự tính quãng đường đã đi), mức xăng lúc trả, tính phụ phí phát sinh (rửa xe, vượt km, thiếu xăng...) ➔ Chuyển đơn sang `COMPLETED`.
  4. **Đánh giá & Phản hồi (Reviews & Ratings)**: Khách thuê chấm điểm 1–5 sao, viết nhận xét cảm nhận, hệ thống tự tính điểm rating trung bình và hiển thị công khai trên trang chi tiết xe.
  5. **Trung tâm Thông báo (Notification Center)**: Chuông thông báo (Bell icon) trên Header, tự động thông báo in-app realtime khi trạng thái đơn thay đổi.
  6. **Triển khai Đám mây (Deploy Render.com Free Tier)**: Đóng gói Dockerfile Multi-stage tối ưu JVM chạy <512MB RAM, file `render.yaml` Blueprint tự động triển khai Backend Spring Boot, Database Postgres và Frontend Static Site hoàn toàn miễn phí.

---

## 🗄️ 2. THIẾT KẾ CƠ SỞ DỮ LIỆU (FLYWAY MIGRATION V6)

Tạo file: `backend/src/main/resources/db/migration/V6__sprint3_full_features.sql`

```sql
-- 1. Bổ sung các cột dịch vụ có tài xế vào bảng cars và rentals
ALTER TABLE cars ADD COLUMN IF NOT EXISTS has_driver_service BOOLEAN DEFAULT FALSE;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS driver_fee_per_day NUMERIC(12,2) DEFAULT 0.00;

ALTER TABLE rentals ADD COLUMN IF NOT EXISTS with_driver BOOLEAN DEFAULT FALSE;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS driver_fee NUMERIC(12,2) DEFAULT 0.00;

-- 2. Bảng biên bản kiểm tra bàn giao và trả xe (Inspections)
CREATE TABLE IF NOT EXISTS rental_inspections (
    inspection_id BIGSERIAL PRIMARY KEY,
    rental_id BIGINT NOT NULL REFERENCES rentals(rental_id) ON DELETE CASCADE,
    inspection_type VARCHAR(20) NOT NULL, -- 'CHECK_IN' hoặc 'CHECK_OUT'
    odo_meter INT NOT NULL,
    fuel_level INT NOT NULL, -- 0 - 100%
    images TEXT, -- Danh sách URL ảnh ngoại quan phân cách bằng dấu phẩy
    notes TEXT,
    extra_fee NUMERIC(12,2) DEFAULT 0.00,
    extra_fee_reason VARCHAR(255),
    performed_by BIGINT NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Bảng đánh giá sau chuyến đi (Reviews)
CREATE TABLE IF NOT EXISTS reviews (
    review_id BIGSERIAL PRIMARY KEY,
    rental_id BIGINT UNIQUE NOT NULL REFERENCES rentals(rental_id) ON DELETE CASCADE,
    car_id BIGINT NOT NULL REFERENCES cars(car_id) ON DELETE CASCADE,
    renter_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Bảng thông báo in-app (Notifications)
CREATE TABLE IF NOT EXISTS notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    reference_id BIGINT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inspections_rental_id ON rental_inspections(rental_id);
CREATE INDEX IF NOT EXISTS idx_reviews_car_id ON reviews(car_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, is_read);
```

---

## 🔌 3. DANH MỤC API BACKEND SPRINT 3

| Nhóm chức năng | Method & Endpoint | Quyền (Role) | Mô tả nghiệp vụ |
| :--- | :--- | :--- | :--- |
| **Dịch vụ Tài xế** | `PUT /api/v1/cars/{id}/driver-service` | `OWNER` | Bật/tắt dịch vụ tài xế và giá phụ phí/ngày cho xe |
| **Đặt xe có tài xế** | `POST /api/v1/rentals` (mở rộng) | `RENTER` | Tích chọn `with_driver = true`, miễn check GPLX, tính cọc |
| **Bàn giao (Check-in)** | `POST /api/v1/owner/rentals/{id}/check-in` | `OWNER` | Lập biên bản nhận xe, ODO, xăng, ảnh ➔ Chuyển `IN_PROGRESS` |
| **Nghiệm thu (Check-out)** | `POST /api/v1/owner/rentals/{id}/check-out` | `OWNER` | Nhập ODO trả xe, tính tổng km, phụ phí ➔ Chuyển `COMPLETED` |
| **Xem biên bản** | `GET /api/v1/rentals/{id}/inspections` | `OWNER`, `RENTER` | Xem chi tiết 2 biên bản nhận & trả kèm ảnh đối chiếu |
| **Đánh giá chuyến đi** | `POST /api/v1/rentals/{id}/reviews` | `RENTER` | Khách chấm 1-5 sao & viết nhận xét sau khi đơn `COMPLETED` |
| **Xem đánh giá xe** | `GET /api/v1/public/cars/{carId}/reviews` | `PUBLIC` | Xem danh sách đánh giá công khai ở trang chi tiết xe |
| **Danh sách thông báo** | `GET /api/v1/notifications/my-notifications` | `AUTHENTICATED` | Lấy danh sách thông báo in-app và số lượng chưa đọc |
| **Đánh dấu đã đọc** | `PUT /api/v1/notifications/{id}/read` | `AUTHENTICATED` | Đánh dấu một thông báo đã đọc |

---

## ☁️ 4. KIẾN TRÚC TRIỂN KHAI RENDER.COM (FREE TIER)

1. **Backend Spring Boot (`backend/Dockerfile`)**:
   - Sử dụng Docker multi-stage build với image base `eclipse-temurin:17-jre-alpine`.
   - Cấu hình biến môi trường JVM tối ưu bộ nhớ:
     ```dockerfile
     ENV JAVA_OPTS="-XX:+UseSerialGC -Xss512k -XX:MaxRAMPercentage=75.0 -Dfile.encoding=UTF-8"
     ```
   - Ứng dụng tiêu thụ RAM thực tế chỉ ~280MB - 350MB, hoàn toàn nằm trong giới hạn 512MB RAM của Render Free mà không bị Out Of Memory (OOM).

2. **Render Blueprint (`render.yaml`)**:
   - File cấu hình triển khai tự động toàn bộ 3 dịch vụ:
     - `driveshare-db`: PostgreSQL Managed Database (Free)
     - `driveshare-backend`: Web Service Docker Container (Free)
     - `driveshare-frontend`: Static Site phục vụ toàn bộ UI HTML/CSS/JS (Free)

---

## 👥 5. BẢNG PHÂN CÔNG NHIỆM VỤ THÀNH VIÊN

| Thành viên | Trách nhiệm chính | Nhiệm vụ cụ thể | Branch Git |
| :--- | :--- | :--- | :--- |
| **Lâm Chí Vĩ** | Lead BE — Core Workflow | Nâng cấp API đặt xe có tài xế (miễn GPLX), API Check-in (`IN_PROGRESS`), Check-out (`COMPLETED`), tính phụ phí | `feature/inspection-be` |
| **Duy Quân** | BE — Reviews & Ratings | Viết API đánh giá sau chuyến đi, thuật toán tính điểm rating trung bình xe/chủ xe | `feature/review-be` |
| **Phát** | BE — Notification Engine | Viết NotificationService, tự động gửi thông báo khi đơn chuyển trạng thái | `feature/notification-be` |
| **Lộc Khiêm** | BE — Docker & Render Deploy | Viết Dockerfile tối ưu JVM <512MB RAM, file `render.yaml`, hướng dẫn nhóm deploy live trên Render | `feature/render-deploy` |
| **Chí Tín** | Full FE Sprint 3 | Form chọn tài xế, Modal Check-in/Check-out, Modal Rating 5 sao, Dropdown chuông thông báo | `feature/sprint3-fe-full` |
| **Nguyễn Bảo** | DB Migration & QA Test | Viết Flyway V6, chuẩn bị dữ liệu mẫu xe có tài xế, viết script kiểm thử tự động toàn bộ Sprint 3 | `feature/db-sprint3-qa` |

---

## 🎯 6. ĐIỀU KIỆN NGHIỆM THU (DEFINITION OF DONE)
- [ ] Chạy lệnh kiểm thử tự động Sprint 3 pass 100%.
- [ ] Khách thuê xe chọn "Kèm tài xế" thành công mà không bị chặn bởi điều kiện GPLX.
- [ ] Chủ xe Check-in và Check-out thành công: Đơn chuyển sang `IN_PROGRESS` rồi `COMPLETED`.
- [ ] Điểm đánh giá sao hiển thị công khai trên giao diện web.
- [ ] Chuông thông báo hiển thị đúng các sự kiện diễn ra.
- [ ] Dự án được build Docker thành công và triển khai chạy trực tiếp trên Render.com (gói Free).
