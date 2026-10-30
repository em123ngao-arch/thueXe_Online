-- =============================================================================
-- DRIVESHARE PLATFORM — DATABASE SCHEMA (MYSQL 8.0+ / MYSQL WORKBENCH)
-- =============================================================================
-- Dự án: DriveShare — Nền tảng chia sẻ và cho thuê xe trực tuyến P2P
-- Phân hệ: Hệ thống Cơ sở dữ liệu quan hệ (RDBMS) chuẩn MySQL 8
-- Nguồn dữ liệu: Trích xuất 100% từ Spring Data JPA Entities & Flyway Migrations (V2 - V8)
-- Thiết kế tối ưu cho: MySQL Workbench 8.0, DBeaver, phpMyAdmin
-- Quy chuẩn: ANSI SQL / MySQL 8 InnoDB, utf8mb4_unicode_ci, Strict Foreign Keys
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `driveshare_db` 
    DEFAULT CHARACTER SET utf8mb4 
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE `driveshare_db`;

-- Tắt kiểm tra khóa ngoại tạm thời để khởi tạo theo thứ tự an toàn
SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- PHẦN 1: XÓA CÁC BẢNG NẾU ĐÃ TỒN TẠI (DROP TABLE IF EXISTS)
-- =============================================================================
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `rental_disputes`;
DROP TABLE IF EXISTS `rental_inspections`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `rentals`;
DROP TABLE IF EXISTS `car_calendar_blocks`;
DROP TABLE IF EXISTS `car_documents`;
DROP TABLE IF EXISTS `car_images`;
DROP TABLE IF EXISTS `cars`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `chat_memory`;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `auth_sessions`;
DROP TABLE IF EXISTS `email_change_tokens`;
DROP TABLE IF EXISTS `password_reset_tokens`;
DROP TABLE IF EXISTS `owner_profiles`;
DROP TABLE IF EXISTS `renter_profiles`;
DROP TABLE IF EXISTS `user_roles`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `roles`;

