# 🚗 TÀI LIỆU KIẾN TRÚC & ĐẶC TẢ NGHIỆP VỤ PHỤC VỤ LÀM SLIDE BẢO VỆ ĐỒ ÁN
> **Dự án**: DriveShare - Nền Tảng Cho Thuê Xe Tự Lái Trực Tuyến (Car Rental Platform)  
> **Repository**: `Spring_ThucTap_k4`  
> **Đối tượng sử dụng**: Dữ liệu đầu vào chuẩn (Ground Truth Prompt) dành cho AI tạo Slide thuyết trình bảo vệ đồ án.  
> **Nguyên tắc cốt lõi**: **100% đối soát từ mã nguồn thực tế — Không bịa tính năng ngoài code — Phân định rõ "Đã làm được" và "Chưa làm / Hạn chế"**.

---

## 📌 CHỈ DẪN DÀNH CHO AI TẠO SLIDE (PROMPT INSTRUCTIONS)
*Khi nhận tài liệu này để thiết kế slide, AI hãy tuân thủ:*
1. **Không tự suy diễn tính năng**: Nếu tài liệu ghi "Chưa làm / Không có", tuyệt đối không đưa vào slide dưới dạng tính năng đã hoàn thiện.
2. **Nhấn mạnh vào điểm mạnh kỹ thuật**: Làm nổi bật cơ chế **Khóa bi quan (`PESSIMISTIC_WRITE`)**, **Khóa 2 tầng (Soft Lock 45 phút $\rightarrow$ Hard Lock)**, và **Tự động hóa phạt trễ hạn Điều 175 BLHS**.
3. **Trung thực ở phần Hạn chế**: Đưa các điểm chưa làm vào slide "Hạn chế & Hướng phát triển" để tăng tính thuyết phục trước Hội đồng chấm điểm.

---

## 🛑 BẢNG ĐỐI CHIẾU THỰC TẾ (FACT-CHECK MATRIX)

| Thành phần | ✅ THỰC TẾ TRONG CODE ĐÃ LÀM (Được phép đưa vào slide) | ❌ THỰC TẾ KHÔNG CÓ / CHƯA LÀM (Tuyệt đối KHÔNG bịa) |
| :--- | :--- | :--- |
| **Cổng thanh toán** | - Sinh mã **VietQR** động chuẩn ngân hàng qua URL `https://img.vietqr.io` kèm số tiền cọc 30% và memo `DSPAY...`.<br>- Xác nhận cọc qua API `POST /api/v1/payments/{id}/confirm` (mô phỏng Webhook). | - **KHÔNG CÓ Webhook ngân hàng tự động thực tế** (chưa tích hợp Casso/SePay).<br>- **KHÔNG CÓ cổng VNPay, MoMo, ZaloPay, Stripe** (chỉ có chữ Enum `VNPAY` khai báo chờ sẵn, không có code xử lý). |
| **Xác thực hồ sơ (eKYC)** | - Khách upload ảnh CCCD 2 mặt, ảnh GPLX.<br>- Chủ xe upload ảnh CCCD, Tên & Số tài khoản ngân hàng thụ hưởng.<br>- **Admin vào portal xem ảnh và bấm Duyệt/Từ chối thủ công** (`verify-cccd`, `approve-license`). | - **KHÔNG CÓ AI OCR tự động quét chữ trên ảnh** (không có Tesseract hay FPT.AI).<br>- **KHÔNG CÓ Face Matching / Liveness Detection** so khớp khuôn mặt với CCCD.<br>*(Chỉ ghi: "Hồ sơ eKYC số hóa & Admin thẩm định thủ công")*. |
| **Trợ lý ảo AI Chatbot** | - Tích hợp gọi REST API **Google Gemini 2.5 Flash** bằng Java `HttpClient` khi cấu hình `GEMINI_API_KEY`.<br>- Lưu lịch sử trò chuyện theo phiên vào PostgreSQL bảng `chat_memory`.<br>- **Heuristic Regex Fallback**: Khi không có key, tự bóc tách tiếng Việt (ngày, giá, số chỗ, hộp số) để query DB xe và tính cọc 30%. | - **KHÔNG CÓ Vector Database hay Embeddings** (không dùng ChromaDB, Pinecone, pgvector). Chỉ là Prompt RAG chèn danh sách xe trực tiếp và Heuristic Regex. |
| **Thông báo (Notification)** | - Lưu dữ liệu thông báo vào bảng `notifications` trong CSDL.<br>- Hiển thị trên chuông Header qua API REST `GET /api/v1/notifications/my-notifications` khi tải trang (REST Polling). | - **KHÔNG CÓ WebSocket / Socket.io / STOMP**.<br>- **KHÔNG CÓ Push Notification qua Firebase (FCM)**. |
| **Email & SMS OTP** | - Có bảng lưu token đổi email (`email_change_tokens`) và token quên mật khẩu (`password_reset_tokens`). | - **KHÔNG CÓ máy chủ gửi Email SMTP thực tế** (`pom.xml` không có `spring-boot-starter-mail`). Token chỉ in ra console log backend. |
| **Bản đồ (Map / GIS)** | - Bảng `cars` lưu tọa độ số thực `latitude`, `longitude` và địa chỉ `address`, `province`.<br>- Lọc tìm kiếm xe theo danh mục Tỉnh/Thành phố dạng text dropdown. | - **KHÔNG CÓ bản đồ tương tác hiển thị xe** (không nhúng Leaflet, Mapbox, Google Maps JavaScript SDK). |
| **Biểu đồ (Dashboard Charts)** | - Các thẻ thống kê doanh thu, số lượng xe, số người dùng tại trang Admin và Chủ xe code bằng HTML/CSS Flexbox thuần. | - **KHÔNG CÓ thư viện Chart** (không nhúng Chart.js, ApexCharts hay Highcharts). |
| **Khóa & Đồng thời** | - **Khóa bi quan `PESSIMISTIC_WRITE`** (`SELECT ... FOR UPDATE`) chống Overbooking và hoàn cọc 2 lần.<br>- Soft Lock 45 phút $\rightarrow$ Hard Lock Cọc 30%.<br>- Scheduler tự động giải phóng đơn hết hạn và khôi phục đơn `ON_HOLD`.<br>- Tự động phạt trễ hạn `OVERDUE` và đưa vào Blacklist sau 24h. | - **ĐÃ HOÀN THIỆN 100% TRONG CODE** (Đã có sẵn 188 bài Unit, Integration & Concurrency Test kiểm thử tự động). |

