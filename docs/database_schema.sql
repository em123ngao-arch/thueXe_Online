-- =============================================================================
-- DRIVESHARE DATABASE SCHEMA — v3.1 (ENTERPRISE / SCRUM BACKLOG COMPLIANT)
-- Single Database Architecture | 20 Tables | Full Audit Trail | RBAC | Mioto Flow
-- Fully Aligned with DriveShare_TienDo.xlsx (15 User Stories, 45 Subtasks, AC)
-- =============================================================================

DROP DATABASE IF EXISTS driveshare_db;
CREATE DATABASE driveshare_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE driveshare_db;


-- ============================================================
-- PHAN 1: NGUOI DUNG & PHAN QUYEN (EPIC-01, EPIC-02)
-- ============================================================

-- 1.1 Danh sach role he thong
CREATE TABLE roles (
  role_id    BIGINT      PRIMARY KEY AUTO_INCREMENT,
  role_name  VARCHAR(30) NOT NULL UNIQUE   -- 'renter', 'owner', 'staff', 'admin'
);

-- 1.2 Bang users trung tam (Ho tro US-01, US-02, US-14)
CREATE TABLE users (
  user_id                   BIGINT       PRIMARY KEY AUTO_INCREMENT,
  username                  VARCHAR(50)  NOT NULL UNIQUE,
  email                     VARCHAR(150) NOT NULL UNIQUE,
  phone                     VARCHAR(20)  NULL,
  password_hash             VARCHAR(255) NOT NULL,
  full_name                 VARCHAR(150) NOT NULL,
  avatar_url                VARCHAR(500) NULL,
  id_card_number            VARCHAR(20)  NULL UNIQUE,
  address                   VARCHAR(255) NULL,                                         -- US-02 AC: Xem va sua dia chi
  reset_password_token      VARCHAR(100) NULL,                                         -- US-01: Quen/doi mat khau
  reset_password_expires_at TIMESTAMP    NULL,                                         -- US-01: Thoi han token reset
  status                    ENUM('pending','active','locked','banned') NOT NULL DEFAULT 'pending', -- US-14: Admin ban user
  
  -- Audit fields bat buoc
  created_at                TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by                BIGINT       NULL,
  updated_at                TIMESTAMP    NULL ON UPDATE CURRENT_TIMESTAMP,
  updated_by                BIGINT       NULL,
  deleted_at                TIMESTAMP    NULL,
  deleted_by                BIGINT       NULL
);

