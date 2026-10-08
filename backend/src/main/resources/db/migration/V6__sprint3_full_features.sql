-- =============================================================================
-- DriveShare Sprint 3 — DB Migration Script
-- Tác giả: Nguyễn Duy Bảo (NB - Database & QA Architect)
-- Mục đích: Khởi tạo bảng rental_inspections, reviews, notifications
--          và bổ sung dịch vụ tài xế, hệ thống rating cho xe
-- =============================================================================

-- 1. Bổ sung các cột dịch vụ tài xế và đánh giá cho bảng cars
ALTER TABLE cars ADD COLUMN IF NOT EXISTS has_driver_service BOOLEAN DEFAULT FALSE;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS driver_fee_per_day NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 5.00;
ALTER TABLE cars ADD COLUMN IF NOT EXISTS rating_count INT DEFAULT 0;

-- 2. Bổ sung các cột dịch vụ tài xế cho bảng rentals
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS with_driver BOOLEAN DEFAULT FALSE;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS driver_fee NUMERIC(12,2) DEFAULT 0.00;

-- 3. Bảng biên bản kiểm tra bàn giao và trả xe (Inspections - Phục vụ Vĩ)
CREATE TABLE IF NOT EXISTS rental_inspections (
    inspection_id       BIGSERIAL PRIMARY KEY,
    rental_id           BIGINT NOT NULL REFERENCES rentals(rental_id) ON DELETE CASCADE,
    inspection_type     VARCHAR(20) NOT NULL, -- 'CHECK_IN' hoặc 'CHECK_OUT'
    odo_meter           INT NOT NULL,
    fuel_level          INT NOT NULL, -- 0 - 100%
    images              TEXT, -- Danh sách URL ảnh ngoại quan phân cách bằng dấu phẩy
    notes               TEXT,
    extra_fee           NUMERIC(12,2) DEFAULT 0.00,
    extra_fee_reason    VARCHAR(255),
    performed_by        BIGINT NOT NULL REFERENCES users(user_id),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_inspection_type CHECK (inspection_type IN ('CHECK_IN', 'CHECK_OUT')),
    CONSTRAINT chk_fuel_level CHECK (fuel_level >= 0 AND fuel_level <= 100)
);

CREATE INDEX IF NOT EXISTS idx_inspections_rental_id ON rental_inspections(rental_id);
CREATE INDEX IF NOT EXISTS idx_inspections_type ON rental_inspections(rental_id, inspection_type);

-- 4. Bảng đánh giá sau chuyến đi (Reviews - Phục vụ Quân)
CREATE TABLE IF NOT EXISTS reviews (
    review_id           BIGSERIAL PRIMARY KEY,
    rental_id           BIGINT UNIQUE NOT NULL REFERENCES rentals(rental_id) ON DELETE CASCADE,
    car_id              BIGINT NOT NULL REFERENCES cars(car_id) ON DELETE CASCADE,
    renter_id           BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    rating              INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment             TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_car_id ON reviews(car_id);
CREATE INDEX IF NOT EXISTS idx_reviews_renter_id ON reviews(renter_id);

-- 5. Bảng thông báo in-app (Notifications)
CREATE TABLE IF NOT EXISTS notifications (
    notification_id     BIGSERIAL PRIMARY KEY,
    user_id             BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title               VARCHAR(150) NOT NULL,
    content             TEXT NOT NULL,
    type                VARCHAR(50) NOT NULL,
    reference_id        BIGINT,
    is_read             BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, is_read);
