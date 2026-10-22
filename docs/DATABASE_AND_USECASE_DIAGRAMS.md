# 📐 SƠ ĐỒ USE CASE & CƠ SỞ DỮ LIỆU (DATABASE ERD) — DRIVESHARE
## PHỤC VỤ BÁO CÁO & BẢO VỆ ĐỒ ÁN / THỰC TẬP TỐT NGHIỆP (K4)

> **Dự án**: DriveShare — Nền tảng chia sẻ và cho thuê xe trực tuyến P2P  
> **Phiên bản kiến trúc**: v3.0 (Sprint 3 Enterprise Edition)  
> **Hệ quản trị CSDL**: PostgreSQL 16 (Render Cloud & Docker Local)  
> **Ngôn ngữ mô hình**: UML 2.5 / Mermaid Standard

---

## PHẦN 1: USE CASE DIAGRAM (SƠ ĐỒ TRƯỜNG HỢP SỬ DỤNG)

### 1.1 Sơ đồ Use Case Tổng Quát Toàn Hệ Thống

```mermaid
flowchart TD
    %% Actors
    Renter(("🧑 Khách thuê<br/>(Renter)"))
    Owner(("🚗 Chủ xe<br/>(Car Owner)"))
    Admin(("🛡️ Quản trị / Vận hành<br/>(Admin / Staff)"))
    VietQRSystem(("💳 Cổng VietQR<br/>(Napas 247)"))
    AiSystem(("🤖 Trợ lý AI<br/>(Gemini LLM)"))

    subgraph DriveShare_System ["HỆ THỐNG NỀN TẢNG DRIVESHARE"]
        
        subgraph Mod_Auth ["1. Xác Thực & Định Danh (Auth & eKYC)"]
            UC_Register["Đăng ký tài khoản (Renter / Owner)"]
            UC_Login["Đăng nhập (Password / Google OAuth2)"]
            UC_UploadKYC["Tải lên CCCD 2 mặt & Giấy phép lái xe"]
            UC_BankConfig["Khai báo STK Ngân hàng thụ hưởng"]
        end

        subgraph Mod_Car ["2. Quản Lý Phương Tiện (Car Management)"]
            UC_PostCar["Đăng tải thông tin & ảnh xe"]
            UC_ToggleStatus["Bật/Tắt trạng thái xe (ACTIVE/INACTIVE)"]
            UC_SearchCars["Tìm kiếm & Lọc xe đa tiêu chí"]
            UC_AiConsult["Tư vấn lộ trình & gợi ý xe qua Chatbot"]
        end

        subgraph Mod_Booking ["3. Đặt Xe & Ký Quỹ (Booking & Escrow)"]
            UC_CreateBooking["Tạo yêu cầu thuê xe (Request-to-Book)"]
            UC_ApproveBooking["Duyệt / Từ chối yêu cầu đặt xe"]
            UC_PayDeposit["Thanh toán tiền cọc 30% qua VietQR"]
            UC_HoldEscrow["Sàn khóa giữ chỗ (Escrow Holding)"]
        end

        subgraph Mod_Operation ["4. Bàn Giao & Vận Hành (Operation & Inspection)"]
            UC_HandoverCheckIn["Biên bản giao xe Check-in (Km, Xăng, Ảnh 6 góc)"]
            UC_HandoverCheckOut["Biên bản trả xe Check-out & Tính phụ phí"]
            UC_DisputeNoShow["Báo cáo sự cố chủ xe bùng hẹn (No-Show Dispute)"]
        end

        subgraph Mod_Admin ["5. Quản Trị & Quyết Toán (Admin Governance)"]
            UC_AdminReviewKYC["Phê duyệt hồ sơ CCCD & STK ngân hàng"]
            UC_AdminApproveCar["Kiểm duyệt xe mới trước khi xuất bản"]
            UC_AdminResolveDispute["Phân xử khiếu nại & Kích hoạt hoàn cọc"]
            UC_PayoutOwner["Quyết toán ví thu nhập 90% cho chủ xe"]
        end

    end

    %% Renter Interactions
    Renter --> UC_Register
    Renter --> UC_Login
    Renter --> UC_UploadKYC
    Renter --> UC_SearchCars
    Renter --> UC_AiConsult
    Renter --> UC_CreateBooking
    Renter --> UC_PayDeposit
    Renter --> UC_HandoverCheckIn
    Renter --> UC_HandoverCheckOut
    Renter --> UC_DisputeNoShow

    %% Owner Interactions
    Owner --> UC_Register
    Owner --> UC_Login
    Owner --> UC_BankConfig
    Owner --> UC_PostCar
    Owner --> UC_ToggleStatus
    Owner --> UC_ApproveBooking
    Owner --> UC_HandoverCheckIn
    Owner --> UC_HandoverCheckOut

    %% Admin Interactions
    Admin --> UC_Login
    Admin --> UC_AdminReviewKYC
    Admin --> UC_AdminApproveCar
    Admin --> UC_AdminResolveDispute
    Admin --> UC_PayoutOwner

    %% External Systems Interactions
    UC_PayDeposit -.->|Tạo mã QR & Xác nhận webhook| VietQRSystem
    UC_AiConsult -.->|Truy vấn đề xuất tự nhiên| AiSystem
    UC_PayDeposit -.->|Tự động kích hoạt| UC_HoldEscrow
```