---

## 1. TECH STACK & KIẾN TRÚC HỆ THỐNG THỰC TẾ

### 1.1 Mô hình kiến trúc
- **Kiến trúc tổng thể**: **Client-Server phân tách độc lập (Decoupled Architecture)** giao tiếp qua **RESTful API** bọc trong format chuẩn `ApiResponse<T>`.
- **Backend Architecture**: **Spring Boot Layered Modular Architecture** (Controller $\rightarrow$ Service / ServiceImpl $\rightarrow$ Repository $\rightarrow$ JPA Entity) phân chia theo 9 module nghiệp vụ (`auth`, `user`, `car`, `rental`, `payment`, `notification`, `ai`, `admin`, `oauth2`).
- **Phân hệ Trợ lý ảo AI**: **Hybrid AI Assistant** kết hợp mô hình ngoại vi (Google Gemini 2.5 Flash) và bộ máy dự phòng Heuristic Rule-based Engine nội bộ.

### 1.2 Frontend Stack
- **Core Technology**: Vanilla HTML5, Modern CSS3, JavaScript ES6+ (Native Modules & Scripts). Không dùng framework nặng (React/Vue/Angular) nhằm tối ưu hiệu năng tải trang tĩnh và kiểm soát DOM trực tiếp.
- **UI Framework & Styling**: Bootstrap 5, FontAwesome 6.5.1, Google Fonts (Plus Jakarta Sans), bộ Design Tokens CSS tự viết (`base.css`, `components.css`, `portals.css`, `mioto-time.css`, `trip-tracker.css`).
- **State Management**: `localStorage` và `sessionStorage` bọc qua `storage.js`, kết hợp in-memory state của JavaScript.
- **Bản đồ / Biểu đồ**:
  - *Bản đồ*: Quản lý tọa độ `latitude`, `longitude` và địa chỉ hành chính trong database; giao diện lọc theo dropdown Tỉnh/Thành phố. Không nhúng map tương tác.
  - *Biểu đồ*: Metrics Cards, thanh tỷ lệ % CSS và bảng dữ liệu HTML tùy biến, không sử dụng thư viện Chart ngoài.

