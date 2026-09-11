-- =============================================================================
-- DỰ ÁN: DRIVESHARE - NỀN TẢNG CHO THUÊ XE CÁ NHÂN TRỰC TUYẾN
-- TÀI LIỆU THIẾT KẾ DATABASE CƠ SỞ (SPRINT 0) — v1.1 REVISED
-- Phụ trách thiết kế: Quân (Catalog/Resource) & Vĩ (Core/Transaction)
-- Thẩm định QA: Tín | Tham vấn luồng: Phát & Khiêm
-- Hệ quản trị CSDL: MySQL 8.0+ / MariaDB
-- 
-- CHANGELOG v1.1:
--   [+] Thêm bảng car_documents (giấy tờ xe: đăng ký, bảo hiểm)
--   [+] Thêm bảng complaint_evidence (tách file bằng chứng khiếu nại)
--   [+] Thêm bảng audit_logs (ghi log hành động Admin/Staff)
--   [~] Sửa reviews: UNIQUE(booking_id) → UNIQUE(booking_id, reviewer_id)
--   [~] Thêm CHECK constraint cho car_availabilities
--   [+] Thêm INDEXES cho các bảng truy vấn nhiều
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `driveshare_db` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `driveshare_db`;

-- =============================================================================
-- 1. PHÂN HỆ NGƯỜI DÙNG & PHÂN QUYỀN (USERS & ROLES) - [Vĩ]
-- =============================================================================

