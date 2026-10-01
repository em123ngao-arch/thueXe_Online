-- =============================================================================
-- DriveShare Sprint 2 — DB Migration Script V4
-- Cập nhật cột payment_expires_at phục vụ Soft Lock 45 phút theo Đặc tả v2.0.0
-- =============================================================================

ALTER TABLE rentals ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_rentals_payment_expires ON rentals(status, payment_expires_at);