-- =============================================================================
-- PHẦN 2: TẠO CÁC BẢNG ĐỘC LẬP VÀ DANH MỤC CƠ BẢN
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Bảng `roles`: Vai trò người dùng trong hệ thống (RBAC)
-- Ánh xạ: com.driveshare.modules.user.entity.Role
-- -----------------------------------------------------------------------------
CREATE TABLE `roles` (
    `role_id`           BIGINT NOT NULL AUTO_INCREMENT,
    `role_name`         VARCHAR(30) NOT NULL,
    PRIMARY KEY (`role_id`),
    UNIQUE KEY `uk_roles_role_name` (`role_name`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Bảng `users`: Thông tin người dùng trung tâm (Customer, Owner, Admin)
-- Ánh xạ: com.driveshare.modules.user.entity.User & BaseEntity & Migrations V2, V7
-- -----------------------------------------------------------------------------
CREATE TABLE `users` (
    `user_id`                   BIGINT NOT NULL AUTO_INCREMENT,
    `username`                  VARCHAR(50) NOT NULL,
    `email`                     VARCHAR(150) NOT NULL,
    `phone`                     VARCHAR(20) DEFAULT NULL,
    `password_hash`             VARCHAR(255) NOT NULL,
    `full_name`                 VARCHAR(150) DEFAULT NULL,
    `avatar_url`                VARCHAR(500) DEFAULT NULL,
    `address`                   VARCHAR(255) DEFAULT NULL,
    `id_card_number`            VARCHAR(20) DEFAULT NULL,
    `status`                    VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `failed_login_attempts`     INT NOT NULL DEFAULT 0,
    `locked_until`              DATETIME DEFAULT NULL,
    `token_version`             BIGINT NOT NULL DEFAULT 0,
    `google_id`                 VARCHAR(255) DEFAULT NULL,
    `auth_provider`             VARCHAR(20) NOT NULL DEFAULT 'LOCAL',
    `bank_verification_status`  VARCHAR(30) DEFAULT 'UNVERIFIED',
    `bank_rejection_reason`     TEXT DEFAULT NULL,
    `created_at`                DATETIME DEFAULT CURRENT_TIMESTAMP,
    `created_by`                BIGINT DEFAULT NULL,
    `updated_at`                DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `updated_by`                BIGINT DEFAULT NULL,
    `deleted_at`                DATETIME DEFAULT NULL,
    `deleted_by`                BIGINT DEFAULT NULL,
    PRIMARY KEY (`user_id`),
    UNIQUE KEY `uk_users_username` (`username`),
    UNIQUE KEY `uk_users_email` (`email`),
    UNIQUE KEY `uk_users_phone` (`phone`),
    UNIQUE KEY `uk_users_id_card` (`id_card_number`),
    UNIQUE KEY `uk_users_google_id` (`google_id`),
    KEY `idx_users_status` (`status`),
    KEY `idx_users_auth_provider` (`auth_provider`),
    CONSTRAINT `chk_users_auth_provider` CHECK (`auth_provider` IN ('LOCAL', 'GOOGLE'))
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Bảng `user_roles`: Bảng trung gian phân quyền N-N giữa users và roles
-- Ánh xạ: com.driveshare.modules.user.entity.User.roles
-- -----------------------------------------------------------------------------
CREATE TABLE `user_roles` (
    `user_id`       BIGINT NOT NULL,
    `role_id`       BIGINT NOT NULL,
    `assigned_at`   DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`, `role_id`),
    KEY `idx_user_roles_role_id` (`role_id`),
    CONSTRAINT `fk_user_roles_user` 
        FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_user_roles_role` 
        FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Bảng `renter_profiles`: Hồ sơ mở rộng 1-1 cho Khách thuê (GPLX eKYC)
-- Ánh xạ: com.driveshare.modules.user.entity.RenterProfile & BaseEntity
-- -----------------------------------------------------------------------------
CREATE TABLE `renter_profiles` (
    `user_id`                       BIGINT NOT NULL,
    `license_number`                VARCHAR(30) DEFAULT NULL,
    `license_full_name`             VARCHAR(150) DEFAULT NULL,
    `license_dob`                   DATE DEFAULT NULL,
    `license_issue_date`            DATE DEFAULT NULL,
    `license_expiry_date`           DATE DEFAULT NULL,
    `license_front_url`             VARCHAR(500) DEFAULT NULL,
    `license_back_url`              VARCHAR(500) DEFAULT NULL,
    `id_card_front_url`             VARCHAR(500) DEFAULT NULL,
    `id_card_back_url`              VARCHAR(500) DEFAULT NULL,
    `verification_status`           VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `rejection_reason`              VARCHAR(500) DEFAULT NULL,
    `license_verification_status`   VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `license_verified_by`           BIGINT DEFAULT NULL,
    `license_verified_at`           DATETIME DEFAULT NULL,
    `license_rejection_reason`      VARCHAR(500) DEFAULT NULL,
    `created_at`                    DATETIME DEFAULT CURRENT_TIMESTAMP,
    `created_by`                    BIGINT DEFAULT NULL,
    `updated_at`                    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `updated_by`                    BIGINT DEFAULT NULL,
    `deleted_at`                    DATETIME DEFAULT NULL,
    `deleted_by`                    BIGINT DEFAULT NULL,
    PRIMARY KEY (`user_id`),
    UNIQUE KEY `uk_renter_license_number` (`license_number`),
    KEY `idx_renter_profiles_status` (`license_verification_status`),
    KEY `idx_renter_license_verified_by` (`license_verified_by`),
    CONSTRAINT `fk_renter_profiles_user` 
        FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_renter_profiles_verified_by` 
        FOREIGN KEY (`license_verified_by`) REFERENCES `users` (`user_id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Bảng `owner_profiles`: Hồ sơ mở rộng 1-1 cho Chủ xe (CCCD eKYC & Tài khoản Bank)
-- Ánh xạ: com.driveshare.modules.user.entity.OwnerProfile & BaseEntity
-- -----------------------------------------------------------------------------
CREATE TABLE `owner_profiles` (
    `user_id`               BIGINT NOT NULL,
    `id_card_front_url`     VARCHAR(500) DEFAULT NULL,
    `id_card_back_url`      VARCHAR(500) DEFAULT NULL,
    `bank_account_number`   VARCHAR(30) DEFAULT NULL,
    `bank_name`             VARCHAR(100) DEFAULT NULL,
    `verification_status`   VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `verified_by`           BIGINT DEFAULT NULL,
    `verified_at`           DATETIME DEFAULT NULL,
    `rejection_reason`      VARCHAR(500) DEFAULT NULL,
    `created_at`            DATETIME DEFAULT CURRENT_TIMESTAMP,
    `created_by`            BIGINT DEFAULT NULL,
    `updated_at`            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `updated_by`            BIGINT DEFAULT NULL,
    `deleted_at`            DATETIME DEFAULT NULL,
    `deleted_by`            BIGINT DEFAULT NULL,
    PRIMARY KEY (`user_id`),
    KEY `idx_owner_profiles_status` (`verification_status`),
    KEY `idx_owner_profiles_verified_by` (`verified_by`),
    CONSTRAINT `fk_owner_profiles_user` 
        FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_owner_profiles_verified_by` 
        FOREIGN KEY (`verified_by`) REFERENCES `users` (`user_id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. Bảng `password_reset_tokens`: Mã xác thực khôi phục mật khẩu
-- Ánh xạ: com.driveshare.modules.auth.entity.PasswordResetToken
-- -----------------------------------------------------------------------------
CREATE TABLE `password_reset_tokens` (
    `id`            BIGINT NOT NULL AUTO_INCREMENT,
    `user_id`       BIGINT NOT NULL,
    `token_hash`    VARCHAR(64) NOT NULL,
    `expires_at`    DATETIME NOT NULL,
    `used_at`       DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_password_reset_token_hash` (`token_hash`),
    KEY `idx_password_reset_user` (`user_id`),
    CONSTRAINT `fk_password_reset_user` 
        FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 7. Bảng `email_change_tokens`: Token xác nhận thay đổi địa chỉ email
-- Ánh xạ: com.driveshare.modules.auth.entity.EmailChangeToken
-- -----------------------------------------------------------------------------
CREATE TABLE `email_change_tokens` (
    `id`            BIGINT NOT NULL AUTO_INCREMENT,
    `user_id`       BIGINT NOT NULL,
    `new_email`     VARCHAR(150) NOT NULL,
    `token_hash`    VARCHAR(64) NOT NULL,
    `expires_at`    DATETIME NOT NULL,
    `used_at`       DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_email_change_token_hash` (`token_hash`),
    KEY `idx_email_change_user` (`user_id`),
    CONSTRAINT `fk_email_change_user` 
        FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. Bảng `auth_sessions`: Quản lý phiên JWT và Blacklist thu hồi token (JTI)
-- Ánh xạ: com.driveshare.modules.auth.entity.AuthSession
-- -----------------------------------------------------------------------------
CREATE TABLE `auth_sessions` (
    `id`            BIGINT NOT NULL AUTO_INCREMENT,
    `jti`           VARCHAR(64) NOT NULL,
    `user_id`       BIGINT NOT NULL,
    `token_version` BIGINT NOT NULL DEFAULT 0,
    `expires_at`    DATETIME NOT NULL,
    `revoked_at`    DATETIME DEFAULT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_auth_session_jti` (`jti`),
    KEY `idx_auth_session_user` (`user_id`),
    CONSTRAINT `fk_auth_sessions_user` 
        FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. Bảng `audit_logs`: Nhật ký kiểm toán hành vi quản trị hệ thống
-- Ánh xạ: com.driveshare.modules.admin.entity.AuditLog
-- -----------------------------------------------------------------------------
CREATE TABLE `audit_logs` (
    `log_id`            BIGINT NOT NULL AUTO_INCREMENT,
    `action`            VARCHAR(100) NOT NULL,
    `actor_id`          BIGINT DEFAULT NULL,
    `actor_username`    VARCHAR(100) DEFAULT NULL,
    `target_type`       VARCHAR(50) NOT NULL,
    `target_id`         BIGINT NOT NULL,
    `details`           VARCHAR(1000) DEFAULT NULL,
    `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`log_id`),
    KEY `idx_audit_logs_actor` (`actor_id`),
    KEY `idx_audit_logs_target` (`target_type`, `target_id`),
    CONSTRAINT `fk_audit_logs_actor` 
        FOREIGN KEY (`actor_id`) REFERENCES `users` (`user_id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 10. Bảng `chat_memory`: Lưu trữ bộ nhớ ngữ cảnh trò chuyện Trợ lý AI Gemini
-- Ánh xạ: com.driveshare.modules.ai.entity.ChatMemoryEntity
-- -----------------------------------------------------------------------------
CREATE TABLE `chat_memory` (
    `id`            BIGINT NOT NULL AUTO_INCREMENT,
    `user_id`       BIGINT NOT NULL,
    `session_id`    VARCHAR(100) NOT NULL,
    `messages`      TEXT NOT NULL,
    `updated_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_session` (`user_id`, `session_id`),
    KEY `idx_chat_memory_user` (`user_id`),
    CONSTRAINT `fk_chat_memory_user` 
        FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 11. Bảng `notifications`: Thông báo in-app cho người dùng (chuông thông báo)
-- Ánh xạ: com.driveshare.modules.notification.entity.Notification & Migration V6
-- -----------------------------------------------------------------------------
CREATE TABLE `notifications` (
    `notification_id`   BIGINT NOT NULL AUTO_INCREMENT,
    `user_id`           BIGINT NOT NULL,
    `title`             VARCHAR(150) NOT NULL,
    `content`           TEXT NOT NULL,
    `type`              VARCHAR(50) NOT NULL,
    `reference_id`      BIGINT DEFAULT NULL,
    `is_read`           BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at`        DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`notification_id`),
    KEY `idx_notifications_user_id` (`user_id`, `is_read`),
    CONSTRAINT `fk_notifications_user` 
        FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =============================================================================
-- PHẦN 3: PHÂN HỆ QUẢN LÝ PHƯƠNG TIỆN (CARS & ASSETS)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 12. Bảng `cars`: Danh mục phương tiện cho thuê
-- Ánh xạ: com.driveshare.modules.car.entity.Car & BaseEntity & Migration V6
-- -----------------------------------------------------------------------------
CREATE TABLE `cars` (
    `car_id`                BIGINT NOT NULL AUTO_INCREMENT,
    `owner_id`              BIGINT NOT NULL,
    `plate_number`          VARCHAR(20) NOT NULL,
    `brand`                 VARCHAR(100) NOT NULL,
    `model`                 VARCHAR(100) NOT NULL,
    `year`                  INT NOT NULL,
    `color`                 VARCHAR(50) DEFAULT NULL,
    `seats`                 INT NOT NULL,
    `transmission`          VARCHAR(20) DEFAULT NULL,
    `fuel_type`             VARCHAR(20) DEFAULT NULL,
    `price_per_day`         DECIMAL(15,2) NOT NULL,
    `address`               VARCHAR(500) DEFAULT NULL,
    `province`              VARCHAR(100) DEFAULT NULL,
    `latitude`              DECIMAL(10,7) DEFAULT NULL,
    `longitude`             DECIMAL(10,7) DEFAULT NULL,
    `description`           TEXT DEFAULT NULL,
    `features`              TEXT DEFAULT NULL,
    `thumbnail_url`         VARCHAR(500) DEFAULT NULL,
    `has_driver_service`    BOOLEAN DEFAULT FALSE,
    `driver_fee_per_day`    DECIMAL(12,2) DEFAULT 0.00,
    `rating`                DECIMAL(3,2) DEFAULT 5.00,
    `rating_count`          INT DEFAULT 0,
    `status`                VARCHAR(20) NOT NULL DEFAULT 'PENDING_REVIEW',
    `rejection_reason`      TEXT DEFAULT NULL,
    `approved_at`           DATETIME DEFAULT NULL,
    `approved_by`           BIGINT DEFAULT NULL,
    `created_at`            DATETIME DEFAULT CURRENT_TIMESTAMP,
    `created_by`            BIGINT DEFAULT NULL,
    `updated_at`            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `updated_by`            BIGINT DEFAULT NULL,
    `deleted_at`            DATETIME DEFAULT NULL,
    `deleted_by`            BIGINT DEFAULT NULL,
    PRIMARY KEY (`car_id`),
    UNIQUE KEY `uk_cars_plate_number` (`plate_number`),
    KEY `idx_cars_owner_id` (`owner_id`),
    KEY `idx_cars_status` (`status`),
    KEY `idx_cars_approved_by` (`approved_by`),
    KEY `idx_cars_filter` (`status`, `brand`, `price_per_day`, `seats`),
    CONSTRAINT `fk_cars_owner` 
        FOREIGN KEY (`owner_id`) REFERENCES `users` (`user_id`) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_cars_approved_by` 
        FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 13. Bảng `car_images`: Thư viện album ảnh xe (Cloudinary CDN)
-- Ánh xạ: com.driveshare.modules.car.entity.CarImage
-- -----------------------------------------------------------------------------
CREATE TABLE `car_images` (
    `image_id`      BIGINT NOT NULL AUTO_INCREMENT,
    `car_id`        BIGINT NOT NULL,
    `image_url`     VARCHAR(500) NOT NULL,
    `is_thumbnail`  BOOLEAN DEFAULT FALSE,
    `created_at`    DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`image_id`),
    KEY `idx_car_images_car_id` (`car_id`),
    CONSTRAINT `fk_car_images_car` 
        FOREIGN KEY (`car_id`) REFERENCES `cars` (`car_id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 14. Bảng `car_documents`: Giấy tờ đăng kiểm, bảo hiểm, cà-vẹt xe
-- Ánh xạ: com.driveshare.modules.car.entity.CarDocument
-- -----------------------------------------------------------------------------
CREATE TABLE `car_documents` (
    `document_id`           BIGINT NOT NULL AUTO_INCREMENT,
    `car_id`                BIGINT NOT NULL,
    `document_type`         VARCHAR(50) NOT NULL,
    `document_url`          VARCHAR(500) NOT NULL,
    `verification_status`   VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `rejection_reason`      VARCHAR(500) DEFAULT NULL,
    `verified_by`           BIGINT DEFAULT NULL,
    `verified_at`           DATETIME DEFAULT NULL,
    `created_at`            DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`document_id`),
    KEY `idx_car_documents_car_id` (`car_id`),
    KEY `idx_car_documents_verified_by` (`verified_by`),
    CONSTRAINT `fk_car_documents_car` 
        FOREIGN KEY (`car_id`) REFERENCES `cars` (`car_id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_car_documents_verified_by` 
        FOREIGN KEY (`verified_by`) REFERENCES `users` (`user_id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 15. Bảng `car_calendar_blocks`: Quản lý ngày bận/khóa lịch xe của chủ xe
-- Ánh xạ: com.driveshare.modules.car.entity.CarCalendarBlock & Migration V5
-- -----------------------------------------------------------------------------
CREATE TABLE `car_calendar_blocks` (
    `block_id`      BIGINT NOT NULL AUTO_INCREMENT,
    `car_id`        BIGINT NOT NULL,
    `start_date`    DATE NOT NULL,
    `end_date`      DATE NOT NULL,
    `reason`        VARCHAR(255) DEFAULT 'Chủ xe bận / Bảo dưỡng',
    `created_at`    DATETIME DEFAULT CURRENT_TIMESTAMP,
    `created_by`    BIGINT DEFAULT NULL,
    `updated_at`    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `updated_by`    BIGINT DEFAULT NULL,
    `deleted_at`    DATETIME DEFAULT NULL,
    `deleted_by`    BIGINT DEFAULT NULL,
    PRIMARY KEY (`block_id`),
    KEY `idx_calendar_blocks_car_dates` (`car_id`, `start_date`, `end_date`),
    KEY `idx_calendar_blocks_deleted` (`deleted_at`),
    CONSTRAINT `chk_block_dates` CHECK (`end_date` >= `start_date`),
    CONSTRAINT `fk_car_calendar_blocks_car` 
        FOREIGN KEY (`car_id`) REFERENCES `cars` (`car_id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =============================================================================
-- PHẦN 4: HỢP ĐỒNG THUÊ XE & GIAO DỊCH KÝ QUỸ (RENTALS & ESCROW)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 16. Bảng `rentals`: Hợp đồng thuê xe & tiến trình đơn thuê (Shopee Stepper)
-- Ánh xạ: com.driveshare.modules.rental.entity.Rental & Migrations V3, V4, V6, V8
-- -----------------------------------------------------------------------------
CREATE TABLE `rentals` (
    `rental_id`                 BIGINT NOT NULL AUTO_INCREMENT,
    `car_id`                    BIGINT NOT NULL,
    `renter_id`                 BIGINT NOT NULL,
    `start_date`                DATE NOT NULL,
    `end_date`                  DATE NOT NULL,
    `total_days`                INT NOT NULL DEFAULT 1,
    `price_per_day`             DECIMAL(12,2) NOT NULL,
    `total_price`               DECIMAL(12,2) NOT NULL,
    `deposit_amount`            DECIMAL(12,2) NOT NULL,
    `status`                    VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    `payment_expires_at`        DATETIME DEFAULT NULL,
    `reject_reason`             VARCHAR(500) DEFAULT NULL,
    `note`                      VARCHAR(500) DEFAULT NULL,
    `with_driver`               BOOLEAN DEFAULT FALSE,
    `driver_fee`                DECIMAL(12,2) DEFAULT 0.00,
    `overdue_hours`             INT DEFAULT 0,
    `penalty_fee`               DECIMAL(12,2) DEFAULT 0.00,
    `actual_return_time`        DATETIME DEFAULT NULL,
    `is_blacklisted_triggered`  BOOLEAN DEFAULT FALSE,
    `created_at`                DATETIME DEFAULT CURRENT_TIMESTAMP,
    `created_by`                BIGINT DEFAULT NULL,
    `updated_at`                DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `updated_by`                BIGINT DEFAULT NULL,
    `deleted_at`                DATETIME DEFAULT NULL,
    `deleted_by`                BIGINT DEFAULT NULL,
    PRIMARY KEY (`rental_id`),
    KEY `idx_rentals_car_dates` (`car_id`, `start_date`, `end_date`, `status`),
    KEY `idx_rentals_renter_status` (`renter_id`, `status`),
    KEY `idx_rentals_status_end_date` (`status`, `end_date`),
    KEY `idx_rentals_payment_expires` (`status`, `payment_expires_at`),
    CONSTRAINT `chk_rental_dates` CHECK (`end_date` >= `start_date`),
    CONSTRAINT `fk_rentals_car` 
        FOREIGN KEY (`car_id`) REFERENCES `cars` (`car_id`) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_rentals_renter` 
        FOREIGN KEY (`renter_id`) REFERENCES `users` (`user_id`) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 17. Bảng `payments`: Giao dịch thanh toán cọc 30% VietQR & quyết toán
-- Ánh xạ: com.driveshare.modules.payment.entity.Payment & Migration V3
-- -----------------------------------------------------------------------------
CREATE TABLE `payments` (
    `payment_id`        BIGINT NOT NULL AUTO_INCREMENT,
    `rental_id`         BIGINT NOT NULL,
    `amount`            DECIMAL(12,2) NOT NULL,
    `payment_type`      VARCHAR(30) NOT NULL DEFAULT 'DEPOSIT',
    `payment_method`    VARCHAR(30) NOT NULL DEFAULT 'VIETQR',
    `status`            VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    `transaction_code`  VARCHAR(100) DEFAULT NULL,
    `qr_code_url`       VARCHAR(500) DEFAULT NULL,
    `paid_at`           DATETIME DEFAULT NULL,
    `created_at`        DATETIME DEFAULT CURRENT_TIMESTAMP,
    `created_by`        BIGINT DEFAULT NULL,
    `updated_at`        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `updated_by`        BIGINT DEFAULT NULL,
    `deleted_at`        DATETIME DEFAULT NULL,
    `deleted_by`        BIGINT DEFAULT NULL,
    PRIMARY KEY (`payment_id`),
    UNIQUE KEY `uk_payments_transaction_code` (`transaction_code`),
    KEY `idx_payments_rental_id` (`rental_id`),
    KEY `idx_payments_status` (`status`),
    CONSTRAINT `fk_payments_rental` 
        FOREIGN KEY (`rental_id`) REFERENCES `rentals` (`rental_id`) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =============================================================================
-- PHẦN 5: BIÊN BẢN BÀN GIAO, ĐÁNH GIÁ & TRANH CHẤP PHÁP LÝ
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 18. Bảng `rental_inspections`: Biên bản bàn giao ODO Check-in & Check-out
-- Ánh xạ: com.driveshare.modules.rental.entity.RentalInspection & Migration V6
-- -----------------------------------------------------------------------------
CREATE TABLE `rental_inspections` (
    `inspection_id`     BIGINT NOT NULL AUTO_INCREMENT,
    `rental_id`         BIGINT NOT NULL,
    `inspection_type`   VARCHAR(20) NOT NULL,
    `odo_meter`         INT NOT NULL,
    `fuel_level`        INT NOT NULL,
    `images`            TEXT DEFAULT NULL,
    `notes`             TEXT DEFAULT NULL,
    `extra_fee`         DECIMAL(12,2) DEFAULT 0.00,
    `extra_fee_reason`  VARCHAR(255) DEFAULT NULL,
    `performed_by`      BIGINT NOT NULL,
    `created_at`        DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`inspection_id`),
    KEY `idx_inspections_rental_id` (`rental_id`),
    KEY `idx_inspections_type` (`rental_id`, `inspection_type`),
    KEY `idx_inspections_performer` (`performed_by`),
    CONSTRAINT `chk_inspection_type` CHECK (`inspection_type` IN ('CHECK_IN', 'CHECK_OUT')),
    CONSTRAINT `chk_fuel_level` CHECK (`fuel_level` >= 0 AND `fuel_level` <= 100),
    CONSTRAINT `fk_inspections_rental` 
        FOREIGN KEY (`rental_id`) REFERENCES `rentals` (`rental_id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_inspections_performed_by` 
        FOREIGN KEY (`performed_by`) REFERENCES `users` (`user_id`) 
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 19. Bảng `rental_disputes`: Khiếu nại bùng hẹn, tranh chấp bồi thường & phạt
-- Ánh xạ: com.driveshare.modules.rental.entity.RentalDispute & Migration V7
-- -----------------------------------------------------------------------------
CREATE TABLE `rental_disputes` (
    `id`                BIGINT NOT NULL AUTO_INCREMENT,
    `rental_id`         BIGINT NOT NULL,
    `reporter_id`       BIGINT NOT NULL,
    `reason`            TEXT NOT NULL,
    `proof_urls`        TEXT DEFAULT NULL,
    `status`            VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    `refund_amount`     DECIMAL(12,2) DEFAULT 0.00,
    `penalty_amount`    DECIMAL(12,2) DEFAULT 0.00,
    `admin_note`        TEXT DEFAULT NULL,
    `resolved_by`       BIGINT DEFAULT NULL,
    `resolved_at`       DATETIME DEFAULT NULL,
    `created_at`        DATETIME DEFAULT CURRENT_TIMESTAMP,
    `created_by`        BIGINT DEFAULT NULL,
    `updated_at`        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `updated_by`        BIGINT DEFAULT NULL,
    `deleted_at`        DATETIME DEFAULT NULL,
    `deleted_by`        BIGINT DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_rental_disputes_rental` (`rental_id`),
    KEY `idx_rental_disputes_reporter` (`reporter_id`),
    KEY `idx_rental_disputes_resolver` (`resolved_by`),
    KEY `idx_rental_disputes_status` (`status`),
    CONSTRAINT `chk_dispute_status` CHECK (`status` IN ('PENDING', 'RESOLVED_REFUND', 'REJECTED')),
    CONSTRAINT `fk_disputes_rental` 
        FOREIGN KEY (`rental_id`) REFERENCES `rentals` (`rental_id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_disputes_reporter` 
        FOREIGN KEY (`reporter_id`) REFERENCES `users` (`user_id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_disputes_resolver` 
        FOREIGN KEY (`resolved_by`) REFERENCES `users` (`user_id`) 
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 20. Bảng `reviews`: Đánh giá 1-5 sao và nhận xét sau chuyến đi (1:1 với rentals)
-- Ánh xạ: com.driveshare.modules.rental.entity.Review & Migration V6
-- -----------------------------------------------------------------------------
CREATE TABLE `reviews` (
    `review_id`     BIGINT NOT NULL AUTO_INCREMENT,
    `rental_id`     BIGINT NOT NULL,
    `car_id`        BIGINT NOT NULL,
    `renter_id`     BIGINT NOT NULL,
    `rating`        INT NOT NULL,
    `comment`       TEXT DEFAULT NULL,
    `created_at`    DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`review_id`),
    UNIQUE KEY `uk_reviews_rental_id` (`rental_id`),
    KEY `idx_reviews_car_id` (`car_id`),
    KEY `idx_reviews_renter_id` (`renter_id`),
    CONSTRAINT `chk_review_rating` CHECK (`rating` >= 1 AND `rating` <= 5),
    CONSTRAINT `fk_reviews_rental` 
        FOREIGN KEY (`rental_id`) REFERENCES `rentals` (`rental_id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_reviews_car` 
        FOREIGN KEY (`car_id`) REFERENCES `cars` (`car_id`) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_reviews_renter` 
        FOREIGN KEY (`renter_id`) REFERENCES `users` (`user_id`) 
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- =============================================================================
-- KHÔI PHỤC KIỂM TRA KHÓA NGOẠI
-- =============================================================================
SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;

-- =============================================================================
-- PHẦN 6: DỮ LIỆU DANH MỤC KHỞI TẠO BAN ĐẦU (SEED DATA CHO ROLES)
-- =============================================================================
INSERT INTO `roles` (`role_id`, `role_name`) VALUES 
(1, 'ROLE_CUSTOMER'),
(2, 'ROLE_CAR_OWNER'),
(3, 'ROLE_ADMIN')
ON DUPLICATE KEY UPDATE `role_name` = VALUES(`role_name`);