-- 1.3 Gan role (N-N: 1 user co the dong thoi la renter va owner)
CREATE TABLE user_roles (
  user_id     BIGINT    NOT NULL,
  role_id     BIGINT    NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  assigned_by BIGINT    NULL,
  PRIMARY KEY (user_id, role_id),
  CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

-- 1.4 Refresh Token — bat buoc cho Spring Security + JWT logout/refresh (US-01)
CREATE TABLE refresh_tokens (
  token_id    BIGINT       PRIMARY KEY AUTO_INCREMENT,
  user_id     BIGINT       NOT NULL,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMP    NOT NULL,
  revoked_at  TIMESTAMP    NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- 1.5 Ho so mo rong cho Renter (1-1 voi users) — US-02
CREATE TABLE renter_profiles (
  user_id                 BIGINT       PRIMARY KEY,
  license_number          VARCHAR(30)  NULL UNIQUE,
  license_full_name       VARCHAR(150) NULL,
  license_dob             DATE         NULL,
  license_issue_date      DATE         NULL,
  license_expiry_date     DATE         NULL,
  license_front_url       VARCHAR(500) NULL,
  license_back_url        VARCHAR(500) NULL,
  license_status          ENUM('unverified','pending','verified','rejected')
                            NOT NULL DEFAULT 'unverified',
  license_verified_by     BIGINT       NULL,
  license_verified_at     TIMESTAMP    NULL,
  license_reject_reason   VARCHAR(255) NULL,
  created_at              TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by              BIGINT       NULL,
  updated_at              TIMESTAMP    NULL ON UPDATE CURRENT_TIMESTAMP,
  updated_by              BIGINT       NULL,
  CONSTRAINT fk_rp_user        FOREIGN KEY (user_id)             REFERENCES users(user_id),
  CONSTRAINT fk_rp_verified_by FOREIGN KEY (license_verified_by) REFERENCES users(user_id)
);

-- 1.6 Ho so mo rong cho Owner (1-1 voi users) — US-02
CREATE TABLE owner_profiles (
  user_id               BIGINT       PRIMARY KEY,
  id_card_front_url     VARCHAR(500) NULL,
  id_card_back_url      VARCHAR(500) NULL,
  bank_account_number   VARCHAR(30)  NULL,
  bank_name             VARCHAR(100) NULL,
  verification_status   ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  verified_by           BIGINT       NULL,
  verified_at           TIMESTAMP    NULL,
  created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by            BIGINT       NULL,
  updated_at            TIMESTAMP    NULL ON UPDATE CURRENT_TIMESTAMP,
  updated_by            BIGINT       NULL,
  CONSTRAINT fk_op_user        FOREIGN KEY (user_id)     REFERENCES users(user_id),
  CONSTRAINT fk_op_verified_by FOREIGN KEY (verified_by) REFERENCES users(user_id)
);


-- ============================================================
-- PHAN 2: XE & TIEN ICH (EPIC-03, EPIC-04)
-- ============================================================

-- 2.1 Xe cho thue (US-03, US-04, US-05, US-10)
CREATE TABLE cars (
  car_id                 BIGINT        PRIMARY KEY AUTO_INCREMENT,
  owner_id               BIGINT        NOT NULL,
  brand                  VARCHAR(50)   NOT NULL,
  model                  VARCHAR(100)  NOT NULL,
  year                   SMALLINT      NOT NULL,
  license_plate          VARCHAR(20)   NOT NULL UNIQUE,
  car_type               ENUM('sedan','suv','crossover','hatchback','mpv','pickup','other') 
                           NOT NULL DEFAULT 'sedan',                                      -- US-05 AC: Loc theo loai xe
  seats                  TINYINT       NOT NULL DEFAULT 4,
  transmission           ENUM('manual','automatic') NOT NULL,
  fuel_type              ENUM('gasoline','diesel','electric','hybrid') NOT NULL,
  color                  VARCHAR(30)   NULL,
  description            TEXT          NULL,
  pickup_address         VARCHAR(255)  NOT NULL,
  latitude               DECIMAL(10,7) NULL,
  longitude              DECIMAL(10,7) NULL,
  base_price_per_day     DECIMAL(12,2) NOT NULL CHECK (base_price_per_day > 0),
  
  -- Dinh muc & Don gia phu phi phuc vu tinh tu dong (US-10 AC)
  max_km_per_day         INT           NOT NULL DEFAULT 300,                              -- Gioi han km/ngay
  overmileage_fee_per_km DECIMAL(10,2) NOT NULL DEFAULT 5000.00,                          -- Don gia vuot km
  overtime_fee_per_hour  DECIMAL(10,2) NOT NULL DEFAULT 100000.00,                        -- Don gia tre gio
  
  -- Cache rating tranh full table scan khi sort search (US-05 AC & US-11)
  avg_rating             DECIMAL(3,2)  NOT NULL DEFAULT 0.00,
  review_count           INT           NOT NULL DEFAULT 0,

  status                 ENUM('draft','pending_review','approved','active','inactive','rejected','suspended')
                           NOT NULL DEFAULT 'draft',
  rejection_reason       VARCHAR(255)  NULL,
  approved_by            BIGINT        NULL,
  approved_at            TIMESTAMP     NULL,
  
  created_at             TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by             BIGINT        NULL,
  updated_at             TIMESTAMP     NULL ON UPDATE CURRENT_TIMESTAMP,
  updated_by             BIGINT        NULL,
  deleted_at             TIMESTAMP     NULL,
  deleted_by             BIGINT        NULL,
  CONSTRAINT fk_car_owner       FOREIGN KEY (owner_id)    REFERENCES users(user_id),
  CONSTRAINT fk_car_approved_by FOREIGN KEY (approved_by) REFERENCES users(user_id)
);
CREATE INDEX idx_cars_owner   ON cars(owner_id);
CREATE INDEX idx_cars_status  ON cars(status);
CREATE INDEX idx_cars_search  ON cars(status, car_type, base_price_per_day);
CREATE INDEX idx_cars_rating  ON cars(status, avg_rating DESC);

-- 2.2 Anh xe (US-03: upload >= 3 anh)
CREATE TABLE car_images (
  image_id     BIGINT       PRIMARY KEY AUTO_INCREMENT,
  car_id       BIGINT       NOT NULL,
  image_url    VARCHAR(500) NOT NULL,
  is_thumbnail BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by   BIGINT       NULL,
  CONSTRAINT fk_ci_car FOREIGN KEY (car_id) REFERENCES cars(car_id) ON DELETE CASCADE
);

-- 2.3 Giay to xe (dang ky, dang kiem, bao hiem) — US-03
CREATE TABLE car_documents (
  document_id         BIGINT       PRIMARY KEY AUTO_INCREMENT,
  car_id              BIGINT       NOT NULL,
  document_type       VARCHAR(50)  NOT NULL,
  document_url        VARCHAR(500) NOT NULL,
  expiry_date         DATE         NULL,
  verification_status ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  verified_by         BIGINT       NULL,
  verified_at         TIMESTAMP    NULL,
  created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by          BIGINT       NULL,
  updated_at          TIMESTAMP    NULL ON UPDATE CURRENT_TIMESTAMP,
  updated_by          BIGINT       NULL,
  CONSTRAINT fk_cd_car         FOREIGN KEY (car_id)      REFERENCES cars(car_id),
  CONSTRAINT fk_cd_verified_by FOREIGN KEY (verified_by) REFERENCES users(user_id)
);

-- 2.4 Tien ich xe (US-03)
CREATE TABLE amenities (
  amenity_id BIGINT      PRIMARY KEY AUTO_INCREMENT,
  name       VARCHAR(50) NOT NULL UNIQUE
);

-- 2.5 N-N xe — tien ich
CREATE TABLE car_amenities (
  car_id     BIGINT NOT NULL,
  amenity_id BIGINT NOT NULL,
  PRIMARY KEY (car_id, amenity_id),
  CONSTRAINT fk_ca_car     FOREIGN KEY (car_id)     REFERENCES cars(car_id) ON DELETE CASCADE,
  CONSTRAINT fk_ca_amenity FOREIGN KEY (amenity_id) REFERENCES amenities(amenity_id)
);

-- 2.6 Lich san sang cua xe (US-03 calendar)
CREATE TABLE car_availability (
  availability_id BIGINT       PRIMARY KEY AUTO_INCREMENT,
  car_id          BIGINT       NOT NULL,
  available_from  DATETIME     NOT NULL,
  available_to    DATETIME     NOT NULL,
  is_blocked      BOOLEAN      NOT NULL DEFAULT FALSE,
  note            VARCHAR(255) NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by      BIGINT       NULL,
  updated_at      TIMESTAMP    NULL ON UPDATE CURRENT_TIMESTAMP,
  updated_by      BIGINT       NULL,
  CONSTRAINT fk_cav_car   FOREIGN KEY (car_id) REFERENCES cars(car_id),
  CONSTRAINT chk_cav_range CHECK (available_to > available_from)
);
CREATE INDEX idx_cav_range ON car_availability(car_id, available_from, available_to);

-- 2.7 Quy tac gia dac biet (cuoi tuan, le, thue dai ngay)
CREATE TABLE pricing_rules (
  rule_id      BIGINT        PRIMARY KEY AUTO_INCREMENT,
  car_id       BIGINT        NOT NULL,
  rule_type    ENUM('weekend','holiday','long_term_discount') NOT NULL,
  adjust_type  ENUM('fixed','percent') NOT NULL DEFAULT 'percent',
  adjust_value DECIMAL(10,2) NOT NULL,
  min_days     INT           NULL,
  start_date   DATE          NULL,
  end_date     DATE          NULL,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by   BIGINT        NULL,
  updated_at   TIMESTAMP     NULL ON UPDATE CURRENT_TIMESTAMP,
  updated_by   BIGINT        NULL,
  CONSTRAINT fk_pr_car FOREIGN KEY (car_id) REFERENCES cars(car_id) ON DELETE CASCADE
);

-- 2.8 Chinh sach huy theo % (US-07)
CREATE TABLE cancellation_policies (
  policy_id           BIGINT        PRIMARY KEY AUTO_INCREMENT,
  name                VARCHAR(100)  NOT NULL,
  hours_before_pickup INT           NOT NULL,
  refund_percent      DECIMAL(5,2)  NOT NULL,
  car_id              BIGINT        NULL,
  created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by          BIGINT        NULL,
  updated_at          TIMESTAMP     NULL ON UPDATE CURRENT_TIMESTAMP,
  updated_by          BIGINT        NULL,
  CONSTRAINT fk_cp_car FOREIGN KEY (car_id) REFERENCES cars(car_id)
);


-- ============================================================
-- PHAN 3: DAT XE — BOOKING (EPIC-05: US-06, US-07, US-14)
-- Vong doi Mioto: requested → confirmed → deposit_paid
--                 → in_progress → returned → completed
-- Nhanh cancel: rejected | cancelled_by_renter | cancelled_by_owner | cancelled_by_admin | expired
-- ============================================================

CREATE TABLE bookings (
  booking_id            BIGINT        PRIMARY KEY AUTO_INCREMENT,
  renter_id             BIGINT        NOT NULL,
  car_id                BIGINT        NOT NULL,
  owner_id              BIGINT        NOT NULL,   -- Denormalize de query nhanh

  start_datetime        DATETIME      NOT NULL,
  end_datetime          DATETIME      NOT NULL,
  pickup_location       VARCHAR(255)  NOT NULL,
  return_location       VARCHAR(255)  NOT NULL,

  -- Snapshot gia tai thoi diem dat
  price_per_day         DECIMAL(12,2) NOT NULL,
  total_days            INT           NOT NULL CHECK (total_days > 0),
  subtotal_amount       DECIMAL(12,2) NOT NULL,
  extra_fee_amount      DECIMAL(12,2) NOT NULL DEFAULT 0,
  deposit_amount        DECIMAL(12,2) NOT NULL,
  total_amount          DECIMAL(12,2) NOT NULL,
  applied_policy_id     BIGINT        NULL,

  -- Theo doi doi lich (US-07 Reschedule)
  reschedule_count      INT           NOT NULL DEFAULT 0,

  -- Trang thai vong doi (Mioto flow + US-14 Admin force-cancel)
  status ENUM(
    'requested',
    'confirmed',
    'deposit_paid',
    'in_progress',
    'returned',
    'completed',
    'rejected',
    'cancelled_by_renter',
    'cancelled_by_owner',
    'cancelled_by_admin',
    'expired'
  ) NOT NULL DEFAULT 'requested',

  -- Deadline tu dong (Scheduler xu ly auto-expire & auto-cancel)
  confirmation_deadline DATETIME  NULL,
  deposit_deadline      DATETIME  NULL,

  -- Timestamp tung milestone
  confirmed_at    TIMESTAMP NULL,
  deposit_paid_at TIMESTAMP NULL,
  picked_up_at    TIMESTAMP NULL,
  returned_at     TIMESTAMP NULL,
  completed_at    TIMESTAMP NULL,
  cancelled_at    TIMESTAMP NULL,
  cancelled_by    BIGINT    NULL,
  cancel_reason   VARCHAR(255) NULL,

  -- Audit
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by  BIGINT    NULL,
  updated_at  TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  updated_by  BIGINT    NULL,

  CONSTRAINT fk_bk_renter       FOREIGN KEY (renter_id)        REFERENCES users(user_id),
  CONSTRAINT fk_bk_car          FOREIGN KEY (car_id)           REFERENCES cars(car_id),
  CONSTRAINT fk_bk_owner        FOREIGN KEY (owner_id)         REFERENCES users(user_id),
  CONSTRAINT fk_bk_policy       FOREIGN KEY (applied_policy_id) REFERENCES cancellation_policies(policy_id),
  CONSTRAINT fk_bk_cancelled_by FOREIGN KEY (cancelled_by)     REFERENCES users(user_id),
  CONSTRAINT chk_bk_dates       CHECK (end_datetime > start_datetime)
);

CREATE INDEX idx_bk_car_range ON bookings(car_id, start_datetime, end_datetime);
CREATE INDEX idx_bk_renter    ON bookings(renter_id, status);
CREATE INDEX idx_bk_owner     ON bookings(owner_id, status);
CREATE INDEX idx_bk_status    ON bookings(status);

-- 3.2 Lich su chuyen trang thai booking
CREATE TABLE booking_status_history (
  history_id  BIGINT       PRIMARY KEY AUTO_INCREMENT,
  booking_id  BIGINT       NOT NULL,
  old_status  VARCHAR(30)  NULL,
  new_status  VARCHAR(30)  NOT NULL,
  changed_by  BIGINT       NOT NULL,
  changed_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  note        VARCHAR(255) NULL,
  CONSTRAINT fk_bsh_booking    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
  CONSTRAINT fk_bsh_changed_by FOREIGN KEY (changed_by) REFERENCES users(user_id)
);
CREATE INDEX idx_bsh_booking ON booking_status_history(booking_id);


-- ============================================================
-- PHAN 4: GIAO / TRA XE (EPIC-07: US-09, US-10)
-- ============================================================

CREATE TABLE handovers (
  handover_id             BIGINT    PRIMARY KEY AUTO_INCREMENT,
  booking_id              BIGINT    NOT NULL,
  handover_type           ENUM('pickup','return') NOT NULL,
  odometer_reading        INT       NOT NULL CHECK (odometer_reading >= 0),
  fuel_level              TINYINT   NOT NULL CHECK (fuel_level BETWEEN 0 AND 100),
  exterior_condition_note TEXT      NULL,
  interior_condition_note TEXT      NULL,
  handed_by               BIGINT    NOT NULL,
  received_by             BIGINT    NOT NULL,
  handover_time           DATETIME  NOT NULL,
  renter_confirmed        BOOLEAN   NOT NULL DEFAULT FALSE,
  renter_confirmed_at     TIMESTAMP NULL,
  owner_confirmed         BOOLEAN   NOT NULL DEFAULT FALSE,
  owner_confirmed_at      TIMESTAMP NULL,
  has_dispute             BOOLEAN   NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by              BIGINT    NULL,
  updated_at              TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  updated_by              BIGINT    NULL,
  UNIQUE KEY uk_handover (booking_id, handover_type),
  CONSTRAINT fk_ho_booking     FOREIGN KEY (booking_id)  REFERENCES bookings(booking_id),
  CONSTRAINT fk_ho_handed_by   FOREIGN KEY (handed_by)   REFERENCES users(user_id),
  CONSTRAINT fk_ho_received_by FOREIGN KEY (received_by) REFERENCES users(user_id)
);

CREATE TABLE handover_images (
  image_id     BIGINT       PRIMARY KEY AUTO_INCREMENT,
  handover_id  BIGINT       NOT NULL,
  image_url    VARCHAR(500) NOT NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_hi_handover FOREIGN KEY (handover_id) REFERENCES handovers(handover_id) ON DELETE CASCADE
);


-- ============================================================
-- PHAN 5: THANH TOAN & PHU PHI (EPIC-06: US-08, EPIC-07: US-10)
-- ============================================================

-- 5.1 Giao dich thanh toan (US-08)
CREATE TABLE payments (
  payment_id       BIGINT        PRIMARY KEY AUTO_INCREMENT,
  booking_id       BIGINT        NOT NULL,
  user_id          BIGINT        NOT NULL,                                         -- US-08: Tra cuu lich su truc tiep theo user
  amount           DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  payment_type     ENUM('deposit','final_payment','surcharge','refund') NOT NULL,
  payment_method   ENUM('vnpay','momo','bank_transfer','cash','simulated') NOT NULL,
  transaction_code VARCHAR(100)  NULL UNIQUE,
  gateway_response TEXT          NULL,                                             -- US-08: Luu Webhook response doi soat VNPay/MoMo
  status           ENUM('pending','success','failed','refunded') NOT NULL DEFAULT 'pending',
  paid_at          TIMESTAMP     NULL,
  note             VARCHAR(255)  NULL,
  created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by       BIGINT        NULL,
  updated_at       TIMESTAMP     NULL ON UPDATE CURRENT_TIMESTAMP,
  updated_by       BIGINT        NULL,
  CONSTRAINT fk_pm_booking FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
  CONSTRAINT fk_pm_user    FOREIGN KEY (user_id)    REFERENCES users(user_id)
);
CREATE INDEX idx_pm_booking ON payments(booking_id);
CREATE INDEX idx_pm_user    ON payments(user_id);

-- 5.2 Phu phi phat sinh khi tra xe (US-10)
CREATE TABLE surcharges (
  surcharge_id   BIGINT        PRIMARY KEY AUTO_INCREMENT,
  booking_id     BIGINT        NOT NULL,
  surcharge_type ENUM('late_return','overmileage','fuel','cleaning','damage','other') NOT NULL,
  amount         DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  description    VARCHAR(255)  NULL,
  status         ENUM('pending','paid','waived') NOT NULL DEFAULT 'pending',       -- US-10: Theo doi da tra / con no
  payment_id     BIGINT        NULL,                                               -- Lien ket toi giao dich thanh toan phu phi
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by     BIGINT        NOT NULL,
  CONSTRAINT fk_sc_booking    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
  CONSTRAINT fk_sc_created_by FOREIGN KEY (created_by) REFERENCES users(user_id),
  CONSTRAINT fk_sc_payment    FOREIGN KEY (payment_id) REFERENCES payments(payment_id)
);


-- ============================================================
-- PHAN 6: DANH GIA, KHIEU NAI, THONG BAO, YEU THICH (EPIC-08 -> EPIC-12)
-- ============================================================

-- 6.1 Danh gia sau chuyen (US-11)
CREATE TABLE reviews (
  review_id    BIGINT    PRIMARY KEY AUTO_INCREMENT,
  booking_id   BIGINT    NOT NULL,
  reviewer_id  BIGINT    NOT NULL,
  reviewee_id  BIGINT    NOT NULL,
  car_id       BIGINT    NULL,
  rating       TINYINT   NOT NULL,
  comment      TEXT      NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_rv_rating   CHECK (rating BETWEEN 1 AND 5),
  UNIQUE KEY uk_review (booking_id, reviewer_id),
  CONSTRAINT fk_rv_booking  FOREIGN KEY (booking_id)  REFERENCES bookings(booking_id),
  CONSTRAINT fk_rv_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(user_id),
  CONSTRAINT fk_rv_reviewee FOREIGN KEY (reviewee_id) REFERENCES users(user_id)
);

-- 6.2 Khieu nai (US-12, US-15 AI Summarization)
CREATE TABLE complaints (
  complaint_id      BIGINT       PRIMARY KEY AUTO_INCREMENT,
  booking_id        BIGINT       NULL,
  reporter_id       BIGINT       NOT NULL,
  against_user_id   BIGINT       NULL,
  category          VARCHAR(50)  NULL,
  description       TEXT         NOT NULL,
  ai_summary        TEXT         NULL,                                             -- US-15: Ket qua tom tat tu dong bang AI
  status            ENUM('open','in_progress','escalated','resolved','rejected') 
                      NOT NULL DEFAULT 'open',                                     -- US-12 AC & Test: Ho tro Escalate
  assigned_staff_id BIGINT       NULL,
  resolution_note   TEXT         NULL,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by        BIGINT       NULL,
  updated_at        TIMESTAMP    NULL ON UPDATE CURRENT_TIMESTAMP,
  updated_by        BIGINT       NULL,
  resolved_at       TIMESTAMP    NULL,
  CONSTRAINT fk_cm_booking  FOREIGN KEY (booking_id)        REFERENCES bookings(booking_id),
  CONSTRAINT fk_cm_reporter FOREIGN KEY (reporter_id)       REFERENCES users(user_id),
  CONSTRAINT fk_cm_against  FOREIGN KEY (against_user_id)   REFERENCES users(user_id),
  CONSTRAINT fk_cm_staff    FOREIGN KEY (assigned_staff_id) REFERENCES users(user_id)
);

-- 6.3 Bang chung khieu nai (US-12)
CREATE TABLE complaint_attachments (
  attachment_id BIGINT       PRIMARY KEY AUTO_INCREMENT,
  complaint_id  BIGINT       NOT NULL,
  file_url      VARCHAR(500) NOT NULL,
  file_type     VARCHAR(20)  NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cat_complaint FOREIGN KEY (complaint_id) REFERENCES complaints(complaint_id) ON DELETE CASCADE
);

-- 6.4 Thong bao he thong (US-13)
CREATE TABLE notifications (
  notification_id    BIGINT       PRIMARY KEY AUTO_INCREMENT,
  user_id            BIGINT       NOT NULL,
  type               VARCHAR(50)  NOT NULL,
  title              VARCHAR(150) NOT NULL,
  content            VARCHAR(500) NOT NULL,
  is_read            BOOLEAN      NOT NULL DEFAULT FALSE,
  related_booking_id BIGINT       NULL,
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_noti_user    FOREIGN KEY (user_id)            REFERENCES users(user_id),
  CONSTRAINT fk_noti_booking FOREIGN KEY (related_booking_id) REFERENCES bookings(booking_id)
);
CREATE INDEX idx_noti_user_read ON notifications(user_id, is_read);

-- 6.5 Xe yeu thich (US-05)
CREATE TABLE favorites (
  user_id    BIGINT    NOT NULL,
  car_id     BIGINT    NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, car_id),
  CONSTRAINT fk_fav_user FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_fav_car  FOREIGN KEY (car_id)  REFERENCES cars(car_id)
);


-- ============================================================
-- PHAN 7: CAU HINH HE THONG (EPIC-11: US-14)
-- ============================================================

CREATE TABLE system_configs (
  config_key   VARCHAR(100) PRIMARY KEY,
  config_value VARCHAR(500) NOT NULL,
  description  VARCHAR(255) NULL,
  updated_at   TIMESTAMP    NULL ON UPDATE CURRENT_TIMESTAMP,
  updated_by   BIGINT       NULL,
  CONSTRAINT fk_cfg_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id)
);


