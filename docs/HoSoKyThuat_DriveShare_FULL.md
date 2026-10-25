# HỒ SƠ KỸ THUẬT & DỮ LIỆU LẬP KẾ HOẠCH HỌC TẬP
## DỰ ÁN: DRIVESHARE — NỀN TẢNG CHO THUÊ XE TRỰC TUYẾN (WEB CAR RENTAL)
> **Mục đích**: Tài liệu chi tiết 8 mục tổng hợp từ 100% mã nguồn thực tế (Backend Spring Boot 3.3.4 + Frontend + PostgreSQL) gửi Giảng viên hướng dẫn để xây dựng lộ trình học từ gốc đến bảo vệ đồ án.  
> **Thời gian trích xuất**: 25/10/2026  
> **Phiên bản tài liệu**: 1.0 (Bản hoàn chỉnh đầy đủ 8 mục trong 1 file duy nhất)

---

## MỤC LỤC TỔNG QUAN HỒ SƠ
- [Mục 1: Nghiệp Vụ & Dữ Liệu Vẽ Sơ Đồ Use Case](#muc-1-nghiep-vu--du-lieu-ve-so-do-use-case)
  - 1.1 Các Tác Nhân (Actors)
  - 1.2 Use Cases Chi Tiết Theo Actor (kèm include / extend)
  - 1.3 Bảng Tổng Hợp Quan Hệ Giữa Các Use Case
- [Mục 2: Tech Stack, Thư Viện & Hệ Thống Bên Ngoài](#muc-2-tech-stack-thu-vien--he-thong-ben-ngoai)
  - 2.1 Backend Stack & Versions
  - 2.2 Frontend Stack & Libraries
  - 2.3 Database & ORM
  - 2.4 Hệ Thống Bên Ngoài (External Services)
  - 2.5 File Cấu Hình Quan Trọng
- [Mục 3: Cấu Trúc Thư Mục & Kiến Trúc Phân Tầng](#muc-3-cau-truc-thu-muc--kien-truc-phan-tang)
  - 3.1 Cây Thư Mục Toàn Dự Án
  - 3.2 Kiến Trúc Phân Tầng (Layered Architecture)
  - 3.3 Quy Tắc Phân Tách Trách Nhiệm
- [Mục 4: Cơ Sở Dữ Liệu & Dữ Liệu Vẽ ERD](#muc-4-co-so-du-lieu--du-lieu-ve-erd)
  - 4.1 Danh Sách 18 Bảng
  - 4.2 Chi Tiết Các Bảng Cốt Lõi (PK, FK, Ràng Buộc)
  - 4.3 Sơ Đồ Mối Quan Hệ Giữa Các Thực Thể (ERD Data)
- [Mục 5: Danh Sách Toàn Bộ API Endpoints](#muc-5-danh-sach-toan-bo-api-endpoints)
  - 5.1 Auth Module (Xác thực & Phân quyền)
  - 5.2 Public Cars (Khách vãng lai xem xe)
  - 5.3 Owner Cars (Chủ xe quản lý xe)
  - 5.4 Rental Module (Khách thuê xe)
  - 5.5 Owner Rental Module (Chủ xe xử lý đơn)
  - 5.6 Payment Module (Thanh toán cọc VietQR 30%)
  - 5.7 Admin Module (Quản trị & Phê duyệt)
  - 5.8 Các API Khác (Chatbot Gemini, Health, Profile)
- [Mục 6: Luồng Chạy Chi Tiết (Flowchart / Sequence Diagram)](#muc-6-luong-chay-chi-tiet-flowchart--sequence-diagrams)
  - 6.1 Luồng 1: Đăng Nhập, Xác Thực & Kiểm Tra Phân Quyền (JWT Filter)
  - 6.2 Luồng 2: Khách Đặt Xe, Chủ Duyệt & Tạo Mã QR Thanh Toán 30%
- [Mục 7: Phân Loại Độ Khó & Khái Niệm Cốt Lõi Cần Nắm](#muc-7-phan-loai-do-kho--khai-niem-cot-loi-can-nam)
  - 7.1 Phân Loại Chức Năng Theo Độ Khó (Dễ - Vừa - Khó)
  - 7.2 26 Khái Niệm & Annotation Cốt Lõi Trong Code
- [Mục 8: Bài Tập Thực Hành, Câu Hỏi Vấn Đáp & Từ Vựng Tiếng Anh](#muc-8-bai-tap-thuc-hanh-cau-hoi-van-dap--tu-vung-tieng-anh)
  - 8.1 3 Bài Tập Sửa Lỗi Thực Tế (Edge Cases)
  - 8.2 5 Câu Hỏi Vấn Đáp Thầy Hay Hỏi Khi Bảo Vệ
  - 8.3 20 Thuật Ngữ Tiếng Anh Chuyên Ngành Trong Code
- [Tóm Tắt Dành Cho Giảng Viên Hướng Dẫn](#tom-tat-cho-thay-huong-dan)

---

## MUC 1: NGHIEP VU & DU LIEU VE SO DO USE CASE

### 1.1 Cac Tac Nhan (Actors)

| STT | Actor | Mo ta | Trang thai tai khoan |
|-----|-------|--------|----------------------|
| 1 | Guest | Nguoi truy cap chua dang nhap | Khong co |
| 2 | Renter (Khach thue) | Da dang ky vai tro thue xe | ACTIVE tu dong |
| 3 | Owner (Chu xe) | Da dang ky vai tro cho thue | PENDING -> ACTIVE can Admin duyet |
| 4 | Admin | Quan tri vien he thong | ACTIVE |
| 5 | Staff | Nhan vien tham dinh quyen nhu Admin | ACTIVE |
| 6 | AI Chatbot | He thong tu van AI Gemini | Tu dong |

### 1.2 Use Cases chi tiet theo Actor

#### GUEST (Khach an danh — khong can dang nhap)
- Xem danh sach xe cong khai — GET /api/v1/public/cars
- Tim kiem / loc xe — GET /api/v1/public/cars/search [extends: Xem ds xe]
- Xem chi tiet xe — GET /api/v1/public/cars/{carId} [extends: Xem ds xe]
- Dang ky Renter — POST /api/v1/auth/register/renter
- Dang ky Owner — POST /api/v1/auth/register/owner
- Dang ky kem giay to — POST /api/v1/auth/register-with-docs (CCCD+GPLX) [extends: Dang ky]
- Dang nhap — POST /api/v1/auth/login
- Dang nhap Google OAuth2 [extends: Dang nhap]
- Quen mat khau — POST /api/v1/auth/forgot-password
- Hoi AI Chatbot — POST /api/v1/chat

#### RENTER (Khach thue xe — yeu cau da dang nhap)
- Tat ca Use Case cua Guest [include]
- Dat thue xe — POST /api/v1/rentals [include: Kiem tra lich trong; include: Kiem tra GPLX]
- Dat thue kem tai xe withDriver=true [extends: Dat thue xe]
- Thue theo gio 4-8h ghi vao note [extends: Dat thue xe]
- Xem lich su don thue — GET /api/v1/rentals/me
- Huy don PENDING — PUT /api/v1/rentals/{id}/cancel
- Thanh toan coc 30% VietQR — POST /api/v1/payments/rentals/{id}/pay-deposit [include: Dat thue]
- Xem QR thanh toan — GET /api/v1/payments/rentals/{id}/qr
- Bao su co khong nhan xe — POST /api/v1/rentals/{id}/report-no-show (upload hinh/video)
- Xem khieu nai — GET /api/v1/rentals/{id}/dispute
- Xem bien ban giao nhan — GET /api/v1/rentals/{id}/inspections
- Danh gia sau chuyen — POST /api/v1/rentals/{id}/reviews [include: Hoan tat chuyen]
- Xem/cap nhat ho so — GET/PUT /api/v1/users/me
- Doi mat khau — PUT /api/v1/auth/change-password
- Doi email — POST /api/v1/auth/change-email/request
- Dang xuat — POST /api/v1/auth/logout

#### OWNER (Chu xe — can Admin duyet truoc)
- Dang xe moi — POST /api/v1/cars (status=PENDING_REVIEW) [include: Tai khoan da duyet]
- Xem xe cua minh — GET /api/v1/cars/my-cars
- Cap nhat xe — PUT /api/v1/cars/{id}
- Doi trang thai xe ACTIVE/INACTIVE — PATCH /api/v1/cars/{id}/status
- An xe — PATCH /api/v1/cars/{id}/deactivate
- Xoa mem xe — DELETE /api/v1/cars/{id}
- Upload anh xe — POST /api/v1/cars/{id}/photos [extends: Dang xe moi]
- Xem lich xe — GET /api/v1/cars/{id}/calendar
- Chan ngay ban — POST /api/v1/cars/{id}/calendar/blocks [extends: Xem lich xe]
- Mo khoa ngay ban — DELETE /api/v1/cars/{id}/calendar/blocks/{blockId}
- Xem yeu cau thue gui den — GET /api/v1/owner/rentals
- Duyet yeu cau thue — PUT /api/v1/owner/rentals/{id}/approve
- Tu choi yeu cau thue — PUT /api/v1/owner/rentals/{id}/reject
- Bat dau chuyen di — PUT /api/v1/owner/rentals/{id}/start
- Hoan tat chuyen di — PUT /api/v1/owner/rentals/{id}/complete
- Lap bien ban Check-in — POST /api/v1/owner/rentals/{id}/check-in [include: Bat dau chuyen]
- Lap bien ban Check-out — POST /api/v1/owner/rentals/{id}/check-out [include: Hoan tat]
- Xem doanh thu — GET /api/v1/users/me/earnings

#### ADMIN / STAFF
- Duyet/Tu choi Owner — PATCH /api/v1/admin/users/{id}/approve-owner
- Duyet/Tu choi CCCD — PUT /api/v1/admin/users/{id}/verify-cccd
- Duyet/Tu choi GPLX — PATCH /api/v1/admin/users/{id}/approve-license
- Khoa/Mo khoa tai khoan — PATCH /api/v1/admin/users/{id}/status
- Xem ds nguoi dung — GET /api/v1/admin/users
- Xem chi tiet nguoi dung — GET /api/v1/admin/users/{id}
- Xem CCCD cho duyet — GET /api/v1/admin/users/pending-cccd
- Xem GPLX cho duyet — GET /api/v1/admin/users/pending-licenses
- Duyet/Tu choi xe — PUT /api/v1/admin/cars/{id}/approve
- Xem ds xe he thong — GET /api/v1/admin/cars
- Xem xe cho duyet — GET /api/v1/admin/cars/pending
- Duyet giay to phap ly xe — PATCH /api/v1/admin/cars/{id}/documents/{docId}/approve
- Xem tat ca don dat xe — GET /api/v1/admin/rentals
- Giai quyet khieu nai — POST /api/v1/admin/rentals/disputes/{id}/resolve
- Xem ds khieu nai — GET /api/v1/admin/rentals/disputes
- Giai ngan cho chu xe — POST /api/v1/admin/rentals/{id}/payout
- Xem thong ke — GET /api/v1/admin/stats

---

## MUC 2: TECH STACK, THU VIEN & HE THONG BEN NGOAI

### 2.1 Moi truong & Ngon ngu

| Thanh phan | Phien ban | Ghi chu |
|-----------|-----------|---------|
| Java | 17 | pom.xml: java.version = 17 |
| Spring Boot | 3.3.4 | spring-boot-starter-parent:3.3.4 |
| Apache Maven | Wrapper | Build tool: mvnw.cmd |

### 2.2 Backend Libraries (tu pom.xml)

| Thu vien | Phien ban | Vai tro | File cau hinh |
|----------|-----------|---------|--------------|
| spring-boot-starter-web | 3.3.4 | REST API / HTTP Server | application.yml |
| spring-boot-starter-data-jpa | 3.3.4 | ORM — anh xa Entity voi Database | application-dev.yml |
| spring-boot-starter-security | 3.3.4 | Xac thuc & Phan quyen | SecurityConfig.java |
| spring-boot-starter-oauth2-client | 3.3.4 | Dang nhap Google OAuth2 | application-dev.yml |
| spring-boot-starter-validation | 3.3.4 | Validate DTO (@Valid @NotBlank) | *Request.java |
| JJWT (jjwt-api/impl/jackson) | 0.12.6 | Tao & xac minh JWT Token | JwtTokenProvider.java |
| Lombok | 1.18.40 | Giam boilerplate (@Getter @Builder) | Toan bo Entity & Service |
| SpringDoc OpenAPI (Swagger) | 2.6.0 | Sinh tai lieu API tu dong | OpenApiConfig.java |
| Cloudinary SDK | 1.36.0 | Upload anh CCCD GPLX anh xe | CloudinaryService.java |
| postgresql | runtime | Driver ket noi PostgreSQL | application-dev.yml |
| h2 | runtime | DB nhung dung cho test | application-h2.yml |
| spring-boot-starter-test | test | JUnit5 Mockito MockMvc | Test classes |
| spring-security-test | test | Test Security layer | Test classes |

### 2.3 Frontend Stack

| Thanh phan | Chi tiet |
|-----------|---------|
| HTML5 | index.html, login.html, admin.html, profile.html, payment.html... |
| Vanilla CSS | css/base.css, components.css, portals.css, home.css |
| Bootstrap 5 | Framework CSS responsive |
| FontAwesome | Icon library |
| Vanilla JavaScript | js/api.js, auth.js, booking.js, owner.js, payment.js, admin.js, chat-ai.js |

### 2.4 He thong ben ngoai (External Services)

| Dich vu | Vai tro | Cau hinh bien moi truong |
|---------|---------|--------------------------|
| PostgreSQL 16 | Database chinh Docker port 5432 | DB_USERNAME, DB_PASSWORD |
| Cloudinary | Luu anh xe CCCD GPLX bien ban | CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET |
| Google OAuth2 | Dang nhap bang Google | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET |
| Google Gemini AI | AI Chatbot tu van chon xe | GEMINI_API_KEY, model: gemini-2.5-flash |
| VietQR | Tao ma QR thanh toan coc 30% | PaymentService.java |
| Adminer | Giao dien quan tri DB Docker port 8088 | docker-compose.yml |

### 2.5 File Cau hinh Quan trong

| File | Duong dan | Noi dung chinh |
|------|-----------|----------------|
| application.yml | backend/src/main/resources/ | Cong 8080, Cloudinary, Gemini, Swagger |
| application-dev.yml | backend/src/main/resources/ | PostgreSQL, Google OAuth2, JWT secret/expiration |
| application-h2.yml | backend/src/main/resources/ | H2 in-memory cho test |
| SecurityConfig.java | backend/.../security/ | Luat truy cap, JWT filter, OAuth2 |
| docker-compose.yml | Spring_ThucTap_k4/ | Khoi chay PostgreSQL + Adminer |
| pom.xml | backend/ | Toan bo dependencies Maven |
| .env | Root | Bien moi truong bao mat (KHONG commit Git) |

---

## MUC 3: CAU TRUC THU MUC & KIEN TRUC PHAN TANG

### 3.1 Cay thu muc du an

```
Spring_ThucTap_k4/
|-- docker-compose.yml        <- Khoi PostgreSQL 5432 + Adminer 8088
|-- AGENTS.md                 <- Quy tac phat trien du an
|-- seed_data.sql             <- Du lieu mau
|-- backend/                  <- TOAN BO BACKEND (Spring Boot 3 + Maven)
|   |-- pom.xml
|   |-- mvnw.cmd
|   +-- src/main/java/com/driveshare/
|       |-- DriveShareApplication.java     <- Diem khoi dong (@SpringBootApplication)
|       |
|       |-- common/           <- Dung chung toan he thong
|       |   |-- dto/          <- ApiResponse<T>, PageResponse<T>
|       |   |-- entity/       <- BaseEntity (created_at, updated_at, deleted_at, soft-delete)
|       |   |-- enums/        <- ERole, ECarStatus, ERentalStatus, EPaymentStatus, EDisputeStatus
|       |   |-- exception/    <- AppException, ErrorCode, GlobalExceptionHandler
|       |   +-- service/      <- CloudinaryService
|       |
|       |-- config/           <- Cau hinh Spring
|       |   |-- SecurityBeanConfig.java    <- Bean PasswordEncoder (BCrypt)
|       |   |-- CorsConfig.java            <- CORS cho Frontend port 3000/5500
|       |   |-- DataInitializer.java       <- Seed du lieu mau khi khoi dong
|       |   |-- JpaAuditingConfig.java     <- Bat @CreatedDate, @LastModifiedDate
|       |   +-- OpenApiConfig.java         <- Swagger UI + BearerAuth
|       |
|       |-- security/         <- Bao mat JWT
|       |   |-- SecurityConfig.java           <- Luat truy cap & Filter chain (QUAN TRONG NHAT)
|       |   |-- JwtTokenProvider.java          <- Tao/Xac minh JWT (JJWT 0.12.6)
|       |   |-- JwtAuthenticationFilter.java   <- Filter doc JWT tu Header (chay truoc Controller)
|       |   |-- JwtAuthenticationEntryPoint.java  <- Tra loi 401 khi chua dang nhap
|       |   |-- JwtAccessDeniedHandler.java    <- Tra loi 403 khi khong du quyen
|       |   |-- CustomUserDetails.java         <- Wrapper User cho Spring Security
|       |   +-- CustomUserDetailsService.java  <- Load user tu DB theo username
|       |
|       +-- modules/          <- CAC MODULE NGHIEP VU
|           |
|           |-- auth/         <- Dang ky, Dang nhap, JWT, Password
|           |   |-- controller/AuthController.java    <- 15 endpoints
|           |   |-- service/AuthService.java          <- 603 dong, logic chinh
|           |   |-- dto/ (LoginRequest, RegisterRequest, AuthResponse, ChangePasswordRequest...)
|           |   |-- entity/ (AuthSession, PasswordResetToken, EmailChangeToken)
|           |   +-- repository/ (UserRepository, AuthSessionRepository...)
|           |
|           |-- user/         <- Ho so nguoi dung
|           |   |-- controller/UserProfileController.java
|           |   |-- entity/ (User, Role, OwnerProfile, RenterProfile)
|           |   +-- repository/
|           |
|           |-- car/          <- Quan ly xe
|           |   |-- controller/CarController.java       <- API xe cua Owner
|           |   |-- controller/PublicCarController.java <- API xe cong khai (khong can dang nhap)
|           |   |-- controller/CarPhotoController.java  <- Upload anh xe
|           |   |-- service/CarService.java + CarCalendarService.java
|           |   |-- entity/ (Car, CarImage, CarDocument, CarCalendarBlock)
|           |   |-- specification/CarSpecification.java <- Loc dong JPA Criteria API
|           |   |-- dto/request/ (CarCreateRequest, CarUpdateRequest, CarSearchRequest...)
|           |   +-- dto/response/ (CarResponse, CarDetailResponse, CarCalendarOverviewResponse...)
|           |
|           |-- rental/       <- Quan ly dat xe (PHUC TAP NHAT)
|           |   |-- controller/RentalController.java        <- API cua Renter
|           |   |-- controller/OwnerRentalController.java   <- API cua Owner quan ly don
|           |   |-- controller/ReviewController.java        <- API danh gia xe
|           |   |-- service/RentalService.java (interface)
|           |   |-- service/OwnerRentalService.java
|           |   |-- service/RentalQueryService.java
|           |   |-- service/RentalInspectionService.java
|           |   |-- service/RentalDisputeService.java
|           |   |-- service/ReviewService.java
|           |   |-- service/impl/RentalServiceImpl.java     <- 199 dong, logic dat xe
|           |   |-- service/impl/OwnerRentalServiceImpl.java
|           |   |-- entity/ (Rental, RentalInspection, RentalDispute, Review)
|           |   |-- scheduler/RentalExpirationScheduler.java <- @Scheduled tu huy WAITING_PAYMENT
|           |   +-- repository/
|           |
|           |-- payment/      <- Thanh toan VietQR
|           |   |-- controller/PaymentController.java
|           |   |-- service/PaymentService.java
|           |   |-- entity/Payment.java
|           |   +-- util/
|           |
|           |-- admin/        <- Quan tri he thong
|           |   |-- controller/AdminUserController.java   <- 173 dong
|           |   |-- controller/AdminCarController.java    <- 173 dong
|           |   |-- controller/AdminRentalController.java <- 186 dong
|           |   |-- controller/AdminStatsController.java
|           |   +-- service/ (AdminUserService, AdminCarService)
|           |
|           |-- ai/           <- AI Chatbot Gemini
|           |   |-- controller/ChatController.java
|           |   |-- service/AiChatService.java
|           |   +-- entity/ChatMemoryEntity.java
|           |
|           |-- oauth2/       <- Dang nhap Google
|           |   |-- controller/OAuth2Controller.java
|           |   |-- service/GoogleOAuth2Service.java
|           |   +-- handler/OAuth2SuccessHandler.java
|           |
|           |-- notification/ <- Module thong bao (in progress)
|           +-- health/       <- Health check: GET /api/v1/health
|
|-- frontend/                 <- GIAO DIEN WEB (Vanilla HTML/CSS/JS)
|   |-- index.html            <- Trang chu tim kiem xe (41KB)
|   |-- login.html            <- Dang nhap / Dang ky (48KB)
|   |-- profile.html          <- Ho so ca nhan (24KB)
|   |-- admin.html            <- Trang quan tri (13KB)
|   |-- admin-revenue.html    <- Thong ke doanh thu
|   |-- owner-cars.html       <- Quan ly xe cua Owner
|   |-- owner-earnings.html   <- Thu nhap cua Owner
|   |-- payment.html          <- Trang thanh toan
|   |-- css/ (base, components, portals, home)
|   +-- js/ (api, auth, booking, owner, payment, admin, chat-ai)
|
+-- docs/                     <- Tai lieu dac ta
```

### 3.2 Kien truc Phan Tang & Luong Du lieu

```
[Frontend HTML/JS]
      |  HTTP Request (JSON Body + JWT Bearer Token trong Header)
      v
[Controller Layer]     @RestController @RequestMapping
      |  Nhan request, validate @Valid, goi Service, tra ResponseEntity<ApiResponse<T>>
      |  KHONG chua logic nghiep vu
      v
[Service Layer]        @Service @Transactional
      |  Chua TOAN BO logic nghiep vu
      |  Kiem tra dieu kien (so luong don, lich xe, quyen so huu...)
      |  Tinh toan (tien thue, tien coc, phi tai xe...)
      v
[Repository Layer]     extends JpaRepository<Entity, Long>
      |  Truy van DB bang JPQL hoac Spring Data method naming
      |  Vi du: findByCarIdAndStatus(), hasDateConflict()
      v
[Database - PostgreSQL] (Docker, port 5432)
      
[Entity Layer]         @Entity @Table @Column
      |  Anh xa 1-1 voi bang trong DB
      |  Dung @OneToMany @ManyToOne @OneToOne cho quan he
      
[DTO Layer]            Class co @NotBlank @Email @Min...
      |  Request DTO: du lieu nhan vao tu client
      |  Response DTO: du lieu tra ve cho client
      
[Exception Layer]      @RestControllerAdvice
      |  GlobalExceptionHandler bat moi AppException
      |  Tra format chuan: ApiResponse{code, success, message, data}
```

**Bang tom tat Annotations quan trong nhat:**

| Annotation | Tang | Y nghia |
|------------|------|---------|
| @Entity + @Table | Entity | Danh dau class la bang DB |
| @Id + @GeneratedValue | Entity | Khoa chinh tu tang |
| @Column | Entity | Dinh nghia cot DB (ten, null, unique) |
| @ManyToOne @OneToMany | Entity | Quan he N-1 va 1-N |
| @OneToOne | Entity | Quan he 1-1 (User-OwnerProfile) |
| @MappedSuperclass | Entity | Lop cha chua fields dung chung |
| @Enumerated(STRING) | Entity | Luu enum dang String trong DB |
| @RestController | Controller | Class tra JSON response |
| @RequestMapping | Controller | Dinh nghia URL goc cua Controller |
| @PreAuthorize | Controller | Kiem tra quyen truoc khi vao ham |
| @Valid + @RequestBody | Controller | Nhan va validate JSON body |
| @Service | Service | Danh dau class la Spring Service bean |
| @Transactional | Service | Boc trong transaction DB, rollback khi loi |
| @RequiredArgsConstructor | Ca | Lombok tao constructor inject final fields |
| @Builder @Getter @Setter | Ca | Lombok tao Builder pattern va getters/setters |
| @Configuration @Bean | Config | Dinh nghia Spring beans |
| @RestControllerAdvice | Exception | Bat loi toan cuc tu tat ca Controller |
| @Scheduled | Scheduler | Cron job tu dong chay dinh ky |

---

## MUC 4: CO SO DU LIEU — SCHEMA 18 BANG

### Bang 1: users
**PK:** user_id (BIGINT AUTO_INCREMENT)

| Cot | Kieu DB | Rang buoc | Mo ta |
|-----|---------|-----------|-------|
| user_id | BIGINT | PK | Khoa chinh |
| username | VARCHAR(50) | UNIQUE NOT NULL | Ten dang nhap |
| email | VARCHAR(150) | UNIQUE NOT NULL | Email |
| phone | VARCHAR(20) | UNIQUE | So dien thoai |
| password_hash | VARCHAR(255) | NOT NULL | Mat khau BCrypt |
| full_name | VARCHAR(150) | | Ho ten |
| avatar_url | VARCHAR(500) | | Anh dai dien Cloudinary |
| address | VARCHAR(255) | | Dia chi |
| id_card_number | VARCHAR(20) | UNIQUE | So CCCD |
| status | VARCHAR(20) | | PENDING / ACTIVE / LOCKED |
| failed_login_attempts | INT | default=0 | So lan dang nhap sai |
| locked_until | TIMESTAMP | | Bi khoa den luc nay |
| token_version | BIGINT | default=0 | Version JWT, tang khi doi mat khau |
| google_id | VARCHAR(255) | UNIQUE | Google OAuth2 ID |
| auth_provider | VARCHAR(20) | NOT NULL | LOCAL / GOOGLE |
| created_at | TIMESTAMP | auto | Thua ke BaseEntity |
| updated_at | TIMESTAMP | auto | Thua ke BaseEntity |
| deleted_at | TIMESTAMP | null=chua xoa | Soft-delete |

Quan he: users --1-N--> cars | users --1-N--> rentals | users --1-1--> owner_profiles | users --1-1--> renter_profiles | users --N-N--> roles (qua user_roles)

---

### Bang 2: roles
**PK:** role_id (BIGINT)

| Cot | Kieu | Rang buoc | Mo ta |
|-----|------|-----------|-------|
| role_id | BIGINT | PK | |
| role_name | VARCHAR(30) | UNIQUE | ROLE_ADMIN / ROLE_OWNER / ROLE_RENTER / ROLE_STAFF |

---

### Bang 3: user_roles (Trung gian N-N)
| Cot | Kieu | Rang buoc |
|-----|------|-----------|
| user_id | BIGINT | FK -> users |
| role_id | BIGINT | FK -> roles |

---

### Bang 4: owner_profiles
**PK+FK:** user_id -> users (Quan he 1-1)

| Cot | Kieu | Mo ta |
|-----|------|-------|
| id_card_front_url | VARCHAR(500) | Anh mat truoc CCCD |
| id_card_back_url | VARCHAR(500) | Anh mat sau CCCD |
| bank_account_number | VARCHAR(50) | So tai khoan ngan hang |
| bank_name | VARCHAR(100) | Ten ngan hang |
| verification_status | VARCHAR(20) | PENDING / VERIFIED / REJECTED |
| verified_by | BIGINT FK->users | Admin da duyet |
| verified_at | TIMESTAMP | Thoi diem Admin duyet |

---

### Bang 5: renter_profiles
**PK+FK:** user_id -> users (Quan he 1-1)

| Cot | Kieu | Mo ta |
|-----|------|-------|
| id_card_front_url | VARCHAR(500) | Anh mat truoc CCCD |
| id_card_back_url | VARCHAR(500) | Anh mat sau CCCD |
| license_number | VARCHAR(50) | So giay phep lai xe |
| license_front_url | VARCHAR(500) | Anh GPLX |
| verification_status | VARCHAR(20) | PENDING/VERIFIED/REJECTED (CCCD) |
| license_verification_status | VARCHAR(20) | PENDING/VERIFIED/REJECTED (GPLX) |

---

### Bang 6: cars
**PK:** car_id (BIGINT) | **FK:** owner_id -> users

| Cot | Kieu DB | Rang buoc | Mo ta |
|-----|---------|-----------|-------|
| plate_number | VARCHAR(20) | UNIQUE NOT NULL | Bien so xe |
| brand | VARCHAR(100) | NOT NULL | Hang xe Toyota Honda... |
| model | VARCHAR(100) | NOT NULL | Model Camry City... |
| year | INT | NOT NULL | Nam san xuat |
| color | VARCHAR(50) | | Mau xe |
| seats | INT | NOT NULL | So cho ngoi |
| transmission | VARCHAR(20) | | MANUAL / AUTOMATIC |
| fuel_type | VARCHAR(20) | | GASOLINE / DIESEL / ELECTRIC |
| price_per_day | DECIMAL(15,2) | NOT NULL | Gia thue/ngay |
| address | VARCHAR(500) | | Dia chi xe |
| province | VARCHAR(100) | | Tinh/Thanh pho |
| latitude / longitude | DECIMAL(10,7) | | Toa do GPS |
| description | TEXT | | Mo ta xe |
| features | TEXT | | Tien nghi GPS Bluetooth CSV/JSON |
| thumbnail_url | VARCHAR(500) | | Anh bia xe |
| has_driver_service | BOOLEAN | default=false | Co dich vu tai xe |
| driver_fee_per_day | DECIMAL(12,2) | default=0 | Phi tai xe/ngay |
| rating | DECIMAL(3,2) | default=5.00 | Diem danh gia trung binh |
| rating_count | INT | default=0 | So luot danh gia |
| status | VARCHAR(20) | NOT NULL | PENDING_REVIEW / ACTIVE / INACTIVE / REJECTED |
| rejection_reason | TEXT | | Ly do Admin tu choi |
| approved_at | TIMESTAMP | | Luc Admin duyet xe |
| approved_by | BIGINT FK->users | | Admin da duyet xe |

*Indexes: idx_cars_owner_id, idx_cars_plate_number, idx_cars_status*

---

### Bang 7: car_images
| Cot | Kieu | Rang buoc | Mo ta |
|-----|------|-----------|-------|
| image_id | BIGINT | PK | |
| car_id | BIGINT | FK -> cars | |
| image_url | VARCHAR(500) | NOT NULL | Cloudinary URL |
| is_thumbnail | BOOLEAN | | La anh bia chinh |

---

### Bang 8: car_documents
| Cot | Kieu | Mo ta |
|-----|------|-------|
| document_id | BIGINT PK | |
| car_id | BIGINT FK->cars | |
| document_type | VARCHAR(30) | REGISTRATION / INSPECTION / INSURANCE |
| document_url | VARCHAR(500) | Cloudinary URL |
| verification_status | VARCHAR(20) | PENDING / VERIFIED / REJECTED |

---

### Bang 9: car_calendar_blocks
| Cot | Kieu | Mo ta |
|-----|------|-------|
| block_id | BIGINT PK | |
| car_id | BIGINT FK->cars | |
| start_date | DATE NOT NULL | Ngay bat dau chan |
| end_date | DATE NOT NULL | Ngay ket thuc chan |
| reason | VARCHAR(500) | Ly do bao duong viec rieng |

---

### Bang 10: rentals — BANG TRUNG TAM QUAN TRONG NHAT
**PK:** rental_id | **FK:** car_id->cars, renter_id->users

| Cot | Kieu | Rang buoc | Mo ta |
|-----|------|-----------|-------|
| start_date | DATE | NOT NULL | Ngay bat dau thue |
| end_date | DATE | NOT NULL | Ngay ket thuc thue |
| total_days | INT | default=1 | Tong so ngay |
| price_per_day | DECIMAL(12,2) | NOT NULL | Gia/ngay tai thoi diem dat |
| total_price | DECIMAL(12,2) | NOT NULL | Tong tien thue + tai xe |
| deposit_amount | DECIMAL(12,2) | NOT NULL | Tien coc 30% tong tien |
| status | VARCHAR(30) | NOT NULL | Xem bang trang thai duoi |
| payment_expires_at | TIMESTAMP | | Han TT coc 45 phut sau khi Owner duyet |
| reject_reason | VARCHAR(500) | | Ly do tu choi |
| note | VARCHAR(500) | | Ghi chu cua khach |
| with_driver | BOOLEAN | default=false | Co tai xe di kem |
| driver_fee | DECIMAL(12,2) | default=0 | Tong phi tai xe |

**Luong trang thai (State Machine) cua Rental:**
```
PENDING_APPROVAL
    |-- [Owner duyet] --> WAITING_PAYMENT (bat dau dem 45 phut)
    |-- [Owner tu choi] --> REJECTED
    +-- [Khach huy] --> CANCELLED

WAITING_PAYMENT
    |-- [Khach thanh toan coc] --> CONFIRMED
    |-- [Het 45 phut] --> CANCELLED (RentalExpirationScheduler tu dong huy)
    +-- [Khach huy] --> CANCELLED

CONFIRMED
    +-- [Owner bat dau ban giao xe] --> IN_PROGRESS

IN_PROGRESS
    +-- [Owner hoan tat nhan lai xe] --> COMPLETED

COMPLETED (Trang thai cuoi cung)
```

---

### Bang 11: payments
| Cot | Kieu | Mo ta |
|-----|------|-------|
| payment_id | BIGINT PK | |
| rental_id | BIGINT FK->rentals | |
| amount | DECIMAL(12,2) NOT NULL | So tien |
| payment_type | VARCHAR(30) default=DEPOSIT | DEPOSIT / FULL_PAYMENT |
| payment_method | VARCHAR(30) default=VIETQR | Phuong thuc thanh toan |
| status | VARCHAR(30) NOT NULL | PENDING / COMPLETED / FAILED |
| transaction_code | VARCHAR(100) UNIQUE | Ma giao dich |
| qr_code_url | VARCHAR(500) | URL anh ma QR |
| paid_at | TIMESTAMP | Thoi diem thanh toan thanh cong |

---

### Bang 12: rental_inspections (Bien ban giao nhan xe)
| Cot | Kieu | Mo ta |
|-----|------|-------|
| inspection_id | BIGINT PK | |
| rental_id | BIGINT FK->rentals | |
| inspection_type | VARCHAR(30) | CHECK_IN / CHECK_OUT |
| odometer | INT | So km dong ho |
| fuel_level | VARCHAR(20) | E / 1/4 / 1/2 / 3/4 / F |
| inspector_id | BIGINT FK->users | Nguoi lap bien ban (Owner) |
| photo_urls | TEXT | Danh sach anh hien trang xe |
| note | TEXT | Ghi chu bien ban |

---

### Bang 13: rental_disputes (Khieu nai tranh chap)
| Cot | Kieu | Mo ta |
|-----|------|-------|
| id | BIGINT PK | |
| rental_id | BIGINT FK->rentals | Don thue bi khieu nai |
| reporter_id | BIGINT FK->users | Nguoi bao cao (Renter) |
| reason | TEXT NOT NULL | Ly do khieu nai |
| proof_urls | TEXT | Anh/video bang chung Cloudinary |
| status | VARCHAR(30) | PENDING / RESOLVED / REJECTED |
| refund_amount | DECIMAL(12,2) default=0 | Tien hoan lai cho khach |
| penalty_amount | DECIMAL(12,2) default=0 | Tien phat chu xe |
| admin_note | TEXT | Ghi chu Admin khi giai quyet |
| resolved_by | BIGINT FK->users | Admin giai quyet |
| resolved_at | TIMESTAMP | Thoi gian giai quyet |

---

### Bang 14: reviews (Danh gia xe)
| Cot | Kieu | Mo ta |
|-----|------|-------|
| review_id | BIGINT PK | |
| rental_id | BIGINT FK->rentals UNIQUE | 1 chuyen chi 1 danh gia |
| car_id | BIGINT FK->cars | Xe duoc danh gia |
| renter_id | BIGINT FK->users | Nguoi danh gia |
| rating | INT NOT NULL | 1-5 sao |
| comment | TEXT | Noi dung nhan xet |
| created_at | TIMESTAMP | |

---

### Bang 15: auth_sessions (Phien dang nhap JWT)
| Cot | Kieu | Mo ta |
|-----|------|-------|
| id | BIGINT PK | |
| jti | VARCHAR UNIQUE | JWT Token ID — dung de thu hoi token |
| user_id | BIGINT FK->users | |
| token_version | BIGINT | Bat dong bo = vo hieu |
| expires_at | TIMESTAMP | Thoi han token |
| revoked_at | TIMESTAMP | null=con hieu luc / khac null = bi thu hoi (logout) |

---

### Bang 16: password_reset_tokens
| Cot | Kieu | Mo ta |
|-----|------|-------|
| id | BIGINT PK | |
| user_id | BIGINT FK->users | |
| token_hash | VARCHAR UNIQUE | SHA-256 hash cua token thuc |
| expires_at | TIMESTAMP | Hieu luc 30 phut |
| used_at | TIMESTAMP | Thoi diem da dung |

### Bang 17: email_change_tokens
Tuong tu password_reset_tokens + them cot new_email | Hieu luc 15 phut

### Bang 18: chat_memory (Lich su chat AI)
| Cot | Kieu | Mo ta |
|-----|------|-------|
| id | BIGINT PK | |
| session_id | VARCHAR | ID phien chat |
| role | VARCHAR | user / model |
| content | TEXT | Noi dung tin nhan |
| created_at | TIMESTAMP | |

---

### So do Moi Quan He (de tu ve ERD)

```
users    (1) ------- (N) cars             [1 Owner co nhieu xe]
users    (1) ------- (N) rentals          [1 User thue nhieu don]
cars     (1) ------- (N) rentals          [1 Xe co nhieu don thue]
users    (1) ------- (1) owner_profiles   [1-1, user_id la PK va FK]
users    (1) ------- (1) renter_profiles  [1-1, user_id la PK va FK]
users    (N) -user_roles- (N) roles       [N-N qua bang trung gian]
cars     (1) ------- (N) car_images       [1 Xe co nhieu anh]
cars     (1) ------- (N) car_documents    [1 Xe co nhieu giay to]
cars     (1) ------- (N) car_calendar_blocks [1 Xe co nhieu khoang chan lich]
rentals  (1) ------- (N) payments         [1 Don co nhieu giao dich TT]
rentals  (1) ------- (N) rental_inspections [1 Don co bien ban check-in & check-out]
rentals  (1) ------- (1) rental_disputes  [1 Don co toi da 1 khieu nai]
rentals  (1) ------- (1) reviews          [1 Don co toi da 1 danh gia]
```

---

## MUC 5: DANH SACH TOAN BO API (ENDPOINTS)

### 5.1 Auth APIs — /api/v1/auth

| Chuc nang | Method | Endpoint | DTO In/Out | Quyen |
|-----------|--------|----------|-----------|-------|
| Dang nhap | POST | /login | LoginRequest / AuthResponse | Public |
| Dang ky Renter | POST | /register/renter | RegisterRequest / Map | Public |
| Dang ky Owner | POST | /register/owner | RegisterRequest / Map | Public |
| Dang ky chung | POST | /register | RegisterRequest / Map | Public |
| Dang ky kem giay to | POST | /register-with-docs | RegisterRequest + MultipartFile / Map | Public |
| Lam moi token | POST | /refresh-token | RefreshTokenRequest / AuthResponse | Public |
| Dang xuat | POST | /logout | Bearer Header / Void | Public |
| Doi mat khau | PUT | /change-password | ChangePasswordRequest / Void | Authenticated |
| Yeu cau doi email | POST | /change-email/request | ChangeEmailRequest / Void | Authenticated |
| Xac nhan doi email | GET | /change-email/confirm | ?token / Void | Public |
| Quen mat khau | POST | /forgot-password | ForgotPasswordRequest / Map | Public |
| Dat lai mat khau | POST | /reset-password | ResetPasswordRequest / Void | Public |
| Thong tin user hien tai | GET | /me | — / Map | Authenticated |
| Owner cho duyet | GET | /pending-owners | — / List<Map> | ADMIN |
| Duyet Owner | POST | /approve-owner/{userId} | — / Map | ADMIN |

### 5.2 Public Car APIs — /api/v1/public/cars

| Chuc nang | Method | Endpoint | DTO In/Out | Quyen |
|-----------|--------|----------|-----------|-------|
| Danh sach xe | GET | / | ?page&size / PageResponse<CarResponse> | Public |
| Tim kiem loc xe | GET | /search | CarSearchRequest (query params) / PageResponse | Public |
| Chi tiet xe | GET | /{carId} | — / CarDetailResponse | Public |

### 5.3 Owner Car APIs — /api/v1/cars

| Chuc nang | Method | Endpoint | DTO In/Out | Quyen |
|-----------|--------|----------|-----------|-------|
| Dang xe moi | POST | / | CarCreateRequest / CarResponse | OWNER |
| Xem xe cua toi | GET | /my-cars | ?status&page&size / PageResponse | OWNER |
| Cap nhat xe | PUT | /{id} | CarUpdateRequest / CarResponse | OWNER |
| Doi trang thai xe | PATCH | /{id}/status | CarStatusUpdateRequest / CarResponse | OWNER |
| An xe | PATCH | /{id}/deactivate | — / CarResponse | OWNER |
| Xoa xe | DELETE | /{id} | — / Void | OWNER |
| Xem lich xe | GET | /{id}/calendar | ?fromDate / CarCalendarOverviewResponse | OWNER |
| Chan ngay ban | POST | /{id}/calendar/blocks | CalendarBlockCreateRequest / Response | OWNER |
| Mo khoa ngay | DELETE | /{id}/calendar/blocks/{blockId} | — / Void | OWNER |
| Upload anh xe | POST | /{id}/photos | MultipartFile / — | OWNER |

### 5.4 Rental APIs — /api/v1/rentals

| Chuc nang | Method | Endpoint | DTO In/Out | Quyen |
|-----------|--------|----------|-----------|-------|
| Gui yeu cau thue xe | POST | / | CreateRentalRequest / RentalResponse | Auth |
| Xem don thue cua toi | GET | /me | — / List<RentalSummaryResponse> | RENTER |
| Huy don thue | PUT | /{id}/cancel | — / RentalSummaryResponse | RENTER |
| Xem bien ban giao nhan | GET | /{id}/inspections | — / List<RentalInspectionResponse> | Auth |
| Bao su co no-show | POST | /{id}/report-no-show | MultipartFile + reason / RentalDisputeResponse | Auth |
| Xem khieu nai | GET | /{id}/dispute | — / RentalDisputeResponse | Auth |
| Danh gia xe | POST | /{id}/reviews | CreateReviewRequest / ReviewResponse | RENTER |
| Xem danh gia | GET | /{id}/reviews | — / List<ReviewResponse> | Public |

### 5.5 Owner Rental APIs — /api/v1/owner/rentals

| Chuc nang | Method | Endpoint | DTO In/Out | Quyen |
|-----------|--------|----------|-----------|-------|
| Xem yeu cau gui den | GET | / | ?status / List<RentalSummaryResponse> | OWNER |
| Duyet yeu cau | PUT | /{id}/approve | — / RentalSummaryResponse | OWNER |
| Tu choi yeu cau | PUT | /{id}/reject | RejectRentalRequest / RentalSummaryResponse | OWNER |
| Bat dau chuyen di | PUT | /{id}/start | — / RentalSummaryResponse | OWNER |
| Hoan tat chuyen di | PUT | /{id}/complete | — / RentalSummaryResponse | OWNER |
| Lap bien ban Check-in | POST | /{id}/check-in | CheckInRequest / RentalInspectionResponse | OWNER |
| Lap bien ban Check-out | POST | /{id}/check-out | CheckOutRequest / RentalInspectionResponse | OWNER |
| Xem bien ban cua minh | GET | /{id}/inspections | — / List<RentalInspectionResponse> | OWNER |

### 5.6 Payment APIs — /api/v1/payments

| Chuc nang | Method | Endpoint | Quyen |
|-----------|--------|----------|-------|
| Lay QR thanh toan coc | GET | /rentals/{id}/qr | Auth |
| Xac nhan thanh toan | POST | /rentals/{id}/pay-deposit | Auth |
| Lich su thanh toan | GET | /rentals/{id} | Auth |

### 5.7 Admin APIs — /api/v1/admin

| Chuc nang | Method | Endpoint | Quyen |
|-----------|--------|----------|-------|
| DS nguoi dung | GET | /users | ADMIN/STAFF |
| Chi tiet nguoi dung | GET | /users/{id} | ADMIN/STAFF |
| CCCD cho duyet | GET | /users/pending-cccd | ADMIN/STAFF |
| GPLX cho duyet | GET | /users/pending-licenses | ADMIN/STAFF |
| Duyet/Tu choi CCCD | PUT | /users/{id}/verify-cccd | ADMIN/STAFF |
| Duyet Owner | PATCH | /users/{id}/approve-owner | ADMIN/STAFF |
| Duyet GPLX | PATCH | /users/{id}/approve-license | ADMIN/STAFF |
| Khoa/Mo tai khoan | PATCH | /users/{id}/status | ADMIN/STAFF |
| DS xe he thong | GET | /cars | ADMIN/STAFF |
| Xe cho duyet | GET | /cars/pending | ADMIN/STAFF |
| Duyet/Tu choi xe | PUT | /cars/{id}/approve | ADMIN/STAFF |
| Duyet giay to xe | PATCH | /cars/{id}/documents/{docId}/approve | ADMIN/STAFF |
| Tat ca don thue | GET | /rentals | ADMIN/STAFF |
| Giai ngan chu xe | POST | /rentals/{id}/payout | ADMIN/STAFF |
| DS khieu nai | GET | /rentals/disputes | ADMIN/STAFF |
| Giai quyet khieu nai | POST | /rentals/disputes/{id}/resolve | ADMIN/STAFF |

### 5.8 Cac API khac

| Chuc nang | Method | Endpoint | Quyen |
|-----------|--------|----------|-------|
| AI Chatbot | POST | /api/v1/chat | Public |
| Health Check | GET | /api/v1/health | Public |
| Swagger UI | GET | /swagger-ui.html | Public |
| OAuth2 Google | GET | /api/v1/oauth2/... | Public |
| User Profile | GET/PUT | /api/v1/users/me | Auth |

---

## MUC 6: LUONG CHAY CHI TIET (FLOWCHART / SEQUENCE DIAGRAM)

### 6.1 Luong 1: DANG NHAP, XAC THUC & KIEM TRA PHAN QUYEN

```
[Browser - login.html]
     |
     | 1. User nhap email/username + password
     | 2. JS goi: POST /api/v1/auth/login
     |    Body: { identifier: "email_hoac_username", password: "matkhau" }
     v
[JwtAuthenticationFilter]   <- Filter chay TRUOC Controller
     | 3. Doc Header "Authorization: Bearer <token>"
     |    (voi /login thi khong co token -> filter bo qua, di tiep)
     v
[SecurityConfig - SecurityFilterChain]
     | 4. Kiem tra URL: /api/v1/auth/login -> .permitAll() -> OK di tiep
     v
[AuthController.login()]
     | 5. @Valid validate LoginRequest
     | 6. Lay IP: clientKey tu X-Forwarded-For header
     v
[AuthService.login(request, clientKey)]
     | 7. KIEM TRA RATE LIMIT:
     |    ipFailures.computeIfAbsent(key) dem so lan that bai
     |    -> Neu that bai >= 5 lan trong 15 phut -> throw RATE_LIMITED (HTTP 429)
     |
     | 8. userRepository.findByUsernameOrEmail(identifier, identifier)
     |    -> Khong tim thay -> recordFailure() -> throw AUTH_FAILED (HTTP 401)
     |
     | 9. passwordEncoder.matches(rawPassword, user.passwordHash)
     |    -> Sai mat khau -> recordFailure() -> throw AUTH_FAILED (HTTP 401)
     |
     | 10. Kiem tra user.lockedUntil != null && isAfter(now)
     |     -> Dang bi khoa -> throw ACCOUNT_LOCKED (HTTP 403)
     |
     | 11. Kiem tra user.status == PENDING
     |     -> Chua duoc Admin duyet -> throw ACCOUNT_PENDING (HTTP 403)
     |
     | 12. Dat lai: failedLoginAttempts = 0, lockedUntil = null
     v
[JwtTokenProvider]
     | 13. generateAccessToken(userDetails):
     |     - Claims: userId, username, roles, jti (UUID random), tokenVersion
     |     - Ky bang HS256 voi JWT_SECRET
     |     - Het han: 24 gio
     |
     | 14. generateRefreshToken(userDetails):
     |     - Het han: 7 ngay
     v
[AuthSessionRepository]
     | 15. sessionRepository.save(AuthSession {
     |       jti, userId, tokenVersion, expiresAt
     |     })
     |     -> Luu session vao DB de co the revoke sau nay
     v
[AuthController - tra ve response]
     | 16. return 200 OK + AuthResponse {
     |       accessToken, refreshToken,
     |       userId, username, role, roles
     |     }
     v
[Browser - JS auth.js]
     | 17. localStorage.setItem("accessToken", data.accessToken)
     | 18. Dua vao role -> dieu huong den trang phu hop:
     |     ROLE_ADMIN -> admin.html
     |     ROLE_OWNER -> owner-cars.html
     |     ROLE_RENTER -> index.html

=== KHI GOI API CO PHAN QUYEN (sau khi dang nhap) ===

[Browser]
     | 1. Dinh kem Header: "Authorization: Bearer <accessToken>"
     v
[JwtAuthenticationFilter.doFilterInternal()]
     | 2. getJwtFromRequest(): tach token tu "Bearer ..."
     | 3. tokenProvider.validateToken(jwt):
     |    - Kiem tra chu ky voi JWT_SECRET
     |    - Kiem tra het han (expiration)
     |
     | 4. Lay jti + tokenVersion tu JWT claims
     | 5. sessionRepository.findByJti(jti):
     |    - session.revokedAt != null -> bo qua (token bi revoke khi logout)
     |    - session.tokenVersion != jwt.tokenVersion -> bo qua (doi mat khau)
     |
     | 6. userDetailsService.loadUserByUsername() -> load User + Roles tu DB
     | 7. SecurityContextHolder.setAuthentication(token)
     v
[SecurityConfig - authorizeHttpRequests]
     | 8. Kiem tra URL pattern:
     |    /api/v1/admin/** -> hasAnyRole("ADMIN", "STAFF")
     |    /api/v1/owner/** -> hasRole("OWNER")
     |    Method-level -> @PreAuthorize("hasRole('RENTER')")
     v
[Controller]
     | 9. authentication.getPrincipal() -> CustomUserDetails
     |    CustomUserDetails.getUserId() -> lay userId hien tai
     | 10. Xu ly logic nghiep vu...
```

---

### 6.2 Luong 2: DAT LICH THUE XE — TINH TIEN & KIEM TRA TRUNG LICH

```
[Browser - index.html]
     |
     | 1. Khach thue chon xe, chon ngay bat dau/ket thuc, bam "Dat xe"
     | 2. JS goi: POST /api/v1/rentals
     |    Body: { carId, startDate, endDate, note?, withDriver? }
     |    Header: "Authorization: Bearer <accessToken>"
     v
[JwtAuthenticationFilter] -> Xac thuc JWT (xem Luong 1 buoc 2-7)
     v
[RentalController.createRental()]
     | 3. @Valid validate CreateRentalRequest
     | 4. goi rentalService.createRentalRequest(request)
     v
[RentalServiceImpl.createRentalRequest()]
     | 5. Lay renterId tu SecurityContext:
     |    SecurityContextHolder.getContext().getAuthentication()
     |    .getPrincipal() -> CustomUserDetails.getUserId()
     |
     | === KIEM TRA 1: GIOI HAN DON PENDING ===
     | 6. count = countByRenterIdAndStatus(renterId, PENDING_APPROVAL)
     |         + countByRenterIdAndStatus(renterId, PENDING)
     |    -> count >= 3 -> throw MAX_PENDING_RENTALS_EXCEEDED (HTTP 400)
     |
     | === KIEM TRA 2: VALIDATE NGAY THUE ===
     | 7. startDate == null || endDate == null -> throw INVALID_REQUEST
     | 8. Neu note chua "thue theo gio":
     |      startDate >= homNay -> OK
     |    Neu thue theo ngay:
     |      startDate >= ngayMai -> OK (khong cho thue ngay hom nay)
     |    -> Vi pham -> throw INVALID_RENTAL_DATES
     | 9. endDate < startDate -> throw INVALID_RENTAL_DATES
     |
     | === KIEM TRA 3: GPLX CUA KHACH ===
     | 10. Neu withDriver == false (khach tu lai):
     |     renterProfile = renterProfileRepo.findById(renterId)
     |     -> licenseVerificationStatus == REJECTED -> throw KYC_NOT_VERIFIED (403)
     |
     | === KIEM TRA 4: XE TON TAI & ACTIVE ===
     | 11. car = carRepository.findByCarIdAndDeletedAtIsNull(carId)
     |     -> Khong tim thay -> throw CAR_NOT_FOUND (404)
     | 12. car.status != ACTIVE -> throw CAR_NOT_FOUND (404)
     | 13. car.ownerId == renterId -> throw INVALID_REQUEST ("khong tu thue xe minh")
     | 14. withDriver == true && car.hasDriverService == false -> throw INVALID_REQUEST
     |
     | === KIEM TRA 5: TRUNG LICH XE ===
     | 15. rentalRepository.hasDateConflict(carId, startDate, endDate,
     |         [WAITING_PAYMENT, APPROVED, CONFIRMED, IN_PROGRESS])
     |
     |     JPQL: SELECT COUNT(r) > 0 FROM Rental r
     |           WHERE r.carId = :carId
     |           AND r.status IN :statuses
     |           AND r.startDate <= :endDate
     |           AND r.endDate >= :startDate
     |
     |     -> Co xung dot -> throw CAR_ALREADY_RENTED (409 Conflict)
     |
     | === KIEM TRA 6: TRUNG YEU CAU CUA CUNG KHACH ===
     | 16. hasActiveOrPendingRentalForUserAndCar(carId, renterId, startDate, endDate,
     |         [PENDING, PENDING_APPROVAL])
     |     -> Da co don trung -> throw DUPLICATE_RENTAL_REQUEST (409)
     |
     | === TINH TIEN ===
     | 17. daysBetween = ChronoUnit.DAYS.between(startDate, endDate)
     |     totalDays = max(1, daysBetween)
     |
     | 18. Neu note chua "Thue theo gio":
     |     - Trich xuat so gio bang regex: (\d+)\s*(?:gio|h)
     |     - Gioi han: 4h <= hours <= 8h
     |     - hourlyRate = pricePerDay / 10
     |     - carRentalPrice = hourlyRate x hours
     |     Neu thue theo ngay:
     |     - carRentalPrice = pricePerDay x totalDays
     |
     | 19. Neu withDriver == true:
     |     driverFee = car.driverFeePerDay x totalDays
     |     Neu khong: driverFee = 0
     |
     | 20. totalPrice = carRentalPrice + driverFee
     | 21. depositAmount = totalPrice x 0.30   <- Tien coc 30%
     |
     | === LUU VAO DATABASE ===
     | 22. rental = Rental.builder()
     |         .carId(carId).renterId(renterId)
     |         .startDate().endDate().totalDays()
     |         .pricePerDay().totalPrice().depositAmount()
     |         .status(PENDING_APPROVAL)   <- Trang thai ban dau
     |         .note().withDriver().driverFee()
     |         .build()
     | 23. rentalRepository.save(rental) -> INSERT INTO rentals ...
     v
[RentalController - tra ve response]
     | 24. return 200 OK + RentalResponse {
     |       rentalId, status="PENDING_APPROVAL",
     |       totalPrice, depositAmount,
     |       startDate, endDate, ...
     |     }
     v
[Browser]
     | 25. Hien thi thong tin don thue vua tao
     | 26. Dieu huong den trang thanh toan coc
```

---

## MUC 7: PHAN LOAI DO KHO & KE HOACH HOC TAP

### 7.1 Cap do 1 — DE NHAT (Doc dau tien)

**Muc tieu**: Hieu cau truc Entity, DTO co ban, cac GET API don gian

| File / Chuc nang | Duong dan | Ly do de |
|-----------------|-----------|---------|
| BaseEntity.java | common/entity/ | Chi co 6 fields audit, khong co logic |
| ERole.java | common/enums/ | Enum don gian 4 gia tri |
| ECarStatus.java | common/enums/ | Enum 4 gia tri |
| ERentalStatus.java | common/enums/ | Enum mo ta trang thai don thue |
| Car.java (Entity) | modules/car/entity/ | Fields ro rang, annotation day du |
| User.java (Entity) | modules/user/entity/ | Entity co ban nhat, co du cac loai quan he |
| Rental.java (Entity) | modules/rental/entity/ | Ngan gon, de hieu business |
| Payment.java (Entity) | modules/payment/entity/ | Don gian, 1 Entity |
| ApiResponse.java | common/dto/ | Wrapper response chuan toan he thong |
| PublicCarController.java | modules/car/controller/ | 3 ham GET, khong can dang nhap |

**Bai tap cap 1**: Doc Car.java -> Ve bang cars trong DB (ten cot, kieu du lieu, rang buoc)

---

### 7.2 Cap do 2 — TRUNG BINH (CRUD kem dieu kien)

**Muc tieu**: Hieu luong Controller -> Service -> Repository, hieu @Transactional

| File / Chuc nang | Ly do trung binh |
|-----------------|-----------------|
| AuthController.java | Hieu REST annotations, @Valid, nhieu endpoint |
| AuthService.registerRenter() | @Transactional, Builder pattern, kiem tra duplicate |
| CarController.java | @PreAuthorize, ResponseEntity, PageResponse, Owner workflow |
| AdminCarController.java | @PathVariable, @RequestBody, quy trinh Admin duyet xe |
| AdminUserController.java | Phan quyen ADMIN/STAFF, nhieu loai duyet |
| OwnerRentalController.java | Luong approve/reject nghiep vu Owner |
| GlobalExceptionHandler.java | @RestControllerAdvice, @ExceptionHandler, format loi |
| ErrorCode.java | Enum voi nhieu fields (code, message, httpStatus) |

**Bai tap cap 2**: Doc AuthService.registerRenter() -> Viet lai bang pseudocode tieng Viet

---

### 7.3 Cap do 3 — KHO (Phan tich sau)

**Muc tieu**: Hieu JWT Security Filter Chain, JPA query phuc tap, External Services

| File / Chuc nang | Ly do kho |
|-----------------|---------|
| SecurityConfig.java | Toan bo cau hinh Spring Security, OAuth2, Filter chain |
| JwtAuthenticationFilter.java | Filter chay truoc moi request, kiem tra JTI + tokenVersion |
| JwtTokenProvider.java | Tao/xac minh JWT bang JJWT 0.12.6, claims |
| AuthService.login() | Rate limiting, token generation, session management |
| RentalServiceImpl.java | 6 lop kiem tra tuan tu, tinh tien phuc tap, JPQL query |
| RentalRepository.hasDateConflict() | JPQL query kiem tra khoang thoi gian trung |
| RentalDisputeService | Logic giai quyet tranh chap, upload Cloudinary |
| CarSpecification.java | JPA Criteria API - loc dong theo nhieu tieu chi |
| CloudinaryService.java | Tich hop SDK ben thu 3 |
| AiChatService.java | Tich hop Google Gemini AI |
| RentalExpirationScheduler.java | @Scheduled — tu dong huy don het han |
| OAuth2SuccessHandler.java | Xu ly callback sau Google login |

---

### 7.4 Bang Annotation & Khai niem BAT BUOC HIEU

| Annotation / Khai niem | Vai tro | File dung nhieu nhat |
|-----------------------|---------|---------------------|
| @Entity | Danh dau class la bang trong DB | Car, User, Rental |
| @Table(name="...") | Anh xa ten bang PostgreSQL | Tat ca Entity |
| @Id + @GeneratedValue | Khoa chinh tu tang AUTO_INCREMENT | Tat ca Entity |
| @Column(name, nullable, unique) | Dinh nghia cot DB | Tat ca Entity |
| @OneToMany / @ManyToOne | Quan he 1-N giua cac bang | Car-CarImage, Rental-Payment |
| @ManyToMany + @JoinTable | Quan he N-N qua bang trung gian | User-Role qua user_roles |
| @OneToOne | Quan he 1-1 | User-OwnerProfile |
| @Enumerated(EnumType.STRING) | Luu enum dang String trong DB | Car.status, Rental.status |
| @MappedSuperclass | Lop cha chua fields dung chung | BaseEntity.java |
| FetchType.LAZY | Chi load quan he khi can (tranh N+1) | Car.owner, Rental.car |
| FetchType.EAGER | Load ngay lap tuc | User.roles (can load ngay khi xac thuc) |
| @RestController | Controller tra ve JSON | Tat ca Controller |
| @RequestMapping | Dinh nghia URL goc Controller | Tat ca Controller |
| @PreAuthorize | Kiem tra quyen truoc khi vao ham | CarController, OwnerRentalController |
| @Valid + @RequestBody | Nhan va validate JSON body | Tat ca Controller |
| @Service | Danh dau class la Spring Service bean | AuthService, RentalServiceImpl |
| @Transactional | Boc trong transaction DB, rollback khi loi | AuthService, RentalServiceImpl |
| @Transactional(readOnly=true) | Toi uu performance cho query chi doc | AuthService.getPendingOwners() |
| @RequiredArgsConstructor | Lombok: tao constructor inject final fields | Ca Service & Controller |
| @Builder | Lombok: tao Builder pattern | Ca Entity & DTO |
| @Getter / @Setter | Lombok: tao getters & setters | Ca Entity |
| @Slf4j | Lombok: tao log object (LogFactory) | AuthService, RentalServiceImpl |
| @Scheduled(cron="...") | Cron job tu dong chay dinh ky | RentalExpirationScheduler |
| @Configuration + @Bean | Dinh nghia Spring beans | SecurityConfig, CorsConfig |
| JpaRepository<E, ID> | Interface CRUD tu dong (save, findById...) | Tat ca Repository |
| JPQL | Truy van bang ten Entity thay ten bang SQL | RentalRepository.hasDateConflict() |

---

## MUC 8: BAI TAP THUC HANH, DIEM YEU & TU VUNG TIENG ANH

### 8.1 Ba cho trong code DANG THIEU kiem tra loi (Edge Cases de bao ve)

#### Edge Case 1: Khong kiem tra do dai ghi chu thue xe
**Vi tri**: RentalServiceImpl.java — buoc tao Rental  
**Van de**: Truong `note` khong gioi han do dai. Neu khach gui ghi chu 10,000 ky tu,
DB se bao loi khi INSERT vi cot VARCHAR(500).  

**Bai tap — tu viet them vao RentalServiceImpl truoc khi tao Rental**:
```java
// TODO: Them kiem tra do dai ghi chu
if (request.getNote() != null && request.getNote().length() > 500) {
    throw new AppException(ErrorCode.INVALID_REQUEST,
        "Ghi chu khong duoc vuot qua 500 ky tu");
}
```

#### Edge Case 2: Khong gioi han so ngay thue toi da
**Vi tri**: RentalServiceImpl.java — buoc validate ngay  
**Van de**: Khong gioi han so ngay thue. Khach co the dat xe 365 ngay,
chan xe cua chu xe suot 1 nam chi voi coc 30%.

**Bai tap — tu viet them sau buoc validate endDate**:
```java
// TODO: Them gioi han toi da 30 ngay
long totalDaysCheck = ChronoUnit.DAYS.between(startDate, endDate);
if (totalDaysCheck > 30) {
    throw new AppException(ErrorCode.INVALID_RENTAL_DATES,
        "Thoi gian thue toi da la 30 ngay moi lan dat");
}
```

#### Edge Case 3: Admin duyet tai khoan da bi xoa mem
**Vi tri**: AuthService.approveOwner() va AdminUserService.approveOwner()  
**Van de**: Ham chi kiem tra findById() nhung KHONG kiem tra user.isDeleted().
Neu user da bi xoa mem (deletedAt != null), Admin van co the "duyet" — tao trang thai khong nhat quan.

**Bai tap — tu viet them ngay sau doan findById()**:
```java
// TODO: Them 2 kiem tra nay
if (user.isDeleted()) {
    throw new AppException(ErrorCode.USER_NOT_FOUND,
        "Tai khoan nay da bi xoa, khong the phe duyet");
}
if (user.getStatus() != EUserStatus.PENDING) {
    throw new AppException(ErrorCode.INVALID_REQUEST,
        "Chi duyet duoc tai khoan dang o trang thai PENDING");
}
```

---

### 8.2 Nam cau hoi van dap (tu de den kho)

**Cau 1 — DE (Ly thuyet co ban)**:
> "Em giai thich vai tro cua annotation @Transactional trong AuthService.registerRenter()
> la gi? Neu bo no di, chuyen gi xay ra khi DB loi giua chung?"

*Goi y*: @Transactional dam bao toan bo ham chay trong 1 transaction. Neu loi o buoc
ownerProfileRepository.save(), thi buoc userRepository.save() truoc do cung rollback.
Khong de lai du lieu nua voi.

---

**Cau 2 — TRUNG BINH (Phan tich code)**:
> "Tai sao trong Car.java Entity lai co ca @Column(name='owner_id') lan
> @ManyToOne @JoinColumn(name='owner_id')? Hai cai do mau thuan nhau khong?
> Tai sao phai ghi insertable=false, updatable=false?"

*Goi y*: Day la ky thuat "dual mapping": dung ownerId (Long) khi chi can query
bang ID; dung owner (User object) khi can load toan bo. Phai ghi insertable/updatable=false
de JPA khong bi nhap nhang va khong co gang insert 1 cot 2 lan.

---

**Cau 3 — TRUNG BINH (Nghiep vu)**:
> "Tai sao khi hasDateConflict() kiem tra trung lich, no check
> [WAITING_PAYMENT, APPROVED, CONFIRMED, IN_PROGRESS] ma KHONG check PENDING_APPROVAL?"

*Goi y*: Khi don o PENDING_APPROVAL, chu xe chua duyet, xe chua bi "giu cho".
Nhieu khach co the cung gui yeu cau PENDING cho cung 1 khoang ngay — chu xe se chon 1.
Chi khi chu xe duyet (WAITING_PAYMENT), xe moi bi "soft-lock" cho nguoi do.

---

**Cau 4 — KHO (Security)**:
> "Em giai thich co che tokenVersion trong he thong JWT nay. Tai sao chi luu
> token vao localStorage ma khong dung HttpOnly Cookie?"

*Goi y*: tokenVersion la so nguyen trong bang users. Khi doi mat khau, tokenVersion++.
JWT cu van co tokenVersion cu -> JwtAuthenticationFilter so sanh -> khong khop -> tu choi.
Tat ca thiet bi dang dang nhap bi da ra. HttpOnly Cookie an toan hon nhung SPA kho dung vi CORS.

---

**Cau 5 — KHO NHAT (Kien truc & Trade-off)**:
> "Nhin vao AdminRentalController.getAllRentals(), em thay N+1 Query problem o dau?
> Em se fix no nhu the nao?"

*Goi y*: Vong stream: moi don thue lai goi carRepository.findById() + 2x userRepository.findById()
= 3 query/don. 100 don = 301 queries. Fix: dung JOIN FETCH trong JPQL, hoac @EntityGraph,
hoac load tat ca IDs truoc roi dung findAllById().

---

### 8.3 20 Tu vung Tieng Anh trong du an

| STT | Tu / Annotation | File dang dung | Nghia tieng Viet |
|-----|----------------|---------------|-----------------|
| 1 | Entity | @Entity — Car, User, Rental | Thuc the — anh xa voi bang DB |
| 2 | Repository | CarRepository, UserRepository | Kho luu tru — tang truy van DB |
| 3 | Service | AuthService, RentalService | Dich vu — tang xu ly logic |
| 4 | Controller | CarController, AuthController | Bo dieu khien — nhan HTTP request |
| 5 | Transaction | @Transactional | Giao dich DB — all-or-nothing |
| 6 | Authentication | SecurityContextHolder | Xac thuc — ai dang dang nhap |
| 7 | Authorization | @PreAuthorize, authorizeHttpRequests | Phan quyen — duoc lam gi |
| 8 | Payload | JWT payload chua claims | Du lieu gui trong body/token |
| 9 | Deposit | depositAmount trong Rental | Tien dat coc |
| 10 | Rental | Rental.java, RentalService | Don thue xe |
| 11 | Inspection | RentalInspection.java | Bien ban kiem tra xe |
| 12 | Dispute | RentalDispute.java | Khieu nai tranh chap |
| 13 | Verification | verificationStatus | Xac minh CCCD GPLX |
| 14 | Pagination | PageResponse, Pageable | Phan trang ket qua |
| 15 | Specification | CarSpecification.java | Tieu chi loc dong JPA |
| 16 | Cascade | CascadeType.ALL trong @OneToMany | Lan truyen thao tac save/delete |
| 17 | Soft Delete | deletedAt trong BaseEntity | Xoa mem — an di khong xoa DB |
| 18 | Rate Limiting | ipFailures trong AuthService | Gioi han so lan thu |
| 19 | Conflict | hasDateConflict() trong RentalRepository | Xung dot lich trung nhau |
| 20 | Session | AuthSession entity | Phien lam viec — luu JWT de revoke |

---

## TOM TAT CHO THAY HUONG DAN

| Muc | Noi dung chinh |
|-----|----------------|
| 1. Use Case | 6 Actor, ~60 Use Case, co quan he include/extend ro rang |
| 2. Tech Stack | Java 17 + Spring Boot 3.3.4 + JJWT 0.12.6 + Cloudinary + Gemini + VietQR |
| 3. Thu muc | 7 module chinh, 3 tang Controller-Service-Repository |
| 4. ERD | 18 bang, du PK/FK/rang buoc, so do quan he 1-1 1-N N-N |
| 5. API | ~55 endpoints, phan theo module, ghi ro Method/DTO/Quyen |
| 6. Luong | 2 luong chi tiet: Dang nhap JWT + Dat xe kiem tra 6 buoc |
| 7. Do kho | 3 cap (De/Trung/Kho), 26 annotation can hieu |
| 8. Bai tap | 3 edge case de tu fix, 5 cau van dap, 20 tu vung tieng Anh |

> **Ghi chu**: Tai lieu nay duoc tong hop truc tiep tu source code thuc te.
> Toan bo ten file, ten ham, ten bien co the verify bang cach mo IDE va tra vao
> duong dan trong workspace Spring_ThucTap_k4/backend/
