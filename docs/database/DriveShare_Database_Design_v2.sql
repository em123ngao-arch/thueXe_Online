-- =====================================================================
-- DRIVESHARE — DATABASE DESIGN v2 (1 DATABASE DUY NHẤT, KHÔNG MICROSERVICE)
-- Áp dụng góp ý của giảng viên:
--   1. Gộp về 1 DB duy nhất
--   2. Mọi bảng có created_at/created_by/updated_at/updated_by (+deleted cho soft-delete)
--   3. 1 bảng users chung, admin/staff là role chứ không phải bảng riêng
--   4. Booking mở rộng đủ trạng thái theo vòng đời (kiểu Mioto)
--   5. Request thuê KHÔNG tách bảng riêng — dùng chung bookings + status_history
--   6. Có bảng handovers xử lý giao/nhận xe
-- =====================================================================

CREATE DATABASE driveshare_db;
USE driveshare_db;

-- =====================================================================
-- 1. NGƯỜI DÙNG & PHÂN QUYỀN
-- =====================================================================

CREATE TABLE roles (
  role_id     BIGINT PRIMARY KEY AUTO_INCREMENT,
  role_name   VARCHAR(30) UNIQUE NOT NULL   -- 'renter', 'owner', 'staff', 'admin'
);

-- Bảng gốc DUY NHẤT cho mọi actor (renter/owner/staff/admin đều là 1 user)
CREATE TABLE users (
  user_id         BIGINT PRIMARY KEY AUTO_INCREMENT,
  username        VARCHAR(50)  UNIQUE NOT NULL,
  email           VARCHAR(150) UNIQUE NOT NULL,
  phone           VARCHAR(20)  UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  full_name       VARCHAR(150),
  avatar_url      VARCHAR(500),
  id_card_number  VARCHAR(20)  UNIQUE,
  status          ENUM('pending','active','locked') DEFAULT 'pending',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by      BIGINT NULL,               -- NULL = tự đăng ký (self-service)
  updated_at      TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  updated_by      BIGINT NULL,
  deleted_at      TIMESTAMP NULL,
  deleted_by      BIGINT NULL
);

