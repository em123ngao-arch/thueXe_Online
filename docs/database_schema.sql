-- =============================================================================
-- DRIVESHARE — CƠ SỞ DỮ LIỆU v2.2 (Sinh viên)
-- 3 Database · 8 bảng · MySQL 8.0+
-- =============================================================================


-- #############################################################################
-- PHẦN 1: DATABASE KHÁCH THUÊ
-- #############################################################################

CREATE DATABASE IF NOT EXISTS `driveshare_renter_db`
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `driveshare_renter_db`;


-- 1. Khách thuê
CREATE TABLE IF NOT EXISTS `renters` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `avatar_url` VARCHAR(500) NULL,
    `license_number` VARCHAR(50) NULL,
    `license_image_url` VARCHAR(500) NULL,
    `license_status` VARCHAR(30) NOT NULL DEFAULT 'UNVERIFIED'
        COMMENT 'UNVERIFIED, PENDING, APPROVED, REJECTED',
    `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE, BANNED',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 2. Đơn đặt thuê xe
-- PENDING → CONFIRMED → DEPOSIT_PAID → IN_PROGRESS → COMPLETED
-- PENDING → REJECTED | EXPIRED | CANCELLED
CREATE TABLE IF NOT EXISTS `bookings` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `renter_id` BIGINT NOT NULL,
    `car_id` BIGINT NOT NULL COMMENT 'Tham chiếu owner_db.cars.id',
    `start_time` DATETIME NOT NULL,
    `end_time` DATETIME NOT NULL,
    `total_days` INT NOT NULL DEFAULT 1,
    `price_per_day` DECIMAL(12,2) NOT NULL,
    `deposit_amount` DECIMAL(12,2) NOT NULL,
    `total_amount` DECIMAL(12,2) NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'PENDING'
        COMMENT 'PENDING, CONFIRMED, DEPOSIT_PAID, IN_PROGRESS, COMPLETED, CANCELLED, REJECTED, EXPIRED',
    `cancel_reason` VARCHAR(255) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT `fk_bk_renter` FOREIGN KEY (`renter_id`) REFERENCES `renters` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 3. Thanh toán
CREATE TABLE IF NOT EXISTS `payments` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `booking_id` BIGINT NOT NULL,
    `renter_id` BIGINT NOT NULL,
    `amount` DECIMAL(12,2) NOT NULL,
    `payment_type` VARCHAR(30) NOT NULL COMMENT 'DEPOSIT, REFUND',
    `status` VARCHAR(30) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING, SUCCESS, FAILED',
    `paid_at` DATETIME NULL,
    `note` VARCHAR(255) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT `fk_pm_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`),
    CONSTRAINT `fk_pm_renter` FOREIGN KEY (`renter_id`) REFERENCES `renters` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- #############################################################################
-- PHẦN 2: DATABASE CHỦ XE
-- #############################################################################

CREATE DATABASE IF NOT EXISTS `driveshare_owner_db`
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `driveshare_owner_db`;


-- 4. Chủ xe
CREATE TABLE IF NOT EXISTS `owners` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `avatar_url` VARCHAR(500) NULL,
    `address` VARCHAR(255) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE, BANNED',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 5. Xe cho thuê
-- DRAFT → PENDING_APPROVAL → ACTIVE | REJECTED
CREATE TABLE IF NOT EXISTS `cars` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `owner_id` BIGINT NOT NULL,
    `brand` VARCHAR(50) NOT NULL,
    `model` VARCHAR(100) NOT NULL,
    `year` INT NOT NULL,
    `license_plate` VARCHAR(20) NOT NULL UNIQUE,
    `seat_count` INT NOT NULL DEFAULT 4,
    `transmission` VARCHAR(30) NOT NULL COMMENT 'MANUAL, AUTOMATIC',
    `fuel_type` VARCHAR(30) NOT NULL COMMENT 'GASOLINE, DIESEL, ELECTRIC',
    `price_per_day` DECIMAL(12,2) NOT NULL,
    `pickup_address` VARCHAR(255) NOT NULL,
    `amenities` TEXT NULL,
    `description` TEXT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'DRAFT'
        COMMENT 'DRAFT, PENDING_APPROVAL, ACTIVE, REJECTED, INACTIVE',
    `rejection_reason` VARCHAR(255) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT `fk_car_owner` FOREIGN KEY (`owner_id`) REFERENCES `owners` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 6. Hình ảnh xe
CREATE TABLE IF NOT EXISTS `car_images` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `car_id` BIGINT NOT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `is_thumbnail` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT `fk_ci_car` FOREIGN KEY (`car_id`) REFERENCES `cars` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- #############################################################################
-- PHẦN 3: DATABASE QUẢN TRỊ
-- #############################################################################

CREATE DATABASE IF NOT EXISTS `driveshare_admin_db`
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `driveshare_admin_db`;


-- 7. Admin & Staff
CREATE TABLE IF NOT EXISTS `admin_users` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `role` VARCHAR(30) NOT NULL DEFAULT 'ROLE_STAFF' COMMENT 'ROLE_ADMIN, ROLE_STAFF',
    `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 8. Đánh giá sau chuyến