-- #############################################################################
-- SEED DATA + SQL VALIDATE TOAN TRINH (KHOP VOI 15 USER STORIES)
-- Mat khau '123456' BCrypt: $2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi
-- #############################################################################

-- STEP 0: Seed role, cau hinh & danh muc (US-01, US-03, US-07, US-14)
INSERT INTO roles (role_name) VALUES ('renter'), ('owner'), ('staff'), ('admin');

INSERT INTO system_configs (config_key, config_value, description) VALUES
('deposit_percent',        '30', 'Ty le % tien coc tren tong tien thue'),
('confirm_deadline_hours', '24', 'So gio owner phai confirm, qua han → expired'),
('deposit_deadline_hours', '2',  'So gio renter phai coc sau khi confirm, qua han → cancelled');

INSERT INTO amenities (name) VALUES
('GPS'), ('Camera hanh trinh'), ('Cua so troi'),
('Ghe tre em'), ('Bluetooth'), ('Man hinh Android');

INSERT INTO cancellation_policies (name, hours_before_pickup, refund_percent) VALUES
('Huy som (>= 48h)',    48, 100.00),
('Huy vua (24h-48h)',   24,  70.00),
('Huy muon (< 24h)',     0,   0.00);


-- STEP 1: Admin khoi tao he thong (US-14)
INSERT INTO users (username, email, phone, password_hash, full_name, address, status)
VALUES ('admin', 'admin@driveshare.vn', '0900000000',
        '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi',
        'Admin He Thong', 'Toa nha Innovation, Q.1, TP.HCM', 'active');
