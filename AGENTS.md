# Quy Tắc Phát Triển Dự Án DriveShare (AGENTS.md)

Tài liệu hướng dẫn quy chuẩn dành cho AI Coding Agent khi làm việc trong repository **DriveShare** (`Spring_ThucTap_k4`).

---

## 1. Tổng Quan Dự Án & Kiến Trúc

- **Dự án**: DriveShare - Nền tảng chia sẻ và cho thuê xe trực tuyến (Car Rental Platform).
- **Kiến trúc**: **Spring Boot Layered Modular Architecture** kết hợp phân hệ **AI Chatbot Assistant**.
- **Công cụ Build**: **Apache Maven** (`backend/`), sử dụng wrapper `mvnw` / `mvnw.cmd`.
- **Môi trường**: Java 17/21+, Spring Boot 3.3.4, Spring Security 6, Spring Data JPA, PostgreSQL 16 (Docker), JWT (`jjwt 0.12.6`).
- **Frontend Stack**: Vanilla HTML5/CSS3/JavaScript, Bootstrap 5, FontAwesome, Widget Trợ lý AI Chatbot (`frontend/js/chat-ai.js`).

---

## 2. Cấu Trúc Phân Hệ Thống Nhất (Project Layout)

Hệ thống được tổ chức thành 3 phân khu rõ ràng, tinh gọn và không bị chồng chéo:

```text
Spring_ThucTap_k4/
├── backend/                                  <-- TOÀN BỘ MÃ NGUỒN BACKEND (SPRING BOOT 3 & MAVEN)
│   ├── pom.xml                               <-- File cấu hình Maven & Dependencies
│   ├── mvnw / mvnw.cmd                       <-- Maven Wrapper
│   └── src/
│       ├── main/java/com/driveshare/
│       │   ├── common/ (dto, entity, enums, exception, service)
│       │   ├── config/ (DataInitializer, SecurityConfig, OpenApiConfig)
│       │   ├── security/ (JwtFilter, CustomUserDetails, TokenService)
│       │   └── modules/                      <-- CÁC MODULE NGHIỆP VỤ CỐT LÕI
│       │       ├── admin/ (AdminUserController, AdminCarController, AdminRentalController)
│       │       ├── ai/ (ChatController, AiChatService, ChatMemoryRepository)
│       │       ├── auth/ (AuthController, AuthService, TokenRefresh)
│       │       ├── car/ (CarController, PublicCarController, CarPhotoController)
│       │       ├── health/ (HealthController)
│       │       ├── oauth2/ (OAuth2Controller, GoogleOAuth2Service)
│       │       ├── payment/ (PaymentController, PaymentService - VietQR 30%)
│       │       ├── rental/ (RentalController, OwnerRentalController, RentalExpirationScheduler)
│       │       └── user/ (UserProfileController, UserProfileService)
│       └── resources/
│           ├── application.yml, application-dev.yml, application-h2.yml
│           ├── db/migration/ (Flyway DDL scripts)
│           └── prompts/car-advisor-system.txt
│
├── frontend/                                 <-- TOÀN BỘ GIAO DIỆN WEB & AI CHATBOT WIDGET
│   ├── index.html, login.html, profile.html, admin.html, owner-cars.html, owner-earnings.html, payment.html
│   ├── css/ (base.css, components.css, portals.css, home.css)
│   └── js/ (api.js, auth.js, booking.js, owner.js, payment.js, admin.js, chat-ai.js...)
│
├── docs/                                     <-- TÀI LIỆU DỰ ÁN, ĐẶC TẢ & HƯỚNG DẪN
├── docker-compose.yml                        <-- PostgreSQL 16 (5432) & Adminer (8088)
├── seed_data.sql                             <-- Kịch bản nạp dữ liệu mẫu
└── AGENTS.md                                 <-- File chỉ dẫn trung tâm
```

---

## 3. Hệ Thống Kỹ Năng Agent Đang Kích Hoạt (`.agents/skills/`)

Agent luôn tự động đọc và tuân thủ các skill trong `.agents/skills/`:
1. **`springboot-patterns`**: Mẫu thiết kế REST API, Controller mỏng, DTO Records, Exception handling tập trung.
2. **`springboot-security`**: Phân quyền RBAC (`ROLE_CUSTOMER`, `ROLE_CAR_OWNER`, `ROLE_ADMIN`), JWT Filter, cấu hình CORS an toàn.
3. **`springboot-tdd`**: Quy trình Test-Driven Development, viết bài kiểm thử trước/đồng thời với code nghiệp vụ.
4. **`springboot-verification`**: Quy trình kiểm tra build và verify chất lượng mã nguồn trước khi hoàn tất task.
5. **`driveshare-sprint-testing`**: Quy trình kiểm thử tự động Sprint cho dự án DriveShare.
6. **`create-github-pr`**: Tiêu chuẩn commit Git và tạo Pull Request đồng bộ cho nhóm.

---

## 4. Quy Chuẩn Lập Trình (Conventions)

### 4.1 Phản Hồi REST API
Mọi endpoint trong Controller phải luôn bọc kết quả trả về trong `ApiResponse<T>`:
```java
@PostMapping
public ResponseEntity<ApiResponse<ChatReplyResponse>> reply(@Valid @RequestBody ChatRequest request) {
    ChatReplyResponse response = aiChatService.chat(request, userId);
    return ResponseEntity.ok(ApiResponse.success(response));
}
```

### 4.2 Xử Lý Lỗi (Exception Handling)
- Ném `AppException` với `ErrorCode` phù hợp (`throw new AppException(ErrorCode.CAR_NOT_FOUND)`).
- `GlobalExceptionHandler` trong `common/exception/` sẽ bắt và chuyển thành HTTP Status phù hợp kèm format `ApiResponse.error(code, message)`.

### 4.3 Trợ Lý Ảo AI Tư Vấn
- Endpoint: `/api/v1/chat`.
- System prompt đặt tại `backend/src/main/resources/prompts/car-advisor-system.txt`.
- Lịch sử chat được lưu trữ tự động vào cơ sở dữ liệu PostgreSQL qua bảng `chat_memory`.

---

## 5. Các Lệnh Kiểm Thử & Biên Dịch Dự Án

- **Khởi chạy Cơ sở dữ liệu Docker (Postgres 5432 & Adminer 8088)**:
  ```powershell
  docker-compose up -d
  ```
- **Biên dịch toàn bộ dự án**:
  ```powershell
  cd backend; .\mvnw.cmd compile
  ```
- **Chạy toàn bộ bài Unit Test (103 tests)**:
  ```powershell
  cd backend; .\mvnw.cmd test
  ```
- **Khởi chạy Backend Service (Cổng 8080)**:
  ```powershell
  cd backend; .\mvnw.cmd spring-boot:run
  ```
- **Khởi chạy Giao diện Frontend (Cổng 3000)**:
  ```powershell
  cd frontend; python -m http.server 3000
  ```
