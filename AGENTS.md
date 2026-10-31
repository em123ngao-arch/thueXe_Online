# Quy Tắc Phát Triển Dự Án DriveShare (AGENTS.md)

Tài liệu hướng dẫn quy chuẩn dành cho AI Coding Agent & Nhà phát triển khi làm việc trong repository **DriveShare** (`Spring_ThucTap_k4`).

---

## 1. Tổng Quan Dự Án & Kiến Trúc

- **Dự án**: DriveShare - Nền tảng chia sẻ và cho thuê xe trực tuyến (Car Rental Platform).
- **Kiến trúc**: **Spring Boot Hexagonal Modular Architecture (Ports & Adapters)** kết hợp phân hệ **AI Chatbot Assistant**.
- **Công cụ Build**: **Apache Maven** (`backend/`), sử dụng wrapper `mvnw` / `mvnw.cmd`.
- **Môi trường**: Java 17/21+, Spring Boot 3.3.4, Spring Security 6, Spring Data JPA, PostgreSQL 16 (Docker), JWT (`jjwt 0.12.6`).
- **Frontend Stack**: Vanilla HTML5/CSS3/JavaScript, Bootstrap 5, FontAwesome, Widget Trợ lý AI Chatbot (`frontend/js/chat-ai.js`).

---

## 2. Cấu Trúc Phân Hệ Thống Nhất (Hexagonal Project Layout)

Hệ thống được tổ chức thành 3 phân khu rõ ràng, tinh gọn và tuyệt đối tuân thủ kiến trúc Ports & Adapters:

```text
Spring_ThucTap_k4/
├── backend/                                  <-- TOÀN BỘ MÃ NGUỒN BACKEND (SPRING BOOT 3 & MAVEN)
│   ├── pom.xml                               <-- File cấu hình Maven & Dependencies
│   ├── mvnw / mvnw.cmd                       <-- Maven Wrapper
│   └── src/
│       ├── main/java/com/driveshare/
│       │   ├── common/                       <-- DTO chung, Enums, ApiResponse, Exception toàn cục
│       │   ├── config/                       <-- Cấu hình Spring (SecurityConfig, OpenApiConfig...)
│       │   ├── security/                     <-- JWT Filter, CustomUserDetails, TokenService
│       │   └── modules/                      <-- 11 MODULES CHUẨN KIẾN TRÚC LỤC GIÁC
│       │       └── <module_name>/            <-- car, rental, payment, user, auth, admin, ai, rag, notification, oauth2, health
│       │           ├── domain/               <-- TẦNG 1: CORE NGHIỆP VỤ (PURE JAVA)
│       │           │   ├── *Record.java      <-- Model/Entity thuần Java (Immutable)
│       │           │   └── *Policy.java      <-- Quy tắc nghiệp vụ thuần túy (CẤM Spring/JPA)
│       │           ├── application/          <-- TẦNG 2: PORTS & USE CASES
│       │           │   ├── port/
│       │           │   │   ├── in/           <-- Inbound Ports (Interface Use Case cho Web/Module khác gọi)
│       │           │   │   └── out/          <-- Outbound Ports (Interface cho DB/External Service)
│       │           │   ├── usecase/          <-- Triển khai nghiệp vụ của Inbound Port
│       │           │   └── command/, result/ <-- Parameter Object & Result DTO cho Use Case
│       │           └── adapter/              <-- TẦNG 3: INFRASTRUCTURE ADAPTERS
│       │               ├── in/web/           <-- REST Controllers (@RestController)
│       │               └── out/persistence/  <-- JPA Entities, Spring Data Repositories, Adapters
│       └── resources/
│           ├── application.yml, application-dev.yml, application-h2.yml
│           ├── db/migration/                 <-- Flyway DDL scripts
│           └── prompts/car-advisor-system.txt
│
├── frontend/                                 <-- TOÀN BỘ GIAO DIỆN WEB & AI CHATBOT WIDGET
│   ├── index.html, login.html, profile.html, admin.html, owner-cars.html, owner-earnings.html, payment.html
│   ├── css/ (base.css, components.css, portals.css, home.css)
│   └── js/ (api.js, auth.js, booking.js, owner.js, payment.js, admin.js, chat-ai.js...)
│
├── docs/                                     <-- TÀI LIỆU DỰ ÁN, ĐẶC TẢ & HƯỚNG DẪN KIẾN TRÚC
├── docker-compose.yml                        <-- PostgreSQL 16 (5432) & Adminer (8088)
├── seed_data.sql                             <-- Kịch bản nạp dữ liệu mẫu
└── AGENTS.md                                 <-- File chỉ dẫn trung tâm
```

