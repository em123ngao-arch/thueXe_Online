-- =============================================================================
-- DriveShare Sprint 3 — DB Migration Script V7
-- Tác giả: Nguyễn Tấn Lộc Khiêm (Backend Live QA & Database Architect)
-- Mục đích: Khởi tạo bảng rental_disputes (khiếu nại sự cố bàn giao xe)
--          và bổ sung xác thực tài khoản ngân hàng của chủ xe trên bảng users
-- =============================================================================

-- 1. Thêm cột xác minh tài khoản ngân hàng vào bảng users
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_verification_status VARCHAR(30) DEFAULT 'UNVERIFIED';
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_rejection_reason TEXT;

-- 2. Bảng quản lý khiếu nại tranh chấp sự cố nhận/trả xe (Disputes)
CREATE TABLE IF NOT EXISTS rental_disputes (
    id                  BIGSERIAL PRIMARY KEY,
    rental_id           BIGINT NOT NULL REFERENCES rentals(rental_id) ON DELETE CASCADE,
    reporter_id         BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reason              TEXT NOT NULL,
    proof_urls          TEXT, -- Danh sách URL ảnh/video từ Cloudinary (JSON array hoặc comma-separated)
    status              VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'RESOLVED_REFUND', 'REJECTED'
    refund_amount       NUMERIC(12,2) DEFAULT 0.00,
    penalty_amount      NUMERIC(12,2) DEFAULT 0.00,
    admin_note          TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at         TIMESTAMP,
    CONSTRAINT chk_dispute_status CHECK (status IN ('PENDING', 'RESOLVED_REFUND', 'REJECTED'))
);

CREATE INDEX IF NOT EXISTS idx_rental_disputes_rental_id ON rental_disputes(rental_id);
CREATE INDEX IF NOT EXISTS idx_rental_disputes_reporter_id ON rental_disputes(reporter_id);
CREATE INDEX IF NOT EXISTS idx_rental_disputes_status ON rental_disputes(status);
