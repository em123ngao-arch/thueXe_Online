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

---

# 🚀 SPRINT 2: BẢNG PHÂN CÔNG NHIỆM VỤ JIRA CHÍNH THỨC (CẬP NHẬT MỚI)

> **Mô hình phân công:**  
> - **TẤT CẢ THÀNH VIÊN LÀM BACKEND (BE)** tập trung xây dựng toàn bộ API cốt lõi của Sprint 2.
> - **Chi Tin Nguyen (Chí Tín)**: Đảm nhận trọn gói module **Thanh toán (Payment)** (Backend + Giao diện VietQR).
> - **Nguyễn Duy Bảo (Bảo)**: Phụ trách **`CRP-55`** (Hoàn thành review Sprint 1, pass 13/13 test cases), kiến tạo Database Migration (`rentals`, `payments`) và Review PR toàn nhóm.
> - **Tổng khối lượng:** 17 Jira Issues — 73 Story Points, chia đều và cân bằng cho 6 thành viên.

---

### 📋 BẢNG GÁN TÀI KHOẢN JIRA 1:1 CHÍNH THỨC (PHỦ KÍN 28 WORK ITEMS)

| Mã Vé Jira | Tên Story / Nhiệm vụ | Điểm (SP) | Người Phụ Trách (Jira Assignee) | Phạm Vi Backend API Cụ Thể |
| :---: | :--- | :---: | :--- | :--- |
| **`CRP-55`** | Complete Sprint 0 / 1 Reviews | **3** | **Nguyễn Duy Bảo** (`NB`) | BE: Fix `CurrentUserProfileResponse` pass 13/13 tests, Viết Migration DB `rentals` & `payments`, Review PR |
| **`CRP-24`** | Manage Own Vehicle Listings (CRUD) | **5** | **Đỗ Ngọc Phát** | BE: API `GET/PUT/DELETE /api/v1/owner/cars/{id}`, validate 403 chủ xe, chặn xóa xe đang có đơn thuê |
| **`CRP-29`** | Owner Create Vehicle Listing | **5** | **Đỗ Ngọc Phát** | BE: API `POST /api/v1/owner/cars` tạo xe mới ở trạng thái `PENDING` |
| **`CRP-30`** | Owner Update Vehicle Listing | **3** | **Đỗ Ngọc Phát** | BE: API `PUT /api/v1/owner/cars/{id}` sửa thông tin, giá thuê, tiện ích |
| **`CRP-31`** | Owner View My Vehicle List | **3** | **Đỗ Ngọc Phát** | BE: API `GET /api/v1/owner/cars` xem danh sách xe của chính mình |
| **`CRP-32`** | Owner Delete or Deactivate Vehicle | **3** | **Đỗ Ngọc Phát** | BE: API `DELETE /api/v1/owner/cars/{id}` và đổi trạng thái `INACTIVE` |
| **`CRP-33`** | Owner Upload and Manage Vehicle Photos | **3** | **Đỗ Ngọc Phát** | BE: Upload ảnh xe lên Cloudinary, lưu danh sách URL vào bảng `car_images` |
| **`CRP-37`** | Vehicle Detail Page / API | **3** | **Đỗ Ngọc Phát** | BE: API `GET /api/v1/public/cars/{id}` trả chi tiết thông số, tiện ích, ảnh xe, điều khoản, thông tin chủ xe |
| **`CRP-39`** | Define Vehicle Filter Set and Search API Contract | **3** | **Đỗ Ngọc Phát** | BE: Chuẩn hóa DTO Request/Response bộ lọc kiểu Mioto (`brand`, `priceMin/Max`, `seats`, `transmission`, `fuelType`) |
| **`CRP-35`** | Public Vehicle Search with Multi-Filter | **8** | **Quân Nguyễn Duy** (`QD`) | BE: Hiện thực tìm kiếm đa tiêu chí (`CarSpecification` JPA), chỉ trả xe `ACTIVE` |
| **`CRP-36`** | Vehicle List Pagination and Sorting | **3** | **Quân Nguyễn Duy** (`QD`) | BE: Phân trang `page`, `size` và sắp xếp theo giá tăng/giảm, năm sản xuất |
| **`CRP-38`** | Filter Vehicles by Availability Date Range | **5** | **Quân Nguyễn Duy** (`QD`) | BE: Lọc xe trống lịch theo ngày (`startDate`, `endDate`), truy vấn `NOT EXISTS` loại trừ xe bận |
| **`CRP-44`** | Renter View and Cancel Own Requests | **3** | **Quân Nguyễn Duy** (`QD`) | BE: API `GET /api/v1/rentals/me` (danh sách đơn của khách) và `PUT /api/v1/rentals/{id}/cancel` (khách tự hủy) |
| **`CRP-46`** | Owner View Incoming Rental Requests | **3** | **Quân Nguyễn Duy** (`QD`) | BE: API `GET /api/v1/owner/rentals` (danh sách các yêu cầu thuê gửi đến chủ xe kèm lọc theo trạng thái) |
| **`CRP-41`** | Renter Submit Rental Request | **8** | **Vĩ Lâm** (`VL`) | BE: API `POST /api/v1/rentals` tạo yêu cầu thuê, validate ngày hợp lệ, tính tổng tiền dự kiến, trạng thái `PENDING` |
| **`CRP-42`** | Enforce Max 3 Pending Requests per User | **3** | **Vĩ Lâm** (`VL`) | BE: Nghiệp vụ đếm số đơn `PENDING` của khách, nếu `>= 3` ném lỗi `MAX_PENDING_RENTALS_EXCEEDED` (HTTP 400) |
| **`CRP-43`** | Auto-Expire Pending Request after 60 Minutes | **5** | **Vĩ Lâm** (`VL`) | BE: Spring `@Scheduled` quét ngầm định kỳ, quét các đơn `PENDING` quá 60 phút tự động chuyển sang `EXPIRED` |
| **`CRP-47`** | Owner Approve Rental Request | **5** | **Khiêm Tấn** (`KT`) | BE: API `PUT /api/v1/owner/rentals/{id}/approve` cho chủ xe duyệt 1 đơn thuê sang trạng thái `APPROVED` |
| **`CRP-48`** | Owner Reject Rental Request | **3** | **Khiêm Tấn** (`KT`) | BE: API `PUT /api/v1/owner/rentals/{id}/reject` từ chối đơn thuê, bắt buộc truyền lý do từ chối |
| **`CRP-49`** | Auto-Reject Competing Requests on Approval | **5** | **Khiêm Tấn** (`KT`) | BE: Thuật toán tự động tìm và chuyển tất cả các đơn `PENDING` khác bị trùng khung giờ sang `REJECTED` |
| **`CRP-51`** | Renter Pay for Approved Booking | **8** | **Chi Tin Nguyen** (`CN`) | Fullstack Pay: API tính tiền cọc 30%, tích hợp sinh VietQR động / Mock Gateway, UI thanh toán |
| **`CRP-52`** | Handle Payment Result States | **5** | **Chi Tin Nguyen** (`CN`) | Fullstack Pay: Xử lý trạng thái kết quả thanh toán `SUCCESS`, `FAILED`, `CANCELLED` |
| **`CRP-53`** | Booking Status Lifecycle after Payment | **3** | **Chi Tin Nguyen** (`CN`) | Fullstack Pay: Chuyển đơn sang `CONFIRMED` / `DEPOSIT_PAID`, cập nhật trạng thái xe |
| **`CRP-54`** | Owner View Earnings and Payment History | **3** | **Chi Tin Nguyen** (`CN`) | Fullstack Pay: API & UI tổng hợp doanh thu, lịch sử dòng tiền của chủ xe |