---

## 3. Hệ Thống Kỹ Năng Agent Đang Kích Hoạt (`.agents/skills/`)

Agent luôn tự động đọc và tuân thủ các skill trong `.agents/skills/`:
1. **`hexagonal-architecture`**: **[BẮT BUỘC]** Quy chuẩn phân tách ranh giới Domain Core, Inbound/Outbound Ports, và Infrastructure Adapters.
2. **`springboot-patterns`**: Mẫu thiết kế REST API, DTO Records, Exception handling tập trung với `ApiResponse<T>`.
3. **`springboot-security`**: Phân quyền RBAC (`ROLE_CUSTOMER`, `ROLE_CAR_OWNER`, `ROLE_ADMIN`), JWT Filter, CORS an toàn.
4. **`springboot-tdd`**: Quy trình Test-Driven Development, viết bài kiểm thử trước/đồng thời với code nghiệp vụ.
5. **`springboot-verification`**: Quy trình kiểm tra build, kiểm thử tương tranh và 7 luật ArchUnit trước khi commit.
6. **`driveshare-sprint-testing`**: Quy trình kiểm thử tự động Sprint cho dự án DriveShare.
7. **`create-github-pr`**: Tiêu chuẩn commit Git và tạo Pull Request đồng bộ cho nhóm.

---

## 4. Quy Chuẩn Lập Trình & 7 Luật ArchUnit Bắt Buộc

### 4.1 Bộ 7 Luật Kiến Trúc ArchUnit (Architecture Rules - Tự Động Kiểm Tra)
Mọi đoạn code được thêm mới hoặc chỉnh sửa **BẮT BUỘC** phải vượt qua bài test `ArchitectureRulesTest.java`:
1. **Domain KHÔNG phụ thuộc Framework**: Package `..domain..` tuyệt đối CẤM import `org.springframework..`, `jakarta.persistence..`, `jakarta.validation..`.
2. **Domain KHÔNG phụ thuộc Application hay Adapter**: Domain là trung tâm độc lập cao nhất, không biết gì về Use Case hay Web/DB.
3. **Application KHÔNG phụ thuộc Adapter**: Tầng Application chỉ định nghĩa Interface (`port/out`), việc kết nối DB do Adapter triển khai.
4. **Application KHÔNG phụ thuộc JPA/Hibernate**: Package `..application..` tuyệt đối CẤM import `jakarta.persistence..` hoặc `org.springframework.data..`.
5. **Controller Web KHÔNG gọi trực tiếp Persistence**: Package `..adapter.in.web..` CẤM inject hay gọi `..adapter.out.persistence..`. Mọi yêu cầu phải đi qua Inbound Port (`..application.port.in..`).
6. **Application các Module KHÔNG phụ thuộc vòng/trực tiếp vào nhau**: Đảm bảo tính độc lập và module hóa cao độ.
7. **Giao tiếp liên Module BẮT BUỘC qua Inbound Port**: Khi Module A cần gọi Module B, A chỉ được phụ thuộc vào `port.in`, `command`, `result`, hoặc DTO công khai của B. Cấm gọi trực tiếp usecase nội bộ hay adapter của module khác.

### 4.2 Phản Hồi REST API
Mọi endpoint trong Controller phải luôn bọc kết quả trả về trong `ApiResponse<T>`:
```java
@PostMapping
public ResponseEntity<ApiResponse<ChatReplyResponse>> reply(@Valid @RequestBody ChatRequest request) {
    ChatReplyResponse response = chatAdvisorUseCase.chat(request, userId);
    return ResponseEntity.ok(ApiResponse.success(response));
}
```