-- N-N: 1 user có thể vừa renter vừa owner; admin/staff chỉ là 1 dòng ở đây
CREATE TABLE user_roles (
  user_id     BIGINT NOT NULL REFERENCES users(user_id),
  role_id     BIGINT NOT NULL REFERENCES roles(role_id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by BIGINT NULL REFERENCES users(user_id),
  PRIMARY KEY (user_id, role_id)
);

-- Mở rộng 1-1 cho Renter (chỉ tồn tại khi user có role 'renter')
CREATE TABLE renter_profiles (
  user_id                       BIGINT PRIMARY KEY REFERENCES users(user_id),
  license_number                VARCHAR(30) UNIQUE,
  license_full_name             VARCHAR(150),
  license_dob                   DATE,
  license_issue_date            DATE,
  license_expiry_date           DATE,
  license_front_url             VARCHAR(500),
  license_back_url              VARCHAR(500),
  license_verification_status   ENUM('pending','verified','rejected') DEFAULT 'pending',
  license_verified_by           BIGINT NULL REFERENCES users(user_id),
  license_verified_at           TIMESTAMP NULL,
  created_at                    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by                    BIGINT NULL,
  updated_at                    TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  updated_by                    BIGINT NULL
);

-- Mở rộng 1-1 cho Owner
CREATE TABLE owner_profiles (
  user_id               BIGINT PRIMARY KEY REFERENCES users(user_id),
  id_card_front_url     VARCHAR(500),
  id_card_back_url      VARCHAR(500),
  bank_account_number   VARCHAR(30),
  bank_name             VARCHAR(100),
  verification_status   ENUM('pending','verified','rejected') DEFAULT 'pending',
  verified_by           BIGINT NULL REFERENCES users(user_id),
  verified_at           TIMESTAMP NULL,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by            BIGINT NULL,
  updated_at            TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  updated_by            BIGINT NULL
);

-- =====================================================================
-- 2. XE (CAR)
-- =====================================================================

CREATE TABLE cars (
  car_id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  owner_id            BIGINT NOT NULL REFERENCES users(user_id),
  brand               VARCHAR(50),
  model               VARCHAR(100),
  year                SMALLINT,
  license_plate       VARCHAR(20) UNIQUE NOT NULL,
  seats               TINYINT,
  transmission        ENUM('manual','automatic'),
  fuel_type           ENUM('gasoline','diesel','electric','hybrid'),
  color               VARCHAR(30),
  description         TEXT,
  pickup_address      VARCHAR(255),
  latitude            DECIMAL(10,7),
  longitude           DECIMAL(10,7),
  base_price_per_day  DECIMAL(12,2) NOT NULL,
  status              ENUM('pending_review','approved','rejected','active','inactive','suspended')
                        DEFAULT 'pending_review',
  rejection_reason    VARCHAR(255),
  approved_by         BIGINT NULL REFERENCES users(user_id),
  approved_at         TIMESTAMP NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by          BIGINT NULL,
  updated_at          TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  updated_by          BIGINT NULL,
  deleted_at          TIMESTAMP NULL,
  deleted_by          BIGINT NULL
);

CREATE TABLE car_documents (      -- đăng ký xe, đăng kiểm, bảo hiểm...
  document_id           BIGINT PRIMARY KEY AUTO_INCREMENT,
  car_id                BIGINT NOT NULL REFERENCES cars(car_id),
  document_type         VARCHAR(50),
  document_url          VARCHAR(500),
  verification_status   ENUM('pending','verified','rejected') DEFAULT 'pending',
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by            BIGINT NULL
);

CREATE TABLE car_images (
  image_id     BIGINT PRIMARY KEY AUTO_INCREMENT,
  car_id       BIGINT NOT NULL REFERENCES cars(car_id) ON DELETE CASCADE,
  image_url    VARCHAR(500) NOT NULL,
  is_thumbnail BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by   BIGINT NULL
);

CREATE TABLE amenities (
  amenity_id  BIGINT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(50) UNIQUE NOT NULL   -- GPS, camera hành trình, ghế trẻ em...
);

CREATE TABLE car_amenities (
  car_id      BIGINT NOT NULL REFERENCES cars(car_id) ON DELETE CASCADE,
  amenity_id  BIGINT NOT NULL REFERENCES amenities(amenity_id),
  PRIMARY KEY (car_id, amenity_id)
);

CREATE TABLE car_availability (
  availability_id BIGINT PRIMARY KEY AUTO_INCREMENT,
  car_id          BIGINT NOT NULL REFERENCES cars(car_id),
  available_from  DATETIME NOT NULL,
  available_to    DATETIME NOT NULL,
  is_blocked      BOOLEAN DEFAULT FALSE,     -- owner tự khóa lịch (bảo dưỡng...)
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by      BIGINT NULL,
  CHECK (available_to > available_from)
);
CREATE INDEX idx_car_availability_range ON car_availability(car_id, available_from, available_to);

CREATE TABLE pricing_rules (
  rule_id     BIGINT PRIMARY KEY AUTO_INCREMENT,
  car_id      BIGINT NOT NULL REFERENCES cars(car_id),
  rule_type   ENUM('holiday','weekend','long_term_discount'),
  value       DECIMAL(12,2),
  start_date  DATE,
  end_date    DATE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by  BIGINT NULL
);

CREATE TABLE cancellation_policies (
  policy_id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  name                 VARCHAR(100),
  refund_percentage    DECIMAL(5,2),
  hours_before_pickup  INT,
  car_id               BIGINT NULL REFERENCES cars(car_id),  -- NULL = áp dụng toàn hệ thống
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by           BIGINT NULL
);

-- =====================================================================
-- 3. ĐẶT XE (BOOKING) — mở rộng đủ trạng thái theo flow kiểu Mioto
-- =====================================================================

CREATE TABLE bookings (
  booking_id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  renter_id             BIGINT NOT NULL REFERENCES users(user_id),
  car_id                BIGINT NOT NULL REFERENCES cars(car_id),
  start_datetime        DATETIME NOT NULL,
  end_datetime          DATETIME NOT NULL,
  pickup_location       VARCHAR(255),
  return_location       VARCHAR(255),
  price_per_day         DECIMAL(12,2) NOT NULL,   -- chốt giá tại thời điểm đặt
  total_days            INT NOT NULL,
  subtotal_amount       DECIMAL(12,2) NOT NULL,
  deposit_amount        DECIMAL(12,2) NOT NULL,
  total_amount          DECIMAL(12,2) NOT NULL,

  status ENUM(
    'requested',            -- khách gửi yêu cầu, chờ owner xác nhận
    'confirmed',            -- owner đã xác nhận, chờ khách đặt cọc
    'deposit_paid',         -- đã cọc, chờ tới ngày giao xe
    'in_progress',          -- đã giao xe, đang trong chuyến
    'returned',             -- đã trả xe, chờ chốt phụ phí/hoàn cọc
    'completed',            -- hoàn tất toàn bộ (đã thanh toán/hoàn tiền xong)
    'rejected',             -- owner từ chối yêu cầu
    'cancelled_by_renter',
    'cancelled_by_owner',
    'expired'               -- quá hạn xác nhận hoặc quá hạn đặt cọc
  ) DEFAULT 'requested',

  confirmation_deadline DATETIME,     -- owner phải confirm trước hạn này, hết hạn -> expired
  deposit_deadline      DATETIME,     -- renter phải cọc trước hạn này sau khi confirmed

  requested_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmed_at   TIMESTAMP NULL,
  deposit_paid_at TIMESTAMP NULL,
  picked_up_at   TIMESTAMP NULL,
  returned_at    TIMESTAMP NULL,
  completed_at   TIMESTAMP NULL,
  cancelled_at   TIMESTAMP NULL,
  cancelled_by   BIGINT NULL REFERENCES users(user_id),
  cancel_reason  VARCHAR(255),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by BIGINT NULL,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  updated_by BIGINT NULL,

  CHECK (end_datetime > start_datetime)
);
-- Bắt buộc để kiểm tra xung đột lịch nhanh
CREATE INDEX idx_bookings_car_range ON bookings(car_id, start_datetime, end_datetime);

-- Nhật ký chuyển trạng thái — thay cho việc tách bảng "request" riêng
CREATE TABLE booking_status_history (
  history_id  BIGINT PRIMARY KEY AUTO_INCREMENT,
  booking_id  BIGINT NOT NULL REFERENCES bookings(booking_id),
  old_status  VARCHAR(30),
  new_status  VARCHAR(30) NOT NULL,
  changed_by  BIGINT NOT NULL REFERENCES users(user_id),
  changed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  note        VARCHAR(255)
);

-- =====================================================================
-- 4. GIAO / NHẬN XE (HANDOVER) — phần còn thiếu ở sơ đồ cũ
-- =====================================================================

CREATE TABLE handovers (
  handover_id             BIGINT PRIMARY KEY AUTO_INCREMENT,
  booking_id              BIGINT NOT NULL REFERENCES bookings(booking_id),
  handover_type           ENUM('pickup','return') NOT NULL,
  odometer_reading        INT NOT NULL,
  fuel_level              TINYINT NOT NULL,   -- % nhiên liệu
  exterior_condition_note TEXT,
  interior_condition_note TEXT,
  handed_by               BIGINT NOT NULL REFERENCES users(user_id),
  received_by             BIGINT NOT NULL REFERENCES users(user_id),
  handover_time           DATETIME NOT NULL,
  renter_confirmed        BOOLEAN DEFAULT FALSE,
  renter_confirmed_at     TIMESTAMP NULL,
  owner_confirmed         BOOLEAN DEFAULT FALSE,
  owner_confirmed_at      TIMESTAMP NULL,
  has_dispute             BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by              BIGINT NULL,
  UNIQUE (booking_id, handover_type)   -- mỗi booking chỉ có 1 biên bản giao + 1 biên bản trả
);

CREATE TABLE handover_images (
  image_id     BIGINT PRIMARY KEY AUTO_INCREMENT,
  handover_id  BIGINT NOT NULL REFERENCES handovers(handover_id) ON DELETE CASCADE,
  image_url    VARCHAR(500) NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- 5. PHỤ PHÍ & THANH TOÁN
-- =====================================================================

CREATE TABLE surcharges (
  surcharge_id    BIGINT PRIMARY KEY AUTO_INCREMENT,
  booking_id      BIGINT NOT NULL REFERENCES bookings(booking_id),
  surcharge_type  ENUM('late_return','overmileage','fuel','cleaning','damage','other'),
  amount          DECIMAL(12,2) NOT NULL,
  description     VARCHAR(255),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by      BIGINT NOT NULL REFERENCES users(user_id)   -- owner hoặc staff lập
);

CREATE TABLE payments (
  payment_id        BIGINT PRIMARY KEY AUTO_INCREMENT,
  booking_id        BIGINT NOT NULL REFERENCES bookings(booking_id),
  amount            DECIMAL(12,2) NOT NULL,
  payment_type      ENUM('deposit','final_payment','surcharge','refund'),
  payment_method    ENUM('vnpay','bank_transfer','cash','simulated'),
  transaction_code  VARCHAR(100),
  status            ENUM('pending','success','failed','refunded') DEFAULT 'pending',
  paid_at           TIMESTAMP NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by        BIGINT NULL
);

-- =====================================================================
-- 6. ĐÁNH GIÁ, KHIẾU NẠI, THÔNG BÁO, YÊU THÍCH
-- =====================================================================

CREATE TABLE reviews (
  review_id    BIGINT PRIMARY KEY AUTO_INCREMENT,
  booking_id   BIGINT NOT NULL REFERENCES bookings(booking_id),
  reviewer_id  BIGINT NOT NULL REFERENCES users(user_id),
  reviewee_id  BIGINT NOT NULL REFERENCES users(user_id),
  rating       TINYINT NOT NULL,
  comment      TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (rating BETWEEN 1 AND 5),
  UNIQUE (booking_id, reviewer_id)
);

CREATE TABLE complaints (
  complaint_id       BIGINT PRIMARY KEY AUTO_INCREMENT,
  booking_id         BIGINT NULL REFERENCES bookings(booking_id),
  reporter_id        BIGINT NOT NULL REFERENCES users(user_id),
  against_user_id    BIGINT NULL REFERENCES users(user_id),
  category           VARCHAR(50),
  description        TEXT,
  attachment_url     VARCHAR(500),
  status             ENUM('open','in_progress','resolved','rejected') DEFAULT 'open',
  assigned_staff_id  BIGINT NULL REFERENCES users(user_id),
  resolution_note    TEXT,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at        TIMESTAMP NULL
);

CREATE TABLE notifications (
  notification_id     BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id             BIGINT NOT NULL REFERENCES users(user_id),
  type                VARCHAR(50),
  title               VARCHAR(150),
  content             VARCHAR(500),
  is_read             BOOLEAN DEFAULT FALSE,
  related_booking_id  BIGINT NULL REFERENCES bookings(booking_id),
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE favorites (
  favorite_id  BIGINT PRIMARY KEY AUTO_INCREMENT,
  renter_id    BIGINT NOT NULL REFERENCES users(user_id),
  car_id       BIGINT NOT NULL REFERENCES cars(car_id),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (renter_id, car_id)
);


-- #######################################################################
-- KỊCH BẢN SQL KIỂM CHỨNG THEO TỪNG BƯỚC (validate: không câu nào bị stuck)
-- #######################################################################

-- STEP 0. Seed role
INSERT INTO roles (role_name) VALUES ('renter'), ('owner'), ('staff'), ('admin');

-- STEP 1. Renter đăng ký tài khoản
INSERT INTO users (username, email, phone, password_hash, full_name)
VALUES ('an.nguyen', 'an@example.com', '0900000001', '$2b$...', 'Nguyễn Văn An');
INSERT INTO user_roles (user_id, role_id) VALUES (LAST_INSERT_ID(), 1);
-- Renter upload GPLX
INSERT INTO renter_profiles (user_id, license_number, license_front_url, license_back_url)
VALUES (1, '123456789', 'url_front.jpg', 'url_back.jpg');

-- STEP 2. Owner đăng ký tài khoản
INSERT INTO users (username, email, phone, password_hash, full_name)
VALUES ('binh.tran', 'binh@example.com', '0900000002', '$2b$...', 'Trần Văn Bình');
INSERT INTO user_roles (user_id, role_id) VALUES (LAST_INSERT_ID(), 2);
INSERT INTO owner_profiles (user_id, bank_account_number, bank_name)
VALUES (2, '00112233', 'Vietcombank');

-- STEP 3. Staff duyệt GPLX của renter
UPDATE renter_profiles
SET license_verification_status = 'verified', license_verified_by = 3, license_verified_at = NOW()
WHERE user_id = 1;

-- STEP 4. Owner đăng xe -> mặc định pending_review
INSERT INTO cars (owner_id, brand, model, year, license_plate, seats, transmission,
                   fuel_type, pickup_address, base_price_per_day, created_by)
VALUES (2, 'Toyota', 'Vios', 2022, '51A-123.45', 5, 'automatic', 'gasoline',
        '123 Nguyễn Huệ, Q1', 800000, 2);
INSERT INTO car_images (car_id, image_url, is_thumbnail, created_by)
VALUES (LAST_INSERT_ID(), 'car1_thumb.jpg', TRUE, 2);

-- STEP 5. Admin/staff duyệt xe
UPDATE cars
SET status = 'approved', approved_by = 3, approved_at = NOW()
WHERE car_id = 1;

-- STEP 6. Owner mở lịch sẵn sàng
INSERT INTO car_availability (car_id, available_from, available_to, created_by)
VALUES (1, '2026-09-15 08:00:00', '2026-12-31 20:00:00', 2);

-- STEP 7. Renter tìm xe & GỬI YÊU CẦU THUÊ (status = requested)
-- (a) kiểm tra xung đột lịch trước khi cho phép đặt
SELECT COUNT(*) AS conflict_count
FROM bookings
WHERE car_id = 1
  AND status IN ('requested','confirmed','deposit_paid','in_progress')
  AND NOT (end_datetime <= '2026-09-20 08:00:00' OR start_datetime >= '2026-09-23 08:00:00');
-- (b) nếu conflict_count = 0 -> tạo booking
INSERT INTO bookings (renter_id, car_id, start_datetime, end_datetime, pickup_location,
                       return_location, price_per_day, total_days, subtotal_amount,
                       deposit_amount, total_amount, confirmation_deadline, created_by)
VALUES (1, 1, '2026-09-20 08:00:00', '2026-09-23 08:00:00', '123 Nguyễn Huệ, Q1',
        '123 Nguyễn Huệ, Q1', 800000, 3, 2400000, 500000, 2400000,
        NOW() + INTERVAL 24 HOUR, 1);
INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by, note)
VALUES (LAST_INSERT_ID(), NULL, 'requested', 1, 'Renter gửi yêu cầu thuê');

-- STEP 8. Owner XÁC NHẬN yêu cầu
UPDATE bookings
SET status = 'confirmed', confirmed_at = NOW(),
    deposit_deadline = NOW() + INTERVAL 12 HOUR, updated_by = 2
WHERE booking_id = 1;
INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by, note)
VALUES (1, 'requested', 'confirmed', 2, 'Owner xác nhận yêu cầu');

-- STEP 9. Renter ĐẶT CỌC
INSERT INTO payments (booking_id, amount, payment_type, payment_method,
                       transaction_code, status, paid_at, created_by)
VALUES (1, 500000, 'deposit', 'vnpay', 'TXN00001', 'success', NOW(), 1);
UPDATE bookings SET status = 'deposit_paid', deposit_paid_at = NOW(), updated_by = 1
WHERE booking_id = 1;
INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by, note)
VALUES (1, 'confirmed', 'deposit_paid', 1, 'Renter đã đặt cọc');