---

### 👥 CHI TIẾT NHIỆM VỤ, RANH GIỚI FILE & KỊCH BẢN TỰ TEST (CHO THÀNH VIÊN & AI)

#### 1. 🛡️ Nguyễn Duy Bảo (`NB` - Lead & Architect) — CRP-55 (3 SP) + DB Migration & Review
* **Nhánh Git:** `feature/CRP-55-sprint1-review-and-migration`
* **Ranh giới File:**
  - ✅ Sửa: `CurrentUserProfileResponse.java`, `UserProfileServiceImpl.java`, `ErrorCode.java`.
  - ✅ Tạo: `backend/src/main/resources/db/migration/V3__create_rentals_and_payments.sql`.
* **Trạng thái thực tế:** ĐÃ HOÀN TẤT. Backend test `45/45` bài test pass 100%.

---

#### 2. 🚗 Đỗ Ngọc Phát — CRP-24, 29, 30, 31, 32, 33, 37, 39
* **Nhánh Git:** `feature/car-management-be`
* **Ranh giới File (Strict Boundary for AI):**
  - ✅ ĐƯỢC PHÉP làm việc trong: `backend/src/main/java/com/driveshare/modules/car/`
  - ⛔ CẤM sửa các package: `auth`, `user`, `admin`, `rental`, `payment`.
