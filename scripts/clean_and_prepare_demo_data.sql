-- ====================================================================
-- SCRIPT DỌN DẸP DỮ LIỆU RÁC & THIẾT LẬP DỮ LIỆU CHUẨN ĐỂ QUAY DEMO SPRINT 2
-- Dự án: DriveShare (Car Rental Platform)
-- Ngày thực thi: 2026-10-03
-- ====================================================================

BEGIN;

-- 1. XÓA SẠCH DỮ LIỆU THUÊ XE CŨ VÀ THANH TOÁN TEST
DELETE FROM payments;
DELETE FROM rentals;

-- Reset Sequence cho rentals và payments về 1
ALTER SEQUENCE rentals_rental_id_seq RESTART WITH 1;
ALTER SEQUENCE payments_payment_id_seq RESTART WITH 1;

-- 2. XÓA CÁC LỊCH BẬN CŨ VÀ RESET SEQUENCE
DELETE FROM car_calendar_blocks;
ALTER TABLE car_calendar_blocks ALTER COLUMN block_id RESTART WITH 1;

-- 3. XÓA TOÀN BỘ SESSIONS ĐĂNG NHẬP CŨ & LỊCH SỬ CHAT TEST
DELETE FROM auth_sessions;
DELETE FROM chat_memory;

-- 4. XÓA CÁC XE TEST / DỊ THƯỜNG VÀ DỮ LIỆU LIÊN QUAN (xe 6, 9, 10, 17, 18)
DELETE FROM car_images WHERE car_id IN (6, 9, 10, 17, 18);
DELETE FROM car_documents WHERE car_id IN (6, 9, 10, 17, 18);
DELETE FROM cars WHERE car_id IN (6, 9, 10, 17, 18);

-- 5. XÓA CÁC TÀI KHOẢN TEST ẢO (user_id: 11, 12, 18: em123ngao, em123chim, em123ruoi)
DELETE FROM user_roles WHERE user_id IN (11, 12, 18);
DELETE FROM renter_profiles WHERE user_id IN (11, 12, 18);
DELETE FROM owner_profiles WHERE user_id IN (11, 12, 18);
DELETE FROM users WHERE user_id IN (11, 12, 18);

-- 6. TẠO 1 ĐƠN THUÊ MẪU ĐÃ HOÀN THÀNH (COMPLETED) TRONG QUÁ KHỨ (CHO XE 7 - TOYOTA CAMRY 2.5Q)
-- Mục đích: Trang Doanh thu chủ xe (owner-earnings.html) có sẵn số liệu doanh thu 2.400.000 đ và cọc 720.000 đ
INSERT INTO rentals (
    car_id, renter_id, start_date, end_date, total_days,
    price_per_day, total_price, deposit_amount, status,
    note, created_at, updated_at
) VALUES (
    7, 3, '2026-09-20', '2026-09-23', 3,
    800000.00, 2400000.00, 720000.00, 'COMPLETED',
    'Khách thuê công tác Sài Gòn - Vũng Tàu. Chuyến đi thuận lợi, hoàn thành đúng hẹn.',
    '2026-09-18 09:00:00', '2026-09-23 18:00:00'
);

-- Tạo bản ghi thanh toán cọc thành công cho đơn hoàn thành trên
INSERT INTO payments (
    rental_id, amount, payment_type, payment_method, status,
    transaction_code, qr_code_url, paid_at, created_at, updated_at
) VALUES (
    1, 720000.00, 'DEPOSIT', 'VIETQR', 'SUCCESS',
    'DSPAY01_SAMPLE_CAMRY',
    'https://img.vietqr.io/image/MB-090123456789-compact2.png',
    '2026-09-18 10:15:00', '2026-09-18 10:00:00', '2026-09-18 10:15:00'
);

-- 7. THIẾT LẬP 1 LỊCH BẬN MẪU CHO XE VINFAST VF8 PLUS (car_id: 8) TỪ 04/10/2026 ĐẾN 07/10/2026
-- Mục đích: Demo tính năng Badge đỏ [Bận], Smart Date Finder tự nhảy sang 08/10, và Lịch Flatpickr gạch đỏ
INSERT INTO car_calendar_blocks (
    car_id, start_date, end_date, reason, created_by, updated_by, created_at, updated_at
) VALUES (
    8, '2026-10-04', '2026-10-07', 'Bảo dưỡng định kỳ tại xưởng VinFast', 2, 2, NOW(), NOW()
);

COMMIT;
