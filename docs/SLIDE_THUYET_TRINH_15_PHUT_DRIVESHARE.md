# 📊 BỘ SLIDE THUYẾT TRÌNH BÁO CÁO 15 PHÚT (DRIVESHARE)
## Khung Chuẩn Tối Ưu Thời Gian - Đầy Đủ Use Case, Database ERD, Demo Luồng Chính & Vấn Đáp

> **Dự án**: DriveShare - Nền tảng chia sẻ và cho thuê xe tự lái P2P  
> **Thời lượng**: 15 phút (Đếm ngược chính xác từng phút)  
> **Mục tiêu**: Đáp ứng 100% yêu cầu của Giảng viên - Thuyết phục, chuyên nghiệp, điểm tối đa.

---

## ⏱️ PHÂN BỔ 15 PHÚT "KHUNG GIỜ VÀNG"

```
[00:00 - 02:00] (2 phút)   : Slide 1 - 4  -> Mở đầu, Bài toán, Sơ đồ Use Case & Database ERD
[02:00 - 08:30] (6.5 phút) : Slide 5 - 6  -> LIVE DEMO Full Luồng Chính (Khách -> Chủ xe -> Sàn -> Admin)
[08:30 - 10:00] (1.5 phút) : Slide 7 - 8  -> Kiến trúc Tech Stack, Chất lượng Test (186/186 Pass), Phân công
[10:00 - 15:00] (5 phút)   : Slide 9      -> VẤN ĐÁP KỸ THUẬT VỚI GIẢNG VIÊN (Từng thành viên phản xạ)
```

---

# 📑 NỘI DUNG TỪNG SLIDE TRÌNH BÀY (SLIDE-BY-SLIDE CONTENT)

---

### 🟢 SLIDE 1: TRANG TIÊU ĐỀ (TITLE SLIDE)
*Thời lượng: 30 giây | Người nói: Nguyễn Duy Bảo (Tech Lead)*

- **Tiêu đề chính**: **DRIVESHARE - NỀN TẢNG THUÊ XE TỰ LÁI P2P**
- **Tiêu đề phụ**: *Tích hợp Trợ lý Ảo AI Tư Vấn & Cơ Chế Ký Quỹ Đặt Cọc VietQR (Escrow 30%)*
- **Giảng viên hướng dẫn**: [Tên Thầy Giảng Viên Phụ Trách]
- **Nhóm thực hiện (K4 PRO)**:
  1. **Nguyễn Duy Bảo** (Tech Lead & Database Architect)
  2. **Chí Tín** (Frontend Lead & UX/UI Integration)
  3. **Lâm Chí Vĩ** (Backend - Authentication & Security JWT)
  4. **Lộc Khiêm** (Backend - Admin Dashboard & Dispute Resolution)
  5. **Duy Quân** (Backend - Profile eKYC & Cloudinary Media CDN)
  6. **Phát** (Backend - Google OAuth2 & Dynamic Search API)
- **Tình trạng nộp bài**: 
  - ✅ **Tài liệu SRS Đặc tả hệ thống (Chương 1 hoàn thiện 100% & Khung sườn 15 Chương)**: Đã hoàn thiện theo chuẩn IEEE 830 (`docs/requirements/BAO_CAO_SRS_DRIVESHARE_K4_PRO_V2.0.docx` & `.md`).
  - ✅ **Mã nguồn & Kiểm thử**: 186/186 Tests tự động Pass 100%.

> 🗣️ **Lời thoại gợi ý (Speaker Note)**:  
> *"Kính chào Thầy và các bạn. Hôm nay nhóm em xin phép trình bày dự án DriveShare - nền tảng cho thuê xe tự lái kết nối trực tiếp chủ xe và khách thuê theo mô hình kinh tế chia sẻ. Để tiết kiệm thời gian quý báu của Thầy, nhóm em đã chuẩn bị sẵn sàng bản SRS Chương 1 để điểm danh, hệ thống web đang chạy live, và sau đây em xin phép đi thẳng vào kiến trúc và luồng hoạt động chính."*

---

### 🟢 SLIDE 2: BÀI TOÁN THỰC TẾ & GIẢI PHÁP ĐỘT PHÁ (PROBLEM & SOLUTION)
*Thời lượng: 30 giây | Người nói: Nguyễn Duy Bảo*