-- user_id = 1
INSERT INTO user_roles (user_id, role_id) VALUES (1, 4);  -- role 4 = admin


-- STEP 2: Staff duyet he thong (US-02, US-04, US-12)
INSERT INTO users (username, email, phone, password_hash, full_name, address, status)
VALUES ('staff_tin', 'tin@driveshare.vn', '0900000099',
        '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi',
        'Nguyen Huu Tin', 'P. Ben Nghe, Q.1, TP.HCM', 'active');
-- user_id = 2
INSERT INTO user_roles (user_id, role_id) VALUES (2, 3);  -- role 3 = staff


-- STEP 3: Owner dang ky tai khoan (US-01, US-02)
INSERT INTO users (username, email, phone, password_hash, full_name, address, status)
VALUES ('owner_hung', 'hung@gmail.com', '0901234567',
        '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi',
        'Nguyen Van Hung', '123 Nguyen Thi Minh Khai, Q.1, TP.HCM', 'active');
-- user_id = 3
INSERT INTO user_roles (user_id, role_id) VALUES (3, 2);  -- role 2 = owner
INSERT INTO owner_profiles (user_id, bank_account_number, bank_name, verification_status, created_by)
VALUES (3, '00112233445', 'Vietcombank', 'verified', 2);


-- STEP 4: Renter dang ky & cap nhat GPLX (US-01, US-02)
INSERT INTO users (username, email, phone, password_hash, full_name, address, status)
VALUES ('renter_nam', 'nam@gmail.com', '0988776655',
        '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi',
        'Le Hoang Nam', '456 Le Van Viet, TP. Thu Duc, TP.HCM', 'active');
