# TÀI LIỆU ĐẶC TẢ API SPEC — SPRINT 1 (DRIVESHARE)

> **Mục đích tài liệu:**
> 1. Là **Bản hợp đồng kỹ thuật (API Contract)** chuẩn giữa Frontend (FE) và Backend (BE).
> 2. **Kim chỉ nam cho AI:** Dùng tài liệu này nạp vào prompt cho AI (Copilot/ChatGPT/Gemini) để sinh code chuẩn xác 100%, không bị đặt tên biến lung tung hay lan man.
> 3. **FE làm Mock UI:** Đội FE có thể dùng ngay Response mẫu để dựng giao diện, xử lý state mà không cần đợi BE viết xong DB hay Controller.
> 4. **Tích hợp sẵn:** File [openapi.yaml](openapi.yaml) (Swagger) và [DriveShare_Sprint1_Postman_Collection.json](DriveShare_Sprint1_Postman_Collection.json).

---

## I. ĐÁNH GIÁ TẦM QUAN TRỌNG GỢI Ý CỦA THẦY

Thầy dặn 2 ý cốt lõi:
1. **API Spec là hợp đồng chuẩn giữa BE và FE:**
2. **API List bắt buộc phải có Phân trang (Pagination), Lọc (Filter), Tìm kiếm (Search), Sắp xếp (Sort).**

### 1. Tại sao API Spec là "Sống Còn" trong dự án nhóm và khi dùng AI?
* **Tránh "Lệch Pha" (Mismatch Schema):** Nếu không chốt Spec, BE trả về `full_name` (snake_case) còn FE gọi `fullName` (camelCase) -> UI hiển thị `undefined`. FE gửi token qua Header `Authorization: Bearer <token>`, BE lại đi tìm trong Cookie -> 401 lỗi toàn tập khi ghép code.
* **Chặn AI "Ảo giác" (Hallucination):** Khi bạn yêu cầu AI viết Controller hoặc giao diện, nếu không có API Spec, AI sẽ "sáng tạo" ra các endpoint và trường dữ liệu ngẫu nhiên. Khi có Spec, bạn chỉ cần đưa schema vào prompt: *"Hãy viết Spring Boot Controller và Service dựa trên OpenAPI spec sau..."* -> Code chuẩn chỉ từng dòng!
* **Song song hóa tiến độ (Zero-blocking):** FE và BE có thể làm việc độc lập 100%. FE dùng Postman Mock hoặc file JSON giả lập dữ liệu theo Spec để làm trang Admin, Login, Register. Khi BE hoàn thành, FE chỉ cần đổi URL `localhost:8080` là hệ thống chạy mượt mà ngay.

### 2. Tại sao API List BẮT BUỘC có Phân trang, Lọc, Tìm kiếm, Sắp xếp?
* **Hiệu năng & Tài nguyên Hệ thống (Performance & Scalability):**
  * Nếu hệ thống có 10,000 users hoặc 5,000 chiếc xe, một câu lệnh `SELECT * FROM users` sẽ kéo toàn bộ dữ liệu lên RAM, ép JSON 50MB truyền qua mạng -> BE nghẽn cổ chai, sập server, trình duyệt FE đơ lag.
  * Phân trang (`page=1&limit=10`) giúp DB chỉ truy vấn đúng 10 dòng (`LIMIT 10 OFFSET 0`), phản hồi tức thì trong vài chục mili-giây.
* **Trải nghiệm người dùng (UX):**
  * Admin không thể cuộn chuột vô tận qua 1,000 dòng để tìm một người.
  * Admin cần:
    * **Search:** Gõ `"nam"` để tìm nhanh theo tên, email, SĐT.
    * **Filter:** Lọc riêng người dùng có role là `owner` và trạng thái `pending` để duyệt xe.
    * **Sort:** Sắp xếp người mới đăng ký lên đầu (`sortBy=created_at&sortDir=desc`).