| ❌ Nỗi đau thị trường truyền thống | 💡 Giải pháp công nghệ của DriveShare |
| :--- | :--- |
| **Bùng cọc & Quỵt tiền**: Khách hủy sát giờ, chủ xe đòi cọc khó khăn hoặc giữ cọc vô lý. | **Cơ chế Ký quỹ Escrow (30% VietQR)**: Tiền cọc được sàn tạm giữ an toàn, tự động kích hoạt điều kiện giải ngân hoặc hoàn cọc. |
| **Xe ảo & Không minh bạch giấy tờ**: Nguy cơ lừa đảo, tai nạn không quy được trách nhiệm. | **Định danh điện tử (eKYC)**: Xác minh CCCD 2 mặt & GPLX lưu trữ bảo mật trên Cloudinary CDN; Chủ xe phải được duyệt giấy tờ trước khi lên sàn. |
| **Khách hàng mất thời gian tìm xe**: Khó so sánh giá, không biết xe nào phù hợp lộ trình. | **Trợ lý ảo AI Assistant**: Tích hợp mô hình AI phân tích nhu cầu ngôn ngữ tự nhiên, gợi ý xe phù hợp ngay tức thì. |
| **Tranh chấp khi không giao xe**: Thiếu biên bản đối soát bàn giao. | **Biên bản kiểm tra kỹ thuật số (Inspection)** & Cơ chế Trọng tài Admin xử lý khiếu nại hoàn tiền 100% kèm phạt vi phạm. |

---

### 🟢 SLIDE 3: SƠ ĐỒ USE CASE CHUẨN HỆ THỐNG (USE CASE DIAGRAM)
*Thời lượng: 30 giây | Người nói: Nguyễn Duy Bảo*

*(Nhúng hình ảnh sơ đồ Use Case từ `docs/diagrams/01_use_case_diagram_v2.jpg` hoặc sơ đồ cấu trúc bên dưới)*

- **Hệ thống phân định 3 Actor chính + 1 Tác nhân thông minh**:
  1. 🧑 **Khách Thuê (Renter)**: 
     - Tra cứu & Lọc xe đa tiêu chí (Hãng, số chỗ, giá, ngày trống).
     - Chat tư vấn lộ trình với AI Assistant.
     - Upload giấy tờ định danh (CCCD 2 mặt, GPLX).
     - Gửi yêu cầu đặt xe (Request-to-Book) & Thanh toán cọc 30% VietQR.
     - Báo cáo sự cố chủ xe không giao xe (Dispute) & Đánh giá sao (Review).
  2. 🚗 **Chủ Xe (Owner)**:
     - Đăng ký phương tiện, cập nhật thông tin & upload ảnh xe.
     - Tiếp nhận & Phê duyệt / Từ chối yêu cầu thuê xe (Host Screening).
     - Giám sát trạng thái cho thuê và quản lý ví doanh thu (90% giá trị hợp đồng).
  3. 🛡️ **Quản Trị Viên (Admin)**:
     - Thẩm định hồ sơ xe mới đăng ký và xác minh giấy tờ người dùng.
     - Đóng vai trò Trọng tài phân xử tranh chấp khiếu nại: Hoàn 100% cọc và phạt chủ xe vi phạm.
     - Giám sát dòng tiền doanh thu sàn (10% hoa hồng).
  4. 🤖 **Trợ Lý Ảo (AI Chatbot)**:
     - Tiếp nhận ngữ cảnh từ người dùng, đối chiếu kho dữ liệu xe khả dụng trong database và đưa ra đề xuất tối ưu.

> 🗣️ **Lời thoại gợi ý**:  
> *"Trên sơ đồ Use Case, nhóm thiết kế theo chuẩn phân quyền RBAC nghiêm ngặt: Khách thuê tập trung vào trải nghiệm tìm kiếm và thanh toán cọc an toàn; Chủ xe toàn quyền kiểm soát phương tiện và ví thu nhập; Admin đóng vai trò trọng tài điều tiết và phân xử tranh chấp; cùng với phân hệ AI Chatbot đóng vai trò cố vấn thông minh."*

---

### 🟢 SLIDE 4: SƠ ĐỒ CƠ SỞ DỮ LIỆU CHUẨN (DATABASE ERD - 14 BẢNG)
*Thời lượng: 30 giây | Người nói: Nguyễn Duy Bảo*

*(Nhúng sơ đồ ERD 14 bảng thực tế chuẩn xác 100% của Backend)*

