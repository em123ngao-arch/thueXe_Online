# 📜 BUSINESS RULES — DRIVESHARE (Sprint 1 Fix)

> **Nguồn gốc:** Thu thập qua phỏng vấn có cấu trúc (Requirements Elicitation) với Product Owner ngày 19/09/2026.
> **Mục đích:** Làm chuẩn cho Dev code + Test viết test case. Mọi ambiguity hỏi lại trước khi code.

---

## 🔐 BR-01: Đăng ký tài khoản

| Rule ID | Mô tả | Ghi chú |
|---|---|---|
| BR-01-1 | Email phải là duy nhất trong hệ thống | Trả lỗi EMAIL_EXISTED nếu trùng |
| BR-01-2 | Sau đăng ký thành công → hiện toast "Đăng ký thành công!" màu xanh | Hiển thị 2 giây |
| BR-01-3 | Sau 2 giây → tự động chuyển sang tab Đăng nhập | Không reload trang, chỉ switch tab |
| BR-01-4 | Owner đăng ký → status = PENDING (chờ Admin duyệt) | Chưa dùng được app cho đến khi được duyệt |
| BR-01-5 | Renter đăng ký → status = ACTIVE (dùng ngay) | Không cần Admin duyệt |
| BR-01-6 | Mật khẩu: tối thiểu 8 ký tự, có chữ hoa, số, ký tự đặc biệt | Validate cả FE và BE |

**Acceptance Criteria:**
- [ ] Register email đã tồn tại → 400 EMAIL_EXISTED, FE hiện lỗi đỏ dưới ô email
- [ ] Register thành công → toast xanh xuất hiện góc phải màn hình
- [ ] Sau đúng 2 giây → form tự chuyển sang tab Đăng nhập (BR-01-3)
- [ ] Không reload trang khi chuyển tab
- [ ] Mật khẩu yếu → FE báo lỗi ngay trước khi gửi API

---

## 🪪 BR-02: Upload & Xác minh Giấy tờ

> ⚠️ **Phân biệt rõ:** CMND/CCCD (định danh cá nhân) ≠ GPLX (bằng lái xe)

| Rule ID | Mô tả | Áp dụng cho | Ghi chú |
|---|---|---|---|
| BR-02-1 | Cả Renter và Owner đều phải upload CMND/CCCD 2 mặt | Cả 2 | Định danh cá nhân |
| BR-02-2 | Renter phải upload thêm GPLX (1 ảnh) | Chỉ Renter | Bằng lái xe |
| BR-02-3 | Phải upload đủ mặt yêu cầu mới hợp lệ | Cả 2 | CMND thiếu 1 mặt → lỗi MISSING_CCCD_SIDE |
| BR-02-4 | Sau khi upload → verification_status = PENDING | Cả 2 | Chờ Admin xem xét |
| BR-02-5 | Admin phê duyệt → verification_status = APPROVED | Cả 2 | |
| BR-02-6 | Admin từ chối → verification_status = REJECTED | Cả 2 | Lưu lý do từ chối |

**Acceptance Criteria:**
- [ ] Upload CMND thiếu 1 mặt → API trả 400 MISSING_CCCD_SIDE
- [ ] Upload đủ → verification_status = PENDING
- [ ] Admin APPROVED → verification_status = APPROVED trong DB
- [ ] Admin REJECTED → lưu lý do vào DB

---

## 🔑 BR-03: Đăng nhập bằng Google (OAuth2)

| Rule ID | Mô tả | Ghi chú |
|---|---|---|
| BR-03-1 | User click "Đăng nhập Google" → redirect sang Google OAuth | Standard OAuth2 flow |
| BR-03-2 | Lần đầu đăng nhập Google → hiện popup chọn role: Khách thuê / Chủ xe | Bắt buộc chọn trước khi vào app |
| BR-03-3 | Sau khi chọn role → tạo tài khoản mới với auth_provider = GOOGLE | Lưu google_id vào DB |
| BR-03-4 | Chọn Khách thuê → status = ACTIVE (dùng ngay) | |
| BR-03-5 | Chọn Chủ xe → status = PENDING (chờ Admin duyệt) | |
| BR-03-6 | Các lần sau đăng nhập Google → vào thẳng, không hỏi role lại | Nhận diện qua google_id |
| BR-03-7 | Email Google trùng tài khoản local → thông báo "Vui lòng đăng nhập bằng mật khẩu" | Không merge 2 tài khoản |

**Acceptance Criteria:**
- [ ] Google login lần đầu → popup chọn role xuất hiện
- [ ] Chọn role xong → JWT token được sinh, vào được app
- [ ] Google login lần 2 → vào thẳng không có popup
- [ ] Email Google trùng tài khoản local → thông báo lỗi rõ ràng

---

## 🚗 BR-04: Xe chờ duyệt (PENDING)