* **Quy tắc & Mã lỗi:**
  - Sửa/Xóa xe không phải của mình ➔ `403 FORBIDDEN` (`CAR_ACCESS_DENIED`).
  - Xóa xe đang có đơn thuê active (`APPROVED`/`CONFIRMED`) ➔ `400 BAD_REQUEST` (`CAR_HAS_ACTIVE_BOOKING`).
* **Kịch bản tự test bằng PowerShell (AI/Phát chạy trên máy mình):**
```powershell
$token = (Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method POST -ContentType "application/json" -Body '{"identifier":"owner_demo","password":"Owner123@"}').data.access_token
$headers = @{Authorization="Bearer $token"}
# 1. Xem danh sach xe cua toi
$myCars = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/owner/cars" -Method GET -Headers $headers
Write-Host "Xe cua toi: $($myCars.data.Count)"
# 2. Xem chi tiet xe public
$detail = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/public/cars/1" -Method GET
Write-Host "Xe 1: $($detail.data.brand) $($detail.data.model)"
```

---

#### 3. 🔍 Quân Nguyễn Duy (`QD`) — CRP-35, 36, 38, 44, 46
* **Nhánh Git:** `feature/rental-query-and-search-be`
* **Ranh giới File (Strict Boundary for AI):**
  - ✅ ĐƯỢC PHÉP làm việc trong: `backend/src/main/java/com/driveshare/modules/car/service/CarSearchService*`, các query controller của xe & rental.
  - ⛔ CẤM sửa logic tạo đơn của Vĩ hoặc duyệt đơn của Khiêm.
* **Quy tắc & Mã lỗi:**
  - Lọc ngày trống: Dùng SQL `NOT EXISTS` loại trừ các xe đã có cuốc thuê `APPROVED` hoặc `CONFIRMED` giao nhau với `[startDate, endDate]`.
  - Khách chỉ hủy được đơn của chính mình khi `status == 'PENDING'`. Nếu không ➔ `400 BAD_REQUEST` (`RENTAL_CANNOT_BE_CANCELLED`).
* **Kịch bản tự test bằng PowerShell (AI/Quân chạy trên máy mình):**
```powershell
# 1. Tim xe theo khoang ngay
$search = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/public/cars?startDate=2026-10-01&endDate=2026-10-03" -Method GET
Write-Host "Tim thay: $($search.data.Count) xe"
# 2. Khach xem don cua minh
$renterToken = (Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method POST -ContentType "application/json" -Body '{"identifier":"renter_demo","password":"Renter123@"}').data.access_token
$myRentals = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/rentals/me" -Method GET -Headers @{Authorization="Bearer $renterToken"}
Write-Host "Don cua toi: $($myRentals.data.Count)"
```

---

#### 4. ⚙️ Vĩ Lâm (`VL`) — CRP-41, 42, 43
* **Nhánh Git:** `feature/rental-request-be`
* **Ranh giới File (Strict Boundary for AI):**
  - ✅ ĐƯỢC PHÉP làm việc trong: `backend/src/main/java/com/driveshare/modules/rental/` (phần tạo đơn & scheduler).
  - ⛔ CẤM sửa các package khác.
* **Quy tắc & Mã lỗi:**
  - Nếu khách đang có `>= 3` đơn `PENDING` ➔ Ném lỗi `400 BAD_REQUEST` (`MAX_PENDING_RENTALS_EXCEEDED`).
  - Viết `@Scheduled(cron = "0 */5 * * * *")` quét các đơn `PENDING` tạo quá 60 phút đổi sang `EXPIRED`.