* **Tiêu chuẩn công nghiệp (Industry Standard):** Trong môi trường doanh nghiệp và phỏng vấn tuyển dụng, viết một API danh sách trả về mảng trần `[...]` mà không có phân trang và metadata (`totalPages`, `totalItems`) sẽ bị đánh giá là **thiếu tư duy kiến trúc backend cơ bản**.

---

## II. QUY CHUẨN CHUNG CỦA HỆ THỐNG (API CONVENTIONS)

* **Base URL:** `http://localhost:8080/api/v1`
* **Format:** `application/json; charset=utf-8`
* **Xác thực (Authentication):** Chuẩn JWT Bearer Token gửi trong Request Header:
  ```http
  Authorization: Bearer <access_token>
  ```
* **Quy chuẩn đặt tên (Naming Convention):**
  * JSON body fields: `snake_case` (trùng khớp với thiết kế Database `DriveShare_Database_Design_v2.sql`).
  * Query parameters: `camelCase` hoặc `snake_case` chuẩn hóa: `page`, `limit`, `search`, `role`, `status`, `sortBy`, `sortDir`.

### Cấu trúc Response chuẩn (Uniform Response Format)

#### 1. Khi thành công (Single Item hoặc Thao tác):
```json
{
  "success": true,
  "message": "Thao tác thành công",
  "data": { ... },
  "timestamp": "2026-09-14T14:30:00Z"
}
```

#### 2. Khi thành công (API Danh sách có Phân trang):
```json
{
  "success": true,
  "message": "Lấy danh sách thành công",
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total_items": 45,
      "total_pages": 5,
      "has_next": true,
      "has_prev": false
    }
  },
  "timestamp": "2026-09-14T14:30:00Z"
}
```

#### 3. Khi thất bại (Error Response):
```json
{
  "success": false,
  "message": "Mật khẩu không chính xác hoặc tài khoản đã bị khóa",
  "errorCode": "AUTH_FAILED",
  "errors": null,
  "timestamp": "2026-09-14T14:30:00Z"
}
```

#### 4. Khi lỗi Validation dữ liệu (Validation Error - 400):
```json
{
  "success": false,
  "message": "Dữ liệu gửi lên không hợp lệ",
  "errorCode": "VALIDATION_FAILED",
  "errors": [
    { "field": "email", "message": "Email không đúng định dạng" },
    { "field": "phone", "message": "Số điện thoại đã tồn tại" }
  ],
  "timestamp": "2026-09-14T14:30:00Z"
}
```

---

## III. CHI TIẾT CÁC ENDPOINT TRONG SPRINT 1

### 1. Phân hệ Authentication (Xác thực & Phân quyền)

#### 1.1. Đăng ký tài khoản (Register)
* **Endpoint:** `POST /api/v1/auth/register`
* **Role:** Public (Ai cũng gọi được)
* **Request Body:**
  ```json
  {
    "username": "hoangnam",
    "email": "hoangnam@gmail.com",
    "phone": "0909123456",
    "password": "Password123@",
    "full_name": "Nguyễn Hoàng Nam",
    "role": "owner" // Hoặc "renter"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Đăng ký tài khoản thành công",
    "data": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "token_type": "Bearer",
      "expires_in": 86400,
      "user": {
        "user_id": 1,
        "username": "hoangnam",
        "email": "hoangnam@gmail.com",
        "phone": "0909123456",
        "full_name": "Nguyễn Hoàng Nam",
        "avatar_url": null,
        "status": "active",
        "roles": ["owner"],
        "created_at": "2026-09-14T14:30:00Z"
      }
    },
    "timestamp": "2026-09-14T14:30:00Z"
  }
  ```

#### 1.2. Đăng nhập (Login)
* **Endpoint:** `POST /api/v1/auth/login`
* **Role:** Public
* **Request Body:**
  ```json
  {
    "identifier": "hoangnam@gmail.com", // Có thể nhập email hoặc username
    "password": "Password123@"
  }
  ```
* **Response (200 OK):** (Trả về token và quyền hạn tương tự như Register)