CREATE TABLE IF NOT EXISTS `roles` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL UNIQUE COMMENT 'ROLE_RENTER, ROLE_OWNER, ROLE_STAFF, ROLE_ADMIN',
    `description` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NULL UNIQUE,
    `avatar_url` VARCHAR(500) NULL,
    `address` VARCHAR(255) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE, INACTIVE, BANNED',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `is_deleted` BOOLEAN NOT NULL DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_roles` (
    `user_id` BIGINT NOT NULL,
    `role_id` BIGINT NOT NULL,
    PRIMARY KEY (`user_id`, `role_id`),
    CONSTRAINT `fk_ur_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ur_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 2. PHÂN HỆ HỒ SƠ KHÁCH THUÊ & GIẤY PHÉP LÁI XE (GPLX) - [Quân]
-- =============================================================================

CREATE TABLE IF NOT EXISTS `renter_profiles` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL UNIQUE COMMENT 'Quan hệ 1-1 với bảng users',
    `license_number` VARCHAR(50) NOT NULL COMMENT 'Số GPLX',
    `license_front_url` VARCHAR(500) NOT NULL COMMENT 'Ảnh mặt trước',
    `license_back_url` VARCHAR(500) NOT NULL COMMENT 'Ảnh mặt sau',
    `status` VARCHAR(30) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING, APPROVED, REJECTED',
    `rejection_reason` VARCHAR(255) NULL,
    `verified_by` BIGINT NULL COMMENT 'Staff ID phê duyệt',
    `verified_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_rp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_rp_staff` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. PHÂN HỆ QUẢN LÝ XE, TIỆN ÍCH & LỊCH XE (CARS) - [Quân]
-- =============================================================================

CREATE TABLE IF NOT EXISTS `cars` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `owner_id` BIGINT NOT NULL COMMENT 'Chủ xe (User có ROLE_OWNER)',
    `brand` VARCHAR(50) NOT NULL COMMENT 'VD: Toyota, Honda, Hyundai',
    `model` VARCHAR(100) NOT NULL COMMENT 'VD: Vios, City, Accent',
    `year` INT NOT NULL COMMENT 'Năm sản xuất',
    `license_plate` VARCHAR(20) NOT NULL UNIQUE COMMENT 'Biển số xe duy nhất',
    `seat_count` INT NOT NULL DEFAULT 4,
    `transmission` VARCHAR(30) NOT NULL COMMENT 'MANUAL (Số sàn), AUTOMATIC (Số tự động)',
    `fuel_type` VARCHAR(30) NOT NULL COMMENT 'GASOLINE (Xăng), DIESEL (Dầu), ELECTRIC (Điện)',
    `fuel_consumption` DECIMAL(5,2) NULL COMMENT 'Lít/100km hoặc kWh/100km',
    `price_per_day` DECIMAL(12,2) NOT NULL COMMENT 'Giá thuê 1 ngày',
    `extra_km_fee` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Phí vượt 1km (VD: 3.000đ/km)',
    `overtime_fee` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Phí trả trễ 1 giờ (VD: 100.000đ/h)',
    `cleaning_fee` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Phí vệ sinh nếu xe bẩn',
    `address` VARCHAR(255) NOT NULL COMMENT 'Địa điểm giao nhận xe',
    `latitude` DECIMAL(10,8) NULL,
    `longitude` DECIMAL(11,8) NULL,
    `description` TEXT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT, PENDING_APPROVAL, ACTIVE, REJECTED, INACTIVE',
    `rejection_reason` VARCHAR(255) NULL,
    `approved_by` BIGINT NULL,
    `approved_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `is_deleted` BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT `fk_car_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_car_staff` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `car_images` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `car_id` BIGINT NOT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `is_thumbnail` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_ci_car` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Giấy tờ xe: Đăng ký xe, Bảo hiểm, Đăng kiểm (yêu cầu từ US-03)
CREATE TABLE IF NOT EXISTS `car_documents` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `car_id` BIGINT NOT NULL,
    `document_type` VARCHAR(50) NOT NULL COMMENT 'REGISTRATION (Đăng ký xe), INSURANCE (Bảo hiểm), INSPECTION (Đăng kiểm)',
    `document_url` VARCHAR(500) NOT NULL,
    `expiry_date` DATE NULL COMMENT 'Ngày hết hạn giấy tờ (nếu có)',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_cd_car` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `amenities` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Bản đồ, Camera hành trình, Cảm biến lốp, Bluetooth...',
    `icon_url` VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `car_amenities` (
    `car_id` BIGINT NOT NULL,
    `amenity_id` BIGINT NOT NULL,
    PRIMARY KEY (`car_id`, `amenity_id`),
    CONSTRAINT `fk_ca_car` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ca_amenity` FOREIGN KEY (`amenity_id`) REFERENCES `amenities` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `car_availabilities` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `car_id` BIGINT NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `is_available` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'TRUE: rảnh, FALSE: chủ xe tự bận',
    CONSTRAINT `fk_cav_car` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`) ON DELETE CASCADE,
    CONSTRAINT `chk_cav_dates` CHECK (`start_date` <= `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `favorites` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `car_id` BIGINT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_fav_user_car` (`user_id`, `car_id`),
    CONSTRAINT `fk_fav_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_fav_car` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. PHÂN HỆ ĐẶT XE & THANH TOÁN (BOOKINGS & PAYMENTS) - [Vĩ]
-- =============================================================================

CREATE TABLE IF NOT EXISTS `bookings` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `booking_code` VARCHAR(20) NOT NULL UNIQUE COMMENT 'Mã đơn dạng: DS20260908001',
    `renter_id` BIGINT NOT NULL,
    `car_id` BIGINT NOT NULL,
    `start_time` DATETIME NOT NULL COMMENT 'Thời điểm nhận xe',
    `end_time` DATETIME NOT NULL COMMENT 'Thời điểm hẹn trả xe',
    `total_days` INT NOT NULL DEFAULT 1,
    
    -- Lưu vết giá (Snapshot) tại thời điểm đặt, không bị ảnh hưởng khi chủ xe sửa giá xe
    `price_per_day_snapshot` DECIMAL(12,2) NOT NULL,
    `deposit_amount` DECIMAL(12,2) NOT NULL COMMENT 'Tiền cọc giữ chỗ (VD: 30%)',
    `rental_total_amount` DECIMAL(12,2) NOT NULL COMMENT 'Tổng tiền thuê dự kiến',
    `extra_fee_total` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Tổng phụ phí thực tế sau chuyến',
    `refund_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT 'Tiền hoàn lại nếu hủy đơn',

    `status` VARCHAR(30) NOT NULL DEFAULT 'PENDING' 
        COMMENT 'PENDING, CONFIRMED, REJECTED, EXPIRED, DEPOSIT_PAID, IN_PROGRESS, COMPLETED, CANCELLED, DISPUTED',
    
    `cancelled_by` BIGINT NULL,
    `cancel_reason` VARCHAR(255) NULL,
    `cancelled_at` DATETIME NULL,
    `deposit_deadline` DATETIME NULL COMMENT 'Hạn chót thanh toán cọc sau khi Owner duyệt',
    
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT `fk_bk_renter` FOREIGN KEY (`renter_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_bk_car` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_bk_cancel_user` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payments` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `booking_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL COMMENT 'Người thanh toán/nhận tiền',
    `amount` DECIMAL(12,2) NOT NULL,
    `type` VARCHAR(30) NOT NULL COMMENT 'DEPOSIT (Đặt cọc), EXTRA_FEE (Phụ phí), REFUND (Hoàn tiền)',
    `method` VARCHAR(30) NOT NULL DEFAULT 'BANK_TRANSFER' COMMENT 'VNPAY, BANK_TRANSFER, WALLET',
    `transaction_code` VARCHAR(100) NULL COMMENT 'Mã giao dịch ngân hàng / cổng thanh toán',
    `status` VARCHAR(30) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING, SUCCESS, FAILED',
    `paid_at` DATETIME NULL,
    `note` VARCHAR(255) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_pm_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_pm_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 5. PHÂN HỆ BIÊN BẢN BÀN GIAO & TRẢ XE (HANDOVERS) - [Quân]
-- =============================================================================

CREATE TABLE IF NOT EXISTS `handover_records` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `booking_id` BIGINT NOT NULL,
    `record_type` VARCHAR(30) NOT NULL COMMENT 'PICKUP (Giao xe), RETURN (Trả xe)',
    `odometer_km` INT NOT NULL COMMENT 'Số km trên đồng hồ lúc giao/nhận',
    `fuel_percentage` INT NOT NULL COMMENT 'Tỷ lệ nhiên liệu còn lại (0 - 100%)',
    `car_condition_notes` TEXT NULL COMMENT 'Ghi chú vết xước, tình trạng xe',
    `owner_confirmed` BOOLEAN NOT NULL DEFAULT FALSE,
    `renter_confirmed` BOOLEAN NOT NULL DEFAULT FALSE,
    `confirmed_at` DATETIME NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_hr_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `handover_images` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `handover_record_id` BIGINT NOT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `photo_type` VARCHAR(50) NOT NULL COMMENT 'ODOMETER, FRONT, BACK, LEFT, RIGHT, INTERIOR, SCRATCH',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_hi_record` FOREIGN KEY (`handover_record_id`) REFERENCES `handover_records` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 6. PHÂN HỆ ĐÁNH GIÁ, KHIẾU NẠI & THÔNG BÁO (REVIEWS, COMPLAINTS, NOTIS)
-- =============================================================================

CREATE TABLE IF NOT EXISTS `reviews` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `booking_id` BIGINT NOT NULL,
    `car_id` BIGINT NOT NULL,
    `reviewer_id` BIGINT NOT NULL COMMENT 'Người đánh giá (Renter hoặc Owner)',
    `reviewee_id` BIGINT NOT NULL COMMENT 'Người được đánh giá',
    `rating` INT NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
    `comment` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- Mỗi người chỉ review 1 lần/booking, nhưng cả Renter lẫn Owner đều được review
    UNIQUE KEY `uk_review_booking_reviewer` (`booking_id`, `reviewer_id`),
    CONSTRAINT `fk_rv_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_rv_car` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_rv_reviewer` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_rv_reviewee` FOREIGN KEY (`reviewee_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `complaints` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `booking_id` BIGINT NOT NULL,
    `reporter_id` BIGINT NOT NULL COMMENT 'Người khiếu nại',
    `title` VARCHAR(200) NOT NULL,
    `content` TEXT NOT NULL,
    `ai_summary` TEXT NULL COMMENT 'AI tóm tắt tự động nội dung tranh chấp',
    `status` VARCHAR(30) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING, INVESTIGATING, RESOLVED, DISMISSED',
    `resolution_note` TEXT NULL,
    `resolved_by` BIGINT NULL COMMENT 'Staff xử lý',
    `resolved_at` DATETIME NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_cp_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_cp_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_cp_staff` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tách file bằng chứng khiếu nại thành bảng riêng (thay vì JSON trong TEXT)
CREATE TABLE IF NOT EXISTS `complaint_evidence` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `complaint_id` BIGINT NOT NULL,
    `file_url` VARCHAR(500) NOT NULL,
    `file_type` VARCHAR(30) NOT NULL COMMENT 'IMAGE, VIDEO, DOCUMENT',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_ce_complaint` FOREIGN KEY (`complaint_id`) REFERENCES `complaints` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(50) NOT NULL COMMENT 'BOOKING_REQUEST, BOOKING_CONFIRMED, PICKUP_REMINDER, RETURN_REMINDER, SYSTEM',
    `target_url` VARCHAR(255) NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_noti_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 7. CẤU HÌNH HỆ THỐNG (SYSTEM CONFIGS) - [Vĩ]
-- =============================================================================

CREATE TABLE IF NOT EXISTS `system_configs` (
    `config_key` VARCHAR(100) PRIMARY KEY,
    `config_value` VARCHAR(255) NOT NULL,
    `description` VARCHAR(255) NULL,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dữ liệu mẫu cấu hình mặc định:
INSERT INTO `system_configs` (`config_key`, `config_value`, `description`) VALUES
('DEPOSIT_PERCENTAGE', '30', 'Phần trăm tiền đặt cọc giữ xe (30%)'),
('OWNER_ACCEPT_TIMEOUT_HOURS', '24', 'Thời gian chủ xe phải xác nhận trước khi auto-expire (giờ)'),
('DEPOSIT_PAYMENT_TIMEOUT_HOURS', '2', 'Thời hạn thanh toán cọc sau khi chủ xe duyệt (giờ)'),
('CANCEL_REFUND_BEFORE_48H', '100', 'Tỷ lệ hoàn tiền khi hủy trước 48h (%)'),
('CANCEL_REFUND_BEFORE_24H', '70', 'Tỷ lệ hoàn tiền khi hủy trước 24h (%)'),
('CANCEL_REFUND_UNDER_24H', '0', 'Tỷ lệ hoàn tiền khi hủy sát giờ (%)');

-- =============================================================================
-- 8. BẢNG GHI LOG HÀNH ĐỘNG (AUDIT LOGS) - [Vĩ]
-- =============================================================================

CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `actor_id` BIGINT NOT NULL COMMENT 'Admin/Staff thực hiện hành động',
    `action` VARCHAR(100) NOT NULL COMMENT 'BAN_USER, UNBAN_USER, FORCE_CANCEL_BOOKING, APPROVE_CAR, REJECT_CAR, APPROVE_LICENSE, ...',
    `target_type` VARCHAR(50) NOT NULL COMMENT 'USER, CAR, BOOKING, COMPLAINT',
    `target_id` BIGINT NOT NULL COMMENT 'ID của đối tượng bị tác động',
    `detail` TEXT NULL COMMENT 'Mô tả chi tiết hoặc dữ liệu trước/sau',
    `ip_address` VARCHAR(45) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_al_actor` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 9. INDEXES — TỐI ƯU HIỆU NĂNG TRUY VẤN
-- =============================================================================

-- Users: tìm theo email, status
ALTER TABLE `users` ADD INDEX `idx_users_status` (`status`);
ALTER TABLE `users` ADD INDEX `idx_users_email_status` (`email`, `status`);

-- Cars: tìm kiếm & lọc xe (trang search chính)
ALTER TABLE `cars` ADD INDEX `idx_cars_status` (`status`);
ALTER TABLE `cars` ADD INDEX `idx_cars_owner` (`owner_id`, `status`);
ALTER TABLE `cars` ADD INDEX `idx_cars_search` (`status`, `seat_count`, `transmission`, `fuel_type`, `price_per_day`);
ALTER TABLE `cars` ADD INDEX `idx_cars_location` (`latitude`, `longitude`);

-- Car documents: tìm theo xe
ALTER TABLE `car_documents` ADD INDEX `idx_cd_car` (`car_id`, `document_type`);

-- Car availabilities: check xung đột lịch
ALTER TABLE `car_availabilities` ADD INDEX `idx_cav_car_dates` (`car_id`, `start_date`, `end_date`, `is_available`);

-- Bookings: truy vấn booking theo trạng thái, theo renter, check xung đột lịch xe
ALTER TABLE `bookings` ADD INDEX `idx_bk_status` (`status`);
ALTER TABLE `bookings` ADD INDEX `idx_bk_renter` (`renter_id`, `status`);
ALTER TABLE `bookings` ADD INDEX `idx_bk_car_time` (`car_id`, `start_time`, `end_time`);
ALTER TABLE `bookings` ADD INDEX `idx_bk_deposit_deadline` (`deposit_deadline`, `status`);

-- Payments: lịch sử thanh toán
ALTER TABLE `payments` ADD INDEX `idx_pm_booking` (`booking_id`, `type`);
ALTER TABLE `payments` ADD INDEX `idx_pm_user` (`user_id`, `status`);

-- Handover records: tìm biên bản theo booking
ALTER TABLE `handover_records` ADD INDEX `idx_hr_booking_type` (`booking_id`, `record_type`);

-- Reviews: tính trung bình sao cho xe & user
ALTER TABLE `reviews` ADD INDEX `idx_rv_car` (`car_id`, `rating`);
ALTER TABLE `reviews` ADD INDEX `idx_rv_reviewee` (`reviewee_id`, `rating`);

-- Complaints: danh sách khiếu nại cho Staff
ALTER TABLE `complaints` ADD INDEX `idx_cp_status` (`status`, `created_at`);

-- Notifications: lấy thông báo chưa đọc
ALTER TABLE `notifications` ADD INDEX `idx_noti_user_read` (`user_id`, `is_read`, `created_at`);

-- Audit logs: lọc theo hành động
ALTER TABLE `audit_logs` ADD INDEX `idx_al_action` (`action`, `created_at`);
ALTER TABLE `audit_logs` ADD INDEX `idx_al_target` (`target_type`, `target_id`);