- **Cấu trúc 14 bảng chuẩn hóa**:
  1. **Nhóm Xác thực & Phân quyền**: `users`, `roles`, `user_roles`, `renter_profiles`, `owner_profiles`.
  2. **Nhóm Quản lý Phương tiện**: `cars`, `car_images`, `car_documents`.
  3. **Nhóm Giao dịch & Luân chuyển Hợp đồng**: `rentals`, `payments`.
  4. **Nhóm Kiểm định & Giải quyết Tranh chấp**: `rental_inspections`, `rental_disputes`.
  5. **Nhóm Đánh giá & Trí tuệ Nhân tạo**: `reviews`, `chat_memory`.
- **3 Điểm nhấn kỹ thuật cốt lõi trong Database**:
  - **Cơ chế Soft Lock & Hết hạn**: Cột `payment_expires_at` (45 phút) ngăn chặn giữ xe ảo khi khách chưa thanh toán cọc.
  - **Khóa bi quan (Pessimistic Locking)**: Áp dụng trên bảng `rental_disputes` (`SELECT ... FOR UPDATE`) chống lỗi race condition / double refund khi Admin xử lý khiếu nại đồng thời.
  - **Kiểm soát phiên đăng nhập**: Cột `token_version` trong `users` tự động hủy bỏ mọi JWT cũ khi người dùng đổi mật khẩu.

---

### 🟢 SLIDE 5: KỊCH BẢN LIVE DEMO - 6 BƯỚC KHÉP KÍN LUỒNG CHÍNH
*Thời lượng: 6.5 phút | Người điều khiển máy: Chí Tín | Thuyết minh: Nguyễn Duy Bảo*

> *(Slide này chiếu làm nền trong lúc nhóm chuyển sang màn hình Web để thao tác trực tiếp)*

```
[BƯỚC 1] Khách vãng lai & AI Chatbot  ──>  [BƯỚC 2] Đăng nhập 1-chạm & Đặt xe
                     │                                         │
                     ▼                                         ▼
[BƯỚC 4] Thanh toán VietQR cọc 30%    <──  [BƯỚC 3] Chủ xe phê duyệt đơn thuê
                     │
                     ▼
[BƯỚC 5] Chủ xe nhận ví 90%           ──>  [BƯỚC 6] Admin phân xử tranh chấp & phạt
```

- **Chi tiết từng bước demo thao tác trên Web**:
  1. **Bước 1 (1p)**: Vào trang chủ `localhost:3000`, dùng bộ lọc tìm kiếm VinFast 7 chỗ $\rightarrow$ Bật AI Chatbot hỏi: *"Tư vấn xe 7 chỗ đi du lịch Vũng Tàu"* $\rightarrow$ AI gợi ý xe kèm giá tức thì.
  2. **Bước 2 (1.5p)**: Bấm nút Demo **"Renter"** đăng nhập 1-chạm $\rightarrow$ Chọn Ford Ranger Wildtrak $\rightarrow$ Gửi yêu cầu đặt xe $\rightarrow$ Trạng thái: `PENDING_APPROVAL`.
  3. **Bước 3 (1p)**: Đăng nhập **"Owner"** $\rightarrow$ Vào `owner-cars.html` xem yêu cầu $\rightarrow$ Bấm **"Phê duyệt"** $\rightarrow$ Kích hoạt hạn thanh toán 45 phút, trạng thái: `WAITING_PAYMENT`.
  4. **Bước 4 (1.5p)**: Vào tài khoản Renter $\rightarrow$ Màn hình thanh toán `payment.html`: Hiện số tiền cọc 30% chính xác (570.000 đ) kèm mã **VietQR Napas 247** động và đồng hồ đếm ngược $\rightarrow$ Bấm xác nhận chuyển khoản $\rightarrow$ Hệ thống chuyển sang: `CONFIRMED`.
  5. **Bước 5 (1p)**: Quay lại Owner $\rightarrow$ Trang `owner-earnings.html` $\rightarrow$ Thể hiện ví doanh thu được cộng 90% (trừ 10% phí sàn), có biên lai đầy đủ.
  6. **Bước 6 (0.5p)**: Đăng nhập **"Admin"** $\rightarrow$ Tab Tranh chấp (Disputes) $\rightarrow$ Thao tác hoàn 100% cọc cho khách và ghi nhận phạt chủ xe vi phạm nếu phát sinh sự cố không giao xe.

---

### 🟢 SLIDE 6: MÁY TRẠNG THÁI HỢP ĐỒNG THUÊ XE (RENTAL STATE MACHINE)
*Thời lượng: 30 giây (Trình chiếu song song giải thích logic nghiệp vụ)*