* **Kịch bản tự test bằng PowerShell (AI/Vĩ chạy trên máy mình):**
```powershell
$token = (Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method POST -ContentType "application/json" -Body '{"identifier":"renter_demo","password":"Renter123@"}').data.access_token
$headers = @{Authorization="Bearer $token"}
# Thu tao 4 don, don thu 4 phai bi chan
try {
    for ($i=1; $i -le 4; $i++) {
        $body = @{ car_id = 1; start_date = "2026-11-0$i"; end_date = "2026-11-0$($i+1)" } | ConvertTo-Json
        Invoke-RestMethod -Uri "http://localhost:8080/api/v1/rentals" -Method POST -Headers $headers -ContentType "application/json" -Body $body
        Write-Host "Tao don $i thanh cong"
    }
} catch {
    Write-Host "Da chan thanh cong o don vuot gioi han voi ma: $($_.Exception.Response.StatusCode.value__)"
}
```

---

#### 5. ✍️ Khiêm Tấn (`KT`) — CRP-47, 48, 49
* **Nhánh Git:** `feature/booking-approval-be`
* **Ranh giới File (Strict Boundary for AI):**
  - ✅ ĐƯỢC PHÉP làm việc trong: `backend/src/main/java/com/driveshare/modules/rental/` (phần duyệt & từ chối đơn).
  - ⛔ CẤM sửa module `payment` hay `car`.
* **Quy tắc & Mã lỗi:**
  - Từ chối thiếu lý do ➔ Ném lỗi `400 BAD_REQUEST` (`REJECT_REASON_REQUIRED`).
  - Duyệt đơn ➔ Tự động tìm tất cả các đơn `PENDING` khác của chiếc xe đó bị trùng khoảng thời gian thuê, đổi thành `REJECTED` (lý do: "Xe đã được duyệt cho khách khác").
* **Kịch bản tự test bằng PowerShell (AI/Khiêm chạy trên máy mình):**
```powershell
$token = (Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method POST -ContentType "application/json" -Body '{"identifier":"owner_demo","password":"Owner123@"}').data.access_token
$headers = @{Authorization="Bearer $token"}
# 1. Test tu choi thieu ly do
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/v1/owner/rentals/1/reject" -Method PUT -Headers $headers -ContentType "application/json" -Body '{}'
} catch {
    Write-Host "Chan tu choi thieu ly do dung: $($_.Exception.Response.StatusCode.value__)"
}
# 2. Duyet don thanh cong
$res = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/owner/rentals/1/approve" -Method PUT -Headers $headers
Write-Host "Duyet thanh cong don sang status: $($res.data.status)"
```

---

#### 6. 💳 Chi Tin Nguyen (`CN`) — CRP-51, 52, 53, 54
* **Nhánh Git:** `feature/payment-fullstack`
* **Ranh giới File (Strict Boundary for AI):**
  - ✅ ĐƯỢC PHÉP làm việc trong: `backend/src/main/java/com/driveshare/modules/payment/` và các trang thanh toán FE (`payment.html`, `owner-earnings.html`).
  - ⛔ CẤM sửa các controller hay entity của module khác.
* **Quy tắc & Mã lỗi:**
  - Chỉ đơn `status == 'APPROVED'` mới được thanh toán cọc. Nếu không ➔ Ném `400 BAD_REQUEST` (`RENTAL_NOT_APPROVED`).
  - Tiền cọc = 30% tổng tiền. Sinh mã QR VietQR tự động.
  - Xác nhận thanh toán thành công ➔ Đơn chuyển `CONFIRMED`.
* **Kịch bản tự test bằng PowerShell (AI/Tín chạy trên máy mình):**
```powershell
$token = (Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method POST -ContentType "application/json" -Body '{"identifier":"renter_demo","password":"Renter123@"}').data.access_token
$headers = @{Authorization="Bearer $token"}
# 1. Tao thanh toan coc
$pay = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/rentals/1/payment" -Method POST -Headers $headers
Write-Host "Coc: $($pay.data.deposit_amount) VND - QR: $($pay.data.qr_code_url)"
# 2. Xac nhan coc thanh cong
$confirm = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/payments/$($pay.data.payment_id)/confirm" -Method POST -Headers $headers
Write-Host "Ket qua thanh toan: $($confirm.data.payment_status) - Status don: $($confirm.data.rental_status)"
```