### 1.3 Backend Stack
- **Ngôn ngữ**: Java 17 / 21+ (OpenJDK).
- **Framework cốt lõi**: Spring Boot 3.3.4 (`spring-boot-starter-web`, `spring-boot-starter-security`, `spring-boot-starter-data-jpa`, `spring-boot-starter-validation`, `spring-boot-starter-oauth2-client`).
- **ORM / Data Access**: Hibernate ORM 6 & Spring Data JPA, hỗ trợ Dynamic Queries với `JpaSpecificationExecutor` (`CarSpecification`), JPQL Queries, và Spring Task Scheduler (`@Scheduled`).
- **Tài liệu API**: SpringDoc OpenAPI 2.6.0 (`/swagger-ui.html` & `/v3/api-docs`).

### 1.4 Database & Lưu trữ
- **CSDL chính**: PostgreSQL 16 Alpine chạy Docker container (cổng `5432`), quản trị trực quan qua Adminer Web (cổng `8088`).
- **CSDL dự phòng**: H2 In-Memory Database (`-Dspring-boot.run.profiles=h2`).
- **Lưu trữ tệp (Hybrid Storage)**:
  - *Primary*: Cloudinary CDN (`cloudinary-http44:1.36.0`) tự động nén chất lượng WebP/AVIF cho ảnh xe, giấy tờ và video khiếu nại.
  - *Fallback*: Local Disk Storage lưu vào thư mục `backend/uploads/` khi không có Cloudinary credentials.

### 1.5 Bảo mật & Tích hợp
- **Xác thực & Phân quyền**: Stateless JWT (`jjwt 0.12.6`), mã hóa BCrypt, cơ chế thu hồi token ngay khi đổi mật khẩu (`token_version`), tự động khóa tài khoản sau 5 lần sai pass.
- **Xác thực bên thứ 3**: Google OAuth2 Client (`spring-boot-starter-oauth2-client` + Google Identity Services SDK).
- **Cổng thanh toán**: VietQR (tự động sinh mã QR chuyển khoản chứa số tiền cọc 30% và mã nội dung đối soát `DSPAY...`).
- **Thông báo**: In-app Notification lưu CSDL (bảng `notifications`), client lấy qua REST Polling định kỳ.
- **Trợ lý AI**: Google Gemini API (`gemini-2.5-flash`) kèm Heuristic Regex tiếng Việt tự động dự phòng.

---

## 2. THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

### 2.1 Danh mục 15 Bảng / Entities cốt lõi
1. `users`: Tài khoản, định danh CCCD, trạng thái khóa, số lần đăng nhập sai, `token_version`.
2. `roles` & `user_roles`: Danh mục và liên kết vai trò người dùng (Many-to-Many).
3. `owner_profiles`: Hồ sơ chủ xe, ảnh CCCD 2 mặt, thông tin ngân hàng thụ hưởng (Bank Name, Account No), trạng thái duyệt ví.
4. `renter_profiles`: Hồ sơ khách thuê, số GPLX (hạng B1/B2), ngày cấp, hạn dùng, ảnh chụp 2 mặt bằng lái.
5. `cars`: Xe cho thuê, biển số, thông số kỹ thuật, giá thuê/ngày, cấu hình tài xế, tọa độ, trạng thái duyệt.
6. `car_images` & `car_documents`: Ảnh chi tiết xe và giấy tờ lưu hành (đăng kiểm, bảo hiểm).
7. `car_calendar_blocks`: Khoảng thời gian chủ xe chủ động chặn lịch bận (Blackout Dates).
8. `rentals`: Đơn thuê xe, vòng đời hợp đồng, cọc 30%, thời hạn 45m giữ chỗ, phí phạt trễ hạn.
9. `payments`: Bản ghi cọc VietQR, mã đối soát, ảnh QR động, trạng thái thanh toán.
10. `rental_inspections`: Biên bản giao nhận xe 2 chiều (CHECK_IN và CHECK_OUT), ODO, vạch xăng, ảnh hiện trường, phụ phí.
11. `rental_disputes`: Khiếu nại sự cố không nhận xe, bằng chứng ảnh/video, số tiền hoàn cọc, ghi chú xử lý của Admin.
12. `reviews`: Đánh giá 1-5 sao và nhận xét của khách thuê sau chuyến đi.
13. `notifications`: Hòm thư thông báo in-app realtime cho từng người dùng.
14. `chat_memory`: Lưu trữ ngữ cảnh lịch sử trò chuyện AI theo phiên (`session_id`).
15. `auth_sessions`, `password_reset_tokens`, `email_change_tokens`, `audit_logs`: Quản lý phiên và nhật ký kiểm toán.

