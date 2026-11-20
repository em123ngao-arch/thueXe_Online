# 👑 CHUYÊN ĐỀ TOÀN DIỆN: CƠ SỞ DỮ LIỆU & KIẾN TRÚC HỆ THỐNG
## DÀNH RIÊNG CHO TEAM LEAD & DB ARCHITECT: NGUYỄN DUY BẢO
> **Dự án**: Nền tảng chia sẻ và cho thuê xe trực tuyến (DriveShare K4)  
> **Kiến trúc**: Spring Boot 3.3.4 Hexagonal Modular (Ports & Adapters), PostgreSQL 16, Spring Security 6, JWT, ArchUnit  
> **Hội đồng bảo vệ**: Thầy Trương Thanh Bình (Giảng viên hướng dẫn & phản biện) & Chị Thư (Reviewer Doanh nghiệp)

---

## 📌 MỤC LỤC CHUYÊN ĐỀ
1. [Tâm Thế & Trách Nhiệm Phản Biện Của Team Lead](#1-tâm-thế--trách-nhiệm-phản-biện-của-team-lead)
2. [Sơ Đồ Thực Thể ERD & Phân Phối Quan Hệ Khóa Ngoại](#2-sơ-đồ-thực-thể-erd--phân-phối-quan-hệ-khóa-ngoại)
3. [Đặc Tả Kỹ Thuật Chi Tiết 6 Bảng CSDL Của Bảo](#3-đặc-tả-kỹ-thuật-chi-tiết-6-bảng-csdl-của-bảo)
   * [3.1 Bảng `cars` (Kho phương tiện trung tâm)](#31-bảng-cars-kho-phương-tiện-trung-tâm)
   * [3.2 Bảng `car_images` (Album ảnh xe Cloudinary CDN)](#32-bảng-car_images-album-ảnh-xe-cloudinary-cdn)
   * [3.3 Bảng `car_documents` (Hồ sơ giấy tờ pháp lý xe)](#33-bảng-car_documents-hồ-sơ-giấy-tờ-pháp-lý-xe)
   * [3.4 Bảng `roles` (Danh mục vai trò RBAC)](#34-bảng-roles-danh-mục-vai-trò-rbac)
   * [3.5 Bảng `user_roles` (Bảng trung gian phân quyền N-N)](#35-bảng-user_roles-bảng-trung-gian-phân-quyền-n-n)
   * [3.6 Bảng `audit_logs` (Nhật ký kiểm toán Admin)](#36-bảng-audit_logs-nhật-ký-kiểm-toán-admin)
4. [Kiến Trúc Lục Giác & Bộ 7 Luật ArchUnit Bắt Buộc](#4-kiến-trúc-lục-giác--bộ-7-luật-archunit-bắt-buộc)
5. [Các Quyết Định Thiết Kế CSDL Trọng Yếu Của Kiến Trúc Sư](#5-các-quyết-định-thiết-kế-csdl-trọng-yếu-của-kiến-trúc-sư)
6. [Bộ Câu Hỏi Phản Biện Lý Thuyết Hóc Búa Dành Cho Leader](#6-bộ-câu-hỏi-phản-biện-lý-thuyết-hóc-búa-dành-cho-leader)
7. [Bộ 8 Truy Vấn SQL Thực Chiến (Live Render PostgreSQL 16)](#7-bộ-8-truy-vấn-sql-thực-chiến-live-render-postgresql-16)

---

## 1. TÂM THẾ & TRÁCH NHIỆM PHẢN BIỆN CỦA TEAM LEAD

Là **Trưởng nhóm (Team Lead)** kiêm **Kiến trúc sư CSDL (Database Architect)** của dự án DriveShare, Bảo giữ vai trò người mở màn và chốt chặn cuối cùng trước Hội đồng bảo vệ:
* **Mở đầu buổi bảo vệ (00:00 - 02:00)**: Tự tin giới thiệu bài toán kinh doanh thực tế (nỗi đau thị trường thuê xe truyền thống), triết lý thiết kế hệ thống và lý do lựa chọn **Kiến trúc Lục giác (Hexagonal Architecture)**.
* **Điều phối phản biện**: Khi Thầy Bình hoặc Chị Thư hỏi câu hỏi tổng quát về hệ thống hoặc kiến trúc, Bảo chủ động trả lời hoặc giới thiệu thành viên chuyên trách trả lời chi tiết.
* **Làm chủ dữ liệu & SQL Analytics**: Bảo chịu trách nhiệm trực tiếp về 6 bảng CSDL nền tảng (`cars`, `car_images`, `car_documents`, `roles`, `user_roles`, `audit_logs`) và các câu truy vấn thống kê toàn sàn (Dashboard Analytics).

---

## 2. SƠ ĐỒ THỰC THỂ ERD & PHÂN PHỐI QUAN HỆ KHÓA NGOẠI

```mermaid
erDiagram
    users ||--o{ cars : "owns (1-n) [RESTRICT]"
    users ||--o{ user_roles : "has (1-n) [CASCADE]"
    roles ||--o{ user_roles : "assigned (1-n) [RESTRICT]"
    users ||--o{ audit_logs : "acts (1-n) [SET NULL]"
    cars ||--o{ car_images : "contains (1-n) [CASCADE]"
    cars ||--o{ car_documents : "has (1-n) [CASCADE]"
    cars ||--o{ rentals : "booked (1-n) [RESTRICT]"
    cars ||--o{ car_calendar_blocks : "blocked (1-n) [CASCADE]"
    cars ||--o{ reviews : "reviewed (1-n) [CASCADE]"

    cars {
        bigint car_id PK
        bigint owner_id FK "users.user_id"
        varchar plate_number UK "Biển số xe duy nhất"
        varchar brand "VinFast, Mazda, Toyota..."
        varchar model "VF8, CX-5, Fortuner..."
        int year "Năm sản xuất"
        varchar color "Màu xe"
        int seats "Số chỗ ngồi (4, 5, 7)"
        varchar transmission "MANUAL / AUTOMATIC"
        varchar fuel_type "GASOLINE / DIESEL / ELECTRIC"
        decimal price_per_day "Đơn giá thuê / ngày"
        varchar province "TP.HCM, Hà Nội, Đà Nẵng..."
        boolean has_driver_service "Có dịch vụ tài xế"
        decimal driver_fee_per_day "Phí tài xế / ngày"
        decimal rating "Điểm đánh giá (1.00 - 5.00)"
        int rating_count "Tổng lượt đánh giá"
        varchar status "PENDING_REVIEW, APPROVED, ACTIVE..."
        timestamp deleted_at "Soft-delete"
    }

    car_images {
        bigint image_id PK
        bigint car_id FK "cars.car_id [CASCADE]"
        varchar image_url "Cloudinary CDN URL"
        boolean is_thumbnail "Ảnh đại diện hiển thị Card"
        timestamp created_at
    }

    car_documents {
        bigint document_id PK
        bigint car_id FK "cars.car_id [CASCADE]"
        varchar document_type "REGISTRATION, INSPECTION, INSURANCE"
        varchar document_url "Link ảnh giấy tờ xe"
        varchar verification_status "PENDING, APPROVED, REJECTED"
        varchar rejection_reason "Lý do từ chối"
        bigint verified_by FK "users.user_id [SET NULL]"
        timestamp verified_at
    }

    roles {
        bigint role_id PK
        varchar role_name UK "ROLE_RENTER, ROLE_OWNER, ROLE_ADMIN"
    }

    user_roles {
        bigint user_id PK,FK "users.user_id [CASCADE]"
        bigint role_id PK,FK "roles.role_id [RESTRICT]"
        timestamp assigned_at
    }

    audit_logs {
        bigint log_id PK
        varchar action "APPROVE_CAR, REJECT_CAR, LOCK_USER..."
        bigint actor_id FK "users.user_id [SET NULL]"
        varchar actor_username
        varchar target_type "CAR, USER, RENTAL, DISPUTE"
        bigint target_id
        varchar details "Nội dung chi tiết thay đổi"
        timestamp created_at
    }
```

---

## 3. ĐẶC TẢ KỸ THUẬT CHI TIẾT 6 BẢNG CSDL CỦA BẢO

### 3.1 Bảng `cars` (Kho phương tiện trung tâm)
* **Ý nghĩa**: Bảng hạt nhân của sàn giao dịch, lưu thông tin định danh xe, giá thuê, địa điểm, cấu hình động cơ, tiện nghi và trạng thái kiểm duyệt.
* **Khóa chính**: `car_id` (`BIGINT`, Tự tăng).
* **Khóa ngoại**:
  * `owner_id` $\rightarrow$ `users.user_id` (Ràng buộc: `ON DELETE RESTRICT ON UPDATE CASCADE` — Cấm xóa chủ xe nếu xe đang tồn tại trên sàn).
  * `approved_by` $\rightarrow$ `users.user_id` (Ràng buộc: `ON DELETE SET NULL` — Lưu vết Admin/Staff đã phê duyệt xe).
* **Ràng buộc duy nhất**: `plate_number` (`UNIQUE` — Mỗi biển số chỉ được đăng ký một xe duy nhất toàn quốc).
* **Vòng đời trạng thái xe (`ECarStatus`)**:
  ```text
  PENDING_REVIEW (Chủ đăng xe mới)
         │
         ├──[Admin duyệt OK]────────► APPROVED ───► ACTIVE (Hiển thị tìm kiếm)
         │                                            ▲
         │                                            │ (Chủ xe bật/tắt nhận khách)
         │                                            ▼
         ├──[Admin từ chối]─────────► REJECTED     INACTIVE (Tạm ngưng)
         │                                            │
         └──[Vi phạm / Khóa xe]─────► SUSPENDED ◄─────┘
  ```
* **Cơ chế Soft-Delete**: Kế thừa `BaseEntity` gồm `deleted_at` (`TIMESTAMP`) và `deleted_by` (`BIGINT`).
  * Khi chủ xe xóa xe: Hệ thống chạy `UPDATE cars SET deleted_at = NOW() WHERE car_id = :id`.
  * Các câu query tìm kiếm xe công khai luôn thêm điều kiện `WHERE deleted_at IS NULL`.
* **Chiến lược Indexing**:
  * `idx_cars_plate_number` (`plate_number`): Tăng tốc tra cứu biển số khi ký biên bản giao nhận xe hoặc kiểm tra phạt nguội.
  * `idx_cars_owner_id` (`owner_id`): Tăng tốc màn hình Portal của Chủ xe (`/owner-cars.html`).
  * `idx_cars_status` (`status`): Lọc nhanh xe đang `ACTIVE` để hiển thị cho khách thuê.
  * **Composite Index `idx_cars_filter` (`status`, `brand`, `price_per_day`, `seats`)**: Tối ưu hóa cực đại bộ lọc tìm kiếm xe nhiều tiêu chí (Multi-criteria search) ngoài trang chủ, tránh Table Scan khi CSDL có hàng triệu dòng xe.

---

### 3.2 Bảng `car_images` (Album ảnh xe Cloudinary CDN)
* **Ý nghĩa**: Lưu trữ bộ sưu tập ảnh nội thất, ngoại thất và góc chụp của xe đã tải lên Cloudinary CDN.
* **Cột chính**:
  * `image_id` (PK, `BIGINT`).
  * `car_id` (FK trỏ về `cars.car_id`).
  * `image_url` (`VARCHAR(500)`): URL ảnh tối ưu WebP/JPG trên Cloudinary CDN.
  * `is_thumbnail` (`BOOLEAN`): Đánh dấu 1 ảnh đại diện chính duy nhất hiển thị trên Card xe ngoài trang chủ.
* **Quy tắc Cascading**: `ON DELETE CASCADE` — Khi xe bị xóa vĩnh viễn, toàn bộ ảnh xe con bị xóa tự động, không để lại rác dữ liệu.

---

### 3.3 Bảng `car_documents` (Hồ sơ giấy tờ pháp lý xe)
* **Ý nghĩa**: Lưu chứng từ pháp lý do chủ xe tải lên để Admin thẩm định trước khi duyệt xe lên sàn.
* **Cột chính**:
  * `document_id` (PK, `BIGINT`).
  * `car_id` (FK trỏ về `cars.car_id`).
  * `document_type` (`EDocumentType`):
    * `REGISTRATION`: Giấy đăng ký xe (Cà-vẹt).
    * `INSPECTION`: Sổ đăng kiểm xe còn hạn lưu hành.
    * `INSURANCE`: Bảo hiểm bắt buộc trách nhiệm dân sự (TNDS).
  * `verification_status` (`EVerificationStatus`): `PENDING` $\rightarrow$ `APPROVED` hoặc `REJECTED`.
  * `rejection_reason` (`VARCHAR(500)`): Ghi rõ lý do nếu từ chối (ví dụ: *"Ảnh đăng kiểm bị mờ góc"*).
  * `verified_by` (FK trỏ về `users.user_id`, `ON DELETE SET NULL`).

---

### 3.4 Bảng `roles` (Danh mục vai trò RBAC)
* **Ý nghĩa**: Định nghĩa các quyền hạn bảo mật Role-Based Access Control trong Spring Security 6.
* **Cột chính**:
  * `role_id` (PK, `BIGINT`).
  * `role_name` (`VARCHAR(30)`, `UNIQUE`):
    * `ROLE_RENTER`: Khách thuê xe (tìm xe, đặt cọc 30%, ký nhận xe).
    * `ROLE_OWNER`: Chủ xe (đăng xe, duyệt đơn, soft-lock 45p, nhận 90% doanh thu).
    * `ROLE_STAFF`: Nhân viên sàn (kiểm duyệt xe, xem xét giấy tờ eKYC).
    * `ROLE_ADMIN`: Quản trị viên tối cao (Dashboard thống kê, phân giải tranh chấp, xuất hồ sơ Điều 175 BLHS).

---

### 3.5 Bảng `user_roles` (Bảng trung gian phân quyền N-N)
* **Ý nghĩa**: Giải quyết mối quan hệ nhiều - nhiều giữa `users` và `roles`.
* **Cột chính**:
  * `user_id` (FK trỏ về `users.user_id`, `ON DELETE CASCADE`).
  * `role_id` (FK trỏ về `roles.role_id`, `ON DELETE RESTRICT`).
  * **Composite Primary Key**: `PRIMARY KEY (user_id, role_id)` — Đảm bảo 1 user không bao giờ bị gán trùng 1 vai trò 2 lần.
* **Ý nghĩa nghiệp vụ**: Một người dùng DriveShare có thể linh hoạt giữ nhiều vai trò cùng lúc (vừa là `ROLE_RENTER` đi thuê xe, vừa là `ROLE_OWNER` đăng xe kiếm thêm thu nhập).

---

### 3.6 Bảng `audit_logs` (Nhật ký kiểm toán Admin)
* **Ý nghĩa**: Bắt buộc tuân thủ quy chuẩn bảo mật doanh nghiệp, ghi lại mọi can thiệp nghiệp vụ quan trọng của Admin và Nhân viên.
* **Cột chính**:
  * `log_id` (PK, `BIGINT`).
  * `action` (`VARCHAR(100)`): Tên hành động (`APPROVE_CAR`, `REJECT_CAR`, `SUSPEND_CAR`, `APPROVE_CCCD`, `LOCK_USER`).
  * `actor_id` (FK `users.user_id`, `ON DELETE SET NULL`): ID của Admin thực hiện.
  * `actor_username` (`VARCHAR(100)`): Lưu tên đăng nhập dự phòng nếu user bị xóa.
  * `target_type` (`VARCHAR(50)`): Loại thực thể bị can thiệp (`CAR`, `USER`, `RENTAL`, `DISPUTE`).
  * `target_id` (`BIGINT`): ID thực thể cụ thể.
  * `details` (`VARCHAR(1000)`): Chi tiết thay đổi hoặc lý do can thiệp.
  * `created_at` (`TIMESTAMP`): Mốc thời gian chính xác ghi log.

---

## 4. KIẾN TRÚC LỤC GIÁC & BỘ 7 LUẬT ARCHUNIT BẮT BUỘC

### 4.1 Tại sao chọn Kiến trúc Lục giác (Hexagonal / Ports & Adapters)?
Trong các dự án MVC 3 tầng truyền thống, Controller gọi Service, Service gọi trực tiếp Repository. Hậu quả là:
1. **Rò rỉ framework (Framework Leakage)**: Các annotation `@Entity`, `@Table`, JPA methods tràn ngập vào tầng nghiệp vụ. Khi muốn đổi database hoặc viết test, toàn bộ hệ thống bị phụ thuộc chặt vào Spring Context.
2. **Khó bảo trì**: Thay đổi nhỏ ở tầng CSDL có thể làm vỡ logic nghiệp vụ ở trên.

**Kiến trúc Lục giác giải quyết triệt để vấn đề này bằng cách chia hệ thống thành 3 tầng ranh giới rõ ràng:**
* **Tầng 1 - Domain Core (Pure Java)**: Trái tim độc lập cao nhất, chỉ chứa POJO Record và Policy thuần Java. Tuyệt đối không import Spring, JPA, Hibernate.
* **Tầng 2 - Application (Ports & Use Cases)**:
  * **Inbound Ports (`port/in`)**: Interface định nghĩa các nghiệp vụ mà Web Controller hoặc Module khác có thể gọi.
  * **Outbound Ports (`port/out`)**: Interface định nghĩa các cổng xuất dữ liệu ra ngoài (lưu DB, gửi mail, gọi bên thứ 3). Tầng Application chỉ phụ thuộc vào Interface này, không quan tâm DB bên dưới là PostgreSQL hay MySQL.
  * **Use Cases (`usecase`)**: Lớp thực thi nghiệp vụ cụ thể.
* **Tầng 3 - Adapters (Infrastructure)**:
  * **Inbound Adapter (`adapter/in/web`)**: REST Controller nhận HTTP Request, gọi Inbound Port, trả về `ApiResponse<T>`.
  * **Outbound Adapter (`adapter/out/persistence`)**: JPA Entities, Spring Data Repositories thực thi Outbound Port để kết nối CSDL thật.

---

### 4.2 Chi Tiết 7 Luật ArchUnit Trong `ArchitectureRulesTest.java`

Dự án DriveShare cài đặt bộ test tự động `ArchitectureRulesTest.java` sử dụng thư viện **ArchUnit** để quét bytecode và chặn đứng mọi vi phạm kiến trúc ngay trong quá trình Build:

```java
// 1. Domain tuyệt đối không phụ thuộc Framework
noClasses().that().resideInAPackage("..modules..domain..")
    .should().dependOnClassesThat().resideInAnyPackage(
        "org.springframework..", "jakarta.persistence..", "jakarta.validation..")

// 2. Domain không phụ thuộc Application hay Adapter
noClasses().that().resideInAPackage("..modules..domain..")
    .should().dependOnClassesThat().resideInAnyPackage(
        "..modules..application..", "..modules..adapter..")

// 3. Application không phụ thuộc Adapter
noClasses().that().resideInAPackage("..modules..application..")
    .should().dependOnClassesThat().resideInAnyPackage(
        "..modules..adapter..", "..common.adapter..", "..common.persistence..")

// 4. Application không phụ thuộc JPA / Hibernate / Spring Data
noClasses().that().resideInAPackage("..modules..application..")
    .should().dependOnClassesThat().resideInAnyPackage(
        "jakarta.persistence..", "org.springframework.data..")

// 5. Controller Web tuyệt đối không gọi trực tiếp Persistence Repository
noClasses().that().resideInAPackage("..adapter.in.web..")
    .should().dependOnClassesThat().resideInAnyPackage("..adapter.out.persistence..")

// 6. Application giữa 11 Module không được phụ thuộc trực tiếp vào nhau (Chống chu trình vòng)
slices().matching("..modules.(*).application..").should().notDependOnEachOther()

// 7. Giao tiếp liên module BẮT BUỘC qua Inbound Port, Command, Result hoặc DTO công khai
classes().that().resideInAnyPackage("..modules..application..", "..modules..adapter.in..")
    .should(tuanThuGiaoTiepModule())
```

> [!TIP]
> **Kết quả kiểm thử thực tế**: Bộ test `ArchitectureRulesTest` gồm 7 bài kiểm tra chạy trong **5.7 giây** với kết quả: **`Tests run: 7, Failures: 0, Errors: 0, Skipped: 0 — BUILD SUCCESS`**.

---

## 5. CÁC QUYẾT ĐỊNH THIẾT KẾ CSDL TRỌNG YẾU CỦA KIẾN TRÚC SƯ

### 1. Tại sao dùng Soft-Delete cho `cars` nhưng Hard-Delete cho `car_images`?
* **Với bảng `cars`**: Một chiếc xe đã từng cho thuê sẽ có liên kết chặt chẽ với bảng `rentals` (đơn thuê), `payments` (hóa đơn tiền cọc), `rental_inspections` (biên bản nhận xe) và `rental_disputes` (hồ sơ tranh chấp). Nếu xóa cứng `DELETE FROM cars WHERE car_id = 1`:
  * Ràng buộc khóa ngoại sẽ quăng lỗi `DataIntegrityViolationException` (hoặc nếu để Cascade thì xóa mất sạch lịch sử tài chính của công ty).
  * Làm mất chứng cứ khi lập **Hồ sơ pháp lý Điều 175 BLHS** gửi cơ quan công an khi khách thuê chiếm đoạt xe.
  * Vì vậy, xe bắt buộc phải dùng **Soft-Delete (`deleted_at != null`)**.
* **Với bảng `car_images` và `car_documents`**: Ảnh và giấy tờ là các thực thể con phụ thuộc tồn tại duy nhất theo xe. Khi một chiếc xe nháp chưa phát sinh giao dịch bị xóa hẳn, cấu hình `ON DELETE CASCADE` giúp database tự động dọn sạch rác, tránh lãng phí bộ nhớ lưu trữ.

### 2. Kỹ thuật tránh N+1 Query trong JPA Entity `Car`:
Trong `Car.java`, Lead Bảo không inject trực tiếp `@ManyToOne User owner` với chế độ `EAGER`. Thay vào đó:
* Khai báo trực tiếp cột ID: `@Column(name = "owner_id") private Long ownerId;`
* Khai báo quan hệ phụ trợ: `@ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "owner_id", insertable = false, updatable = false) private User owner;`
* **Lợi ích**: Khi hệ thống cần lấy danh sách 100 xe để tìm kiếm, JPA chỉ cần đọc `ownerId` từ chính hàng `cars` mà không phải sinh thêm 100 câu `SELECT * FROM users WHERE user_id = ?` (Triệt tiêu 100% lỗi N+1 Query).

### 3. Tối ưu hóa hiệu năng bằng Composite Index:
* Một người dùng tìm xe thường lọc đồng thời: Trạng thái xe đang sẵn sàng (`status = 'ACTIVE'`), hãng xe (`brand = 'VinFast'`), mức giá tối đa (`price_per_day <= 1500000`) và số chỗ ngồi (`seats = 5`).
* Nếu tạo 4 index đơn lẻ trên từng cột, PostgreSQL phải mất thời gian merge bitmap index scan.
* Nhóm em thiết kế **Composite Index `idx_cars_filter (status, brand, price_per_day, seats)`**: Toàn bộ điều kiện tìm kiếm được xử lý ngay trên cây B-Tree của Index, thời gian trả kết quả chỉ mất **dưới 15ms** ngay cả khi hệ thống có hàng chục ngàn xe.

---

## 6. BỘ CÂU HỎI PHẢN BIỆN LÝ THUYẾT HÓC BÚA DÀNH CHO LEADER

### ❓ Câu 1: "Tại sao nhóm chọn Hexagonal Architecture (Ports & Adapters) mà không dùng MVC 3 tầng truyền thống?"
* 👉 **Bảo trả lời**:
  *"Dạ thưa Thầy/Cô, MVC 3 tầng truyền thống thường gặp vấn đề 'rò rỉ framework': các annotation của Spring Data JPA hoặc HTTP Request tràn ngập vào tầng Service nghiệp vụ. Khi hệ thống mở rộng hoặc muốn thay đổi công nghệ, việc refactor cực kỳ rủi ro và khó viết Unit Test độc lập.*  
  *Kiến trúc Lục giác tách biệt hoàn toàn 3 lớp: Tầng **Domain Core (Pure Java)** hoàn toàn độc lập, không import bất kỳ thư viện Spring hay JPA nào. Tầng **Application** chỉ định nghĩa các Interface Inbound Port và Outbound Port. Tầng **Adapters** (Web Controller, JPA Persistence) là các cổng cắm rút bên ngoài. Nhờ đó, tụi em có thể viết Unit Test cho logic nghiệp vụ chỉ trong vài mili-giây mà không cần dựng Spring Context nặng nề, và dễ dàng mở rộng sang gRPC hoặc đổi CSDL sau này mà không đụng chạm một dòng code nghiệp vụ nào."*

---

### ❓ Câu 2: "7 luật ArchUnit của nhóm kiểm soát điều gì? Làm sao biết chắc các thành viên khác không gọi xuyên tầng?"
* 👉 **Bảo trả lời**:
  *"Dạ, để bảo vệ kiến trúc Lục giác không bị phá vỡ khi 6 thành viên làm việc song song, em đã thiết lập bài kiểm thử tự động `ArchitectureRulesTest.java` sử dụng thư viện ArchUnit. Mỗi lần thành viên commit code và chạy `mvn test`, ArchUnit sẽ quét trực tiếp cấu trúc bytecode của toàn bộ 191 class trong dự án theo 7 quy tắc nghiêm ngặt:*  
  *1. Domain cấm import Framework (Spring, JPA, Validation).*  
  *2. Domain cấm gọi Application hay Adapter.*  
  *3. Application cấm gọi Adapter.*  
  *4. Application cấm phụ thuộc JPA/Spring Data.*  
  *5. Web Controller tuyệt đối cấm gọi trực tiếp Repository Persistence.*  
  *6. Tầng Application của 11 module độc lập không được phụ thuộc trực tiếp vào nhau.*  
  *7. Giao tiếp liên module bắt buộc phải đi qua Inbound Port (`port.in`), Command hoặc Result DTO.*  
  *Nếu bất kỳ ai viết code gọi tắt xuyên tầng, bài test sẽ fail ngay lập tức và chặn không cho build hệ thống."*

---

### ❓ Câu 3: "Mô hình phân quyền RBAC trong CSDL của nhóm được thiết kế như thế nào? Một người vừa là Renter vừa là Owner thì phân quyền ra sao?"
* 👉 **Bảo trả lời**:
  *"Dạ, hệ thống áp dụng mô hình RBAC chuẩn doanh nghiệp gồm 2 bảng `roles` và bảng trung gian `user_roles`:*  
  *- Bảng `roles` lưu 4 vai trò: `ROLE_RENTER`, `ROLE_OWNER`, `ROLE_STAFF`, `ROLE_ADMIN`.*  
  *- Bảng `user_roles` lưu cặp khóa ngoại `(user_id, role_id)` và là Composite Primary Key.*  
  *Thiết kế này cho phép quan hệ Nhiều - Nhiều (N - N): Một khách hàng đăng ký tài khoản ban đầu mặc định có quyền `ROLE_RENTER`. Khi họ muốn đăng xe cho thuê, sau khi Admin duyệt hồ sơ thông tin tài khoản ngân hàng và xe, hệ thống sẽ chèn thêm 1 bản ghi `ROLE_OWNER` vào `user_roles` cho cùng `user_id` đó. Khi đăng nhập, Spring Security gom toàn bộ các vai trò này vào danh sách `GrantedAuthority` trong JWT Token, giúp họ vừa có thể đặt xe đi du lịch, vừa có thể quản lý kho xe cá nhân của mình."*

---

### ❓ Câu 4: "Bảng `audit_logs` dùng để làm gì? Tại sao khóa ngoại `actor_id` lại để `ON DELETE SET NULL` mà không để `ON DELETE CASCADE`?"
* 👉 **Bảo trả lời**:
  *"Dạ, `audit_logs` là bảng nhật ký kiểm toán ghi lại mọi thao tác nhạy cảm của Admin và Staff (như duyệt xe `APPROVE_CAR`, từ chối xe `REJECT_CAR`, khóa tài khoản `LOCK_USER`).*  
  *Em cấu hình khóa ngoại `actor_id` là `ON DELETE SET NULL` kèm theo việc lưu dự phòng cột `actor_username`. Lý do là vì theo chuẩn an toàn thông tin (Security Audit Trail): nếu một tài khoản Admin nghỉ việc hoặc bị xóa khỏi bảng `users`, toàn bộ lịch sử các hành động kiểm toán trong quá khứ do người này thực hiện vẫn **bắt buộc phải được giữ nguyên vẹn** để phục vụ việc đối soát pháp lý, không bao giờ được phép xóa theo kiểu `CASCADE`."*

---

## 7. BỘ 8 TRUY VẤN SQL THỰC CHIẾN (LIVE RENDER POSTGRESQL 16)
*(Toàn bộ 8 câu truy vấn dưới đây đã được kiểm thử tự động và trả kết quả chính xác 100% trên CSDL Render Singapore `driveshare_db_qgbj`)*

---

### 💻 Query 1: Top 5 xe được BOOKING nhiều nhất toàn sàn
* **Đề bài Thầy hỏi**: *"Hãy viết query lấy ra 5 chiếc xe có lượt đặt (booking) nhiều nhất toàn sàn để hiển thị lên Dashboard?"*
* **Câu SQL**:
  ```sql
  SELECT 
      c.car_id,
      c.brand,
      c.model,
      c.plate_number,
      c.price_per_day,
      COUNT(r.rental_id) AS tong_so_lan_dat
  FROM cars c
  LEFT JOIN rentals r ON c.car_id = r.car_id
  GROUP BY c.car_id, c.brand, c.model, c.plate_number, c.price_per_day
  ORDER BY tong_so_lan_dat DESC, c.car_id ASC
  LIMIT 5;
  ```
* **Kết quả thực tế trên CSDL**:
  * Top 1: **VinFast VF8** (`51K-12345`) — **4 lượt đặt**.
  * Top 2: **Hyundai Accent 1.4 AT** (`30E-888.22`) — **2 lượt đặt**.
  * Top 3: **Toyota Vios 1.5 G** (`43A-666.88`) — **2 lượt đặt**.
* 👉 **Giải thích kỹ thuật**: Dùng `LEFT JOIN` giữa `cars` và `rentals` theo `car_id`. Nếu dùng `INNER JOIN` thì những xe mới đăng chưa có lượt đặt nào sẽ bị biến mất khỏi thống kê. Dùng hàm `COUNT(r.rental_id)` gom nhóm theo xe và sắp xếp `ORDER BY tong_so_lan_dat DESC LIMIT 5`.

---

### 💻 Query 2: Top 5 xe có DOANH THU cao nhất toàn sàn
* **Đề bài Thầy hỏi**: *"Xe được đặt nhiều chưa chắc doanh thu đã cao bằng xe sang đắt tiền. Viết query lấy ra 5 xe mang lại DOANH THU cao nhất?"*
* **Câu SQL**:
  ```sql
  SELECT 
      c.car_id,
      c.brand,
      c.model,
      c.plate_number,
      COUNT(r.rental_id) AS so_chuyen_thue,
      COALESCE(SUM(r.total_price), 0) AS tong_doanh_thu
  FROM cars c
  LEFT JOIN rentals r ON c.car_id = r.car_id 
      AND r.status IN ('COMPLETED', 'CONFIRMED', 'IN_PROGRESS')
  GROUP BY c.car_id, c.brand, c.model, c.plate_number
  ORDER BY tong_doanh_thu DESC
  LIMIT 5;
  ```
* **Kết quả thực tế trên CSDL**:
  * Top 1: **BMW 320i Sport Line** (`30H-999.66`) — **8.200.000 VNĐ** (2 chuyến).
  * Top 2: **Ford Everest Titanium 4x4** (`51L-888.99`) — **7.250.000 VNĐ** (2 chuyến).
  * Top 3: **Mercedes-Benz C200 Avantgarde** (`51K-999.88`) — **5.850.000 VNĐ** (2 chuyến).
* 👉 **Giải thích kỹ thuật**: Khác với số lượt đặt, doanh thu chỉ tính các đơn hợp lệ (`COMPLETED`, `CONFIRMED`, `IN_PROGRESS`), loại bỏ các đơn bị hủy (`CANCELLED`). Hàm `COALESCE(..., 0)` giúp thay thế giá trị `NULL` thành `0` cho các xe chưa phát sinh doanh thu.

---

### 💻 Query 3: Thống kê doanh thu sàn theo từng tháng & tính hoa hồng 10%
* **Đề bài Thầy hỏi**: *"Viết query báo cáo tài chính thống kê tổng doanh thu theo từng tháng và trích xuất số tiền hoa hồng 10% sàn DriveShare thu về?"*
* **Câu SQL**:
  ```sql
  SELECT 
      TO_CHAR(created_at, 'YYYY-MM') AS thang,
      COUNT(rental_id) AS tong_so_don,
      COALESCE(SUM(total_price), 0) AS doanh_thu_thang,
      COALESCE(SUM(total_price) * 0.10, 0) AS hoa_hong_san_10_phan_tram
  FROM rentals
  WHERE status IN ('COMPLETED', 'CONFIRMED', 'IN_PROGRESS')
  GROUP BY TO_CHAR(created_at, 'YYYY-MM')
  ORDER BY thang DESC;
  ```
* **Kết quả thực tế trên CSDL**:
  * Tháng `2026-11`: **25 đơn thành công**, tổng doanh thu **63.300.000 VNĐ**, hoa hồng sàn 10% thu về là **6.330.000 VNĐ**.
* 👉 **Giải thích kỹ thuật**: Sử dụng hàm `TO_CHAR(created_at, 'YYYY-MM')` của PostgreSQL để định dạng thời gian thành dạng năm-tháng và gom nhóm `GROUP BY`.

---

### 💻 Query 4: Top 5 khách hàng VIP chi tiêu nhiều nhất sàn (Customer Lifetime Value)
* **Đề bài Thầy hỏi**: *"Làm sao tìm ra 5 khách hàng trung thành chi nhiều tiền nhất trên hệ thống?"*
* **Câu SQL**:
  ```sql
  SELECT 
      u.user_id,
      u.full_name,
      u.email,
      u.phone,
      COUNT(r.rental_id) AS so_lan_thue,
      COALESCE(SUM(r.total_price), 0) AS tong_chi_tieu
  FROM users u
  JOIN rentals r ON u.user_id = r.renter_id
  WHERE r.status IN ('COMPLETED', 'CONFIRMED', 'IN_PROGRESS')
  GROUP BY u.user_id, u.full_name, u.email, u.phone
  ORDER BY tong_chi_tieu DESC
  LIMIT 5;
  ```
* **Kết quả thực tế trên CSDL**:
  * Top 1: **Trần Văn B** (`renter@driveshare.com`) — 7 lần thuê — Chi tiêu **18.750.000 VNĐ**.
  * Top 2: **Phạm Quốc Dũng** (`dung.pham@driveshare.com`) — 5 lần thuê — Chi tiêu **16.800.000 VNĐ**.
  * Top 3: **Nguyễn Hoàng Nam** (`nam.nguyen@driveshare.com`) — 6 lần thuê — Chi tiêu **14.800.000 VNĐ**.

---

### 💻 Query 5: Danh sách xe chờ duyệt kèm số lượng giấy tờ đã nộp
* **Đề bài Thầy hỏi**: *"Trên màn hình Admin kiểm duyệt, làm sao lấy danh sách xe đang chờ duyệt kèm thông tin liên lạc của chủ xe và số lượng giấy tờ xe đã upload?"*
* **Câu SQL**:
  ```sql
  SELECT 
      c.car_id,
      c.brand,
      c.model,
      c.plate_number,
      u.full_name AS ten_chu_xe,
      u.phone AS sdt_chu_xe,
      c.status AS trang_thai_xe,
      COUNT(cd.document_id) AS so_giay_to_da_nop
  FROM cars c
  JOIN users u ON c.owner_id = u.user_id
  LEFT JOIN car_documents cd ON c.car_id = cd.car_id
  WHERE c.status IN ('PENDING_REVIEW', 'PENDING_APPROVAL')
  GROUP BY c.car_id, c.brand, c.model, c.plate_number, u.full_name, u.phone, c.status
  ORDER BY c.car_id ASC;
  ```
* 👉 **Giải thích kỹ thuật**: Kết hợp `JOIN` với bảng `users` để lấy tên và SĐT của chủ xe, đồng thời `LEFT JOIN` với bảng `car_documents` để đếm (`COUNT`) số lượng giấy tờ (Cavet, Đăng kiểm, Bảo hiểm) đã nộp.

---

### 💻 Query 6: Phân bổ xe theo Loại nhiên liệu & Tỉnh thành
* **Đề bài Thầy hỏi**: *"Viết query phân tích thị trường: Thống kê số lượng xe và giá thuê trung bình phân bổ theo Tỉnh thành và Loại nhiên liệu?"*
* **Câu SQL**:
  ```sql
  SELECT 
      COALESCE(province, 'Chưa cập nhật') AS tinh_thanh,
      COALESCE(fuel_type, 'Chưa rõ') AS loai_nhien_lieu,
      COUNT(*) AS so_luong_xe,
      ROUND(AVG(price_per_day), 0) AS gia_thue_trung_binh
  FROM cars
  WHERE deleted_at IS NULL
  GROUP BY province, fuel_type
  ORDER BY so_luong_xe DESC, tinh_thanh ASC;
  ```
* **Kết quả thực tế trên CSDL**:
  * TP.HCM: 5 xe Xăng (giá TB 1.180.000đ), 4 xe Điện (giá TB 1.200.000đ).
  * Hà Nội: 4 xe Xăng (giá TB 1.187.500đ), 2 xe Dầu (giá TB 1.150.000đ).
* 👉 **Giải thích kỹ thuật**: Điều kiện `WHERE deleted_at IS NULL` loại trừ các xe đã bị soft-delete. Hàm `ROUND(AVG(price_per_day), 0)` tính giá thuê trung bình làm tròn.

---

### 💻 Query 7: Truy vết nhật ký kiểm toán Admin (`audit_logs`)
* **Đề bài Thầy hỏi**: *"Làm sao truy vết xem gần đây Admin đã thực hiện những hành động phê duyệt hoặc thay đổi nào trên hệ thống?"*
* **Câu SQL**:
  ```sql
  SELECT 
      log_id,
      action,
      actor_username,
      target_type,
      target_id,
      details,
      created_at
  FROM audit_logs
  ORDER BY created_at DESC
  LIMIT 10;
  ```
* **Kết quả thực tế trên CSDL**:
  * Log 2: Admin duyệt xe VinFast VF3 (`51F-2921`) thành công, xe chuyển sang `ACTIVE`.
  * Log 1: Admin duyệt hồ sơ CCCD của khách thuê `user_id = 4`.

---

### 💻 Query 8: Phân quyền RBAC: Danh sách người dùng đa vai trò
* **Đề bài Thầy hỏi**: *"Làm sao kiểm tra những người dùng nào trong hệ thống đang nắm giữ nhiều vai trò cùng một lúc?"*
* **Câu SQL**:
  ```sql
  SELECT 
      u.user_id,
      u.full_name,
      u.email,
      COUNT(DISTINCT r.role_name) AS so_vai_tro,
      STRING_AGG(r.role_name, ', ') AS danh_sach_vai_tro
  FROM users u
  JOIN user_roles ur ON u.user_id = ur.user_id
  JOIN roles r ON ur.role_id = r.role_id
  GROUP BY u.user_id, u.full_name, u.email
  HAVING COUNT(DISTINCT r.role_name) >= 1
  ORDER BY so_vai_tro DESC, u.user_id ASC;
  ```
* 👉 **Giải thích kỹ thuật**: Dùng `STRING_AGG(r.role_name, ', ')` của PostgreSQL để nối danh sách các quyền thành chuỗi đọc được (`admin`, `owner`, `renter`). Dùng mệnh đề `HAVING COUNT(DISTINCT r.role_name) >= 2` nếu muốn lọc chính xác người có từ 2 vai trò trở lên.
