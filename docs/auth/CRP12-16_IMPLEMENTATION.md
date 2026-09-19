# CRP-12 → CRP-16 — Authentication & Authorization

Phạm vi: chỉ phần xác thực/phân quyền. Không triển khai CRP-10/CRP-11.

## API

- `POST /api/v1/auth/login` — đăng nhập, JWT access/refresh token.
- `POST /api/v1/auth/logout` — thu hồi access token hiện tại.
- `POST /api/v1/auth/change-password` — đổi mật khẩu, thu hồi các session khác.
- `POST /api/v1/auth/forgot-password` — tạo token reset; phản hồi không tiết lộ email có tồn tại. Trong dev, reset URL được trả về để test và cũng ghi log backend.
- `POST /api/v1/auth/reset-password` — token một lần, hết hạn sau 30 phút.
- `GET /api/v1/auth/me` — endpoint protected.
- `GET /api/v1/auth/owner-test` — chỉ OWNER.
- `GET /api/v1/auth/admin-test` — chỉ ADMIN.

## CRP-12

- Sai email/mật khẩu: cùng lỗi `AUTH_FAILED`.
- Owner `PENDING`: đúng mật khẩu mới trả `ACCOUNT_PENDING`.
- `LOCKED`: trả `ACCOUNT_LOCKED`.
- 5 lần đăng nhập sai từ cùng IP → rate limit 15 phút.
- Access token có thời hạn; refresh token có thời hạn 7 ngày.

## CRP-13

- Bắt buộc xác minh mật khẩu hiện tại.
- Mật khẩu mới tối thiểu 8 ký tự, có chữ hoa, chữ thường, chữ số.
- Xác nhận mật khẩu phải trùng.
- Đổi mật khẩu tăng `token_version` và thu hồi toàn bộ session cũ.

## CRP-14

- Token reset được lưu dạng SHA-256, không lưu token thô.
- Token hết hạn sau 30 phút và chỉ dùng một lần.
- Reset thành công tăng `token_version` và thu hồi toàn bộ session.
- Trong môi trường dev hiện chưa cấu hình SMTP nên chưa gửi email thật; reset URL chỉ dùng để test local.

## CRP-15

- Logout đánh dấu session hiện tại là revoked.
- JWT đã revoked sẽ không được `JwtAuthenticationFilter` chấp nhận.
- Token hết hạn hoặc revoked khi gọi protected endpoint → 401.

## CRP-16

Role requirement được khai báo tập trung trong `SecurityConfig`:
- `/api/v1/auth/owner-test` → OWNER
- `/api/v1/auth/admin-test` → ADMIN

Unauthenticated → 401; authenticated nhưng sai role → 403.

## Lưu ý database

`ddl-auto: update` trong profile dev sẽ tạo thêm:
- `auth_sessions`
- `password_reset_tokens`
- các cột `failed_login_attempts`, `locked_until`, `token_version` trong `users`.

Role trong SQL thiết kế là `renter/owner/staff/admin`; `ERoleConverter` chuyển đổi giữa format DB và `ROLE_*` của Spring Security.