---

### 2.2 Chi tiết 2 Bảng Cốt Lõi: `rentals` & `cars`

#### A. Bảng `rentals` (Đơn thuê xe)
- **Khóa chính**: `rental_id` (BIGINT, IDENTITY).
- **Khóa ngoại**:
  - `car_id` $\rightarrow$ Liên kết `cars(car_id)`.
  - `renter_id` $\rightarrow$ Liên kết `users(user_id)`.
- **Trường trạng thái quan trọng (`status` - `ERentalStatus`)**:
  - `PENDING_APPROVAL`: Khách đã gửi yêu cầu thuê, chờ chủ xe duyệt.
  - `WAITING_PAYMENT`: Đã duyệt, kích hoạt **Soft Lock 45 phút** chờ khách cọc 30%.
  - `ON_HOLD`: Bị tạm hoãn do trùng khung giờ Soft Lock với đơn khác.
  - `CONFIRMED`: Đã thanh toán cọc 30%, kích hoạt **Hard Lock** khóa lịch xe.
  - `IN_PROGRESS`: Đã bàn giao xe (Check-in), đang trong hành trình.
  - `OVERDUE`: Quá thời hạn kết thúc hợp đồng (`endDate`) nhưng chưa làm thủ tục Check-out trả xe.
  - `COMPLETED`: Đã hoàn thành Check-out trả xe, đối soát phụ phí và nghiệm thu cuốc.
  - `EXPIRED`: Hết hạn 45 phút giữ chỗ mà khách không đặt cọc.
  - `REJECTED`: Bị từ chối bởi chủ xe hoặc hệ thống tự động từ chối do trùng lịch với đơn đã chốt cọc.
  - `DISPUTED`: Đang phát sinh khiếu nại tranh chấp bàn giao xe, đóng băng cọc chờ Admin phân xử.
- **Trường nghiệp vụ tài chính & thời gian**:
  - `start_date`, `end_date`, `total_days`: Khoảng thời gian và số ngày thuê.
  - `price_per_day`, `total_price`: Đơn giá ngày và tổng giá trị đơn thuê.
  - `deposit_amount`: Giá trị cọc bắt buộc **30%** tính toán tự động.
  - `payment_expires_at`: Mốc thời gian chính xác hết hạn 45 phút giữ chỗ.
  - `with_driver`, `driver_fee`: Tùy chọn thuê kèm tài xế và phụ phí tài xế.
  - `overdue_hours`, `penalty_fee`: Số giờ quá hạn trả xe và số tiền phạt tích lũy.
  - `is_blacklisted_triggered`: Cờ đánh dấu tài khoản bị xử phạt danh sách đen.

#### B. Bảng `cars` (Xe cho thuê)
- **Khóa chính**: `car_id` (BIGINT, IDENTITY).
- **Khóa ngoại**:
  - `owner_id` $\rightarrow$ Liên kết `users(user_id)` (chủ xe).
  - `approved_by` $\rightarrow$ Liên kết `users(user_id)` (Admin duyệt xe).
- **Trường trạng thái quan trọng (`status` - `ECarStatus`)**:
  - `PENDING_REVIEW`: Xe mới đăng, chờ Admin duyệt giấy tờ và ảnh.
  - `APPROVED`: Đã được Admin phê duyệt đủ điều kiện.
  - `ACTIVE`: Xe đang sẵn sàng hiển thị trên sàn cho khách tìm kiếm và đặt lịch.
  - `INACTIVE`: Chủ xe chủ động tạm ngưng cho thuê.
  - `REJECTED`: Bị Admin từ chối phê duyệt (kèm lý do `rejection_reason`).
  - `SUSPENDED`: Xe bị hệ thống đình chỉ do vi phạm quy chế hoặc tranh chấp.
- **Thông số xe & Soft-delete**:
  - `plate_number`: Biển số xe (`UNIQUE`).
  - `brand`, `model`, `year`, `color`, `seats`, `transmission`, `fuel_type`.
  - `price_per_day`, `has_driver_service`, `driver_fee_per_day`.
  - `address`, `province`, `latitude`, `longitude`.
  - `rating`, `rating_count`.
  - `deleted_at`, `deleted_by`: Cơ chế **Soft Delete** kế thừa từ `BaseEntity` (không xóa cứng khỏi DB).

