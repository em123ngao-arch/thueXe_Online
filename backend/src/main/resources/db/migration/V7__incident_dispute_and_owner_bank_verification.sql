-- =============================================================================
-- DriveShare Sprint 3 Fix — DB Migration Script V7
-- Tác giả: Lâm Chí Vĩ & Lộc Khiêm
-- Mục đích: Khởi tạo bảng rental_disputes (khiếu nại không nhận xe),
--          bổ sung cột xác minh tài khoản ngân hàng chủ xe trong users.
-- =============================================================================

-- 1. Bảng quản lý khiếu nại tranh chấp (Rental Disputes - Phục vụ Vĩ)
CREATE TABLE IF NOT EXISTS rental_disputes (
    id                  BIGSERIAL PRIMARY KEY,
    rental_id           BIGINT NOT NULL REFERENCES rentals(rental_id) ON DELETE CASCADE,
    reporter_id         BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    reason              TEXT NOT NULL,
    proof_urls          TEXT, -- Danh sách JSON hoặc URLs ảnh/video bằng chứng
    status              VARCHAR(30) DEFAULT 'PENDING', -- PENDING, RESOLVED_REFUND, REJECTED
    refund_amount       NUMERIC(12,2) DEFAULT 0.00,
    penalty_amount      NUMERIC(12,2) DEFAULT 0.00,
    admin_note          TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at         TIMESTAMP,
    CONSTRAINT chk_dispute_status CHECK (status IN ('PENDING', 'RESOLVED_REFUND', 'REJECTED'))
);

CREATE INDEX IF NOT EXISTS idx_rental_disputes_rental ON rental_disputes(rental_id);
CREATE INDEX IF NOT EXISTS idx_rental_disputes_status ON rental_disputes(status);
CREATE INDEX IF NOT EXISTS idx_rental_disputes_reporter ON rental_disputes(reporter_id);

-- 2. Bổ sung các cột kiểm duyệt tài khoản ngân hàng chủ xe cho bảng users (Phục vụ Quân & Khiêm)
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_verification_status VARCHAR(30) DEFAULT 'UNVERIFIED';
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_rejection_reason TEXT;