*(Biểu diễn vòng đời 17 trạng thái hợp đồng thuê xe nghiêm ngặt)*

```
[Khởi tạo]               [Chủ xe duyệt]                 [Thanh toán cọc 30%]
 DRAFT ──> PENDING_APPROVAL ──────> WAITING_PAYMENT ─────────> CONFIRMED
                 │                         │                      │
                 ▼ (Từ chối)               ▼ (Quá 45 phút)        ▼ (Bàn giao xe)
             REJECTED                   EXPIRED               IN_PROGRESS
                                                                  │
                                                ┌─────────────────┴─────────────────┐
                                                ▼ (Hoàn tất)                        ▼ (Chủ xe bùng/Sự cố)
                                            COMPLETED                            DISPUTED
                                                                                    │
                                                                                    ▼ (Admin phân xử)
                                                                           CANCELLED_BY_HOST + Phạt 500k
```

- **Logic an toàn tuyệt đối**:
  - Không thể nhảy cóc trạng thái (VD: Không thể thanh toán nếu chủ xe chưa duyệt).
  - Tự động hủy nếu khách không cọc trong 45 phút (Scheduler chạy nền).
  - Khóa lịch xe chống overbooking (hai khách không thể thuê cùng 1 xe cùng thời điểm).

---

### 🟢 SLIDE 7: CÔNG NGHỆ ÁP DỤNG & ĐẢM BẢO CHẤT LƯỢNG (TECH STACK & TESTING)
*Thời lượng: 1 phút | Người nói: Lộc Khiêm*

- **Kiến trúc Kỹ thuật (Technical Architecture)**:
  - **Backend**: Java 17/21, Spring Boot 3.3.4 (Layered Modular), Spring Security 6 (Stateless JWT), Spring Data JPA, Hibernate, PostgreSQL 16 chạy Docker Container.
  - **Frontend**: Vanilla JS ES6+ module hóa (`api.js`, `auth.js`, `booking.js`), Bootstrap 5, FontAwesome, Widget AI Chatbot.
  - **Third-party Services**: VietQR Napas 247 Banking API, Cloudinary CDN Media Storage, Google OAuth2 Identity Service.
- **Kết quả Kiểm thử Tự động (Automated Verification)**:
  - **186 Tests Unit & Integration**: Đạt tỷ lệ **100% Pass** (Không lỗi, không flaky test).
  - **Độ phủ kiểm thử (Test Coverage)**: Bao phủ toàn bộ luồng Auth, Lock Concurrency, Tính toán cọc 30%, Hoa hồng 90/10, Quản lý tranh chấp và Token Expiration.

---

### 🟢 SLIDE 8: MA TRẬN PHÂN CÔNG THÀNH VIÊN & SẴN SÀNG VẤN ĐÁP
*Thời lượng: 30 giây | Người nói: Nguyễn Duy Bảo giới thiệu chuyển tiếp sang phần Vấn đáp*

| Thành viên | Vai trò | Phân hệ chịu trách nhiệm kỹ thuật chính | Kỹ thuật nổi bật sẵn sàng phản xạ |
| :--- | :--- | :--- | :--- |
| **Nguyễn Duy Bảo** | Tech Lead | Database Architecture & Concurrency Lock | `@Lock(PESSIMISTIC_WRITE)`, Thiết kế ERD 14 bảng, chống Double Refund. |
| **Lâm Chí Vĩ** | Backend Dev | Auth, Security & Session Management | JWT Filter Stateless, `token_version` hủy phiên khi đổi mật khẩu. |
| **Duy Quân** | Backend Dev | User Profile eKYC & Media Upload | Validate MIME Type/dung lượng, Cloudinary CDN, CCCD 2 mặt bắt buộc. |
| **Lộc Khiêm** | Backend Dev | Admin Dashboard, Test Suites & Disputes | Luồng Dispute hoàn cọc 100% & phạt 500k, duy trì 186 Unit Tests pass 100%. |
| **Chí Tín** | Frontend Lead | UI/UX Web Portal & VietQR Integration | Quản lý phiên `localStorage`, tích hợp VietQR động Napas 247 & polling. |
| **Phát** | Backend Dev | Google OAuth2 & Dynamic Search API | `OAuth2SuccessHandler` phân nhánh tài khoản, JPA `Specification` lọc chống trùng lịch. |

---

