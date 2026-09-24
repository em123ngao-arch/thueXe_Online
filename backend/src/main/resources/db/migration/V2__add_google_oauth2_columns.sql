-- =============================================================================
-- DriveShare Sprint 1 Fix — DB Migration Script
-- Tác giả: Nguyễn Bảo (NB) — thực thi bởi fix/DB-migration
-- Mục đích: Bổ sung cột hỗ trợ Google OAuth2 vào bảng users (BR-03)
-- Ngày: 21/09/2026
-- =============================================================================

-- Bước 1: Thêm cột google_id (lưu Google user ID, unique, nullable)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

-- Bước 2: Thêm cột auth_provider (LOCAL hoặc GOOGLE, mặc định LOCAL)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL';

-- Bước 3: Đánh index trên google_id để tìm kiếm nhanh khi đăng nhập Google
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Bước 4: Đánh index trên auth_provider để phân loại tài khoản
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);

-- Bước 5: Cập nhật CHECK constraint đảm bảo giá trị hợp lệ
ALTER TABLE users
    DROP CONSTRAINT IF EXISTS chk_auth_provider;

ALTER TABLE users
    ADD CONSTRAINT chk_auth_provider
    CHECK (auth_provider IN ('LOCAL', 'GOOGLE'));

-- =============================================================================
-- Kiểm tra sau khi chạy:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'users' AND column_name IN ('google_id', 'auth_provider');
-- =============================================================================