---

## 3. PHÂN QUYỀN (ROLES) & CHỨC NĂNG ĐÃ CODE HOÀN THIỆN

Triển khai chuẩn **RBAC (Role-Based Access Control)** với 3 vai trò chính:

### 3.1 Khách thuê xe (`ROLE_RENTER`) - Đã hoàn thiện
- Đăng ký, đăng nhập Local JWT & Google OAuth2, cập nhật hồ sơ cá nhân.
- Tải ảnh CCCD 2 mặt và Giấy phép lái xe (GPLX B1/B2) phục vụ xác thực eKYC.
- Bộ lọc tìm kiếm xe đa tiêu chí (địa điểm/tỉnh thành, ngày thuê, khoảng giá, số chỗ, hộp số, nhiên liệu, có tài xế).
- Trợ lý AI Assistant: Widget chatbox tư vấn chọn xe, tính trước số tiền cọc 30% và tiền thanh toán còn lại 70%.
- Gửi yêu cầu đặt xe: Ràng buộc tối đa 3 đơn chờ duyệt, miễn kiểm tra bằng lái nếu chọn "Thuê có tài xế", hỗ trợ đặt theo ngày hoặc theo giờ (4h - 8h).
- Thanh toán cọc VietQR 30%: Quét mã QR ngân hàng tự động, xác nhận cọc để chuyển sang `CONFIRMED`.
- Theo dõi hành trình (Trip Tracker Modal): Theo dõi tiến trình 5 nấc (*Chờ duyệt $\rightarrow$ Chờ cọc $\rightarrow$ Đã chốt $\rightarrow$ Đang đi $\rightarrow$ Hoàn tất/Quá hạn*).
- Xác nhận bàn giao nhận xe Check-in và trả xe Check-out đối soát ODO/nhiên liệu.
- Đánh giá 1-5 sao hoặc gửi khiếu nại không nhận xe (No-Show) kèm video/ảnh làm bằng chứng để đóng băng cọc.

### 3.2 Chủ xe / Đối tác P2P (`ROLE_OWNER`) - Đã hoàn thiện
- Đăng ký thông tin ngân hàng thụ hưởng (Tên ngân hàng, Số tài khoản, Chủ tài khoản) và CCCD.
- Đăng xe mới, tải ảnh xe/giấy tờ lưu hành lên Cloudinary/Local, bật/tắt trạng thái xe (`ACTIVE` / `INACTIVE`), xóa mềm xe.
- Chặn lịch bận (Calendar Blackout): Chủ động khóa các ngày xe bận bảo dưỡng hoặc việc gia đình.
- Duyệt đơn khách: Kích hoạt **Soft Lock 45 phút**, tự động chuyển các đơn trùng lịch sang `ON_HOLD` hoặc Từ chối đơn có lý do.
- Bàn giao xe (Check-in): Ghi nhận ODO xuất phát, mức xăng ban đầu, chụp ảnh hiện trạng xe gửi khách xác nhận.
- Thu hồi xe (Check-out): Ghi nhận ODO trả về, mức xăng thực tế, kê khai phụ phí phát sinh (nếu trễ giờ, hao xăng, hư hại).
- Cổng doanh thu (Owner Earnings Portal): Theo dõi tổng doanh thu, số dư khả dụng, lịch sử giao dịch cọc 30%.

### 3.3 Quản trị viên (`ROLE_ADMIN` & `ROLE_STAFF`) - Đã hoàn thiện
- Dashboard tổng quan: Thống kê số lượng người dùng, xe đang hoạt động, đơn thuê, tổng cọc VietQR đã thu.
- Quản trị người dùng: Tìm kiếm, lọc theo vai trò/trạng thái, khóa tài khoản vi phạm (`BLOCKED`) hoặc kích hoạt lại.
- Thẩm định hồ sơ giấy tờ: Xem ảnh duyệt CCCD/GPLX của Renter; Thẩm định thông tin ngân hàng và danh tính của Owner.
- Kiểm duyệt xe: Thẩm định thông tin kỹ thuật, ảnh và giấy tờ xe mới đăng trước khi cho phép hiển thị lên sàn.
- Trung tâm tranh chấp (Dispute Center): Xem ảnh/video chứng cứ, quyết định:
  - `REFUND_RENTER`: Hủy đơn, tạo lệnh hoàn 100% tiền cọc cho khách và xử phạt chủ xe.
  - `REJECT`: Bác bỏ khiếu nại sai sự thật, giữ nguyên tiền cọc cho chủ xe.
