# ☕ QUY CHUẨN LẬP TRÌNH BACKEND (SPRING BOOT)

> **Dành cho:** Tất cả các thành viên phát triển Backend (Chí Vĩ, Lộc Khiêm, Phát, Quân, Bảo).  
> **Mục tiêu:** Code của 5 bạn viết ra phải có cùng một phong cách, thống nhất cấu trúc thư mục, chuẩn hóa dữ liệu trả về và xử lý lỗi tập trung.

---

## 1. 📂 Cấu Trúc Gói (Package Structure)

Dự án tổ chức theo mô hình **Modular Monolith (Package by Feature / Domain)** dưới gói gốc `com.driveshare`:

```
com.driveshare
├── common/                  # Dùng chung cho toàn hệ thống
│   ├── dto/                 # ApiResponse, PageResponse, ErrorResponse...
│   ├── entity/              # BaseEntity (chứa id, createdAt, updatedAt)
│   ├── enums/               # Các enum dùng chung (Role, Status...)
│   └── exception/           # AppException, ErrorCode, GlobalExceptionHandler
├── config/                  # Các cấu hình Spring (CorsConfig, SwaggerConfig, AsyncConfig...)
├── security/                # Spring Security, JwtTokenProvider, CustomUserDetailsService...
└── modules/                 # Chia nhỏ theo từng nghiệp vụ (Module)
    ├── auth/                # Module Đăng ký, Đăng nhập, Quên mật khẩu
    ├── user/                # Module Hồ sơ, Thông tin người dùng
    ├── admin/               # Module Quản trị viên
    ├── car/                 # Module Xe cho thuê, Tìm kiếm xe
    └── booking/             # Module Đặt xe (Sprint 2)
```

### Cấu trúc bên trong mỗi `module`:
```
modules/car/
├── controller/              # Tiếp nhận HTTP Request, gọi Service, trả ApiResponse
│   └── CarController.java
├── service/                 # Interface định nghĩa logic nghiệp vụ
│   ├── CarService.java
│   └── impl/
│       └── CarServiceImpl.java
├── repository/              # Spring Data JPA Repository giao tiếp CSDL
│   └── CarRepository.java
├── entity/                  # JPA Entity ánh xạ bảng CSDL
│   └── Car.java
└── dto/                     # Data Transfer Objects
    ├── request/             # Dữ liệu Client gửi lên (CarCreateRequest, CarFilterRequest)
    └── response/            # Dữ liệu trả về Client (CarResponse, CarDetailResponse)
```

---

## 2. 🌐 Quy Chuẩn Thiết Kế RESTful API

### 📌 Quy tắc đặt tên URL:
1. Dùng **danh từ số nhiều**, chữ thường, ngăn cách bằng dấu gạch ngang (`kebab-case`).
2. **Không dùng động từ** trong URL (hành động được quyết định bởi HTTP Method).

| Mục đích | HTTP Method | URL chuẩn ✅ | URL sai ❌ (Cấm dùng) |
| :--- | :---: | :--- | :--- |
| Lấy danh sách xe | `GET` | `/api/v1/cars` | `/api/v1/getAllCars` |
| Xem chi tiết 1 xe | `GET` | `/api/v1/cars/{id}` | `/api/v1/getCarById?id=1` |
| Tạo mới 1 xe | `POST` | `/api/v1/cars` | `/api/v1/createCar` |
| Sửa thông tin xe | `PUT` | `/api/v1/cars/{id}` | `/api/v1/updateCar` |
| Đổi trạng thái duyệt | `PATCH` | `/api/v1/admin/cars/{id}/approve` | `/api/v1/admin/approveCar` |
| Xóa 1 xe | `DELETE` | `/api/v1/cars/{id}` | `/api/v1/deleteCar/{id}` |

---

## 3. 📦 Quy Chuẩn Phản Hồi Dữ Liệu (Response Format)

Tất cả các API **bắt buộc** phải trả về dữ liệu qua các DTO chuẩn đã được tạo sẵn trong `com.driveshare.common.dto`:

