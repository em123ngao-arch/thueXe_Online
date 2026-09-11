# 📊 SƠ ĐỒ LUỒNG DRIVESHARE — Phiên bản dễ đọc

---

## 1. TỔNG QUAN — Ai làm gì?

```mermaid
flowchart LR
    subgraph Renter ["🧑 Khách thuê xe"]
        R1["Đăng ký / Đăng nhập"]
        R2["Upload GPLX"]
        R3["Tìm xe"]
        R4["Đặt xe"]
        R5["Thanh toán cọc"]
        R6["Nhận xe"]
        R7["Trả xe"]
        R8["Đánh giá"]
    end

    subgraph Owner ["🚗 Chủ xe"]
        O1["Đăng xe lên hệ thống"]
        O2["Duyệt yêu cầu thuê"]
        O3["Giao xe"]
        O4["Nhận lại xe"]
        O5["Đánh giá khách"]
    end

    subgraph Staff ["👨‍💼 Nhân viên"]
        S1["Duyệt xe mới"]
        S2["Duyệt GPLX"]
        S3["Xử lý khiếu nại"]
    end

    subgraph Admin ["🛡️ Quản trị"]
        A1["Quản lý user"]
        A2["Quản lý xe + booking"]
        A3["Cấu hình chính sách"]
        A4["Xem báo cáo"]
    end
```

---

## 2. QUAN HỆ CÁC BẢNG — Nhìn tổng quan

```mermaid
flowchart TB
    USERS["👤 users"] --> ROLES["🔑 user_roles → roles"]
    USERS --> RENTER["📋 renter_profiles<br/>GPLX"]
    USERS --> RESET["🔒 password_reset_tokens"]
    USERS --> CARS["🚗 cars"]
    USERS --> BOOKING["📝 bookings"]
    USERS --> NOTI["🔔 notifications"]
    USERS --> FAV["❤️ favorites"]
    USERS --> AUDIT["📜 audit_logs"]

    CARS --> IMG["🖼️ car_images"]
    CARS --> DOC["📄 car_documents"]
    CARS --> AME["✨ car_amenities → amenities"]
    CARS --> AVA["📅 car_availabilities"]

    BOOKING --> PAY["💳 payments"]
    BOOKING --> HAND["🤝 handover_records"]
    BOOKING --> REV["⭐ reviews"]
    BOOKING --> COMP["🚨 complaints"]

    HAND --> HIMG["📸 handover_images"]
    COMP --> EVID["📎 complaint_evidence"]

    style USERS fill:#4CAF50,color:white
    style CARS fill:#2196F3,color:white
    style BOOKING fill:#FF9800,color:white
```

---

## 3. LUỒNG ĐĂNG KÝ & ĐĂNG NHẬP

```mermaid
flowchart TD
    A["Người dùng mở app"] --> B{"Đã có tài khoản?"}

    B -->|Chưa| C["Nhập email, mật khẩu, họ tên"]
    C --> D["Chọn vai trò: Khách thuê / Chủ xe"]
    D --> E["Bấm Đăng ký"]
    E --> F{"Email đã tồn tại?"}
    F -->|Có| G["❌ Báo lỗi email trùng"]
    G --> C
    F -->|Chưa| H["✅ Tạo tài khoản thành công"]
    H --> I["Chuyển sang trang Đăng nhập"]

    B -->|Rồi| I
    I --> J["Nhập email + mật khẩu"]
    J --> K{"Đúng mật khẩu?"}
    K -->|Sai| L["❌ Sai email hoặc mật khẩu"]
    L --> J
    K -->|Đúng| M["✅ Đăng nhập thành công"]
    M --> N{"Vai trò?"}
    N -->|Khách thuê| P1["→ Trang tìm xe"]
    N -->|Chủ xe| P2["→ Trang quản lý xe"]
    N -->|Staff| P3["→ Trang duyệt"]
    N -->|Admin| P4["→ Dashboard"]

    style H fill:#4CAF50,color:white
    style M fill:#4CAF50,color:white
    style G fill:#f44336,color:white
    style L fill:#f44336,color:white
```

---

## 4. LUỒNG ĐĂNG XE — Owner

