# Quy Tắc Phát Triển Dự Án DriveShare (AGENTS.md)

Tài liệu hướng dẫn quy chuẩn dành cho AI Coding Agent khi làm việc trong repository **DriveShare** (`Spring_ThucTap_k4`).

---

## 1. Tổng Quan Dự Án & Kiến Trúc

- **Dự án**: DriveShare - Nền tảng chia sẻ và cho thuê xe trực tuyến (Car Rental Platform).
- **Kiến trúc**: **Hexagonal Architecture (Kiến trúc Lục giác / Ports & Adapters)** kết hợp **Spring AI**.
- **Công cụ Build**: **Gradle Multi-Module** (`:core`, `:app`), sử dụng wrapper `gradlew` / `gradlew.bat`.
- **Môi trường**: Java 17/21+, Spring Boot 3.3.4, Spring AI 1.1.5, Spring Security 6, Spring Data JPA, PostgreSQL (hoặc H2 local), JWT (`jjwt 0.12.6`).
- **Frontend Stack**: Vanilla HTML5/CSS3/JavaScript, Bootstrap 5, FontAwesome, Widget Trợ lý AI Chatbot (`frontend/js/chat-ai.js`).

---

## 2. Cấu Trúc Phân Hệ (Module Layout)

Hệ thống được chia thành 2 module rõ ràng theo nguyên lý Dependency Inversion:

```text
Spring_ThucTap_k4/
├── core/                                     <-- THUẦN JAVA (PURE DOMAIN & USE CASES)
│   └── src/main/java/com/driveshare/core/
│       ├── domain/
│       │   ├── model/ (Car, Rental, User)    <-- Pure POJO Domain Models
│       │   ├── vo/ (CarStatus, RentalStatus, ChatRole, Money, Email)
│       │   └── exception/ (DomainException, CarNotFoundException...)
│       └── application/
│           ├── dto/ (ChatCommand, ChatReply, CarSuggestion, CarResult...)
│           ├── port/in/ (ChatUseCase, CarSuggestionUseCase, BrowseCarsUseCase...)
│           ├── port/out/ (ChatMemoryPort, CarSuggestionPort, CarRepositoryPort...)
│           └── usecase/ (ChatUseCaseImpl, BrowseCarsUseCaseImpl...)
│
├── app/                                      <-- SPRING BOOT & INFRASTRUCTURE ADAPTERS
│   └── src/main/java/com/driveshare/app/
│       ├── adapter/in/web/ (ChatController, CarController...)
│       ├── adapter/in/security/ (SecurityConfig, JwtFilter...)
│       ├── adapter/out/persistence/ (JPA Entities, Repositories, Adapters)
│       ├── adapter/out/ai/ (SpringAiCarSuggestionAdapter - ChatClient)
│       ├── memory/ (JpaChatMemoryStore, ChatMemoryEntity)
│       ├── config/ (AiConfig, SecurityConfig)
│       └── resources/
│           ├── application.yml
│           └── prompts/car-advisor-system.txt
│
├── frontend/                                 <-- Giao diện web và AI Chatbot Widget
├── .agents/                                  <-- AI Agent Customizations (Skills, Agents, Commands)
└── AGENTS.md                                 <-- File chỉ dẫn trung tâm
```

### Quy Tắc Bất Di Bất Dịch Cho Module `core/`:
1. **KHÔNG phụ thuộc Framework**: Tuyệt đối KHÔNG import `org.springframework.*`, `jakarta.persistence.*`, `org.hibernate.*`, `com.fasterxml.jackson.*`, hay `jakarta.servlet.*` vào `core`.
2. **Domain Logic tập trung**: Mọi quy tắc nghiệp vụ (trạng thái xe, tính tiền thuê, điều kiện hủy chuyến) phải nằm trong Domain Model hoặc UseCase trong `core`.
3. **Unit Test thuần khiết**: Test trong `core` sử dụng JUnit 5 + AssertJ + Hand-written Test Doubles (Fakes), không dùng Spring Context hay Mockito trên `core` classpath.

---

## 3. Hệ Thống Kỹ Năng Agent Đang Kích Hoạt (`.agents/skills/`)

Agent luôn tự động đọc và tuân thủ các skill trong `.agents/skills/`:
1. **`hexagonal-architecture`**: Bảo vệ ranh giới Domain Core và Adapters, kiểm soát Dependency Rule (chỉ có `app` phụ thuộc `core`, `core` không phụ thuộc `app`).
2. **`springboot-patterns`**: Mẫu thiết kế REST API, Controller mỏng, DTO Records, Exception handling tập trung.
3. **`springboot-security`**: Phân quyền RBAC (`ROLE_CUSTOMER`, `ROLE_CAR_OWNER`, `ROLE_ADMIN`), JWT Filter, cấu hình CORS an toàn.
4. **`springboot-tdd`**: Quy trình Test-Driven Development, viết bài kiểm thử trước/đồng thời với code nghiệp vụ.
5. **`springboot-verification`**: Quy trình kiểm tra build và verify chất lượng mã nguồn trước khi hoàn tất task.
6. **`driveshare-sprint-testing`**: Quy trình kiểm thử tự động Sprint cho dự án DriveShare.
7. **`create-github-pr`**: Tiêu chuẩn commit Git và tạo Pull Request đồng bộ cho nhóm.

---

## 4. Quy Chuẩn Lập Trình (Conventions)

### 4.1 Phản Hồi REST API
Mọi endpoint trong `adapter/in/web/` phải luôn bọc kết quả trả về trong `ApiResponse<T>`:
```java
@PostMapping
public ResponseEntity<ApiResponse<ChatReplyResponse>> reply(@Valid @RequestBody ChatRequest request) {
    ChatReplyResponse response = ChatReplyResponse.from(chatUseCase.reply(command));
    return ResponseEntity.ok(ApiResponse.success(response));
}
```

### 4.2 Xử Lý Lỗi (Exception Handling)
- Ném Domain Exception từ `core` (`CarNotFoundException`, `DomainException`).
- `GlobalExceptionHandler` trong `app/adapter/in/web/` sẽ bắt và chuyển thành HTTP Status phù hợp kèm format `ApiResponse.error(code, message)`.

### 4.3 Trợ Lý Ảo Spring AI
- Hệ thống tích hợp Trợ lý tư vấn thuê xe thông minh tại `/api/v1/chat`.
- System prompt đặt tại `app/src/main/resources/prompts/car-advisor-system.txt`.
- Lịch sử chat được lưu trữ tự động vào cơ sở dữ liệu qua `JpaChatMemoryStore`.

---

## 5. Các Lệnh Kiểm Thử & Biên Dịch Dự Án

- **Biên dịch toàn bộ dự án**:
  ```powershell
  cmd /c "gradlew.bat assemble"
  ```
- **Chạy toàn bộ bài Unit Test**:
  ```powershell
  cmd /c "gradlew.bat test"
  ```
- **Khởi chạy Backend Service (Cổng 8080)**:
  ```powershell
  cmd /c "gradlew.bat bootRun"
  ```
- **Chạy Kiểm Thử Tự Động Sprint 1**:
  ```powershell
  powershell -ExecutionPolicy Bypass -File ./test_sprint1_fix.ps1
  ```
