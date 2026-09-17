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
INSERT INTO renter_profiles (user_id, license_number, license_verification_status) VALUES
(4, 'B2-790123456789', 'VERIFIED'),
(5, 'B1-790987654321', 'PENDING')
ON CONFLICT (user_id) DO NOTHING;