```mermaid
flowchart TD
    A["Owner bấm Đăng xe mới"] --> B["Bước 1: Nhập thông tin xe<br/>Hãng, đời, biển số, số chỗ, hộp số"]
    B --> C["Bước 2: Upload ảnh xe<br/>Tối thiểu 3 ảnh"]
    C --> D["Bước 3: Upload giấy tờ<br/>Đăng ký xe + Bảo hiểm"]
    D --> E["Bước 4: Chọn tiện ích<br/>GPS, camera, bluetooth..."]
    E --> F["Bước 5: Đặt giá + Lịch<br/>Giá/ngày, phụ phí, lịch sẵn sàng"]
    F --> G["Bấm Lưu nháp"]
    G --> H["Xe ở trạng thái DRAFT"]
    H --> I["Owner bấm Gửi duyệt"]
    I --> J["Xe chuyển sang PENDING"]
    J --> K["📩 Staff nhận thông báo"]

    K --> L{"Staff xem xét"}
    L -->|"✅ Duyệt"| M["Xe → ACTIVE<br/>Hiện trên trang tìm kiếm"]
    L -->|"❌ Từ chối"| N["Xe → REJECTED<br/>Kèm lý do"]
    N --> O["Owner sửa lại → Gửi duyệt lại"]
    O --> J

    style M fill:#4CAF50,color:white
    style N fill:#f44336,color:white
    style H fill:#90CAF9
```

### Trạng thái xe — Chuyển đổi như thế nào?

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Tạo mới
    DRAFT --> PENDING: Gửi duyệt
    PENDING --> ACTIVE: Staff duyệt
    PENDING --> REJECTED: Staff từ chối
    REJECTED --> PENDING: Sửa và gửi lại
    ACTIVE --> INACTIVE: Owner ẩn xe
    INACTIVE --> ACTIVE: Owner bật lại
```

---

## 5. ⭐ LUỒNG ĐẶT XE — Luồng quan trọng nhất

```mermaid
flowchart TD
    A["🔍 Renter tìm xe<br/>Chọn địa điểm, ngày, giá"] --> B["Xem danh sách xe phù hợp"]
    B --> C["Chọn 1 xe → Xem chi tiết"]
    C --> D["Bấm ĐẶT XE"]

    D --> E{"Kiểm tra GPLX?"}
    E -->|"Chưa có / Chưa duyệt"| F["❌ Yêu cầu upload GPLX trước"]
    E -->|"Đã duyệt ✅"| G{"Xe còn trống<br/>ngày này không?"}
    G -->|"Trùng lịch"| H["❌ Xe đã có người đặt"]
    G -->|"Còn trống"| I["✅ Tạo đơn đặt xe<br/>Trạng thái: PENDING"]

    I --> J["📩 Owner nhận thông báo<br/>Có yêu cầu thuê xe mới"]

    J --> K{"Owner phản hồi?"}
    K -->|"✅ Xác nhận"| L["Đơn → CONFIRMED<br/>⏰ Renter có 2 giờ để cọc"]
    K -->|"❌ Từ chối"| M["Đơn → REJECTED"]
    K -->|"⏰ Im lặng > 24h"| N["Đơn → EXPIRED<br/>Hệ thống tự hủy"]

    L --> O{"Renter thanh toán cọc?"}
    O -->|"✅ Thanh toán<br/>trong 2 giờ"| P["Đơn → DEPOSIT_PAID<br/>🎉 Đặt xe thành công!"]
    O -->|"⏰ Quá 2 giờ<br/>chưa thanh toán"| Q["Đơn → CANCELLED<br/>Hệ thống tự hủy"]

    P --> R["⏳ Chờ đến ngày nhận xe..."]

    style I fill:#2196F3,color:white
    style P fill:#4CAF50,color:white
    style F fill:#f44336,color:white
    style H fill:#f44336,color:white
    style M fill:#f44336,color:white
    style N fill:#FF9800,color:white
    style Q fill:#FF9800,color:white
