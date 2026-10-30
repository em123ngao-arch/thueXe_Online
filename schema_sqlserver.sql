-- =============================================================================
-- DRIVESHARE PLATFORM — DATABASE SCHEMA (MICROSOFT SQL SERVER / SSMS)
-- =============================================================================
-- Dự án: DriveShare — Nền tảng chia sẻ và cho thuê xe trực tuyến P2P
-- Phân hệ: Hệ thống Cơ sở dữ liệu quan hệ T-SQL chuẩn SQL Server 2016 - 2022
-- Thiết kế tối ưu cho: SQL Server Management Studio (SSMS) & Database Diagrams
-- Tương thích 100% với: SQL Server Express, Developer, Enterprise
-- =============================================================================

USE master;
GO

-- 1. Khởi tạo Cơ sở dữ liệu
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'driveshare_db')
BEGIN
    CREATE DATABASE [driveshare_db] COLLATE Latin1_General_100_CI_AS_SC_UTF8;
END
GO

USE [driveshare_db];
GO

-- 2. Xóa các bảng cũ nếu đã tồn tại (theo thứ tự con trước, cha sau)
IF OBJECT_ID('dbo.reviews', 'U') IS NOT NULL DROP TABLE dbo.reviews;
IF OBJECT_ID('dbo.rental_disputes', 'U') IS NOT NULL DROP TABLE dbo.rental_disputes;
IF OBJECT_ID('dbo.rental_inspections', 'U') IS NOT NULL DROP TABLE dbo.rental_inspections;
IF OBJECT_ID('dbo.payments', 'U') IS NOT NULL DROP TABLE dbo.payments;
IF OBJECT_ID('dbo.rentals', 'U') IS NOT NULL DROP TABLE dbo.rentals;
IF OBJECT_ID('dbo.car_calendar_blocks', 'U') IS NOT NULL DROP TABLE dbo.car_calendar_blocks;
IF OBJECT_ID('dbo.car_documents', 'U') IS NOT NULL DROP TABLE dbo.car_documents;
IF OBJECT_ID('dbo.car_images', 'U') IS NOT NULL DROP TABLE dbo.car_images;
IF OBJECT_ID('dbo.cars', 'U') IS NOT NULL DROP TABLE dbo.cars;
IF OBJECT_ID('dbo.notifications', 'U') IS NOT NULL DROP TABLE dbo.notifications;
IF OBJECT_ID('dbo.chat_memory', 'U') IS NOT NULL DROP TABLE dbo.chat_memory;
IF OBJECT_ID('dbo.audit_logs', 'U') IS NOT NULL DROP TABLE dbo.audit_logs;
IF OBJECT_ID('dbo.auth_sessions', 'U') IS NOT NULL DROP TABLE dbo.auth_sessions;
IF OBJECT_ID('dbo.email_change_tokens', 'U') IS NOT NULL DROP TABLE dbo.email_change_tokens;
IF OBJECT_ID('dbo.password_reset_tokens', 'U') IS NOT NULL DROP TABLE dbo.password_reset_tokens;
IF OBJECT_ID('dbo.owner_profiles', 'U') IS NOT NULL DROP TABLE dbo.owner_profiles;
IF OBJECT_ID('dbo.renter_profiles', 'U') IS NOT NULL DROP TABLE dbo.renter_profiles;
IF OBJECT_ID('dbo.user_roles', 'U') IS NOT NULL DROP TABLE dbo.user_roles;
IF OBJECT_ID('dbo.users', 'U') IS NOT NULL DROP TABLE dbo.users;
IF OBJECT_ID('dbo.roles', 'U') IS NOT NULL DROP TABLE dbo.roles;
GO

-- =============================================================================
-- PHẦN 1: BẢNG ĐỘC LẬP & PHÂN QUYỀN (USERS & ROLES)
-- =============================================================================