### 4.3 Xử Lý Lỗi (Exception Handling)
- Ném `AppException` với `ErrorCode` phù hợp (`throw new AppException(ErrorCode.CAR_NOT_FOUND)`).
- `GlobalExceptionHandler` trong `common/exception/` sẽ bắt và chuyển thành HTTP Status phù hợp kèm format `ApiResponse.error(code, message)`.

### 4.4 Quy Trình 5 Bước Phát Triển Tính Năng Mới Chuẩn Hexagonal
Khi thêm chức năng hoặc sửa lỗi, AI và Developer cần tuân thủ thứ tự:
1. **Bước 1 - Domain**: Định nghĩa Domain Model (Record) hoặc nghiệp vụ cốt lõi trong `domain/` (Pure Java).
2. **Bước 2 - Ports**: Định nghĩa Inbound Port trong `application/port/in/` và Outbound Port trong `application/port/out/`.
3. **Bước 3 - Use Case**: Viết lớp Use Case thực thi Inbound Port trong `application/usecase/`.
4. **Bước 4 - Adapters**: 
   - Web: Viết Controller trong `adapter/in/web/` gọi Inbound Port.
   - Persistence: Triển khai Outbound Port trong `adapter/out/persistence/` sử dụng JPA Repository.
5. **Bước 5 - Chạy Test**: Chạy `.\mvnw.cmd test` xác nhận 7 luật ArchUnit và các Unit Test đều xanh.

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
- **Chạy toàn bộ bài Unit, Integration, Concurrency & ArchUnit Test (240 tests)**:
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

---

## 6. Quy Chuẩn Quản Lý Nhánh & GitHub Workflow Chuẩn Doanh Nghiệp

### 6.1 Cấu Trúc Nhánh & Quyền Hạn
- **`develop`**: Nhánh tích hợp chính (Default branch). Toàn bộ tính năng (`feature/*`) và sửa lỗi (`fix/*`) mở PR vào đây.
- **`main`**: Nhánh Production/Release kết nối với Render Web Service. Chỉ nhận PR từ `develop` do Tech Lead duyệt.
- **CẤM**: Không được push trực tiếp vào `develop` và `main`. Mọi thay đổi phải qua Pull Request.
- **CODEOWNERS**: Tech Lead Nguyễn Duy Bảo (`@em123ngao-arch`) là người duyệt bắt buộc (Required Approval).

### 6.2 Chiến Lược Hợp Nhất (Merge Strategy)
- **Feature/Fix PR $\rightarrow$ `develop`**: Sử dụng **Squash and Merge** (Gom các commit nhỏ lẻ thành 1 commit sạch đẹp).
- **`develop` $\rightarrow$ `main`**: Sử dụng **Create a Merge Commit** (Lưu giữ mốc phát hành phiên bản).

### 6.3 Quy Trình 5 Bước Làm Việc Của Thành Viên (Chống Ghi Đè Code & Chống Bể Kiến Trúc)
1. **Bắt đầu**: Chuyển về `develop` và kéo code mới nhất:  
   `git checkout develop && git pull origin develop`
2. **Tạo nhánh**: Tạo nhánh riêng theo định dạng chuẩn:  
   `git checkout -b feature/<ma-task>-<ten-ngan-gon>` hoặc `git checkout -b fix/<ma-task>-<ten-loi>`
3. **Phát triển & Kiểm thử local**: 
   - Viết code tuân thủ 3 tầng Hexagonal.
   - Chạy `cd backend; .\mvnw.cmd test` (bắt buộc pass 239/240 tests, bao gồm 7 luật ArchUnit).
4. **Đồng bộ trước khi tạo PR**: Kéo `develop` mới nhất về nhánh để giải quyết xung đột trên máy mình:  
   `git fetch origin && git merge origin/develop`  
   *(Xác nhận kỹ lưỡng không ghi đè hoặc làm mất code của đồng đội).*
5. **Mở Pull Request**: Đẩy nhánh lên GitHub và tạo PR vào `develop`, điền đầy đủ Checklist trong PR Template kèm ảnh chụp minh chứng pass tests.