```

---

## 6. LUỒNG GIAO XE & TRẢ XE

```mermaid
flowchart TD
    subgraph PICKUP ["📋 GIAO XE — Ngày nhận xe"]
        P1["Owner lập biên bản giao xe"]
        P2["Ghi: số km, % xăng, tình trạng xe"]
        P3["Chụp ảnh xe 6 góc"]
        P4["Owner bấm XÁC NHẬN"]
        P5["Renter xem biên bản"]
        P6["Renter bấm XÁC NHẬN"]
        P7["✅ Cả 2 bên xác nhận<br/>Đơn → IN_PROGRESS"]
        P1 --> P2 --> P3 --> P4 --> P5 --> P6 --> P7
    end

    P7 --> DRIVING["🚗 ĐANG THUÊ<br/>Renter sử dụng xe"]

    subgraph RETURN ["📋 TRẢ XE — Ngày trả xe"]
        T1["Renter lập biên bản trả xe"]
        T2["Ghi: số km cuối, % xăng còn lại"]
        T3["Chụp ảnh xe khi trả"]
        T4["Hệ thống tự tính phụ phí"]
        T5["Owner xem biên bản + phụ phí"]
        T6["Cả 2 bên xác nhận"]
        T7["✅ Đơn → COMPLETED"]
        T1 --> T2 --> T3 --> T4 --> T5 --> T6 --> T7
    end

    DRIVING --> T1

    T7 --> EXTRA{"Có phụ phí?"}
    EXTRA -->|"Không"| DONE["🎉 Hoàn thành!"]
    EXTRA -->|"Có"| PAY_EXTRA["Renter thanh toán<br/>phụ phí bổ sung"]
    PAY_EXTRA --> DONE

    style P7 fill:#2196F3,color:white
    style T7 fill:#4CAF50,color:white
    style DRIVING fill:#FF9800,color:white
    style DONE fill:#4CAF50,color:white
```

### Phụ phí tính thế nào?

```mermaid
flowchart LR
    A["Km cuối - Km nhận<br/>= Km đã chạy"] --> B{"Vượt km<br/>miễn phí?"}
    B -->|Có| C["Km vượt × phí/km"]
    B -->|Không| D["0đ"]

    E["Giờ trả thực tế<br/>- Giờ hẹn trả"] --> F{"Trả trễ?"}
    F -->|Có| G["Số giờ trễ × phí/giờ"]
    F -->|Không| H["0đ"]

    C --> I["TỔNG PHỤ PHÍ"]
    D --> I
    G --> I
    H --> I

    style I fill:#FF9800,color:white
```

---

## 7. LUỒNG HỦY ĐƠN & HOÀN TIỀN

```mermaid
flowchart TD
    A["Renter hoặc Owner muốn hủy"] --> B{"Đơn đang ở<br/>trạng thái nào?"}

    B -->|"PENDING<br/>hoặc CONFIRMED"| C["✅ Hủy miễn phí<br/>Chưa mất gì"]
    B -->|"DEPOSIT_PAID<br/>Đã cọc rồi"| D{"Còn bao lâu<br/>tới ngày nhận xe?"}
    B -->|"IN_PROGRESS<br/>Đang đi rồi"| E["❌ Không hủy được"]

    D -->|"Còn >= 48 giờ"| F["Hoàn 100% cọc 💚"]
    D -->|"Còn 24h - 48h"| G["Hoàn 70% cọc 🟡"]
    D -->|"Còn < 24 giờ"| H["Mất hết tiền cọc 🔴"]

    C --> I["Đơn → CANCELLED"]
    F --> I
    G --> I
    H --> I
    I --> J["📩 Thông báo cho 2 bên"]
    J --> K["Lịch xe được giải phóng"]

    style C fill:#4CAF50,color:white
    style F fill:#4CAF50,color:white
    style G fill:#FF9800,color:white
    style H fill:#f44336,color:white
    style E fill:#f44336,color:white
