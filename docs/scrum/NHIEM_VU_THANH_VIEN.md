# 📋 BẢNG PHÂN CÔNG & ĐẶC TẢ CHI TIẾT NHIỆM VỤ THÀNH VIÊN (DRIVESHARE)

> **Mục đích:** Sổ tay tra cứu nhiệm vụ cho từng thành viên nhóm DriveShare. Giúp mỗi người khi bắt tay vào code ("vibe") biết chính xác: **Mình cần làm task gì, viết API/giao diện nào, DTO gì, logic xử lý ra sao và điều kiện nghiệm thu là gì**, tránh bị quên hoặc làm lệch pha với nhóm.  
> **Cập nhật theo Jira:** Dự án `Car Rental Platform (CRP)` - Sprint 0 (7 Sep – 19 Sep).

---

## 📊 BẢNG TỔNG QUAN TIẾN ĐỘ THEO THÀNH VIÊN

| Avatar Jira | Họ tên | Vai trò chính | Mã Task phụ trách | Story Points | Trạng thái hiện tại |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **NB** | **Nguyễn Bảo** | Project Lead & Data Architect | `CRP-5`, `CRP-8`, `CRP-9` | 11 pts | ✅ **Đã hoàn thành 100%** |
| **CN** | **Chí Tín** | Frontend Lead & DevOps/QA | `CRP-6`, `CRP-7` + Toàn bộ Web UI | 8 pts | ✅ **Xong Setup** ➔ Dựng UI |
| **KT** | **Lộc Khiêm** | Backend Core (Admin & Booking) | `CRP-19`, `CRP-20`, `CRP-21`, `CRP-22` | 14 pts | ✅ **Đã hoàn thành 100%** |
| **QD** | **Duy Quân** | Backend Dev (Profile & Services) | `CRP-17`, `CRP-18` | 6 pts | 🚀 **Đang In Review** (Đã xong code) |
| **VL** | **Lâm Chí Vĩ** | Backend Dev (Auth & Security) | `CRP-10` ➔ `CRP-16` | **29 pts** | ⏳ **Trọng tâm Sprint (To Do)** |
| 👤 | **Phát** | Backend Dev (Car Management) | `CRP-23`, `CRP-24` (Backlog) | 10 pts | 📌 Sẵn sàng khi kéo vào Sprint |

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