-- 1. Bảng roles: Vai trò người dùng (ROLE_CUSTOMER, ROLE_CAR_OWNER, ROLE_ADMIN)
CREATE TABLE dbo.roles (
    role_id         BIGINT IDENTITY(1,1) NOT NULL,
    role_name       NVARCHAR(30) NOT NULL,
    CONSTRAINT pk_roles PRIMARY KEY CLUSTERED (role_id),
    CONSTRAINT uk_roles_role_name UNIQUE (role_name)
);
GO

-- 2. Bảng users: Tài khoản người dùng trung tâm
CREATE TABLE dbo.users (
    user_id                     BIGINT IDENTITY(1,1) NOT NULL,
    username                    NVARCHAR(50) NOT NULL,
    email                       NVARCHAR(150) NOT NULL,
    phone                       NVARCHAR(20) NULL,
    password_hash               NVARCHAR(255) NOT NULL,
    full_name                   NVARCHAR(150) NULL,
    avatar_url                  NVARCHAR(500) NULL,
    address                     NVARCHAR(255) NULL,
    id_card_number              NVARCHAR(20) NULL,
    status                      NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
    failed_login_attempts       INT NOT NULL DEFAULT 0,
    locked_until                DATETIME2 NULL,
    token_version               BIGINT NOT NULL DEFAULT 0,
    google_id                   NVARCHAR(255) NULL,
    auth_provider               NVARCHAR(20) NOT NULL DEFAULT 'LOCAL',
    bank_verification_status    NVARCHAR(30) NULL DEFAULT 'UNVERIFIED',
    bank_rejection_reason       NVARCHAR(MAX) NULL,
    created_at                  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                  BIGINT NULL,
    updated_at                  DATETIME2 NULL,
    updated_by                  BIGINT NULL,
    deleted_at                  DATETIME2 NULL,
    deleted_by                  BIGINT NULL,
    CONSTRAINT pk_users PRIMARY KEY CLUSTERED (user_id),
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT uk_users_phone UNIQUE (phone),
    CONSTRAINT uk_users_id_card UNIQUE (id_card_number),
    CONSTRAINT uk_users_google_id UNIQUE (google_id),
    CONSTRAINT chk_users_auth_provider CHECK (auth_provider IN ('LOCAL', 'GOOGLE'))
);
GO

CREATE NONCLUSTERED INDEX idx_users_status ON dbo.users(status);
CREATE NONCLUSTERED INDEX idx_users_auth_provider ON dbo.users(auth_provider);
GO

-- 3. Bảng user_roles: Trung gian N-N giữa Users và Roles
CREATE TABLE dbo.user_roles (
    user_id         BIGINT NOT NULL,
    role_id         BIGINT NOT NULL,
    assigned_at     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_user_roles PRIMARY KEY CLUSTERED (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) 
        REFERENCES dbo.users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) 
        REFERENCES dbo.roles(role_id) ON DELETE NO ACTION ON UPDATE CASCADE
);
GO

-- 4. Bảng renter_profiles: Hồ sơ mở rộng 1-1 cho Khách thuê (GPLX eKYC)
CREATE TABLE dbo.renter_profiles (
    user_id                         BIGINT NOT NULL,
    license_number                  NVARCHAR(30) NULL,
    license_full_name               NVARCHAR(150) NULL,
    license_dob                     DATE NULL,
    license_issue_date              DATE NULL,
    license_expiry_date             DATE NULL,
    license_front_url               NVARCHAR(500) NULL,
    license_back_url                NVARCHAR(500) NULL,
    id_card_front_url               NVARCHAR(500) NULL,
    id_card_back_url                NVARCHAR(500) NULL,
    verification_status             NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
    rejection_reason                NVARCHAR(500) NULL,
    license_verification_status     NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
    license_verified_by             BIGINT NULL,
    license_verified_at             DATETIME2 NULL,
    license_rejection_reason        NVARCHAR(500) NULL,
    created_at                      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                      BIGINT NULL,
    updated_at                      DATETIME2 NULL,
    updated_by                      BIGINT NULL,
    deleted_at                      DATETIME2 NULL,
    deleted_by                      BIGINT NULL,
    CONSTRAINT pk_renter_profiles PRIMARY KEY CLUSTERED (user_id),
    CONSTRAINT uk_renter_license UNIQUE (license_number),
    CONSTRAINT fk_renter_profiles_user FOREIGN KEY (user_id) 
        REFERENCES dbo.users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_renter_profiles_verified_by FOREIGN KEY (license_verified_by) 
        REFERENCES dbo.users(user_id) ON DELETE NO ACTION
);
GO