### 3.1. Phản hồi thành công (`ApiResponse<T>`)
Luôn trả về đối tượng `ApiResponse` bọc trong `ResponseEntity`:

```java
// Ví dụ trong Controller:
@PostMapping("/register")
public ResponseEntity<ApiResponse<UserResponse>> register(@Valid @RequestBody RegisterRequest request) {
    UserResponse responseData = authService.register(request);
    
    return ResponseEntity.status(HttpStatus.CREATED).body(
        ApiResponse.<UserResponse>builder()
            .success(true)
            .message("Đăng ký tài khoản thành công")
            .data(responseData)
            .build()
    );
}
```

**JSON Client nhận được:**
```json
{
  "success": true,
  "message": "Đăng ký tài khoản thành công",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "role": "RENTER"
  },
  "timestamp": "2026-09-15T15:00:00Z"
}
```

### 3.2. Phản hồi phân trang (`PageResponse<T>`)
Với các API lấy danh sách có phân trang (Danh sách xe, danh sách user):
```java
@GetMapping
public ResponseEntity<ApiResponse<PageResponse<CarResponse>>> getCars(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
    PageResponse<CarResponse> carPage = carService.getCars(page, size);
    
    return ResponseEntity.ok(ApiResponse.<PageResponse<CarResponse>>builder()
        .success(true)
        .message("Lấy danh sách xe thành công")
        .data(carPage)
        .build());
}
```

---

## 4. ⚠️ Quy Chuẩn Xử Lý Lỗi Tập Trung (Exception Handling)

> 🚫 **CẤM:** Không tự ý `try-catch` rồi trả về `ResponseEntity.badRequest().body("Lỗi rồi")` hoặc in `e.printStackTrace()`.

### Cách xử lý chuẩn:
1. Khi phát hiện vi phạm nghiệp vụ trong Service, chỉ cần `throw new AppException(ErrorCode.XYZ)`.
2. `GlobalExceptionHandler` đã cấu hình sẵn sẽ tự động bắt và trả về format `ErrorResponse`.

```java
// Trong Service:
if (userRepository.existsByEmail(request.getEmail())) {
    throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
}

User user = userRepository.findById(id)
    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
```

Nếu cần thêm mã lỗi mới, hãy mở file `com.driveshare.common.exception.ErrorCode` và thêm vào enum:
```java
CAR_NOT_FOUND("CAR_404", "Không tìm thấy thông tin xe", HttpStatus.NOT_FOUND),
CAR_PLATE_DUPLICATE("CAR_409", "Biển số xe đã tồn tại trong hệ thống", HttpStatus.CONFLICT),
```

---

## 5. 🛡️ Quy Chuẩn DTO & Validation

Mọi dữ liệu Client gửi lên phải được kiểm tra (validate) ngay tại DTO bằng các annotation của Jakarta:

```java
@Data
public class ChangePasswordRequest {

    @NotBlank(message = "Mật khẩu cũ không được để trống")
    private String oldPassword;

    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Size(min = 8, message = "Mật khẩu mới phải có tối thiểu 8 ký tự")
    private String newPassword;
}
```

Trong Controller, **BẮT BUỘC** phải có `@Valid`:
```java
@PutMapping("/change-password")
public ResponseEntity<ApiResponse<Void>> changePassword(
        @Valid @RequestBody ChangePasswordRequest request) { ... }
```

---

## 6. 🗄️ Quy Chuẩn Entity (JPA & Database)

1. Mọi Entity nên kế thừa `BaseEntity` để có sẵn `id`, `createdAt`, `updatedAt`.
2. Đặt tên bảng: `snake_case`, số nhiều (ví dụ `@Table(name = "cars")`, `@Table(name = "car_images")`).
3. Khóa ngoại / Quan hệ:
   - Luôn sử dụng `fetch = FetchType.LAZY` cho quan hệ `@ManyToOne` hoặc `@OneToOne` để tránh lỗi N+1 Query.
   - Tránh dùng `@ToString` hoặc `@EqualsAndHashCode` của Lombok trên các trường quan hệ (gây đệ quy vô tận / StackOverflowError).
