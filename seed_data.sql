-- 1. Roles
INSERT INTO roles (role_id, role_name) VALUES 
(1, 'ROLE_ADMIN'),
(2, 'ROLE_STAFF'),
(3, 'ROLE_OWNER'),
(4, 'ROLE_RENTER')
ON CONFLICT (role_id) DO NOTHING;

-- 2. Users
INSERT INTO users (user_id, username, email, phone, password_hash, full_name, avatar_url, status, created_at) VALUES
(1, 'hung_toyota', 'owner.hung@gmail.com', '0901 234 567', '$2a$10$e8wF3QvX...dummyhash', 'Nguyễn Văn Hùng', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80', 'ACTIVE', NOW()),
(2, 'lan_vinfast', 'owner.lan@gmail.com', '0912 345 678', '$2a$10$e8wF3QvX...dummyhash', 'Trần Thị Lan', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80', 'ACTIVE', NOW()),
(3, 'kiet_sedan', 'owner.kiet@gmail.com', '0988 123 456', '$2a$10$e8wF3QvX...dummyhash', 'Lê Tuấn Kiệt', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', 'PENDING', NOW()),
(4, 'nam_renter', 'renter.nam@gmail.com', '0988 776 655', '$2a$10$e8wF3QvX...dummyhash', 'Lê Hoàng Nam', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', 'ACTIVE', NOW()),
(5, 'mai_phuong', 'renter.mai@gmail.com', '0977 665 544', '$2a$10$e8wF3QvX...dummyhash', 'Nguyễn Phương Mai', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', 'ACTIVE', NOW()),
(6, 'admin_tin', 'admin.tin@driveshare.vn', '0909 999 888', '$2a$10$e8wF3QvX...dummyhash', 'Nguyễn Trọng Tín', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80', 'ACTIVE', NOW())
ON CONFLICT (user_id) DO NOTHING;

-- Fix sequences
SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));
SELECT setval('roles_role_id_seq', (SELECT MAX(role_id) FROM roles));

-- 3. User roles
INSERT INTO user_roles (user_id, role_id) VALUES
(1, 3),
(2, 3),
(3, 3),
(4, 4),
(5, 4),
(6, 1),
(6, 2)
ON CONFLICT DO NOTHING;

-- 4. Owner profiles
INSERT INTO owner_profiles (user_id, bank_name, bank_account_number, verification_status) VALUES
(1, 'Techcombank', '1903345678901', 'VERIFIED'),
(2, 'Vietcombank', '0071001234567', 'VERIFIED'),
(3, 'MB Bank', '0988123456', 'PENDING')
ON CONFLICT (user_id) DO NOTHING;

-- 5. Renter profiles
INSERT INTO renter_profiles (user_id, license_number, license_full_name, license_dob, license_issue_date, license_expiry_date, license_front_url, license_back_url, license_verification_status) VALUES
(4, 'B2-790123456789', 'Lê Hoàng Nam', '1992-05-15', '2018-06-20', '2028-06-20', 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80', 'VERIFIED'),
(5, 'B1-790987654321', 'Nguyễn Phương Mai', '1996-10-22', '2021-03-10', '2031-03-10', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80', 'PENDING')
ON CONFLICT (user_id) DO NOTHING;

-- 6. Cars
INSERT INTO cars (car_id, owner_id, brand, model, year, license_plate, seats, transmission, fuel_type, color, description, pickup_address, base_price_per_day, status, created_at) VALUES
(1, 1, 'Toyota', 'Vios 1.5 G CVT', 2022, '51H-123.45', 5, 'AUTOMATIC', 'GASOLINE', 'Trắng', 'Xe gia đình giữ gìn rất kỹ, bảo dưỡng định kỳ chính hãng.', '123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP.HCM', 750000.00, 'ACTIVE', NOW()),
(2, 1, 'Hyundai', 'Accent 1.4 AT Đặc Biệt', 2023, '51K-987.65', 5, 'AUTOMATIC', 'GASOLINE', 'Đen', 'Dòng xe trẻ trung, kiểu dáng hiện đại.', '245 Điện Biên Phủ, Phường Võ Thị Sáu, Quận 3, TP.HCM', 700000.00, 'ACTIVE', NOW()),
(3, 2, 'VinFast', 'VF8 Plus (Điện)', 2023, '51A-888.88', 5, 'AUTOMATIC', 'ELECTRIC', 'Xanh', 'Trải nghiệm SUV điện hạng D cao cấp, bứt tốc êm ái.', 'Khu đô thị Phú Mỹ Hưng, Nguyễn Văn Linh, Quận 7, TP.HCM', 1200000.00, 'ACTIVE', NOW()),
(4, 1, 'Toyota', 'Corolla Cross 1.8V', 2024, '51L-456.78', 5, 'AUTOMATIC', 'GASOLINE', 'Trắng', 'Xe mới đập hộp 2024 chạy lướt 5.000km, màu trắng ngọc trai bóng bẩy.', '32 Song Hành, Phường An Phú, TP. Thủ Đức, TP.HCM', 950000.00, 'PENDING_REVIEW', NOW())
ON CONFLICT (car_id) DO NOTHING;

-- Fix cars sequence
SELECT setval('cars_car_id_seq', (SELECT COALESCE(MAX(car_id), 1) FROM cars));

-- 7. Car Images
INSERT INTO car_images (image_id, car_id, image_url, is_thumbnail, created_at) VALUES
(1, 1, 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=900&q=80', TRUE, NOW()),
(2, 2, 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80', TRUE, NOW()),
(3, 3, 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=900&q=80', TRUE, NOW()),
(4, 4, 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=900&q=80', TRUE, NOW())
ON CONFLICT (image_id) DO NOTHING;

-- Fix car_images sequence
SELECT setval('car_images_image_id_seq', (SELECT COALESCE(MAX(image_id), 1) FROM car_images));

-- 8. Car Documents (Cavet, Đăng kiểm, Bảo hiểm)
INSERT INTO car_documents (document_id, car_id, document_type, document_url, verification_status, created_at) VALUES
(1, 4, 'REGISTRATION', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80', 'PENDING', NOW()),
(2, 4, 'INSPECTION', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=80', 'PENDING', NOW()),
(3, 4, 'INSURANCE', 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80', 'PENDING', NOW())
ON CONFLICT (document_id) DO NOTHING;

-- Fix car_documents sequence
SELECT setval('car_documents_document_id_seq', (SELECT COALESCE(MAX(document_id), 1) FROM car_documents));