---

## PHẦN 2: DATABASE DIAGRAM (ENTITY RELATIONSHIP DIAGRAM - ERD)

### 2.1 Sơ đồ Thực Thể Mối Quan Hệ Chi Tiết (Cơ sở dữ liệu PostgreSQL)

```mermaid
erDiagram
    USERS ||--o| USER_PROFILES : "1 - 1 (Hồ sơ cá nhân & KYC)"
    USERS ||--o{ CARS : "1 - N (Chủ xe sở hữu nhiều xe)"
    USERS ||--o{ RENTALS : "1 - N (Khách thuê tạo nhiều đơn)"
    USERS ||--o{ PAYMENTS : "1 - N (Lịch sử giao dịch ví)"
    CARS ||--o{ CAR_IMAGES : "1 - N (Bộ sưu tập ảnh xe)"
    CARS ||--o{ RENTALS : "1 - N (Lịch đặt thuê của từng xe)"
    RENTALS ||--o| RENTAL_INSPECTIONS : "1 - 1 (Biên bản giao/nhận xe)"
    RENTALS ||--o{ PAYMENTS : "1 - N (Giao dịch cọc 30% / hoàn tiền)"
    RENTALS ||--o| RENTAL_DISPUTES : "1 - 1 (Khiếu nại bùng hẹn nếu có)"
    RENTALS ||--o| REVIEWS : "1 - 1 (Đánh giá sau chuyến đi)"

    USERS {
        bigint id PK "Khóa chính tự tăng"
        varchar email UK "Email đăng nhập duy nhất"
        varchar password_hash "Mật khẩu mã hóa BCrypt"
        varchar full_name "Họ và tên người dùng"
        varchar phone_number "Số điện thoại liên hệ"
        varchar role "ROLE_RENTER | ROLE_OWNER | ROLE_ADMIN"
        decimal wallet_balance "Số dư ví khả dụng (VNĐ)"
        varchar bank_name "Tên ngân hàng thụ hưởng"
        varchar bank_account_number "Số tài khoản ngân hàng"
        varchar bank_account_holder "Tên chủ tài khoản"
        boolean bank_verified "Admin đã duyệt STK hay chưa"
        varchar kyc_status "PENDING | APPROVED | REJECTED"
        timestamp created_at "Thời điểm tạo tài khoản"
    }

    USER_PROFILES {
        bigint id PK "Khóa chính"
        bigint user_id FK "Liên kết sang bảng USERS"
        varchar cccd_number "Số CCCD 12 chữ số"
        varchar cccd_front_url "URL ảnh mặt trước CCCD (Cloudinary)"
        varchar cccd_back_url "URL ảnh mặt sau CCCD (Cloudinary)"
        varchar driver_license_number "Số Giấy phép lái xe"
        varchar driver_license_url "URL ảnh bằng lái xe"
        date birth_date "Ngày tháng năm sinh"
        text address "Địa chỉ thường trú"
        timestamp updated_at "Thời điểm cập nhật hồ sơ"
    }

    CARS {
        bigint id PK "Mã định danh xe"
        bigint owner_id FK "Chủ xe sở hữu (USERS.id)"
        varchar brand "Hãng xe (Toyota, Mazda, VinFast...)"
        varchar model "Dòng xe (Vios, CX-5, VF8...)"
        int year "Năm sản xuất"
        varchar license_plate UK "Biển kiểm soát (Duy nhất)"
        int seat_count "Số chỗ ngồi (4, 5, 7 chỗ)"
        varchar transmission "MANUAL (Sàn) | AUTOMATIC (Tự động)"
        varchar fuel_type "GASOLINE (Xăng) | DIESEL (Dầu) | ELECTRIC (Điện)"
        decimal price_per_day "Đơn giá thuê 1 ngày (VNĐ)"
        decimal deposit_amount "Mức cọc cố định hoặc tính 30%"
        text description "Mô tả tiện ích, bảo hiểm, điều kiện"
        varchar status "ACTIVE | INACTIVE | PENDING_APPROVAL"
        timestamp created_at "Ngày đăng ký xe"
    }

    CAR_IMAGES {
        bigint id PK "Khóa chính"
        bigint car_id FK "Xe được chụp (CARS.id)"
        varchar image_url "Đường dẫn ảnh CDN Cloudinary"
        boolean is_thumbnail "Ảnh đại diện chính của xe"
        int display_order "Thứ tự sắp xếp hiển thị"
    }

    RENTALS {
        bigint id PK "Mã hợp đồng thuê xe"
        bigint renter_id FK "Người thuê xe (USERS.id)"
        bigint car_id FK "Phương tiện thuê (CARS.id)"
        timestamp start_time "Thời điểm nhận xe bắt đầu"
        timestamp end_time "Thời điểm trả xe kết thúc"
        int total_days "Tổng số ngày thuê"
        decimal daily_price "Đơn giá thuê tại thời điểm ký"
        decimal total_price "Tổng giá trị hợp đồng (100%)"
        decimal deposit_required "Tiền cọc giữ chỗ bắt buộc (30%)"
        decimal deposit_paid "Tiền cọc thực tế đã thanh toán"
        varchar status "PENDING | CONFIRMED | DEPOSIT_PAID | IN_PROGRESS | COMPLETED | CANCELLED | DISPUTED"
        timestamp soft_lock_until "Hạn chót thanh toán cọc (45 phút)"
        timestamp created_at "Ngày tạo hợp đồng"
    }

    RENTAL_INSPECTIONS {
        bigint id PK "Mã biên bản thẩm định xe"
        bigint rental_id FK "Liên kết hợp đồng (RENTALS.id)"
        int checkin_odometer "Số km công-tơ-mét lúc giao xe"
        int checkin_fuel_percentage "Mức nhiên liệu % lúc giao xe"
        text checkin_notes "Ghi chú vết trầy xước lúc giao"
        text checkin_photos_json "Danh sách 6 ảnh hiện trạng lúc nhận"
        int checkout_odometer "Số km lúc khách trả xe"
        int checkout_fuel_percentage "Mức nhiên liệu % lúc trả xe"
        decimal extra_fee "Phụ phí quá km / trả trễ (VNĐ)"
        timestamp checkin_time "Thời điểm hoàn thành giao xe"
        timestamp checkout_time "Thời điểm hoàn tất trả xe"
    }

    PAYMENTS {
        bigint id PK "Mã giao dịch tài chính"
        bigint rental_id FK "Hợp đồng liên quan (RENTALS.id)"
        bigint user_id FK "Người thực hiện thanh toán (USERS.id)"
        decimal amount "Số tiền giao dịch (VNĐ)"
        varchar payment_type "DEPOSIT_30 | FULL_PAYMENT | REFUND | PAYOUT_OWNER"
        varchar payment_method "VIETQR | WALLET | BANK_TRANSFER"
        varchar transaction_ref "Mã tham chiếu ngân hàng Napas"
        varchar status "PENDING | SUCCESS | FAILED"
        timestamp payment_time "Thời điểm giao dịch thành công"
    }

    RENTAL_DISPUTES {
        bigint id PK "Mã hồ sơ tranh chấp"
        bigint rental_id FK "Hợp đồng bị khiếu nại (RENTALS.id)"
        bigint reported_by_user_id FK "Khách thuê khởi tạo khiếu nại"
        varchar dispute_type "OWNER_NO_SHOW | CAR_DEFECT | LATE_HANDOVER"
        text reason "Nội dung giải trình sự việc"
        text evidence_files_json "Đường dẫn ảnh/video bằng chứng"
        varchar status "SUBMITTED | UNDER_REVIEW | RESOLVED | REJECTED"
        decimal refund_amount "Số tiền hoàn cho khách (100% cọc)"
        decimal penalty_amount "Số tiền phạt chủ xe vi phạm (500.000 VNĐ)"
        text admin_resolution_note "Kết luận xử lý của Quản trị viên"
        timestamp resolved_at "Thời điểm phân xử kết thúc"
    }

    REVIEWS {
        bigint id PK "Mã đánh giá"
        bigint rental_id FK "Hợp đồng hoàn thành (RENTALS.id)"
        bigint reviewer_id FK "Người chấm điểm"
        int rating_stars "Số sao đánh giá (1 đến 5 sao)"
        text comment "Nhận xét chất lượng dịch vụ"
        timestamp created_at "Thời điểm gửi đánh giá"
    }
```