-- STEP 10. GIAO XE (pickup handover)
INSERT INTO handovers (booking_id, handover_type, odometer_reading, fuel_level,
                        exterior_condition_note, handed_by, received_by,
                        handover_time, owner_confirmed, owner_confirmed_at, created_by)
VALUES (1, 'pickup', 15200, 100, 'Xe sạch, không trầy xước', 2, 1, NOW(), TRUE, NOW(), 2);
INSERT INTO handover_images (handover_id, image_url) VALUES (LAST_INSERT_ID(), 'pickup1.jpg');
UPDATE handovers SET renter_confirmed = TRUE, renter_confirmed_at = NOW() WHERE handover_id = 1;
UPDATE bookings SET status = 'in_progress', picked_up_at = NOW(), updated_by = 2 WHERE booking_id = 1;
INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by, note)
VALUES (1, 'deposit_paid', 'in_progress', 2, 'Đã giao xe cho khách');

-- STEP 11. TRẢ XE (return handover) + phát sinh phụ phí (nếu có)
INSERT INTO handovers (booking_id, handover_type, odometer_reading, fuel_level,
                        exterior_condition_note, handed_by, received_by,
                        handover_time, created_by)
VALUES (1, 'return', 15550, 80, 'Xe trả trễ 2 tiếng, xăng thiếu 20%', 1, 2, NOW(), 1);
INSERT INTO surcharges (booking_id, surcharge_type, amount, description, created_by)
VALUES (1, 'late_return', 100000, 'Trả trễ 2 giờ', 2),
       (1, 'fuel',        50000,  'Thiếu 20% nhiên liệu', 2);