-- user_id = 4
INSERT INTO user_roles (user_id, role_id) VALUES (4, 1);  -- role 1 = renter
INSERT INTO renter_profiles (user_id, license_number, license_front_url, license_back_url,
                              license_status, created_by)
VALUES (4, 'B2-790123456789', 'front.jpg', 'back.jpg', 'unverified', 4);


-- STEP 5: Staff duyet GPLX cua Renter (US-02)
UPDATE renter_profiles
SET license_status      = 'verified',
    license_verified_by = 2,
    license_verified_at = NOW(),
    updated_by          = 2
WHERE user_id = 4;


-- STEP 6: Owner dang xe moi kem loai xe & dinh muc phu phi (US-03, US-10)
INSERT INTO cars (
  owner_id, brand, model, year, license_plate, car_type, seats, transmission,
  fuel_type, pickup_address, base_price_per_day,
  max_km_per_day, overmileage_fee_per_km, overtime_fee_per_hour,
  status, created_by
) VALUES (
  3, 'Toyota', 'Vios 1.5 CVT', 2022, '51H-123.45', 'sedan', 5, 'automatic',
  'gasoline', '123 Nguyen Thi Minh Khai, Q.1', 800000.00,
  300, 5000.00, 100000.00,
  'draft', 3
);
-- car_id = 1
INSERT INTO car_images (car_id, image_url, is_thumbnail, created_by)
VALUES (1, 'vios_thumb.jpg', TRUE, 3);
INSERT INTO car_amenities (car_id, amenity_id) VALUES (1, 1), (1, 2), (1, 5);