```

---

## 8. ⭐ VÒNG ĐỜI 1 BOOKING — Toàn cảnh

> Nhìn sơ đồ này là hiểu toàn bộ hệ thống

```mermaid
stateDiagram-v2
    [*] --> PENDING: Renter đặt xe

    PENDING --> CONFIRMED: Owner đồng ý
    PENDING --> REJECTED: Owner từ chối
    PENDING --> EXPIRED: Quá 24h không phản hồi
    PENDING --> CANCELLED: Renter tự hủy

    CONFIRMED --> DEPOSIT_PAID: Renter cọc tiền
    CONFIRMED --> CANCELLED: Quá 2h chưa cọc

    DEPOSIT_PAID --> IN_PROGRESS: Giao xe OK
    DEPOSIT_PAID --> CANCELLED: Hủy trước ngày nhận

    IN_PROGRESS --> COMPLETED: Trả xe OK
    IN_PROGRESS --> DISPUTED: Có tranh chấp

    DISPUTED --> COMPLETED: Staff xử lý xong

    COMPLETED --> [*]
    REJECTED --> [*]
    EXPIRED --> [*]
    CANCELLED --> [*]
```

**Giải thích đơn giản:**

| Trạng thái | Nghĩa là gì? | Ai hành động tiếp? |
|---|---|---|
| **PENDING** | Renter vừa đặt, chờ Owner | Owner duyệt trong 24h |
| **CONFIRMED** | Owner đồng ý, chờ cọc | Renter thanh toán trong 2h |
| **DEPOSIT_PAID** | Đã cọc xong, chờ ngày nhận | Đến ngày → giao xe |
| **IN_PROGRESS** | Đang trong chuyến đi | Đến hạn → trả xe |
| **COMPLETED** | Xong xuôi | Cả 2 bên đánh giá |
| **REJECTED** | Owner từ chối | Renter đặt xe khác |
| **EXPIRED** | Owner im lặng quá 24h | Hệ thống tự hủy |
| **CANCELLED** | Đã hủy | Hoàn tiền theo chính sách |
| **DISPUTED** | Có tranh chấp | Staff xử lý |

---

## 9. LUỒNG ĐÁNH GIÁ & KHIẾU NẠI

```mermaid
flowchart TD
    A["Chuyến đi COMPLETED"] --> B{"Renter muốn gì?"}

    B -->|"Đánh giá"| C["Chấm sao 1-5 ⭐<br/>Viết bình luận"]
    C --> D["Gửi đánh giá cho Owner + xe"]
    D --> E["Hiện trên trang xe<br/>và hồ sơ Owner"]

    B -->|"Khiếu nại"| F["Viết nội dung khiếu nại"]
    F --> G["Upload bằng chứng<br/>ảnh, video"]
    G --> H["📩 Gửi → Staff nhận"]
    H --> I["🤖 AI tóm tắt nội dung"]
    I --> J["Staff xem xét + xử lý"]
    J --> K["📩 Kết quả → Renter"]

    L["Owner cũng đánh giá Renter"] --> E

    style D fill:#4CAF50,color:white
    style K fill:#2196F3,color:white
```

---

## 10. HỆ THỐNG TỰ ĐỘNG — Chạy ngầm

```mermaid
flowchart TD
    subgraph AUTO ["⏰ Hệ thống chạy tự động mỗi phút"]
        A["Đơn PENDING > 24h?"] -->|Có| A1["→ Tự chuyển EXPIRED"]
        B["Đơn CONFIRMED > 2h<br/>chưa thanh toán?"] -->|Có| B1["→ Tự chuyển CANCELLED"]
        C["Còn 24h là nhận xe?"] -->|Có| C1["→ Gửi email nhắc Renter"]
        D["Còn 24h là trả xe?"] -->|Có| D1["→ Gửi email nhắc cả 2 bên"]
    end

    style A1 fill:#f44336,color:white
    style B1 fill:#FF9800,color:white
    style C1 fill:#2196F3,color:white
    style D1 fill:#2196F3,color:white
```

---

## 📌 TÓM TẮT — Luồng chính chỉ cần nhớ

```
Renter đặt xe → Owner duyệt → Renter cọc → Giao xe → Đi → Trả xe → Đánh giá
   PENDING    →  CONFIRMED  → DEPOSIT_PAID → IN_PROGRESS        → COMPLETED
```

Nếu bất kỳ bước nào timeout hoặc hủy → đơn chuyển sang **CANCELLED** / **EXPIRED** và hoàn tiền theo chính sách.