UPDATE bookings SET status = 'returned', returned_at = NOW(), updated_by = 2 WHERE booking_id = 1;
INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by, note)
VALUES (1, 'in_progress', 'returned', 2, 'Đã nhận lại xe, chờ tất toán');

-- STEP 12. TẤT TOÁN — trừ phụ phí vào cọc, hoàn phần dư
INSERT INTO payments (booking_id, amount, payment_type, payment_method,
                       transaction_code, status, paid_at, created_by)
VALUES (1, 350000, 'refund', 'vnpay', 'TXN00002', 'success', NOW(), 2);  -- 500k cọc - 150k phụ phí
UPDATE bookings SET status = 'completed', completed_at = NOW(), updated_by = 2 WHERE booking_id = 1;
INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by, note)
VALUES (1, 'returned', 'completed', 2, 'Đã hoàn tất, hoàn cọc sau khi trừ phụ phí');

-- STEP 13. ĐÁNH GIÁ 2 CHIỀU
INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, rating, comment)
VALUES (1, 1, 2, 5, 'Xe sạch, chủ xe nhiệt tình'),
       (1, 2, 1, 4, 'Khách thân thiện, trả xe hơi trễ');

-- STEP 14. (Nhánh phụ) Renter khiếu nại nếu không đồng ý phụ phí
INSERT INTO complaints (booking_id, reporter_id, against_user_id, category, description)
VALUES (1, 1, 2, 'surcharge_dispute', 'Tôi không đồng ý mức phí xăng bị trừ');

-- STEP 15. Thông báo hệ thống (ví dụ khi confirm / nhắc trả xe)
INSERT INTO notifications (user_id, type, title, content, related_booking_id)
VALUES (1, 'booking_confirmed', 'Yêu cầu đã được xác nhận',
        'Chủ xe đã xác nhận chuyến thuê #1, vui lòng đặt cọc trong 12 giờ.', 1);