CREATE TABLE IF NOT EXISTS `reviews` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `booking_id` BIGINT NOT NULL,
    `car_id` BIGINT NOT NULL,
    `reviewer_id` BIGINT NOT NULL,
    `reviewer_role` VARCHAR(20) NOT NULL COMMENT 'RENTER, OWNER',
    `rating` INT NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
    `comment` TEXT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY `uk_review_unique` (`booking_id`, `reviewer_id`, `reviewer_role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- #############################################################################
-- DỮ LIỆU MẪU
-- Mật khẩu '123456' → BCrypt: $2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi
-- #############################################################################

USE `driveshare_admin_db`;

INSERT INTO `admin_users` (`id`, `username`, `password_hash`, `full_name`, `email`, `role`) VALUES
(1, 'admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Admin Hệ Thống', 'admin@driveshare.vn', 'ROLE_ADMIN'),
(2, 'staff_tin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Nhân Viên Tín', 'tin@driveshare.vn', 'ROLE_STAFF')
ON DUPLICATE KEY UPDATE `username` = VALUES(`username`);


USE `driveshare_owner_db`;

INSERT INTO `owners` (`id`, `email`, `password_hash`, `full_name`, `phone`, `address`) VALUES
(1, 'owner.hung@gmail.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Nguyễn Văn Hùng', '0901234567', 'Quận 1, TP.HCM'),
(2, 'owner.lan@gmail.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Trần Thị Lan', '0912345678', 'Quận 7, TP.HCM')
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

INSERT INTO `cars` (`id`, `owner_id`, `brand`, `model`, `year`, `license_plate`, `seat_count`, `transmission`, `fuel_type`, `price_per_day`, `pickup_address`, `amenities`, `description`, `status`) VALUES
(1, 1, 'Toyota', 'Vios 1.5 CVT', 2022, '51H-123.45', 5, 'AUTOMATIC', 'GASOLINE', 750000.00, '123 Nguyễn Thị Minh Khai, Q.1', 'GPS, Camera, Bluetooth', 'Xe gia đình tiết kiệm xăng.', 'ACTIVE'),
(2, 1, 'Hyundai', 'Accent 1.4 AT', 2023, '51K-987.65', 5, 'AUTOMATIC', 'GASOLINE', 700000.00, '123 Nguyễn Thị Minh Khai, Q.1', 'Bản đồ, Camera lùi', 'Xe mới, máy êm.', 'ACTIVE'),
(3, 2, 'VinFast', 'VF8 Plus', 2023, '51A-888.88', 5, 'AUTOMATIC', 'ELECTRIC', 1200000.00, 'Nguyễn Văn Linh, Q.7', 'ADAS, Cửa sổ trời', 'Xe điện cao cấp.', 'ACTIVE')
ON DUPLICATE KEY UPDATE `license_plate` = VALUES(`license_plate`);

INSERT INTO `car_images` (`car_id`, `image_url`, `is_thumbnail`) VALUES
(1, 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800', TRUE),
(2, 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800', TRUE),
(3, 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800', TRUE);


USE `driveshare_renter_db`;

INSERT INTO `renters` (`id`, `email`, `password_hash`, `full_name`, `phone`, `license_number`, `license_status`) VALUES
(1, 'renter.nam@gmail.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Lê Hoàng Nam', '0988776655', 'B2-790123456789', 'APPROVED'),
(2, 'renter.mai@gmail.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Nguyễn Phương Mai', '0977665544', 'B1-790987654321', 'PENDING')
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

INSERT INTO `bookings` (`id`, `renter_id`, `car_id`, `start_time`, `end_time`, `total_days`, `price_per_day`, `deposit_amount`, `total_amount`, `status`) VALUES
(1, 1, 1, '2026-09-15 08:00:00', '2026-09-17 20:00:00', 3, 750000.00, 675000.00, 2250000.00, 'DEPOSIT_PAID')
ON DUPLICATE KEY UPDATE `renter_id` = VALUES(`renter_id`);

INSERT INTO `payments` (`booking_id`, `renter_id`, `amount`, `payment_type`, `status`, `paid_at`, `note`) VALUES
(1, 1, 675000.00, 'DEPOSIT', 'SUCCESS', '2026-09-11 09:30:00', 'Cọc 30% xe Vios 51H-123.45');