-- STEP 7: Staff duyet xe → active de hien thi tren search (US-04, US-05)
UPDATE cars SET status = 'pending_review', updated_by = 3 WHERE car_id = 1;
UPDATE cars
SET status = 'active', approved_by = 2, approved_at = NOW(), updated_by = 2
WHERE car_id = 1;


-- STEP 8: Owner mo lich san sang (US-03)
INSERT INTO car_availability (car_id, available_from, available_to, created_by)
VALUES (1, '2026-09-15 08:00:00', '2026-12-31 20:00:00', 3);


-- STEP 9: Kiem tra xung dot lich truoc khi cho phep dat xe (US-06)
SELECT COUNT(*) AS conflict_count
FROM bookings
WHERE car_id = 1
  AND status IN ('requested','confirmed','deposit_paid','in_progress')
  AND NOT (end_datetime <= '2026-09-20 08:00:00'
        OR start_datetime >= '2026-09-23 08:00:00');


-- STEP 10: Renter GUI YEU CAU DAT XE (status = 'requested') (US-06)
INSERT INTO bookings (
  renter_id, car_id, owner_id,
  start_datetime, end_datetime,
  pickup_location, return_location,
  price_per_day, total_days, subtotal_amount, deposit_amount, total_amount,
  applied_policy_id, confirmation_deadline,
  status, created_by
) VALUES (
  4, 1, 3,
  '2026-09-20 08:00:00', '2026-09-23 08:00:00',
  '123 Nguyen Thi Minh Khai, Q.1', '123 Nguyen Thi Minh Khai, Q.1',
  800000, 3, 2400000, 720000, 2400000,
  1, DATE_ADD(NOW(), INTERVAL 24 HOUR),
  'requested', 4
);
-- booking_id = 1
INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by, note)
VALUES (1, NULL, 'requested', 4, 'Renter gui yeu cau thue xe');


