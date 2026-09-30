-- V5: Tạo bảng car_calendar_blocks cho tính năng Chủ xe quản lý lịch xe và chặn ngày bận (Owner Blackout Dates)
CREATE TABLE IF NOT EXISTS car_calendar_blocks (
    block_id BIGSERIAL PRIMARY KEY,
    car_id BIGINT NOT NULL REFERENCES cars(car_id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(255) DEFAULT 'Chủ xe bận / Bảo dưỡng',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by BIGINT,
    CONSTRAINT chk_block_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_calendar_blocks_car_dates ON car_calendar_blocks(car_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_calendar_blocks_deleted ON car_calendar_blocks(deleted_at);