#### 1.3. Đăng xuất (Logout)
* **Endpoint:** `POST /api/v1/auth/logout`
* **Header:** `Authorization: Bearer <token>`
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Đăng xuất thành công",
    "data": null,
    "timestamp": "2026-09-14T14:30:00Z"
  }
  ```

---

### 2. Phân hệ User Profile (Chung cho Renter & Owner)

#### 2.1. Lấy thông tin cá nhân hiện tại
* **Endpoint:** `GET /api/v1/users/me`
* **Header:** `Authorization: Bearer <token>`
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Lấy thông tin tài khoản thành công",
    "data": {
      "user_id": 1,
      "username": "hoangnam",
      "email": "hoangnam@gmail.com",
      "phone": "0909123456",
      "full_name": "Nguyễn Hoàng Nam",
      "avatar_url": "https://example.com/avatar.jpg",
      "id_card_number": "079201012345",
      "status": "active",
      "roles": ["owner"],
      "created_at": "2026-09-14T14:30:00Z",
      "owner_profile": {
        "bank_account_number": "1903345678901",
        "bank_name": "Techcombank",
        "verification_status": "pending"
      }
    },
    "timestamp": "2026-09-14T14:30:00Z"
  }
  ```

#### 2.2. Cập nhật hồ sơ cá nhân
* **Endpoint:** `PUT /api/v1/users/me`
* **Header:** `Authorization: Bearer <token>`
* **Request Body:**
  ```json
  {
    "full_name": "Nguyễn Hoàng Nam (Mới)",
    "phone": "0909999888",
    "avatar_url": "https://example.com/avatar-new.jpg",
    "id_card_number": "079201012345"
  }
  ```
* **Response (200 OK):** Trả về thông tin user mới cập nhật.

#### 2.3. Đổi mật khẩu
* **Endpoint:** `PUT /api/v1/users/me/password`
* **Header:** `Authorization: Bearer <token>`
* **Request Body:**
  ```json
  {
    "old_password": "Password123@",
    "new_password": "NewSecurePassword456@",
    "confirm_password": "NewSecurePassword456@"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Đổi mật khẩu thành công",
    "data": null,
    "timestamp": "2026-09-14T14:30:00Z"
  }
  ```

---

### 3. Phân hệ Admin — Quản lý User (Theo yêu cầu cốt lõi của Thầy)

#### 3.1. Lấy danh sách người dùng (List Users)
* **Endpoint:** `GET /api/v1/admin/users`
* **Header:** `Authorization: Bearer <token>` (User phải có role `admin` hoặc `staff`)
* **Query Parameters:**
  | Tên Param | Kiểu | Bắt buộc | Mặc định | Ý nghĩa & Ví dụ |
  | :--- | :--- | :--- | :--- | :--- |
  | `page` | integer | Không | `1` | Trang hiện tại (1-based index) |
  | `limit` | integer | Không | `10` | Số dòng trên 1 trang (10, 20, 50) |
  | `search` | string | Không | rỗng | Từ khóa tìm kiếm theo username, email, full_name, phone |
  | `role` | string | Không | `all` | Lọc role: `all`, `renter`, `owner`, `admin`, `staff` |
  | `status` | string | Không | `all` | Lọc trạng thái: `all`, `pending`, `active`, `locked` |
  | `sortBy` | string | Không | `created_at`| Cột sắp xếp: `created_at`, `full_name`, `email` |
  | `sortDir` | string | Không | `desc` | Chiều sắp xếp: `asc` (tăng dần) hoặc `desc` (giảm dần) |

* **Ví dụ gọi URL:**
  ```http
  GET /api/v1/admin/users?page=1&limit=10&search=nam&role=owner&status=pending&sortBy=created_at&sortDir=desc
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Lấy danh sách người dùng thành công",
    "data": {
      "items": [
        {
          "user_id": 5,
          "username": "hoangnam",
          "email": "hoangnam@gmail.com",
          "phone": "0909123456",
          "full_name": "Nguyễn Hoàng Nam",
          "avatar_url": null,
          "id_card_number": "079201012345",
          "status": "pending",
          "roles": ["owner"],
          "created_at": "2026-09-14T10:00:00Z",
          "owner_profile": {
            "bank_account_number": "1903345678901",
            "bank_name": "Techcombank",
            "verification_status": "pending"
          }
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total_items": 1,
        "total_pages": 1,
        "has_next": false,
        "has_prev": false
      }
    },
    "timestamp": "2026-09-14T14:30:00Z"
  }
  ```

