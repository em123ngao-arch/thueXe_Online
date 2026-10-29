-- =============================================================================
-- DriveShare Sprint Final — DB Migration Script V9
-- Tác giả: Lâm Chí Vĩ (Backend & UI Handover)
-- Phê duyệt: Nguyễn Duy Bảo (Tech Lead)
-- Mục đích: Bổ sung cột status cho bảng rental_inspections phục vụ
--          quy trình đồng thuận bàn giao xe 2 chiều (Two-Way Handover Consensus).
-- =============================================================================

ALTER TABLE rental_inspections ADD COLUMN IF NOT EXISTS status VARCHAR(40) DEFAULT 'CONFIRMED';