-- STEP 11: Owner XAC NHAN yeu cau (US-06)
UPDATE bookings
SET status = 'confirmed',
    confirmed_at     = NOW(),
    deposit_deadline = DATE_ADD(NOW(), INTERVAL 2 HOUR),
    updated_by       = 3
WHERE booking_id = 1;

INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by, note)
VALUES (1, 'requested', 'confirmed', 3, 'Owner xac nhan yeu cau thue xe');


-- STEP 12: Renter DAT COC qua cong thanh toan (US-08)
INSERT INTO payments (
  booking_id, user_id, amount, payment_type, payment_method,
  transaction_code, gateway_response, status, paid_at, created_by
) VALUES (
  1, 4, 720000, 'deposit', 'vnpay',
  'VNPAY20260920001', '{"vnp_ResponseCode":"00","vnp_TransactionNo":"14589201"}',
  'success', NOW(), 4
);

UPDATE bookings
SET status = 'deposit_paid', deposit_paid_at = NOW(), updated_by = 4
WHERE booking_id = 1;

INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by, note)
VALUES (1, 'confirmed', 'deposit_paid', 4, 'Renter da thanh toan coc qua VNPay');


-- STEP 13: GIAO XE (Pickup Handover) — US-09
INSERT INTO handovers (
  booking_id, handover_type, odometer_reading, fuel_level,
  exterior_condition_note, handed_by, received_by,
  handover_time, owner_confirmed, owner_confirmed_at, created_by
) VALUES (
  1, 'pickup', 52000, 100, 'Xe sach, khong tray xuoc, du xang 100%',
  3, 4, '2026-09-20 08:30:00', TRUE, NOW(), 3
);
-- handover_id = 1

INSERT INTO handover_images (handover_id, image_url) VALUES
(1, 'pickup_front.jpg'), (1, 'pickup_rear.jpg'),
(1, 'pickup_left.jpg'),  (1, 'pickup_right.jpg');

-- Renter xac nhan bien ban giao xe
UPDATE handovers
SET renter_confirmed = TRUE, renter_confirmed_at = NOW(), updated_by = 4
WHERE handover_id = 1;

-- Ca 2 ben xac nhan → booking chuyen sang in_progress
UPDATE bookings
SET status = 'in_progress', picked_up_at = NOW(), updated_by = 3
WHERE booking_id = 1;

INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by, note)
VALUES (1, 'deposit_paid', 'in_progress', 3, 'Da giao xe, bat dau chuyen thue');


-- STEP 14: TRA XE & TINH PHU PHI TU DONG (US-10)
-- Tra tre 2 tieng (don gia trong xe = 100k/h -> 200k)
-- Thieu 25% xang (125k)
INSERT INTO handovers (
  booking_id, handover_type, odometer_reading, fuel_level,
  exterior_condition_note, handed_by, received_by,
  handover_time, renter_confirmed, renter_confirmed_at, created_by
) VALUES (
  1, 'return', 52350, 75, 'Xe tra tre 2 tieng. Xang con 75% (thieu 25%).',
  4, 3, '2026-09-23 10:00:00', TRUE, NOW(), 4
);
-- handover_id = 2

