-- =============================================================================
-- DriveShare Sprint 4 — DB Migration Script V8
-- Tác giả: Nguyễn Duy Bảo (Tech Lead)
-- Mục đích: Bổ sung các cột kiểm soát đơn quá hạn (OVERDUE), phạt trễ hạn,
--          ghi nhận thời gian trả xe thực tế và cờ kích hoạt Blacklist.
-- =============================================================================

-- 1. Bổ sung các cột quản lý quá hạn trả xe vào bảng rentals
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS overdue_hours INT DEFAULT 0;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS penalty_fee NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS actual_return_time TIMESTAMP;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS is_blacklisted_triggered BOOLEAN DEFAULT FALSE;

-- 2. Đánh chỉ mục tìm kiếm nhanh cho đơn theo trạng thái và thời gian kết thúc
CREATE INDEX IF NOT EXISTS idx_rentals_status_end_date ON rentals(status, end_date);