- Giám sát vi phạm quá hạn & Trích xuất hồ sơ pháp lý (Violation Dossier): Tự động phát hiện khách chiếm dụng xe quá 24h, tự động đưa vào Blacklist (`BLOCKED`), trích xuất hồ sơ chứng cứ vi phạm phục vụ chuyển cơ quan công an xử lý theo Điều 175 BLHS.

---

## 4. LUỒNG NGHIỆP VỤ CỐT LÕI (CORE BUSINESS FLOW)

Quy trình xử lý đơn hàng và chống xung đột lịch diễn ra qua 7 bước:

```text
[1. Khách tìm xe & Gửi yêu cầu]
       │
       ▼
[2. Đơn ở mức PENDING_APPROVAL]
       │
       ▼ (Chủ xe duyệt đơn)
[3. WAITING_PAYMENT (Soft Lock 45 phút)] ──(Các đơn trùng lịch)──> [Chuyển sang ON_HOLD]
       │                                                                  │
       ├─────────────────────────────────┐                                │
       ▼ (Khách cọc 30% VietQR)          ▼ (Quá 45 phút không cọc)         │
[4. CONFIRMED (Hard Lock)]         [Đơn chuyển EXPIRED]                   │
       │                                 │                                │
       ├─(Auto-reject đơn ON_HOLD)       └─(Tự động phục hồi)─────────────┘
       │                                        │
       ▼                                        ▼
[5. Bàn giao nhận xe (Check-in)]         [Quay lại PENDING_APPROVAL]
       │
       ▼
[6. Chuyến đi IN_PROGRESS]
       │
       ├────────────────────────────────────────┐
       ▼ (Trả xe bình thường)                   ▼ (Không nhận được xe / Trục trặc)
[Check-out & COMPLETED]                  [Khách khiếu nại No-Show -> DISPUTED]
       │                                        │
       ▼                                        ▼ (Admin xử lý)
[Đánh giá Review 1-5 sao]                [Hoàn 100% cọc: REFUND_RENTER]
       │
       ▼ (Nếu quá hạn trả xe)
[7. Scheduler quét -> OVERDUE -> Phạt lũy tiến -> Quá 24h khóa tài khoản BLOCKED]
```

---

## 5. ĐIỂM SÁNG KỸ THUẬT NỔI BẬT (ĐIỂM ĂN TIỀN TRƯỚC HỘI ĐỒNG)

1. **Khóa bi quan tầng CSDL (`PESSIMISTIC_WRITE`) chống Race Condition**:
   - Áp dụng trong `CarRepository.findCarForUpdate` và `RentalDisputeRepository.findByIdForUpdate` thông qua câu lệnh SQL `SELECT ... FOR UPDATE`.
   - Ngăn chặn triệt để hiện tượng đặt trùng xe (Overbooking) và giải ngân hoàn cọc 2 lần (Double Refund) khi có nhiều luồng cùng thao tác.
2. **Cơ chế Khóa 2 tầng linh hoạt (Two-Tier Locking)**:
   - Tầng 1: **Soft Lock 45 phút** (`WAITING_PAYMENT`) giúp khách có thời gian chuyển khoản cọc mà không bị người khác nẫng tay trên, tạm hoãn các đơn khác sang `ON_HOLD`.
   - Tầng 2: **Hard Lock** (`CONFIRMED`) chốt xe vĩnh viễn khi có tiền cọc 30%, tự động hủy các đơn trùng.
   - **Tự động hoàn nguyên**: Scheduler ngầm tự hủy đơn hết hạn và khôi phục đơn `ON_HOLD` quay lại `PENDING_APPROVAL`, tối đa hóa hiệu suất cho thuê xe (Car Utilization Rate).
