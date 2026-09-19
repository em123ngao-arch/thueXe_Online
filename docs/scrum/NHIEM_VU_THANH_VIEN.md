# 📋 BẢNG PHÂN CÔNG & ĐẶC TẢ CHI TIẾT NHIỆM VỤ THÀNH VIÊN (DRIVESHARE)

> **Mục đích:** Sổ tay tra cứu nhiệm vụ cho từng thành viên nhóm DriveShare. Giúp mỗi người khi bắt tay vào code ("vibe") biết chính xác: **Mình cần làm task gì, viết API/giao diện nào, DTO gì, logic xử lý ra sao và điều kiện nghiệm thu là gì**, tránh bị quên hoặc làm lệch pha với nhóm.  
> **Cập nhật:** Sprint 1 Fix & Bổ sung (19 Sep – 26 > **Nguyên tắc phân công:** BE dev làm API, **Chí Tín làm toàn bộ FE** của Sprint 1 Fix → BE và FE độc lập nhau, không conflict.

| Avatar | Họ tên | Vai trò | Files sở hữu | Nhánh | Ưu tiên |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **VL** | **Lâm Chí Vĩ** | BE — Auth API | `AuthService`, `SecurityConfig`, `AuthController` | `fix/auth-be` | 🔴 Cao |
| **QD** | **Duy Quân** | BE — Profile & Upload API | `UserProfileController`, `ProfileService` | `fix/profile-be` | 🔴 Cao |
| **PT** | **Phát** | BE — Google OAuth2 + Car API | `modules/oauth2/`, `CarService`, `CarController` | `feature/google-car-be` | 🟠 Vừa |
| **KT** | **Lộc Khiêm** | BE — Admin Extend API | `AdminController` | `fix/admin-be` | 🟠 Vừa |
| **CN** | **Chí Tín** | **FE — TOÀN BỘ Sprint 1** | Tất cả file `.html`, `.js`, `.css` | `fix/FE-sprint1-full` | 🔴 Cao |
| **NB** | **Nguyễn Bảo** | DB Migration + Review tất cả PR | `migration.sql`, `application.properties` | `fix/DB-migration` | 🟡 Thấp |

---

## 🔧 CHI TIẾT SPRINT 1 FIX — PHÂN CÔNG

### 🗓️ Thứ tự thực hiện (tránh conflict)
```
Bước 1 (song song — BE không chờ nhau):
  Vĩ    → fix/auth-be            (API Auth: email, RBAC, đổi mật khẩu, đổi email)
  Quân  → fix/profile-be         (API Profile: GET/PUT, upload avatar/CMND/GPLX)
  Phát  → feature/google-car-be  (API OAuth2 + Car CRUD)
       ↓
Bước 2 (sau Quân merge):
  Khiêm → fix/admin-be           (API Admin: duyệt CMND, xe pending)
       ↓
Bước 3 (sau TẤT CẢ BE merge):
  Chí Tín → fix/FE-sprint1-full  (TOÀN BỘ FE: UI + kết nối API thực)
       ↓
Bước 4:
  Bảo → fix/DB-migration        (Migration SQL + review tất cả PR)
```

> ⚠️ **Chí Tín:** Có thể làm UI với mock data song song với BE, nhưng phải **chờ tất cả BE merge** mới kết nối API thực và tạo PR.

---


### 👤 Vĩ (VL) — Auth BE API
**Nhánh:** `fix/auth-be`
**Phạm vi:** CHỈ viết và fix BE API. Không sửa file FE.

| # | Lỗi / Thiếu | Việc cần làm | File |
|---|---|---|---|
| 1 | Check email không trùng | Đã có `ErrorCode.EMAIL_EXISTED` → test lại, trả lỗi rõ ràng ra FE | `AuthService.java` |
| 2 | Login vô mới dùng được | Bật đúng route security: `/api/v1/users/**` → `authenticated()` | `SecurityConfig.java` |
| 3 | Đổi mật khẩu (CRP-13) | API `PUT /api/v1/auth/change-password` đã có → test + fix bug nếu có | `AuthController.java` |

**Acceptance Criteria** *(tham chiếu: [business-rules.md](../requirements/business-rules.md))*:
- [ ] `POST /api/v1/auth/register` với email đã tồn tại → `400 EMAIL_EXISTED` — `BR-01-1`
- [ ] Gọi `/api/v1/users/me` không có token → `401 Unauthorized` — `BR-05-2`
- [ ] Gọi `/api/v1/admin/**` với role RENTER → `403 Forbidden` — `BR-05-3`
- [ ] `PUT /api/v1/auth/change-password`: 3 ô (cũ + mới + xác nhận), sau đó logout session cũ — `BR-06-1/4`
- [ ] Đổi email → gửi link xác nhận đến email mới, email cũ vẫn hiệu lực — `BR-07-1/2`

---

### 👤 DUY QUÂN (QD) — Profile & Upload BE API
**Nhánh:** `fix/profile-be`
**Phạm vi:** CHỈ viết và fix BE API. Không sửa file FE.

| # | Lỗi / Thiếu | Việc cần làm | File |
|---|---|---|---|
| 1 | Quản lý profile | Hoàn thiện GET/PUT `/api/v1/users/me` trả đủ field | `UserProfileController.java` |
| 2 | Upload avatar (ảnh đại diện) | Thêm `POST /api/v1/users/me/avatar` nhận `MultipartFile` | `ProfileService.java` |
| 3 | Upload CMND 2 mặt | Thêm `POST /api/v1/users/me/cccd` nhận `frontImage` + `backImage` | `ProfileService.java` |
| 4 | **Upload GPLX** (Renter) | Thêm `POST /api/v1/users/me/gplx` nhận `licenseImage` | `ProfileService.java` |
| 5 | Sau upload → chờ Admin duyệt | Set `verification_status = PENDING` sau khi upload | `RenterProfile` / `OwnerProfile` |

**Acceptance Criteria** *(tham chiếu: [business-rules.md](../requirements/business-rules.md))*:
- [ ] `PUT /api/v1/users/me` → cập nhật SĐT, địa chỉ, avatar thành công — `BR-09-1`
- [ ] Họ tên, số CMND **bị khóa** sau khi Admin duyệt → hiển thị read-only + tooltip — `BR-09-2/5`
- [ ] `POST /api/v1/users/me/avatar` → upload JPG/PNG lên Cloudinary, lưu URL vào DB, max 5MB — `BR-08-1/3`
- [ ] `POST /api/v1/users/me/cccd` thiếu 1 trong 2 mặt → trả `400 MISSING_CCCD_SIDE` — `BR-02-3`
- [ ] `POST /api/v1/users/me/gplx` (Renter) → lưu URL vào DB, `verification_status = PENDING` — `BR-02-2/4`
- [ ] Renter có field số GPLX; Owner có tên ngân hàng, số TK — `BR-09-3/4`

---

### 👤 PHÁT (PT) — Google OAuth2 + Car BE API
**Nhánh:** `feature/google-car-be`
**Phạm vi:** CHỈ viết và fix BE API. Không sửa file FE.

| # | Task | Việc cần làm | File |
|---|---|---|---|
| 1 | **Google Login (MỚI)** | Tạo `OAuth2Service`, `OAuth2SuccessHandler`, cấu hình Google Client | File MỚI trong `modules/oauth2/` |
| 2 | Thêm dependency | Thêm `spring-boot-starter-oauth2-client` vào `pom.xml` | `pom.xml` |
| 3 | Cấu hình OAuth2 | Thêm `client-id`, `client-secret`, `scope=email,profile` | `application.properties` |
| 4 | Xe chờ duyệt (PENDING) | API xe public chỉ trả xe có `status=ACTIVE` | `CarService.java` / `CarController.java` |
| 5 | CRP-23: Chủ xe đăng xe | API `POST /api/v1/owner/cars` tạo xe mới | `CarController.java` |
| 6 | CRP-24: CRUD xe | API GET/PUT/DELETE `/api/v1/owner/cars/{id}` | `CarController.java` |

**Acceptance Criteria** *(tham chiếu: [business-rules.md](../requirements/business-rules.md))*:
- [ ] Click "Đăng nhập Google" → redirect OAuth2 → quay về app
- [ ] Tài khoản Google **lần đầu** → hiện **popup chọn role** (Khách thuê / Chủ xe) — `BR-03-2` ✅
- [ ] Chọn Khách thuê → `role=RENTER, status=ACTIVE` | Chọn Chủ xe → `role=OWNER, status=PENDING` — `BR-03-4/5`
- [ ] Đăng nhập Google lần 2 → vào thẳng, KHÔNG hỏi role — `BR-03-6`
- [ ] Email Google trùng tài khoản local → hiện thông báo lỗi — `BR-03-7`
- [ ] `GET /api/v1/public/cars` → KHÔNG trả xe có `status=PENDING` — `BR-04-2`
- [ ] Owner tạo xe mới → `status=PENDING`, Owner thấy badge "Đang chờ duyệt" — `BR-04-3`

**Lưu ý quan trọng — Google OAuth2:**
```
1. Phát tạo file MỚI trong package modules/oauth2/ → KHÔNG sửa AuthService của Vĩ
2. Vĩ chỉ thêm 3 dòng oauth2Login(...) vào SecurityConfig SAU KHI Phát merge
3. Bảo chạy migration thêm cột google_id, auth_provider vào bảng users
```

---

### 👤 CHÍ TÍN (CN) — **TOÀN BỘ FE Sprint 1 Fix**
**Nhánh:** `fix/FE-sprint1-full`
**Phạm vi:** Làm toàn bộ FE cho tất cả tính năng Sprint 1 Fix. Không sửa file `.java`.
**Nguyên tắc:** Bắt đầu với mock data, khi BE merge xong thì kết nối API thực.

| # | Feature | Việc cần làm FE | File |
|---|---|---|---|
| 1 | **Toast system** | Tạo `toast.js` export `showToast(msg, type, ms)` dùng cho toàn app | `toast.js` (mới) |
| 2 | **Auth guard** | `checkAuth()` redirect về `/login.html` nếu không có token | `auth.js` |
| 3 | **Toast đăng ký** | Gọi `showToast()` sau register thành công, 2s → switch tab login | `register.js` |
| 4 | **Form đổi mật khẩu** | UI 3 ô (cũ / mới / xác nhận), gọi API `PUT /auth/change-password` | `profile.html`, `profile.js` |
| 5 | **Form đổi email** | UI nhập email mới, gọi API `POST /auth/change-email/request` | `profile.html`, `profile.js` |
| 6 | **Trang profile** | Hiển thị thông tin user, field khóa read-only + tooltip | `profile.html`, `profile.js` |
| 7 | **Upload avatar** | Nút upload ảnh, preview trước khi gửi, gọi API `POST /users/me/avatar` | `profile.js` |
| 8 | **Upload CMND 2 mặt** | 2 ô upload (mặt trước/sau), validate đủ 2 mặt, gọi API `POST /users/me/cccd` | `profile.html`, `profile.js` |
| 9 | **Upload GPLX** (Renter) | Ô upload GPLX chỉ hiện với Renter, gọi API `POST /users/me/gplx` | `profile.html`, `profile.js` |
| 10 | **Nút Google Login** | `<a href="/oauth2/authorization/google">` trong login page | `login.html` |
| 11 | **Popup chọn role** | Hiện modal chọn Khách thuê/Chủ xe sau Google login lần đầu | `oauth2-callback.html` (mới) |
| 12 | **Filter xe PENDING** | Trang chủ chỉ hiển xe `status=ACTIVE` | `index.js`, `cars.js` |
| 13 | **Badge xe đang chờ** | Owner xem xe của mình → hiển badge "Đang chờ duyệt" | `owner-cars.html/.js` |
| 14 | **2 tab Admin** | Tab Khách thuê / Chủ xe trong trang Admin quản lý user | `admin.html`, `admin.js` |
| 15 | **Admin duyệt CMND** | UI xem nhạn dưỡc CMND pending, nút Duyệt / Từ chối | `admin.html`, `admin.js` |
| 16 | **Admin duyệt xe** | UI xem danh sách xe pending, nút Duyệt / Từ chối + trường nhập lý do | `admin.html`, `admin.js` |

**Acceptance Criteria** *(tham chiếu: [business-rules.md](../requirements/business-rules.md))*:
- [ ] `showToast("text", "success", 2000)` hiện góc phải màn hình, tự ẩn sau 2s — `BR-01-2`
- [ ] Đăng ký thành công → toast xanh, sau 2s → chuyển tab đăng nhập — `BR-01-3`
- [ ] Vào `/profile.html` chưa login → redirect `/login.html` — `BR-05-1`
- [ ] Họ tên / số CMND / GPLX sau duyệt → read-only + tooltip "Liên hệ Admin" — `BR-09-2/5`
- [ ] Upload CMND thiếu 1 mặt → FE báo lỗi trước khi gửi API — `BR-02-3`
- [ ] Renter thấy khu vực upload GPLX; Owner thấy khu vực TK ngân hàng — `BR-09-3/4`
- [ ] Nút "Google Login" → redirect OAuth2 — `BR-03-1`
- [ ] Popup chọn role hiện lần đầu Google login, không hiện lần 2 — `BR-03-2/6`
- [ ] Trang chủ chỉ hiện xe ACTIVE — `BR-04-2`
- [ ] Owner thấy xe PENDING với badge "Đang chờ duyệt" — `BR-04-3`
- [ ] Admin tab "Khách thuê" / "Chủ xe" lọc đúng theo role
- [ ] Admin từ chối xe phải nhập lý do, thiếu lý do → FE báo lỗi — `BR-04-6`

---

### 👤 NGUYỄN BẢO (NB) — DB Migration & Review
**Nhánh:** `fix/DB-migration`  
**Nguyên tắc:** Bảo là architect & gatekeeper → lo phần DB + review toàn bộ PR.

| # | Task | Việc cần làm |
|---|---|---|
| 1 | Migration DB Google | Thêm cột `google_id VARCHAR(255) UNIQUE`, `auth_provider VARCHAR(20) DEFAULT 'LOCAL'` vào bảng `users` |
| 2 | Multipart config | `spring.servlet.multipart.max-file-size=10MB`, `max-request-size=30MB` vào `application.properties` |
| 3 | Admin module refactor | Tách package admin thành module độc lập (nếu còn thời gian) |
| 4 | Review PR | Duyệt PR theo đúng thứ tự: Vĩ → Quân → Phát → Khiêm → Tín |

**Acceptance Criteria:**
- [ ] Bảng `users` có cột `google_id` và `auth_provider` sau migration
- [ ] Upload file 11MB → bị từ chối (vượt limit)
- [ ] Tất cả PR được review theo đúng thứ tự trước khi merge

---

### 👤 LỘC KHIÊM (KT) — Admin BE API
**Nhánh:** `fix/admin-be`
**Phạm vi:** CHỈ viết và fix BE API Admin. Không sửa file FE.

| # | Task | Việc cần làm | File | Loại |
|---|---|---|---|---|
| 1 | **Admin duyệt CMND** (mở rộng CRP-21) | Thêm API `GET /api/v1/admin/users/pending-cccd` xem danh sách user chờ duyệt CMND | `AdminController.java` | 🔴 Fix |
| 2 | **Admin phê duyệt / từ chối CMND** | API `PUT /api/v1/admin/users/{id}/verify-cccd` với `status=APPROVED/REJECTED` | `AdminController.java` | 🔴 Fix |
| 3 | **Hỗ trợ 2 tab** (Chí Tín cần) | Kiểm tra API `GET /api/v1/admin/users?role=RENTER` và `?role=OWNER` đã hoạt động chưa (CRP-19 đã làm) | `AdminController.java` | 🟠 Verify |
| 4 | **Xe chờ duyệt - Admin view** | Thêm API `GET /api/v1/admin/cars/pending` để Admin xem xe đang chờ duyệt | `AdminController.java` | 🟠 Mới |

**Acceptance Criteria** *(tham chiếu: [business-rules.md](../requirements/business-rules.md))*:
- [ ] `GET /api/v1/admin/users?role=RENTER` → trả đúng danh sách Renter — (hỗ trợ `BR-05-3`)
- [ ] `GET /api/v1/admin/users?role=OWNER` → trả đúng danh sách Owner
- [ ] `GET /api/v1/admin/users/pending-cccd` → danh sách user có `verification_status=PENDING` — `BR-02-4`
- [ ] `PUT /api/v1/admin/users/{id}/verify-cccd` body `{"status":"APPROVED"}` → cập nhật DB — `BR-02-5`
- [ ] `PUT /api/v1/admin/users/{id}/verify-cccd` body `{"status":"REJECTED"}` thiếu lý do → lỗi validation — `BR-02-6`
- [ ] `GET /api/v1/admin/cars/pending` → trả xe có `status=PENDING` — `BR-04-4`
- [ ] Admin từ chối xe mà không có lý do → `400` lỗi validation — `BR-04-6`

> 💡 **Lưu ý phối hợp:** Khiêm làm API Admin duyệt CMND **sau khi Duy Quân merge** phần upload CMND — vì cần bảng `renter_profiles.verification_status` được set PENDING trước.

---

## ✅ CHECKLIST NGHIỆM THU SPRINT 1 FIX

| Lỗi ban đầu | Người fix | Nghiệm thu |
|---|---|---|
| Check email không trùng | Vĩ | Register email đã có → `400 EMAIL_EXISTED` |
| Login vô mới dùng được | Vĩ | Chưa login vào `/profile` → redirect 401 |
| Đổi mật khẩu / email | Vĩ | Đổi PW thành công → logout các session cũ |
| Quản lý profile | Duy Quân | GET/PUT `/users/me` đủ fields |
| Upload avatar | Duy Quân | Upload ảnh → URL lưu DB |
| Upload CMND 2 mặt | Duy Quân | Thiếu 1 mặt → báo lỗi, đủ 2 mặt → PENDING |
| Đăng ký hiện thông báo | Chí Tín | Toast xanh xuất hiện sau register |
| 2 tab Khách thuê / Chủ xe | Chí Tín | Admin filter đúng theo role |
| Xe PENDING không hiện | Phát (BE) + Chí Tín (FE) | Trang chủ không có xe PENDING |
| Google Login | Phát | Đăng nhập Google → có JWT, vào được app |
| Admin module riêng | Bảo | Package admin tách biệt, không phụ thuộc chéo |

---

---

## 👤 1. THÀNH VIÊN: LÂM CHÍ VĨ (Avatar: `VL`)
* **Vai trò:** Backend Developer (Core Authentication & Security RBAC).
* **Trọng trách:** Xây dựng "trái tim" bảo mật của hệ thống. Tất cả các thành viên khác đều phụ thuộc vào JWT Token và cơ chế phân quyền do Vĩ viết ra.
* **Tổng khối lượng:** 7 tasks — **29 Story Points** (Trạng thái: **To Do**).

### 🛠️ Chi tiết các Task cần làm:

#### 1.1. `CRP-10` & `CRP-11`: Đăng ký tài khoản Owner & Renter (6 pts)
* **Nhánh Git:** `feature/CRP-10-registration`
* **API cần viết:** `POST /api/v1/auth/register`
* **Request Body (`RegisterRequest`):**
  * `email` (Bắt buộc, chuẩn email, duy nhất trong DB)
  * `password` (Tối thiểu 8 ký tự, có chữ hoa, số, ký tự đặc biệt)
  * `full_name` (Họ và tên)
  * `phone_number` (Số điện thoại hợp lệ)
  * `role` (`RENTER` hoặc `OWNER`)
* **Logic xử lý:**
  1. Kiểm tra email/phone đã tồn tại chưa ➔ nếu có ném `ErrorCode.EMAIL_ALREADY_EXISTS` / `PHONE_EXISTED`.
  2. Mã hóa mật khẩu bằng `PasswordEncoder` (BCrypt).
  3. Gán Role tương ứng. Nếu là `OWNER`, trạng thái tài khoản là `PENDING` (chờ Admin duyệt). Nếu là `RENTER`, trạng thái là `ACTIVE`.
  4. Lưu User và tạo sẵn bản ghi Profile tương ứng (`OwnerProfile` / `RenterProfile`).
  5. Trả về `ApiResponse<AuthResponse>` kèm Access Token hoặc thông báo đăng ký thành công.

---

#### 1.2. `CRP-12`: Đăng nhập cho tất cả các Role (5 pts)
* **Nhánh Git:** `feature/CRP-12-login`
* **API cần viết:** `POST /api/v1/auth/login`
* **Request Body (`LoginRequest`):** `email`, `password`
* **Logic xử lý:**
  1. Dùng `AuthenticationManager.authenticate(...)` xác thực thông tin đăng nhập.
  2. Kiểm tra trạng thái tài khoản: Nếu `status = 'BLOCKED'` ➔ ném `ErrorCode.ACCOUNT_BLOCKED`.
  3. Sinh cặp Token bằng `JwtTokenProvider`:
     * **Access Token:** Hạn 24 giờ, chứa `userId`, `email`, `roles`.
     * **Refresh Token:** Hạn 7 ngày, lưu vào DB (hoặc Redis) để cấp lại token mới.
  4. Trả về `ApiResponse<AuthResponse>` gồm: `accessToken`, `refreshToken`, `tokenType: "Bearer"`, `user: { id, email, fullName, role, status }`.

---

#### 1.3. `CRP-13`: Đổi mật khẩu (Change Password - 3 pts)
* **API cần viết:** `PUT /api/v1/auth/change-password`
* **Header:** `Authorization: Bearer <token>`
* **Request Body:** `old_password`, `new_password`, `confirm_password`
* **Logic:** 
  1. Kiểm tra `new_password.equals(confirm_password)`.
  2. Dùng `passwordEncoder.matches(oldPassword, user.getPassword())` kiểm tra mật khẩu cũ.
  3. Mật khẩu mới không được trùng mật khẩu cũ.
  4. Mã hóa mật khẩu mới và lưu vào DB.

---

#### 1.4. `CRP-14`: Quên & Đặt lại mật khẩu qua Email (5 pts)
* **API 1: `POST /api/v1/auth/forgot-password`**
  * Nhận `email`.
  * **Bảo mật OWASP:** Dù email có trong DB hay không, luôn trả về `200 OK` với thông báo *"Nếu email tồn tại, link khôi phục đã được gửi"* (chống dò quét người dùng).
  * Nếu email có thật: Sinh secure token ngẫu nhiên, lưu vào bảng `password_reset_tokens` (hạn 15 phút, `is_used = false`), gửi email link reset bất đồng bộ (`@Async`).
* **API 2: `POST /api/v1/auth/reset-password`**
  * Nhận `token`, `new_password`.
  * Kiểm tra token hợp lệ, chưa hết hạn, chưa sử dụng (`is_used == false`).
  * Cập nhật mật khẩu mới, đánh dấu `is_used = true`, vô hiệu hóa tất cả Refresh Token cũ của user.

---

#### 1.5. `CRP-15`: Đăng xuất & Quản lý phiên (Logout - 2 pts)
* **API cần viết:** `POST /api/v1/auth/logout`
* **Logic:** Xóa Refresh Token của user trong database / Blacklist Access Token hiện tại, trả về thông báo đăng xuất thành công.

---

#### 1.6. `CRP-16`: Phân quyền RBAC (Role-Based Access Control - 8 pts)
* **Cấu hình:** `SecurityConfig.java` và `JwtAuthenticationFilter.java`
* **Nhiệm vụ:**
  * Cấu hình phân quyền URL:
    * `/api/v1/auth/**`, `/api/v1/public/**`: `permitAll()` (Ai cũng vào được).
    * `/api/v1/admin/**`: Chỉ user có `hasRole('ADMIN')` mới được gọi.
    * `/api/v1/owner/**`: Chỉ user có `hasRole('OWNER')` mới được gọi.
    * `/api/v1/users/**`: Đã đăng nhập (`authenticated()`).
  * Xử lý ngoại lệ bảo mật: Trả về `401 Unauthorized` qua `JwtAuthenticationEntryPoint` khi chưa đăng nhập, `403 Forbidden` qua `CustomAccessDeniedHandler` khi không đủ quyền.

---

## 👤 2. THÀNH VIÊN: DUY QUÂN (Avatar: `QD`)
* **Vai trò:** Backend Developer (Hồ sơ người dùng & Dịch vụ).
* **Trạng thái hiện tại:** 2 tasks — **6 Story Points** (Đã code xong, đang ở trạng thái **In Review**).

### 🛠️ Chi tiết các Task phụ trách:
* **`CRP-17` (Owner Update Profile - 3 pts) & `CRP-18` (Renter Update Profile - 3 pts):**
  * **Nhánh Git:** `feature/CRP-17-update-profile` (Đã có commit `76ea29f`).
  * **Nhiệm vụ tiếp theo:**
    1. Tạo Pull Request trên GitHub vào `develop` để Bảo duyệt.
    2. Sau khi merge, kiểm tra tích hợp upload ảnh (Avatar, ảnh chụp CCCD, ảnh GPLX).
    3. Hỗ trợ chuẩn bị các module của Sprint 2: Thanh toán (`Payment`), Thông báo WebSocket (`Notification`), Đánh giá (`Review`).

---

## 👤 3. THÀNH VIÊN: LỘC KHIÊM (Avatar: `KT`)
* **Vai trò:** Backend Core Developer (Quản trị Admin & Động cơ Đặt xe).
* **Trạng thái hiện tại:** 4 tasks — **14 Story Points** (✅ **Đã hoàn thành 100% - DONE**).

### 🛠️ Chi tiết các Task đã hoàn thành xuất sắc:
* `CRP-19`: Admin View & Search Users by Role (3 pts) - *API phân trang, tìm kiếm, lọc user*.
* `CRP-20`: Admin View User Detail (3 pts) - *Xem chi tiết thông tin hồ sơ 1 user*.
* `CRP-21`: Admin Approve Owner Account (5 pts) - *Duyệt tài khoản chủ xe từ PENDING sang ACTIVE*.
* `CRP-22`: Admin Block / Unblock User (3 pts) - *Khóa / Mở khóa tài khoản*.

### 🚀 Nhiệm vụ tiếp theo (Chuẩn bị cho Sprint 2 - Phần khó nhất dự án):
* Nghiên cứu và thiết kế **State Machine cho Booking** (Vòng đời đơn đặt xe: `PENDING ➔ CONFIRMED ➔ PAID ➔ IN_PROGRESS ➔ COMPLETED / CANCELLED`).
* Thiết kế giải thuật **Pessimistic Locking / Optimistic Locking** chống đặt trùng xe khi 2 khách cùng bấm thuê 1 chiếc xe cùng 1 khung giờ.
* Viết **Spring Scheduler** tự động hủy đơn đặt xe nếu quá thời hạn thanh toán (Auto-cancel timeout).

---

## 👤 4. THÀNH VIÊN: NGUYỄN BẢO (Avatar: `NB`)
* **Vai trò:** Project Lead & Data Architect.
* **Trạng thái hiện tại:** 3 tasks — **11 Story Points** (✅ **Đã hoàn thành 100% - DONE**).

### 🛠️ Trách nhiệm thường trực trong suốt Sprint:
1. **Gatekeeper trên GitHub:** Độc quyền duyệt và bấm Merge các Pull Request vào nhánh `develop`. Đảm bảo code trước khi gộp không làm gãy dự án.
2. **Quản trị CSDL:** Duy trì và cập nhật file `DriveShare_Database_Design_v2.sql`, hỗ trợ seed data mẫu để cả nhóm test.
3. **Điều phối kỹ thuật:** Hỗ trợ Chí Vĩ gỡ lỗi Security/Token nếu cần.

---

## 👤 5. THÀNH VIÊN: CHÍ TÍN (Avatar: `CN`)
* **Vai trò:** Frontend Lead & DevOps / QA Gatekeeper.
* **Trạng thái hiện tại:** Đã xong `CRP-6` (Setup FE) và `CRP-7` (CI/CD) — **8 Story Points**.

### 🛠️ Nhiệm vụ Frontend cần dựng song song:
1. **Trang Xác thực (Auth UI):**
   * Màn hình Đăng nhập (`/login.html`) + lưu token vào `localStorage`.
   * Màn hình Đăng ký (`/register.html`) có nút chọn Role (Khách thuê / Chủ xe).
   * Màn hình Quên mật khẩu (`/forgot-password.html`) & Đặt lại mật khẩu.
2. **Trang Hồ sơ cá nhân (Profile UI):**
   * Kết nối với API của **Duy Quân (`QD`)** để hiển thị và cho phép chỉnh sửa CCCD/GPLX.
3. **Trang Quản trị Admin (Admin UI):**
   * Kết nối với API của **Lộc Khiêm (`KT`)** để hiện bảng danh sách User (có phân trang, tìm kiếm), nút bấm Duyệt Owner và nút Khóa/Mở khóa tài khoản.
4. **Kiểm thử QA:**
   * Dùng file `DriveShare_Sprint1_Postman_Collection.json` kiểm tra chéo các API của BE.

---

## 👤 6. THÀNH VIÊN: PHÁT (Avatar icon người)
* **Vai trò:** Backend Developer (Quản lý xe & Bộ lọc tìm kiếm).
* **Trạng thái:** Nằm trong mục **Backlog** (2 tasks — **10 Story Points**).

### 🛠️ Chi tiết các Task phụ trách:
* `CRP-23`: **Owner Lists a Vehicle (5 pts):**
  * API tạo xe mới: thông tin hãng xe, dòng xe, năm sản xuất, biển số, giá thuê/ngày, upload ảnh xe và giấy tờ xe.
* `CRP-24`: **Manage Own Vehicle Listings - CRUD (5 pts):**
  * API cho Owner xem danh sách xe của mình, sửa giá thuê, cập nhật lịch sẵn sàng, ẩn xe hoặc xóa xe.
* *Lưu ý:* Khi nhóm hoàn thành cơ bản phần Auth, Lead Bảo sẽ kéo 2 task này vào Sprint để Phát bắt đầu đẩy code.

---

## 📌 QUY TẮC PHỐI HỢP CỐT LÕI (BẮT BUỘC NHỚ)
1. **Luôn bắt đầu từ `develop`:** `git checkout develop && git pull origin develop` trước khi tạo nhánh mới.
2. **Tên nhánh:** Bắt buộc có mã task (VD: `feature/CRP-12-login`).
3. **Không push thẳng `develop`:** Luôn tạo **Pull Request** trên GitHub và nhờ Lead Bảo duyệt.
4. **Response chuẩn:** Mọi API thành công phải bọc trong `ApiResponse<T>`, mọi lỗi ném `AppException(ErrorCode.XYZ)`.