#### 3.2. Xem chi tiết người dùng
* **Endpoint:** `GET /api/v1/admin/users/{userId}`
* **Header:** `Authorization: Bearer <token>`
* **Response (200 OK):** Trả về đầy đủ thông tin cá nhân, hồ sơ bằng lái hoặc hồ sơ ngân hàng.

#### 3.3. Phê duyệt hồ sơ Chủ xe (Approve / Reject Owner)
* **Endpoint:** `PATCH /api/v1/admin/users/{userId}/approve-owner`
* **Header:** `Authorization: Bearer <token>`
* **Request Body:**
  ```json
  {
    "verification_status": "verified", // "verified" hoặc "rejected"
    "rejection_reason": ""             // Điền lý do nếu rejected
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Phê duyệt hồ sơ chủ xe thành công",
    "data": null,
    "timestamp": "2026-09-14T14:30:00Z"
  }
  ```

#### 3.4. Khóa hoặc Mở khóa tài khoản (Block / Unblock)
* **Endpoint:** `PATCH /api/v1/admin/users/{userId}/status`
* **Header:** `Authorization: Bearer <token>`
* **Request Body:**
  ```json
  {
    "status": "locked", // "locked" (khóa) hoặc "active" (mở khóa)
    "reason": "Vi phạm điều khoản đăng tin cho thuê xe giả"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Cập nhật trạng thái tài khoản thành công",
    "data": null,
    "timestamp": "2026-09-14T14:30:00Z"
  }
  ```

---

## IV. HƯỚNG DẪN DÀNH CHO FE VÀ BE

### 1. Hướng dẫn dành cho Frontend (Làm Mock data ngay không chờ BE)
1. **Dùng file Postman Collection:**
   * Mở Postman -> Bấm **Import** -> Chọn file `docs/api/DriveShare_Sprint1_Postman_Collection.json`.
   * Bấm vào Collection -> Chọn **Mock collection** -> Postman sẽ tạo cho bạn 1 đường link URL ảo (ví dụ: `https://mock.pstmn.io/...`).
   * Thay Base URL trong code React/Vue/Angular sang URL này là gọi có dữ liệu ngay lập tức!
2. **Tạo service/mock local trong code:**
   * Copy trực tiếp các đoạn JSON trong tài liệu này vào thư mục `src/mocks/` hoặc dùng thư viện `msw` (Mock Service Worker) / `json-server`.
   * Thiết kế giao diện Table Admin với các props: `currentPage`, `pageSize`, `onFilterChange`, `onSearch`, `onSort`. Khi BE xong chỉ cần cắm API thật vào là chạy!

### 2. Hướng dẫn dành cho Backend (Dùng để prompt AI sinh code không lan man)
Khi bạn cần AI sinh code Spring Boot (Controller, Service, DTO, Repository), hãy copy mẫu prompt sau gửi cho AI:

> *"Tôi đang làm dự án Spring Boot 3 + Spring Data JPA + MySQL. Đây là thiết kế cơ sở dữ liệu `users` và đây là API Spec theo chuẩn OpenAPI: [dán endpoint /admin/users từ tài liệu này]. Hãy viết:
> 1. DTO Request và Response tương ứng (sử dụng annotation validation của Jakarta).
> 2. Controller xử lý endpoint `GET /api/v1/admin/users` với `Pageable`, Specification để filter dynamic (`search`, `role`, `status`), và sort.
> 3. Tuyệt đối tuân thủ đúng format JSON Response và tên trường đã định nghĩa trong API Spec."*

---

*Tài liệu này được biên soạn bám sát tài liệu kiến trúc cơ sở dữ liệu v2 của dự án DriveShare.*