### 🟢 SLIDE 9: TỔNG KẾT & PHIÊN VẤN ĐÁP VỚI GIẢNG VIÊN (Q&A SESSION)
*Thời lượng: 5 phút | Toàn bộ 6 thành viên đứng trước bục sẵn sàng trả lời*

- **Thông điệp kết luận**:
  - DriveShare giải quyết trọn vẹn bài toán P2P Car Rental thông qua việc kết hợp chặt chẽ giữa **Nghiệp vụ Ký quỹ Escrow an toàn** và **Kiến trúc Kỹ thuật hướng Module chuẩn mực**.
  - Sản phẩm đáp ứng đầy đủ tài liệu SRS Chương 1, có hệ thống kiểm thử tự động bảo chứng và sẵn sàng triển khai thực tế.
- **Dòng chữ lớn trên Slide**: **"XIN CẢM ƠN THẦY VÀ CÁC BẠN - SẴN SÀNG CHO PHẦN CÂU HỎI VẤN ĐÁP"**

---

## 🎯 BỘ "BẢO BỐI" 6 CÂU TRẢ LỜI ĐIỂM 10 KHI THẦY CHỈ ĐỊNH TỪNG BẠN

*(Mỗi bạn thuộc lòng 1 câu của mình để trả lời dõng dạc trong 30 giây)*

1. **Nguyễn Duy Bảo (Tech Lead - Concurrency & DB)**:  
   👉 *"Khi Admin duyệt hoàn tiền tranh chấp, hệ thống dùng `@Lock(LockModeType.PESSIMISTIC_WRITE)` trên bảng `rental_disputes` (`SELECT ... FOR UPDATE`). Bản ghi bị khóa ở mức database; nếu có request thứ 2 đồng thời, hệ thống thấy trạng thái đã khác `PENDING` và trả lỗi `DISPUTE_ALREADY_RESOLVED`, tuyệt đối không thể hoàn cọc hoặc phạt 2 lần."*

2. **Lâm Chí Vĩ (Auth & Security)**:  
   👉 *"Dự án dùng Spring Security 6 với JWT Stateless. Điểm đặc biệt là bảng `users` có cột `token_version`. Khi người dùng đổi mật khẩu, `token_version` tăng lên 1; các JWT cũ mang `token_version` cũ sẽ bị bộ lọc `JwtAuthenticationFilter` phát hiện và vô hiệu hóa ngay lập tức trên mọi thiết bị khác."*

3. **Duy Quân (Profile eKYC & Media)**:  
   👉 *"Ảnh và giấy tờ người dùng không lưu trong DB để tránh phình dữ liệu mà được đẩy lên Cloudinary CDN qua kết nối HTTPS, DB chỉ lưu link URL. Backend kiểm tra chặt chẽ: dung lượng file tối đa 5MB, MIME type chỉ nhận ảnh JPG/PNG/WebP, và bắt buộc upload đủ cả 2 mặt CCCD mới cho phép cập nhật."*

4. **Lộc Khiêm (Admin & Disputes)**:  
   👉 *"Quy trình Dispute bảo vệ tối đa quyền lợi khách hàng: Khi khách báo chủ xe không giao xe, đơn chuyển sang `DISPUTED`. Admin xác minh và bấm `REFUND_RENTER`, hệ thống trích 100% tiền cọc (570.000 đ) từ tài khoản Escrow trả lại cho khách, hủy đơn và tự động ghi nhận khoản phạt 500.000 đ vào tài khoản chủ xe để cấn trừ vào các chuyến sau."*

5. **Chí Tín (Frontend & VietQR)**:  
   👉 *"Frontend quản lý phân quyền bằng hàm `checkAuth(requiredRole)` đầu mỗi trang để chặn truy cập trái phép. Với VietQR, Frontend gửi yêu cầu tạo thanh toán, Backend tính đúng 30% cọc và trả về link ảnh QR chuẩn Napas 247. Màn hình hiển thị QR kèm đồng hồ đếm ngược 15 phút và tự động kiểm tra trạng thái giao dịch."*

6. **Phát (Google OAuth2 & Search Car)**:  
   👉 *"Đăng nhập Google dùng `spring-boot-starter-oauth2-client`. Handler kiểm tra email: nếu chưa có thì tự động tạo tài khoản mới với vai trò được chọn, nếu có rồi thì cấp ngay JWT. Bộ lọc tìm xe dùng JPA `Specification` linh hoạt lọc theo hãng, số chỗ, mức giá và đặc biệt là kiểm tra bảng `rentals` để loại bỏ các xe đang có lịch thuê trùng lặp."*