| Rule ID | Mô tả | Ghi chú |
|---|---|---|
| BR-04-1 | Owner đăng xe mới → xe có status = PENDING | Chờ Admin duyệt |
| BR-04-2 | Trang chủ / tìm kiếm xe KHÔNG hiển thị xe PENDING | Chỉ hiện xe ACTIVE |
| BR-04-3 | Owner vào trang quản lý xe vẫn thấy xe PENDING của mình | Có badge "Đang chờ duyệt" |
| BR-04-4 | Admin có trang riêng xem danh sách xe đang chờ duyệt | GET /api/v1/admin/cars/pending |
| BR-04-5 | Admin duyệt xe → status = ACTIVE → xe xuất hiện trên trang chủ | |
| BR-04-6 | Admin từ chối xe → status = REJECTED, bắt buộc nhập lý do → lưu vào DB | Sprint 1: chỉ lưu DB. Hiển thị cho Owner là Sprint 2 |
| BR-04-7 | Owner bị từ chối xe → được phép sửa thông tin và đăng lại | |

**Acceptance Criteria:**
- [ ] GET /api/v1/public/cars → không trả xe PENDING
- [ ] Owner vào /owner/my-cars → thấy xe PENDING với badge "Đang chờ duyệt"
- [ ] Admin từ chối xe mà không nhập lý do → lỗi validation
- [ ] Admin từ chối xe có lý do → lý do được lưu vào DB thành công

---

## 🔓 BR-05: Phân quyền truy cập (Auth Guard)

| Rule ID | Mô tả | Ghi chú |
|---|---|---|
| BR-05-1 | Chưa đăng nhập → không truy cập được trang profile, dashboard | Redirect về trang login |
| BR-05-2 | API /api/v1/users/** → yêu cầu JWT token hợp lệ | Trả 401 Unauthorized |
| BR-05-3 | API /api/v1/admin/** → chỉ ADMIN | Trả 403 Forbidden nếu sai role |
| BR-05-4 | API /api/v1/owner/** → chỉ OWNER | Trả 403 Forbidden nếu sai role |
| BR-05-5 | API /api/v1/public/** → ai cũng vào được | Không cần token |

---

## 🔐 BR-06: Đổi mật khẩu

| Rule ID | Mô tả | Ghi chú |
|---|---|---|
| BR-06-1 | Form đổi mật khẩu gồm 3 ô: Mật khẩu cũ + Mật khẩu mới + Xác nhận mật khẩu mới | Chuẩn bảo mật |
| BR-06-2 | Mật khẩu mới phải khác mật khẩu cũ | Trả lỗi nếu trùng |
| BR-06-3 | Mật khẩu mới và xác nhận phải khớp nhau | Validate FE trước khi gửi API |
| BR-06-4 | Mật khẩu mới phải đủ mạnh: min 8 ký tự, có chữ hoa, số, ký tự đặc biệt | Nhất quán với BR-01-6 |
| BR-06-5 | Sau đổi mật khẩu thành công → logout toàn bộ session cũ | Bảo mật: tránh session hijacking |

---

## 📧 BR-07: Đổi email

| Rule ID | Mô tả | Ghi chú |
|---|---|---|
| BR-07-1 | User nhập email mới → hệ thống gửi link xác nhận đến email mới | Tái sử dụng code PasswordResetToken |
| BR-07-2 | Email cũ vẫn có hiệu lực cho đến khi user bấm link xác nhận ở email mới | |
| BR-07-3 | Email mới phải chưa tồn tại trong hệ thống | Trả lỗi EMAIL_EXISTED |
| BR-07-4 | Link xác nhận có hiệu lực 15 phút | Hết hạn → phải yêu cầu lại |

---

## 🖼️ BR-08: Upload ảnh (Avatar & Giấy tờ)

| Rule ID | Mô tả | Ghi chú |
|---|---|---|
| BR-08-1 | Nền tảng lưu trữ: Cloudinary | Miễn phí, không lưu file vào DB, chỉ lưu URL |
| BR-08-2 | Định dạng chấp nhận: JPG, PNG | Không chấp nhận PDF |
| BR-08-3 | Kích thước tối đa avatar: 5MB | |
| BR-08-4 | Kích thước tối đa mỗi mặt CMND / GPLX: 10MB | Cấu hình multipart.max-file-size=10MB |
| BR-08-5 | DB chỉ lưu URL Cloudinary của ảnh | Không lưu binary vào DB |
| BR-08-6 | Upload thành công → trả về URL công khai của ảnh | |

---

## 🔒 BR-09: Quản lý Profile — Giới hạn chỉnh sửa

| Rule ID | Mô tả | Ghi chú |
|---|---|---|
| BR-09-1 | Field luôn chỉnh sửa được: SĐT, địa chỉ, avatar | |
| BR-09-2 | Field bị khóa sau khi Admin duyệt: Họ tên, số CMND, ảnh CMND | Thông tin định danh đã xác thực |
| BR-09-3 | Renter thêm: Số GPLX, ảnh GPLX (bị khóa sau khi duyệt) | |
| BR-09-4 | Owner thêm: Tên ngân hàng, Số tài khoản (luôn chỉnh sửa được trong Sprint 1) | Ràng buộc giao dịch để Sprint 2 xử lý |
| BR-09-5 | Field bị khóa → hiển thị dạng read-only, có tooltip "Liên hệ Admin để thay đổi" | UX rõ ràng |

---

> **Cập nhật lần cuối:** 19/09/2026 — Sau rà soát lần 1 (sửa 6 lỗi nghiệp vụ)