-- 5. Bảng owner_profiles: Hồ sơ mở rộng 1-1 cho Chủ xe (CCCD eKYC & Bank)
CREATE TABLE dbo.owner_profiles (
    user_id                 BIGINT NOT NULL,
    id_card_front_url       NVARCHAR(500) NULL,
    id_card_back_url        NVARCHAR(500) NULL,
    bank_account_number     NVARCHAR(30) NULL,
    bank_name               NVARCHAR(100) NULL,
    verification_status     NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
    verified_by             BIGINT NULL,
    verified_at             DATETIME2 NULL,
    rejection_reason        NVARCHAR(500) NULL,
    created_at              DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by              BIGINT NULL,
    updated_at              DATETIME2 NULL,
    updated_by              BIGINT NULL,
    deleted_at              DATETIME2 NULL,
    deleted_by              BIGINT NULL,
    CONSTRAINT pk_owner_profiles PRIMARY KEY CLUSTERED (user_id),
    CONSTRAINT fk_owner_profiles_user FOREIGN KEY (user_id) 
        REFERENCES dbo.users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_owner_profiles_verified_by FOREIGN KEY (verified_by) 
        REFERENCES dbo.users(user_id) ON DELETE NO ACTION
);
GO

-- 6. Bảng password_reset_tokens: Token khôi phục mật khẩu
CREATE TABLE dbo.password_reset_tokens (
    id              BIGINT IDENTITY(1,1) NOT NULL,
    user_id         BIGINT NOT NULL,
    token_hash      NVARCHAR(64) NOT NULL,
    expires_at      DATETIME2 NOT NULL,
    used_at         DATETIME2 NULL,
    CONSTRAINT pk_password_reset_tokens PRIMARY KEY CLUSTERED (id),
    CONSTRAINT uk_password_reset_token UNIQUE (token_hash),
    CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) 
        REFERENCES dbo.users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);
GO

-- 7. Bảng email_change_tokens: Token đổi địa chỉ email
CREATE TABLE dbo.email_change_tokens (
    id              BIGINT IDENTITY(1,1) NOT NULL,
    user_id         BIGINT NOT NULL,
    new_email       NVARCHAR(150) NOT NULL,
    token_hash      NVARCHAR(64) NOT NULL,
    expires_at      DATETIME2 NOT NULL,
    used_at         DATETIME2 NULL,
    CONSTRAINT pk_email_change_tokens PRIMARY KEY CLUSTERED (id),
    CONSTRAINT uk_email_change_token UNIQUE (token_hash),
    CONSTRAINT fk_email_change_user FOREIGN KEY (user_id) 
        REFERENCES dbo.users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);
GO

-- 8. Bảng auth_sessions: Quản lý phiên JWT & JTI Blacklist
CREATE TABLE dbo.auth_sessions (
    id              BIGINT IDENTITY(1,1) NOT NULL,
    jti             NVARCHAR(64) NOT NULL,
    user_id         BIGINT NOT NULL,
    token_version   BIGINT NOT NULL DEFAULT 0,
    expires_at      DATETIME2 NOT NULL,
    revoked_at      DATETIME2 NULL,
    CONSTRAINT pk_auth_sessions PRIMARY KEY CLUSTERED (id),
    CONSTRAINT uk_auth_session_jti UNIQUE (jti),
    CONSTRAINT fk_auth_sessions_user FOREIGN KEY (user_id) 
        REFERENCES dbo.users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);
GO