---

## PHẦN 3: ĐẶC TẢ LOGIC TRẠNG THÁI VÒNG ĐỜI HỢP ĐỒNG (STATE MACHINE)

```mermaid
stateDiagram-v2
    [*] --> PENDING : 1. Khách gửi yêu cầu thuê (Request-to-Book)
    
    PENDING --> CONFIRMED : 2. Chủ xe chấp thuận (Soft-lock xe 45 phút)
    PENDING --> CANCELLED : 2a. Chủ xe từ chối / Khách hủy trước khi duyệt
    PENDING --> EXPIRED : 2b. Quá 24h chủ xe không phản hồi (Scheduler tự hủy)

    CONFIRMED --> DEPOSIT_PAID : 3. Khách quét VietQR cọc 30% (Hard-lock lịch xe)
    CONFIRMED --> CANCELLED : 3a. Quá 45 phút không thanh toán cọc

    DEPOSIT_PAID --> IN_PROGRESS : 4. Hai bên ký Biên bản Check-in giao xe
    DEPOSIT_PAID --> DISPUTED : 4a. Chủ xe bùng hẹn (Khách bấm Báo cáo sự cố)

    IN_PROGRESS --> COMPLETED : 5. Ký Biên bản Check-out trả xe & Quyết toán
    
    DISPUTED --> COMPLETED : 6. Admin giải quyết (Hoàn 100% cọc cho khách & Phạt chủ xe)
    
    COMPLETED --> [*] : Chuyến đi kết thúc, khách đánh giá sao ⭐
    CANCELLED --> [*]
    EXPIRED --> [*]
```

---

## 🎯 HƯỚNG DẪN TRÌNH CHIẾU DÀNH CHO NHÓM TRONG BUỔI BÁO CÁO
1. **Khi chiếu slide:** Sử dụng sơ đồ Use Case (Phần 1) để chứng minh tính hoàn thiện của 5 module nghiệp vụ và tương tác giữa 5 Actors.
2. **Khi thầy hỏi về Database:** Sử dụng sơ đồ ERD (Phần 2) để chỉ rõ:
   - Cơ chế tách bảng `USERS` và `USER_PROFILES` để tối ưu bảo mật và thời gian truy vấn danh mục.
   - Cơ chế toàn vẹn dữ liệu: `RENTALS` giữ giá trị lịch sử `daily_price` để tránh biến động khi chủ xe đổi giá thuê sau này.
   - Bảng `RENTAL_DISPUTES` và `RENTAL_INSPECTIONS` là bằng chứng bảo vệ cả hai bên theo chuẩn các app Mioto/Zoomcar.
