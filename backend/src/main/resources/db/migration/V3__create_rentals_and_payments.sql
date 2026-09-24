-- =============================================================================
-- DriveShare Sprint 2 — DB Migration Script
-- Tác giả: Nguyễn Duy Bảo (NB - Lead)
-- Mục đích: Khởi tạo bảng rentals (yêu cầu thuê xe) và payments (thanh toán cọc VietQR)
-- =============================================================================

-- 1. Bảng rentals: Quản lý vòng đời yêu cầu thuê xe của khách và phê duyệt của chủ xe
CREATE TABLE IF NOT EXISTS rentals (
    rental_id           BIGSERIAL PRIMARY KEY,
    car_id              BIGINT NOT NULL REFERENCES cars(car_id),
    renter_id           BIGINT NOT NULL REFERENCES users(user_id),
    start_date          DATE NOT NULL,
    end_date            DATE NOT NULL,
    total_days          INT NOT NULL DEFAULT 1,
    price_per_day       DECIMAL(12,2) NOT NULL,
    total_price         DECIMAL(12,2) NOT NULL,
    deposit_amount      DECIMAL(12,2) NOT NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    reject_reason       VARCHAR(500),
    note                VARCHAR(500),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by          BIGINT,
    updated_at          TIMESTAMP,
    updated_by          BIGINT,
    CONSTRAINT chk_rental_dates CHECK (end_date >= start_date)
);

-- Đánh index phục vụ kiểm tra xung đột trùng lịch và lọc theo khách/chủ xe
CREATE INDEX IF NOT EXISTS idx_rentals_car_dates ON rentals(car_id, start_date, end_date, status);
CREATE INDEX IF NOT EXISTS idx_rentals_renter_status ON rentals(renter_id, status);

-- 2. Bảng payments: Quản lý giao dịch thanh toán đặt cọc 30% VietQR và hoàn tất
CREATE TABLE IF NOT EXISTS payments (
    payment_id          BIGSERIAL PRIMARY KEY,
    rental_id           BIGINT NOT NULL REFERENCES rentals(rental_id),
    amount              DECIMAL(12,2) NOT NULL,
    payment_type        VARCHAR(30) NOT NULL DEFAULT 'DEPOSIT',
    payment_method      VARCHAR(30) NOT NULL DEFAULT 'VIETQR',
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    transaction_code    VARCHAR(100) UNIQUE,
    qr_code_url         VARCHAR(500),
    paid_at             TIMESTAMP,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by          BIGINT,
    updated_at          TIMESTAMP,
    updated_by          BIGINT
);

CREATE INDEX IF NOT EXISTS idx_payments_rental_id ON payments(rental_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