-- 9. Bảng audit_logs: Nhật ký kiểm toán quản trị
CREATE TABLE dbo.audit_logs (
    log_id          BIGINT IDENTITY(1,1) NOT NULL,
    action          NVARCHAR(100) NOT NULL,
    actor_id        BIGINT NULL,
    actor_username  NVARCHAR(100) NULL,
    target_type     NVARCHAR(50) NOT NULL,
    target_id       BIGINT NOT NULL,
    details         NVARCHAR(1000) NULL,
    created_at      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_audit_logs PRIMARY KEY CLUSTERED (log_id),
    CONSTRAINT fk_audit_logs_actor FOREIGN KEY (actor_id) 
        REFERENCES dbo.users(user_id) ON DELETE SET NULL
);
GO

-- 10. Bảng chat_memory: Lưu lịch sử hội thoại AI Gemini
CREATE TABLE dbo.chat_memory (
    id              BIGINT IDENTITY(1,1) NOT NULL,
    user_id         BIGINT NOT NULL,
    session_id      NVARCHAR(100) NOT NULL,
    messages        NVARCHAR(MAX) NOT NULL,
    updated_at      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_chat_memory PRIMARY KEY CLUSTERED (id),
    CONSTRAINT uk_user_session UNIQUE (user_id, session_id),
    CONSTRAINT fk_chat_memory_user FOREIGN KEY (user_id) 
        REFERENCES dbo.users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);
GO

-- 11. Bảng notifications: Thông báo in-app
CREATE TABLE dbo.notifications (
    notification_id BIGINT IDENTITY(1,1) NOT NULL,
    user_id         BIGINT NOT NULL,
    title           NVARCHAR(150) NOT NULL,
    content         NVARCHAR(MAX) NOT NULL,
    type            NVARCHAR(50) NOT NULL,
    reference_id    BIGINT NULL,
    is_read         BIT NOT NULL DEFAULT 0,
    created_at      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_notifications PRIMARY KEY CLUSTERED (notification_id),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) 
        REFERENCES dbo.users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);
GO

-- =============================================================================
-- PHẦN 2: PHƯƠNG TIỆN & LỊCH XE (CARS)
-- =============================================================================

-- 12. Bảng cars: Danh mục phương tiện
CREATE TABLE dbo.cars (
    car_id                  BIGINT IDENTITY(1,1) NOT NULL,
    owner_id                BIGINT NOT NULL,
    plate_number            NVARCHAR(20) NOT NULL,
    brand                   NVARCHAR(100) NOT NULL,
    model                   NVARCHAR(100) NOT NULL,
    [year]                  INT NOT NULL,
    color                   NVARCHAR(50) NULL,
    seats                   INT NOT NULL,
    transmission            NVARCHAR(20) NULL,
    fuel_type               NVARCHAR(20) NULL,
    price_per_day           DECIMAL(15,2) NOT NULL,
    address                 NVARCHAR(500) NULL,
    province                NVARCHAR(100) NULL,
    latitude                DECIMAL(10,7) NULL,
    longitude               DECIMAL(10,7) NULL,
    description             NVARCHAR(MAX) NULL,
    features                NVARCHAR(MAX) NULL,
    thumbnail_url           NVARCHAR(500) NULL,
    has_driver_service      BIT NOT NULL DEFAULT 0,
    driver_fee_per_day      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    rating                  DECIMAL(3,2) NOT NULL DEFAULT 5.00,
    rating_count            INT NOT NULL DEFAULT 0,
    status                  NVARCHAR(20) NOT NULL DEFAULT 'PENDING_REVIEW',
    rejection_reason        NVARCHAR(MAX) NULL,
    approved_at             DATETIME2 NULL,
    approved_by             BIGINT NULL,
    created_at              DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by              BIGINT NULL,
    updated_at              DATETIME2 NULL,
    updated_by              BIGINT NULL,
    deleted_at              DATETIME2 NULL,
    deleted_by              BIGINT NULL,
    CONSTRAINT pk_cars PRIMARY KEY CLUSTERED (car_id),
    CONSTRAINT uk_cars_plate UNIQUE (plate_number),
    CONSTRAINT fk_cars_owner FOREIGN KEY (owner_id) 
        REFERENCES dbo.users(user_id) ON DELETE NO ACTION,
    CONSTRAINT fk_cars_approved_by FOREIGN KEY (approved_by) 
        REFERENCES dbo.users(user_id) ON DELETE NO ACTION
);
GO