INSERT INTO handover_images (handover_id, image_url) VALUES
(2, 'return_front.jpg'), (2, 'return_rear.jpg');

-- Lap phu phi (surcharges) voi trang thai 'pending'
INSERT INTO surcharges (booking_id, surcharge_type, amount, description, status, created_by) VALUES
(1, 'late_return', 200000, 'Tra tre 2 tieng x 100,000/tieng', 'pending', 3),
(1, 'fuel',        125000, 'Thieu 25% xang x 500,000/tank',   'pending', 3);

-- Owner xac nhan bien ban tra xe
UPDATE handovers
SET owner_confirmed = TRUE, owner_confirmed_at = NOW(), updated_by = 3
WHERE handover_id = 2;

UPDATE bookings
SET status = 'returned', returned_at = NOW(), updated_by = 3
WHERE booking_id = 1;

INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by, note)
VALUES (1, 'in_progress', 'returned', 3, 'Da nhan lai xe, dang tat toan phu phi');


-- STEP 15: TAT TOAN & HOAN COC SAU KHI TRU PHU PHI (US-08, US-10)
-- Tong phu phi = 325,000 (tru vao coc 720,000 -> hoan lai 395,000)
INSERT INTO payments (
  booking_id, user_id, amount, payment_type, payment_method,
  transaction_code, status, paid_at, note, created_by
) VALUES (
  1, 4, 395000, 'refund', 'bank_transfer',
  'REFUND20260923001', 'success', NOW(),
  'Hoan coc sau khi tru phu phi tra tre + thieu xang', 3
);

-- Cap nhat phu phi sang 'paid'
UPDATE surcharges SET status = 'paid' WHERE booking_id = 1;

UPDATE bookings
SET status       = 'completed',
    completed_at = NOW(),
    total_amount = 2400000 + 325000,
    updated_by   = 3
WHERE booking_id = 1;

INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by, note)
VALUES (1, 'returned', 'completed', 3, 'Hoan tat, hoan coc 395,000 sau khi tru phu phi');


-- STEP 16: DANH GIA 2 CHIEU & DONG BO RATING XE (US-11)
-- Renter danh gia Owner va xe
INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, car_id, rating, comment)
VALUES (1, 4, 3, 1, 5, 'Xe sach, chu xe nhiet tinh, giao xe dung gio');

-- Trigger / Application Event cap nhat cache rating xe
UPDATE cars
SET avg_rating   = (SELECT ROUND(AVG(rating), 2) FROM reviews WHERE car_id = 1),
    review_count = (SELECT COUNT(*) FROM reviews WHERE car_id = 1)
WHERE car_id = 1;

-- Owner danh gia Renter
INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, rating, comment)
VALUES (1, 3, 4, 4, 'Khach than thien nhung tra xe tre 2 tieng');


-- STEP 17: THONG BAO HE THONG (US-13)
INSERT INTO notifications (user_id, type, title, content, related_booking_id) VALUES
(4, 'booking_confirmed', 'Yeu cau da duoc xac nhan',
 'Chu xe xac nhan chuyen thue #1. Vui long dat coc 720,000d trong 2 gio.', 1),
(3, 'deposit_received', 'Renter da dat coc',
 'Renter Le Hoang Nam da coc 720,000d cho chuyen thue #1.', 1),
(4, 'trip_completed', 'Chuyen thue hoan tat',
 'Chuyen thue #1 hoan tat. Da hoan lai 395,000d vao tai khoan.', 1);


-- STEP 18: KHIEU NAI, TOM TAT AI & ESCALATE (US-12, US-15)
INSERT INTO complaints (
  booking_id, reporter_id, against_user_id, category,
  description, ai_summary, status, created_by
) VALUES (
  1, 4, 3, 'surcharge_dispute',
  'Toi khong dong y muc phi xang 125,000d. Khi nhan xe xang chi 90% khong phai 100%.',
  '[AI Summary] Renter khieu nai phi nhien lieu 125k, cho rang luc nhan xe xang chi dat 90%.',
  'open', 4
);
-- complaint_id = 1
INSERT INTO complaint_attachments (complaint_id, file_url, file_type)
VALUES (1, 'evidence_fuel_gauge.jpg', 'image');

-- Staff tien hanh escalate len Admin vi khong tu hoa giai duoc
UPDATE complaints
SET status = 'escalated', assigned_staff_id = 2, updated_by = 2
WHERE complaint_id = 1;


-- STEP 19: ADMIN FORCE-CANCEL BOOKING (US-14)
-- Gia su booking #2 bi Admin huy cuong che do vi pham
-- UPDATE bookings SET status = 'cancelled_by_admin', cancelled_by = 1, cancel_reason = 'Phat hien hanh vi gian lan', cancelled_at = NOW() WHERE booking_id = 2;


-- ============================================================
-- KIEM TRA CUOI: Timeline toan bo booking #1
-- ============================================================
SELECT
  bsh.changed_at,
  bsh.old_status,
  bsh.new_status,
  u.full_name AS changed_by_name,
  bsh.note
FROM booking_status_history bsh
JOIN users u ON u.user_id = bsh.changed_by
WHERE bsh.booking_id = 1
ORDER BY bsh.history_id;