3. **Thuật toán Tự động hóa Phạt trễ hạn & Chế tài Điều 175 BLHS**:
   - Scheduler tự động tính phạt lũy tiến: Trễ $\le 24h$ phạt $1.5 \times$ đơn giá giờ; Trễ $> 24h$ phạt gấp đôi đơn giá ngày.
   - Tự động kích hoạt cờ `isBlacklistedTriggered`, chuyển tài khoản sang `BLOCKED` sau 24h chiếm dụng xe và xuất Hồ sơ pháp lý vi phạm 1-click (`ViolationDossierResponse`).
4. **Kiến trúc Trợ lý AI Hybrid chịu lỗi cao (Fault-Tolerant Engine)**:
   - Tích hợp Google Gemini 2.5 Flash, có lưu vết lịch sử trong PostgreSQL bảng `chat_memory`.
   - Bộ máy Heuristic Regex tiếng Việt dự phòng tự động kích hoạt khi mất kết nối Internet hoặc chưa cấu hình API Key, đảm bảo trải nghiệm người dùng không bao giờ bị đứt quãng.

---

## 6. HẠN CHẾ & HƯỚNG PHÁT TRIỂN (CHỦ ĐỘNG BÁO CÁO HỘI ĐỒNG)

*(Chủ động trình bày mục này ở slide cuối để thể hiện sự am hiểu kiến trúc chuyên sâu)*:
1. **Cơ chế xác nhận thanh toán**: Hiện dùng nút bấm mô phỏng Webhook trên giao diện $\rightarrow$ *Hướng phát triển*: Tích hợp Webhook tài khoản ngân hàng thực tế (Casso/SePay) để tự động lắng nghe biến động số dư.
2. **Xác thực hồ sơ eKYC**: Hiện đang duyệt thủ công bằng mắt trên ảnh chụp CCCD/GPLX $\rightarrow$ *Hướng phát triển*: Tích hợp AI OCR và nhận diện sinh trắc học khuôn mặt (Face Matching).
3. **Thông báo Realtime**: Hiện dùng cơ chế REST Polling định kỳ $\rightarrow$ *Hướng phát triển*: Chuyển đổi sang giao thức hai chiều WebSocket (STOMP Broker) hoặc Server-Sent Events (SSE).
4. **Bản đồ tương tác**: Hiện quản lý tọa độ trong DB và lọc theo danh sách Tỉnh/Thành $\rightarrow$ *Hướng phát triển*: Nhúng bản đồ Mapbox/Leaflet để xem vị trí xe trực quan và tìm xe theo bán kính quanh vị trí người dùng.

---

## 💡 GỢI Ý CẤU TRÚC 10 SLIDE THUYẾT TRÌNH BẢO VỆ ĐỒ ÁN

- **Slide 1**: Trang bìa (Tên đề tài, GVHD, Thành viên nhóm, Ngày bảo vệ).
- **Slide 2**: Bối cảnh & Mục tiêu đề tài (Giải quyết bài toán thuê xe P2P, hạn chế của phương thức truyền thống).
- **Slide 3**: Kiến trúc tổng thể & Tech Stack (Spring Boot 3, PostgreSQL, Vanilla JS, Hybrid Storage, JWT).
- **Slide 4**: Thiết kế Cơ sở dữ liệu (ERD 15 bảng, chi tiết bảng `rentals` và `cars`).
- **Slide 5**: Phân quyền RBAC & Tính năng theo Role (Khách thuê, Chủ xe, Quản trị viên).
- **Slide 6**: Luồng nghiệp vụ cốt lõi (Vòng đời đơn hàng từ Tìm kiếm $\rightarrow$ Bàn giao $\rightarrow$ Trả xe).
- **Slide 7**: Điểm sáng kỹ thuật 1: Khóa bi quan `PESSIMISTIC_WRITE` & Quy trình khóa 2 tầng (Soft Lock/Hard Lock).
- **Slide 8**: Điểm sáng kỹ thuật 2: Thuật toán kiểm soát trễ hạn & Hồ sơ pháp lý vi phạm Điều 175 BLHS.
- **Slide 9**: Điểm sáng kỹ thuật 3: Trợ lý ảo AI Hybrid (Gemini 2.5 Flash + Heuristic Regex Fallback).
- **Slide 10**: Hạn chế hiện tại & Hướng phát triển (Chủ động nêu 4 hạn chế đã phân tích).
- **Slide 11**: Demo trực quan các màn hình chính (Trang chủ, Đặt cọc VietQR, Trip Tracker, Admin Portal).
- **Slide 12**: Lời cảm ơn & Q&A với Hội đồng.