CREATE NONCLUSTERED INDEX idx_cars_owner ON dbo.cars(owner_id);
CREATE NONCLUSTERED INDEX idx_cars_status ON dbo.cars(status);
GO

-- 13. Bảng car_images: Album ảnh xe Cloudinary
CREATE TABLE dbo.car_images (
    image_id        BIGINT IDENTITY(1,1) NOT NULL,
    car_id          BIGINT NOT NULL,
    image_url       NVARCHAR(500) NOT NULL,
    is_thumbnail    BIT NOT NULL DEFAULT 0,
    created_at      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_car_images PRIMARY KEY CLUSTERED (image_id),
    CONSTRAINT fk_car_images_car FOREIGN KEY (car_id) 
        REFERENCES dbo.cars(car_id) ON DELETE CASCADE ON UPDATE CASCADE
);
GO

-- 14. Bảng car_documents: Giấy tờ Cavet / Đăng kiểm / Bảo hiểm
CREATE TABLE dbo.car_documents (
    document_id             BIGINT IDENTITY(1,1) NOT NULL,
    car_id                  BIGINT NOT NULL,
    document_type           NVARCHAR(50) NOT NULL,
    document_url            NVARCHAR(500) NOT NULL,
    verification_status     NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
    rejection_reason        NVARCHAR(500) NULL,
    verified_by             BIGINT NULL,
    verified_at             DATETIME2 NULL,
    created_at              DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_car_documents PRIMARY KEY CLUSTERED (document_id),
    CONSTRAINT fk_car_documents_car FOREIGN KEY (car_id) 
        REFERENCES dbo.cars(car_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_car_documents_verified_by FOREIGN KEY (verified_by) 
        REFERENCES dbo.users(user_id) ON DELETE NO ACTION
);
GO

-- 15. Bảng car_calendar_blocks: Khóa lịch xe bận đột xuất
CREATE TABLE dbo.car_calendar_blocks (
    block_id        BIGINT IDENTITY(1,1) NOT NULL,
    car_id          BIGINT NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    reason          NVARCHAR(255) NULL DEFAULT N'Chủ xe bận / Bảo dưỡng',
    created_at      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by      BIGINT NULL,
    updated_at      DATETIME2 NULL,
    updated_by      BIGINT NULL,
    deleted_at      DATETIME2 NULL,
    deleted_by      BIGINT NULL,
    CONSTRAINT pk_car_calendar_blocks PRIMARY KEY CLUSTERED (block_id),
    CONSTRAINT chk_block_dates CHECK (end_date >= start_date),
    CONSTRAINT fk_car_calendar_blocks_car FOREIGN KEY (car_id) 
        REFERENCES dbo.cars(car_id) ON DELETE CASCADE ON UPDATE CASCADE
);
GO

-- =============================================================================
-- PHẦN 3: HỢP ĐỒNG THUÊ XE & GIAO DỊCH KÝ QUỸ (RENTALS & ESCROW)
-- =============================================================================

-- 16. Bảng rentals: Đơn thuê xe & hành trình Shopee Stepper
CREATE TABLE dbo.rentals (
    rental_id                   BIGINT IDENTITY(1,1) NOT NULL,
    car_id                      BIGINT NOT NULL,
    renter_id                   BIGINT NOT NULL,
    start_date                  DATE NOT NULL,
    end_date                    DATE NOT NULL,
    total_days                  INT NOT NULL DEFAULT 1,
    price_per_day               DECIMAL(12,2) NOT NULL,
    total_price                 DECIMAL(12,2) NOT NULL,
    deposit_amount              DECIMAL(12,2) NOT NULL,
    status                      NVARCHAR(30) NOT NULL DEFAULT 'PENDING',
    payment_expires_at          DATETIME2 NULL,
    reject_reason               NVARCHAR(500) NULL,
    note                        NVARCHAR(500) NULL,
    with_driver                 BIT NOT NULL DEFAULT 0,
    driver_fee                  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    overdue_hours               INT NOT NULL DEFAULT 0,
    penalty_fee                 DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    actual_return_time          DATETIME2 NULL,
    is_blacklisted_triggered    BIT NOT NULL DEFAULT 0,
    created_at                  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by                  BIGINT NULL,
    updated_at                  DATETIME2 NULL,
    updated_by                  BIGINT NULL,
    deleted_at                  DATETIME2 NULL,
    deleted_by                  BIGINT NULL,
    CONSTRAINT pk_rentals PRIMARY KEY CLUSTERED (rental_id),
    CONSTRAINT chk_rental_dates CHECK (end_date >= start_date),
    CONSTRAINT fk_rentals_car FOREIGN KEY (car_id) 
        REFERENCES dbo.cars(car_id) ON DELETE NO ACTION,
    CONSTRAINT fk_rentals_renter FOREIGN KEY (renter_id) 
        REFERENCES dbo.users(user_id) ON DELETE NO ACTION
);
GO

CREATE NONCLUSTERED INDEX idx_rentals_car_dates ON dbo.rentals(car_id, start_date, end_date, status);
CREATE NONCLUSTERED INDEX idx_rentals_status_end_date ON dbo.rentals(status, end_date);
GO

-- 17. Bảng payments: Thanh toán cọc 30% VietQR & quyết toán
CREATE TABLE dbo.payments (
    payment_id          BIGINT IDENTITY(1,1) NOT NULL,
    rental_id           BIGINT NOT NULL,
    amount              DECIMAL(12,2) NOT NULL,
    payment_type        NVARCHAR(30) NOT NULL DEFAULT 'DEPOSIT',
    payment_method      NVARCHAR(30) NOT NULL DEFAULT 'VIETQR',
    status              NVARCHAR(30) NOT NULL DEFAULT 'PENDING',
    transaction_code    NVARCHAR(100) NULL,
    qr_code_url         NVARCHAR(500) NULL,
    paid_at             DATETIME2 NULL,
    created_at          DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          BIGINT NULL,
    updated_at          DATETIME2 NULL,
    updated_by          BIGINT NULL,
    deleted_at          DATETIME2 NULL,
    deleted_by          BIGINT NULL,
    CONSTRAINT pk_payments PRIMARY KEY CLUSTERED (payment_id),
    CONSTRAINT uk_payments_trans UNIQUE (transaction_code),
    CONSTRAINT fk_payments_rental FOREIGN KEY (rental_id) 
        REFERENCES dbo.rentals(rental_id) ON DELETE NO ACTION
);
GO

-- =============================================================================
-- PHẦN 4: BIÊN BẢN BÀN GIAO, ĐÁNH GIÁ & TRANH CHẤP
-- =============================================================================

-- 18. Bảng rental_inspections: Biên bản bàn giao xe Check-in & Check-out (ODO)
CREATE TABLE dbo.rental_inspections (
    inspection_id       BIGINT IDENTITY(1,1) NOT NULL,
    rental_id           BIGINT NOT NULL,
    inspection_type     NVARCHAR(20) NOT NULL,
    odo_meter           INT NOT NULL,
    fuel_level          INT NOT NULL,
    images              NVARCHAR(MAX) NULL,
    notes               NVARCHAR(MAX) NULL,
    extra_fee           DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    extra_fee_reason    NVARCHAR(255) NULL,
    performed_by        BIGINT NOT NULL,
    created_at          DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_rental_inspections PRIMARY KEY CLUSTERED (inspection_id),
    CONSTRAINT chk_inspection_type CHECK (inspection_type IN ('CHECK_IN', 'CHECK_OUT')),
    CONSTRAINT chk_fuel_level CHECK (fuel_level >= 0 AND fuel_level <= 100),
    CONSTRAINT fk_inspections_rental FOREIGN KEY (rental_id) 
        REFERENCES dbo.rentals(rental_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_inspections_performed_by FOREIGN KEY (performed_by) 
        REFERENCES dbo.users(user_id) ON DELETE NO ACTION
);
GO

-- 19. Bảng rental_disputes: Khiếu nại bùng hẹn, bồi thường & phạt
CREATE TABLE dbo.rental_disputes (
    id                  BIGINT IDENTITY(1,1) NOT NULL,
    rental_id           BIGINT NOT NULL,
    reporter_id         BIGINT NOT NULL,
    reason              NVARCHAR(MAX) NOT NULL,
    proof_urls          NVARCHAR(MAX) NULL,
    status              NVARCHAR(30) NOT NULL DEFAULT 'PENDING',
    refund_amount       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    penalty_amount      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    admin_note          NVARCHAR(MAX) NULL,
    resolved_by         BIGINT NULL,
    resolved_at         DATETIME2 NULL,
    created_at          DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    created_by          BIGINT NULL,
    updated_at          DATETIME2 NULL,
    updated_by          BIGINT NULL,
    deleted_at          DATETIME2 NULL,
    deleted_by          BIGINT NULL,
    CONSTRAINT pk_rental_disputes PRIMARY KEY CLUSTERED (id),
    CONSTRAINT chk_dispute_status CHECK (status IN ('PENDING', 'RESOLVED_REFUND', 'REJECTED')),
    CONSTRAINT fk_disputes_rental FOREIGN KEY (rental_id) 
        REFERENCES dbo.rentals(rental_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_disputes_reporter FOREIGN KEY (reporter_id) 
        REFERENCES dbo.users(user_id) ON DELETE NO ACTION,
    CONSTRAINT fk_disputes_resolver FOREIGN KEY (resolved_by) 
        REFERENCES dbo.users(user_id) ON DELETE NO ACTION
);
GO

-- 20. Bảng reviews: Đánh giá 1-5 sao và nhận xét sau chuyến đi (1:1 với rentals)
CREATE TABLE dbo.reviews (
    review_id       BIGINT IDENTITY(1,1) NOT NULL,
    rental_id       BIGINT NOT NULL,
    car_id          BIGINT NOT NULL,
    renter_id       BIGINT NOT NULL,
    rating          INT NOT NULL,
    comment         NVARCHAR(MAX) NULL,
    created_at      DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_reviews PRIMARY KEY CLUSTERED (review_id),
    CONSTRAINT uk_reviews_rental UNIQUE (rental_id),
    CONSTRAINT chk_review_rating CHECK (rating >= 1 AND rating <= 5),
    CONSTRAINT fk_reviews_rental FOREIGN KEY (rental_id) 
        REFERENCES dbo.rentals(rental_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_reviews_car FOREIGN KEY (car_id) 
        REFERENCES dbo.cars(car_id) ON DELETE NO ACTION,
    CONSTRAINT fk_reviews_renter FOREIGN KEY (renter_id) 
        REFERENCES dbo.users(user_id) ON DELETE NO ACTION
);
GO

-- =============================================================================
-- SEED DATA: KHỞI TẠO CÁC ROLE CƠ BẢN
-- =============================================================================
SET IDENTITY_INSERT dbo.roles ON;
IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE role_id = 1) INSERT INTO dbo.roles (role_id, role_name) VALUES (1, N'ROLE_CUSTOMER');
IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE role_id = 2) INSERT INTO dbo.roles (role_id, role_name) VALUES (2, N'ROLE_CAR_OWNER');
IF NOT EXISTS (SELECT 1 FROM dbo.roles WHERE role_id = 3) INSERT INTO dbo.roles (role_id, role_name) VALUES (3, N'ROLE_ADMIN');
SET IDENTITY_INSERT dbo.roles OFF;
GO

PRINT '=======================================================';
PRINT '  CƠ SỞ DỮ LIỆU DRIVESHARE ĐÃ ĐƯỢC TẠO THÀNH CÔNG!     ';
PRINT '  BÂY GIỜ BẠN CÓ THỂ TẠO DATABASE DIAGRAM TRONG SSMS. ';
PRINT '=======================================================';
GO
