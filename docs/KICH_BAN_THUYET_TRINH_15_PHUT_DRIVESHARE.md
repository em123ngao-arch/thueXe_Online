# 🎤 KỊCH BẢN THUYẾT TRÌNH BẢO VỆ ĐỒ ÁN DRIVESHARE (15 PHÚT)
> **Đề tài**: DRIVESHARE — NỀN TẢNG CHIA SẺ VÀ CHO THUÊ XE TỰ LÁI TRỰC TUYẾN P2P  
> **Giảng viên hướng dẫn**: Thầy Trương Thanh Bình  
> **Người thuyết trình chính**: Nguyễn Duy Bảo (Tech Lead / Đại diện nhóm K4)  
> **Đội ngũ thực hiện**: Nguyễn Duy Bảo, Chí Tín, Lâm Chí Vĩ, Đỗ Ngọc Phát, Nguyễn Duy Quân, Tấn Khiêm  
> **Tổng thời lượng**: 15 phút (Canh chuẩn từng giây) + Phiên hỏi đáp Q&A Hội đồng

---

## ⏱️ BẢNG PHÂN BỔ THỜI GIAN THEO 3 CHƯƠNG CHUẨN MỰC

| Phần | Nội dung chính | Slide | Thời gian | Mốc thời gian |
| :--- | :--- | :---: | :---: | :---: |
| **Mở đầu** | Chào Hội đồng, giới thiệu GVHD & Nhóm sinh viên | Slide 1 | 0:30 | `00:00 - 00:30` |
| **Chương 1** | Tổng quan thị trường, Benchmark & Mục tiêu đề tài | Slide 2 - 4 | 2:30 | `00:30 - 03:00` |
| **Chương 2** | Phân tích thiết kế hệ thống, CSDL & Điểm sáng kỹ thuật | Slide 5 - 11 | 5:30 | `03:00 - 08:30` |
| **Chương 3** | Triển khai thực nghiệm: Demo 3 phân hệ & Kiểm thử API | Slide 12 - 16 | 4:30 | `08:30 - 13:00` |
| **Kết luận** | Tổng kết Agile, Điểm cộng hạn chế & Lời cảm ơn | Slide 17 - 19 | 2:00 | `13:00 - 15:00` |
| **Hậu kỳ** | Phiên vấn đáp phản biện cùng Hội đồng (Q&A) | Phụ lục Q&A | 10 - 15p | Sau 15:00 |

---

# 📜 LỜI THOẠI CHI TIẾT TỪNG SLIDE (SPEAKER SCRIPT)

---

### SLIDE 1: TRANG BÌA (00:00 - 00:30)
> *[Slide chiếu: Tiêu đề DriveShare, GVHD Thầy Trương Thanh Bình, 6 Thành viên]*

**Lời thoại:**
> *"Kính thưa quý Thầy, Cô trong Hội đồng phản biện và các bạn sinh viên.*  
> *Em tên là **Nguyễn Duy Bảo**, đại diện cho nhóm sinh viên K4 hôm nay xin phép được báo cáo đề án tốt nghiệp chuyên ngành với đề tài:*  
> ***DRIVESHARE — NỀN TẢNG CHIA SẺ VÀ CHO THUÊ XE TỰ LÁI TRỰC TUYẾN P2P***.  
> *Đề án được thực hiện dưới sự hướng dẫn tận tình của **Thầy Trương Thanh Bình**. Nhóm gồm 6 thành viên phụ trách các phân hệ chuyên sâu từ Kiến trúc, Core Backend, Security, Trợ lý AI đến Kiểm thử tự động.*  
> *Sau đây, em xin phép bắt đầu phần trình bày của nhóm."*

---

## 🌟 CHƯƠNG 1: TỔNG QUAN VỀ THỊ TRƯỜNG & ĐỀ TÀI (00:30 - 03:00)

### SLIDE 2: BỐI CẢNH & PHƯƠNG THỨC THUÊ XE HIỆN NAY (00:30 - 01:15)
> *[Slide chiếu: 3 thẻ so sánh bất cập thuê xe truyền thống vs Tiềm năng P2P]*

**Lời thoại:**
> *"Thưa Thầy Cô, nhu cầu thuê xe ô tô tự lái phục vụ du lịch và công tác tại Việt Nam đang tăng trưởng rất nhanh. Tuy nhiên, phương thức thuê xe truyền thống hiện nay đang bộc lộ 3 bất cập lớn:*  
> *1. **Rủi ro giam giữ tài sản**: Khách bắt buộc phải để lại CCCD gắn chip gốc, hộ khẩu hoặc xe máy kèm cà-vẹt có giá trị cao, tiềm ẩn nguy cơ lộ lọt danh tính.*  
> *2. **Bất đồng tiền cọc & Tranh chấp hư hỏng**: Không có quy trình nghiệm thu chuẩn hóa, dẫn đến tình trạng bắt đền oan các vết trầy xước cũ khi trả xe.*  
> *3. **Quản lý phân tán, thủ công**: Chủ xe chốt khách qua tin nhắn Zalo, sổ tay nên rất dễ xảy ra tình trạng nhận cọc của 2 người cùng một ngày.*  
> *Mô hình kinh tế chia sẻ P2P ra đời như một lời giải tất yếu nhằm kết nối trực tiếp xe nhàn rỗi của người dân với khách có nhu cầu, được bảo đảm qua sàn công nghệ minh bạch."*

---

### SLIDE 3: BẢNG ĐÁNH GIÁ ĐỐI CHUẨN TIÊU CHÍ (BENCHMARK) (01:15 - 02:15)
> *[Slide chiếu: Bảng so sánh 5 tiêu chí: Mioto, Zoomcar, DriveShare]*

**Lời thoại:**
> *"Để xây dựng sản phẩm có tính cạnh tranh, nhóm đã tiến hành khảo sát và lập Bảng đối chuẩn giữa hai nền tảng dẫn đầu thị trường là Mioto, Zoomcar với DriveShare qua 5 tiêu chí nghiệp vụ cốt lõi:*  
> *- **Về chính sách cọc**: DriveShare áp dụng cơ chế Ký quỹ 30% VietQR tự động, đóng vai trò trọng tài trung gian giữ hộ, chỉ giải ngân khi cuốc xe kết thúc.*  
> *- **Về hỗ trợ tư vấn**: Tích hợp Trợ lý ảo AI Assistant giúp khách tính nhanh tiền cọc và tìm xe theo ngân sách.*  
> *- **Về kiểm soát lịch xe**: Cung cấp công cụ Chặn lịch bận linh hoạt cho chủ xe bảo dưỡng phương tiện.*  
> *- **Về bàn giao nhận xe**: Thiết kế quy trình điện tử 2 chiều Check-in và Check-out bắt buộc đối soát số ODO, vạch xăng và chụp ảnh hiện trường.*  
> *- **Đặc biệt về chế tài vi phạm**: DriveShare tự động hóa cơ chế phát hiện chiếm dụng xe quá hạn hợp đồng và trích xuất hồ sơ chứng cứ theo Điều 175 Bộ luật Hình sự."*

---

### SLIDE 4: MỤC TIÊU & PHẠM VI CỦA ĐỀ TÀI (02:15 - 03:00)
> *[Slide chiếu: 4 mục tiêu trọng tâm & Phạm vi Web Responsive]*

**Lời thoại:**
> *"Từ những phân tích trên, đồ án DriveShare xác định 4 mục tiêu triển khai then chốt:*  
> *1. Xây dựng nền tảng Web Fullstack chuẩn mực với Backend Spring Boot 3 và Frontend Responsive trên mọi thiết bị.*  
> *2. Thiết kế cơ chế giao dịch an toàn, minh bạch, bảo vệ tài chính 2 chiều giữa Khách và Chủ xe.*  
> *3. Giải quyết triệt để bài toán kỹ thuật chống đặt trùng xe (Race Condition / Overbooking).*  
> *4. Ứng dụng Trí tuệ nhân tạo (AI) nâng cao trải nghiệm đặt xe và tư vấn tự động 24/7."*

---

## 🏗️ CHƯƠNG 2: PHÂN TÍCH & THIẾT KẾ HỆ THỐNG (03:00 - 08:30)

### SLIDE 5: MÔ HÌNH KIẾN TRÚC TỔNG QUAN (03:00 - 03:45)
> *[Slide chiếu: Kiến trúc Decoupled Client - Spring Boot 3 - PostgreSQL 16 - Cloudinary - Gemini]*

**Lời thoại:**
> *"Về mặt kiến trúc, hệ thống được thiết kế theo mô hình **Client-Server phân tách độc lập (Decoupled Architecture)** giao tiếp hoàn toàn qua **RESTful API**.*  
> *- **Phía Backend**: Nhóm áp dụng **Spring Boot Layered Modular Architecture** trên nền Java 17/21 và Spring Boot 3.3.4, chia thành 9 module nghiệp vụ rõ ràng, bọc toàn bộ dữ liệu trả về trong chuẩn `ApiResponse<T>`.*  
> *- **Cơ sở dữ liệu**: PostgreSQL 16 Alpine được đóng gói hoàn toàn trong Docker Container, đảm bảo tính nhất quán trên mọi môi trường.*  
> *- **Lưu trữ tệp**: Triển khai chiến lược Hybrid Storage, tối ưu hóa ảnh xe và video khiếu nại lên Cloudinary CDN.*  
> *- **Phía Frontend**: Sử dụng Vanilla JS ES6+ kết hợp Bootstrap 5 nhằm tối ưu tốc độ tải trang tĩnh và kiểm soát DOM linh hoạt."*

---

### SLIDE 6: PHÂN TÍCH USE CASE THEO PHÂN QUYỀN RBAC (03:45 - 04:30)
> *[Slide chiếu: Sơ đồ Use Case tổng thể 3 Actor: Renter, Owner, Admin]*

**Lời thoại:**
> *"Thưa Thầy Cô, đây là sơ đồ Use Case tổng thể do nhóm thiết kế. Hệ thống phân quyền chặt chẽ theo mô hình RBAC với 3 tác nhân chính:*  
> *- **Khách thuê (`ROLE_RENTER`)**: Tìm xe đa tiêu chí, chat AI, cọc VietQR 30%, theo dõi Trip Tracker, xác nhận Check-in/Check-out, đánh giá hoặc khiếu nại.*  
> *- **Chủ xe (`ROLE_OWNER`)**: Đăng xe, quản lý lịch bận bảo dưỡng, xét duyệt đơn, lập biên bản Check-in/Check-out ODO và theo dõi ví doanh thu.*  
> *- **Quản trị viên (`ROLE_ADMIN`)**: Thẩm định eKYC CCCD/GPLX, duyệt xe lên sàn, trung tâm xử lý tranh chấp hoàn cọc và giám sát hồ sơ vi phạm.*  
> *Toàn bộ quy trình đặt xe đều bắt buộc phải ràng buộc kiểm tra tính hợp lệ của hồ sơ và lịch rảnh của xe."*

---

### SLIDE 7: THIẾT KẾ CƠ SỞ DỮ LIỆU ERD (04:30 - 05:20)
> *[Slide chiếu: Sơ đồ ERD 15 bảng chuẩn 3NF, nổi bật bảng rentals & cars]*

**Lời thoại:**
> *"Về thiết kế CSDL, nhóm xây dựng mô hình gồm 15 bảng quan hệ chuẩn hóa 3NF.*  
> *Trái tim của hệ thống là bảng `rentals` liên kết trực tiếp với `cars`, `users`, `payments` và `rental_inspections`.*  
> *- Bảng `rentals` lưu giữ toàn bộ vòng đời hợp đồng, số tiền cọc 30%, thời hạn giữ chỗ 45 phút, số giờ quá hạn và phí phạt trễ.*  
> *- Nhóm áp dụng kỹ thuật Soft Delete thông qua `deleted_at` trên `BaseEntity` để đảm bảo tính toàn vẹn dữ liệu kế toán và không bao giờ xóa cứng xe khi đang có đơn chạy.*  
> *- Bảng `chat_memory` lưu trữ vết hội thoại AI theo phiên, phục vụ phân tích ngữ cảnh người dùng."*

---

### SLIDE 8: STATE MACHINE VÒNG ĐỜI ĐƠN THUÊ XE (05:20 - 06:10)
> *[Slide chiếu: Máy trạng thái 18 trạng thái từ PENDING_APPROVAL -> COMPLETED / OVERDUE / DISPUTED]*

**Lời thoại:**
> *"Điểm đặc sắc trong nghiệp vụ là cỗ máy trạng thái (State Machine) với 18 trạng thái kiểm soát chặt chẽ:*  
> *Đơn khởi tạo ở `PENDING_APPROVAL` $\rightarrow$ Khi chủ xe duyệt, chuyển sang `WAITING_PAYMENT` (kích hoạt Soft Lock 45 phút) $\rightarrow$ Khách cọc 30% VietQR, đơn chuyển `CONFIRMED` (Hard Lock) $\rightarrow$ Hoàn tất Check-in chuyển `IN_PROGRESS` $\rightarrow$ Check-out xong chuyển `COMPLETED`.*  
> *Nếu có sự cố không giao xe, đơn chuyển `DISPUTED` để đóng băng tiền cọc chờ Admin phân xử.*  
> *Nếu quá hạn trả xe, Cronjob tự động chuyển `OVERDUE` để kích hoạt chế tài xử phạt."*

---

### SLIDE 9: ĐIỂM SÁNG KỸ THUẬT 01 — KHÓA BI QUAN PESSIMISTIC_WRITE (06:10 - 07:10)
> *[Slide chiếu: Minh họa Race Condition & Code @Lock(LockModeType.PESSIMISTIC_WRITE)]*

**Lời thoại:**
> *"Thưa Hội đồng, đây là **Điểm sáng kỹ thuật then chốt** của đề tài: **Giải quyết bài toán xung đột đồng thời (Race Condition)**.*  
> *Trong thực tế, khi nhiều giao dịch cùng duyệt giữ chỗ cho 1 xe hoặc nhiều Admin cùng bấm giải quyết 1 khiếu nại hoàn tiền, các câu lệnh `SELECT` thông thường sẽ dẫn đến lỗi Overbooking hoặc giải ngân hoàn cọc 2 lần.*  
> *Nhóm đã xử lý triệt để bằng cách áp dụng **Khóa bi quan (`@Lock(LockModeType.PESSIMISTIC_WRITE)`)** tại `CarRepository.findCarForUpdate` và `RentalDisputeRepository.findByIdForUpdate`.*  
> *Câu lệnh SQL phát sinh tương đương `SELECT ... FOR UPDATE`, giữ khóa độc quyền ở tầng CSDL trong suốt transaction, đảm bảo an toàn tuyệt đối 100% cho các giao dịch tài chính."*

---

### SLIDE 10: ĐIỂM SÁNG KỸ THUẬT 02 — CƠ CHẾ KHÓA 2 TẦNG (TWO-TIER LOCKING) (07:10 - 08:00)
> *[Slide chiếu: Sơ đồ Soft Lock 45m -> Hard Lock VietQR & Tự động hoàn nguyên ON_HOLD]*

**Lời thoại:**
> *"Tiếp nối bài toán trên là **Cơ chế Khóa 2 tầng linh hoạt**:*  
> *- **Tầng 1 (Soft Lock 45 phút)**: Khi chủ xe duyệt 1 khách, đơn chuyển `WAITING_PAYMENT`, đồng thời tự động đưa các đơn trùng lịch khác sang `ON_HOLD`.*  
> *- **Tầng 2 (Hard Lock)**: Khách chuyển cọc 30% VietQR thành công, đơn sang `CONFIRMED`, hệ thống tự động từ chối (`REJECTED`) các đơn `ON_HOLD`.*  
> *- **Cơ chế tự động hoàn nguyên**: Nếu quá 45 phút khách không cọc, `RentalExpirationScheduler` quét ngầm mỗi phút sẽ tự hủy đơn hết hạn (`EXPIRED`) và **tự động phục hồi** các đơn `ON_HOLD` quay lại `PENDING_APPROVAL`. Nhờ đó, chủ xe không bao giờ bị 'chôn xe' và tối đa hóa hiệu suất kinh doanh."*

---

### SLIDE 11: ĐIỂM SÁNG KỸ THUẬT 03 — AN TOÀN BẢO MẬT & AI CHỊU LỖI CAO (08:00 - 08:30)
> *[Slide chiếu: JWT token_version & Bộ máy AI Hybrid Gemini 2.5 Flash + Heuristic Regex]*

**Lời thoại:**
> *"Về an toàn ứng dụng, hệ thống sử dụng Stateless JWT kèm cơ chế `token_version` để thu hồi token tức thì khi đổi mật khẩu, tự động khóa tài khoản sau 5 lần đăng nhập sai.*  
> *Phân hệ AI được thiết kế theo cơ chế **Chịu lỗi cao (Fault-Tolerant)**: Bình thường gọi mô hình **Google Gemini 2.5 Flash**; khi mất kết nối mạng hoặc không có API Key, bộ máy **Heuristic Regex** tiếng Việt tự động kích hoạt để bóc tách ý định, truy vấn DB xe và tính cọc 30% mượt mà, đảm bảo trải nghiệm khách hàng 24/7."*

---

## 🚀 CHƯƠNG 3: TRIỂN KHAI THỰC NGHIỆM & KẾT QUẢ ĐẠT ĐƯỢC (08:30 - 13:00)

### SLIDE 12: THỰC NGHIỆM PHÂN HỆ KHÁCH THUÊ XE (08:30 - 09:30)
> *[Slide chiếu: Ảnh chụp màn hình Bộ lọc xe, Chatbot AI, Mã QR VietQR, Shopee Trip Tracker]*

**Lời thoại:**
> *"Bước sang Chương 3 là phần kết quả thực nghiệm. Đầu tiên là giao diện Khách thuê xe:*  
> *- Khách tìm kiếm xe qua bộ lọc trực quan theo ngày, địa điểm, khoảng giá và số chỗ.*  
> *- Widget Trợ lý AI tư vấn dòng xe phù hợp và tính trước 30% tiền cọc.*  
> *- Khi được duyệt, màn hình thanh toán tự động sinh mã VietQR chuẩn ngân hàng với số tiền cọc 30% và cú pháp đối soát `DSPAY...`.*  
> *- Khách theo dõi hành trình qua modal **Trip Tracker 5 bước** chuẩn sàn thương mại điện tử, minh bạch từng trạng thái."*

---

### SLIDE 13: THỰC NGHIỆM PHÂN HỆ CHỦ XE (09:30 - 10:30)
> *[Slide chiếu: Ảnh Dashboard chủ xe, Chặn lịch bảo dưỡng, Biên bản Check-in/out, Ví doanh thu]*

**Lời thoại:**
> *"Đối với phân hệ Chủ xe:*  
> *- Chủ xe quản lý danh sách xe, tải ảnh và giấy tờ đăng kiểm.*  
> *- Công cụ **Chặn lịch bận (Blackout Dates)** cho phép khóa các ngày bảo dưỡng định kỳ.*  
> *- Quy trình giao xe điện tử: Chủ xe ghi nhận số ODO, vạch xăng và chụp ảnh hiện trường để tạo biên bản Check-in; khi nhận xe về thì lập biên bản Check-out và kê khai phụ phí.*  
> *- Trang Ví doanh thu cập nhật tự động số dư sau khi cuốc xe hoàn tất đối soát."*

---

### SLIDE 14: THỰC NGHIỆM PHÂN HỆ QUẢN TRỊ ADMIN (10:30 - 11:30)
> *[Slide chiếu: Dashboard số liệu, Thẩm định eKYC CCCD/GPLX, Dispute Center, Hồ sơ Điều 175]*

**Lời thoại:**
> *"Về phía Quản trị viên (Admin Portal):*  
> *- Dashboard hiển thị số liệu người dùng, xe đang chạy và tổng cọc VietQR đã thu.*  
> *- Phân hệ Thẩm định hồ sơ: Admin trực tiếp kiểm tra hình ảnh CCCD, bằng lái xe và tài khoản ngân hàng của đối tác để phê duyệt.*  
> *- **Dispute Center**: Tiếp nhận khiếu nại không giao xe, xem video chứng cứ để ra quyết định hoàn 100% cọc cho khách và xử phạt chủ xe vi phạm.*  
> *- **Chế tài Điều 175 BLHS**: Hệ thống tự động phát hiện đơn quá hạn 24h, khóa tài khoản khách vi phạm và xuất **Hồ sơ pháp lý 1-click** phục vụ khiếu kiện."*

---

### SLIDE 15: HỆ THỐNG REST API & SWAGGER UI (11:30 - 12:15)
> *[Slide chiếu: Ảnh chụp giao diện Swagger UI OpenAPI 3.0 với các nhóm API module]*

**Lời thoại:**
> *"Toàn bộ hệ thống Backend được chuẩn hóa hợp đồng API qua **SpringDoc OpenAPI 3.0 / Swagger UI**.*  
> *Hơn 40 endpoints được nhóm theo đúng các module nghiệp vụ: Auth, User Profile, Car Management, Rental Lifecycle, Payment VietQR, Inspections, Disputes và Admin Stats.*  
> *Mọi API đều có validation chặt chẽ và xử lý ngoại lệ tập trung qua `GlobalExceptionHandler`."*

---

### SLIDE 16: CHIẾN LƯỢC KIỂM THỬ PHẦN MỀM TỰ ĐỘNG (12:15 - 13:00)
> *[Slide chiếu: Báo cáo kết quả 188 bài tests tự động, Unit Test, Concurrency Test]*

**Lời thoại:**
> *"Để chứng minh chất lượng phần mềm, nhóm đã áp dụng phương pháp kiểm thử Test-Driven Development (TDD) với bộ kiểm thử tự động gồm **188 bài tests** toàn diện:*  
> *- **Unit Tests & Service Tests**: Kiểm thử logic tính tiền, chia cọc 30%, tính phí phạt lũy tiến.*  
> *- **MockMvc Integration Tests**: Kiểm thử toàn bộ các luồng xác thực JWT và phân quyền API.*  
> *- **Concurrency Tests**: Giả lập đa luồng đặt xe cùng lúc, xác nhận không xảy ra hiện tượng Overbooking.*  
> *Toàn bộ 188 tests đều vượt qua thành công với độ bao phủ mã nguồn cao."*

---

## 🎯 KẾT LUẬN & HƯỚNG PHÁT TRIỂN (13:00 - 15:00)

### SLIDE 17: TỔNG KẾT KẾT QUẢ ĐẠT ĐƯỢC (13:00 - 13:45)
> *[Slide chiếu: 5 Sprint Agile Scrum hoàn thành, sản phẩm chạy thực tế, quy trình Git chuẩn]*

**Lời thoại:**
> *"Tóm lại, sau quá trình làm việc nghiêm túc theo khung Agile Scrum 5 Sprints, nhóm chúng em đã đạt được các kết quả trọng tâm:*  
> *1. Xây dựng thành công nền tảng chia sẻ xe tự lái P2P khép kín, an toàn và dễ sử dụng.*  
> *2. Áp dụng các giải pháp kiến trúc chuyên nghiệp: Khóa bi quan CSDL, cọc giữ chỗ VietQR 30%, bàn giao điện tử 2 chiều và AI tư vấn.*  
> *3. Tuân thủ quy trình phát triển doanh nghiệp: Git Feature-branch, Pull Request kiểm soát mã nguồn và kiểm thử tự động 188 tests."*

---

### SLIDE 18: HẠN CHẾ TỒN TẠI & HƯỚNG PHÁT TRIỂN (13:45 - 14:35)
> *[Slide chiếu: 4 Hạn chế trung thực & 4 Hướng phát triển tương lai]*

**Lời thoại:**
> *"Với tinh thần cầu thị và trung thực khoa học, nhóm xin được chủ động báo cáo trước Hội đồng 4 điểm hạn chế hiện tại và hướng phát triển tiếp theo:*  
> *1. **Cơ chế xác nhận VietQR**: Hiện tại bước nạp tiền đang xác nhận qua nút bấm mô phỏng Webhook trên giao diện $\rightarrow$ Hướng tới tích hợp Webhook biến động số dư ngân hàng tự động qua Casso hoặc SePay.*  
> *2. **Thẩm định eKYC**: Hiện Admin đang duyệt bằng mắt trên ảnh chụp CCCD/GPLX $\rightarrow$ Hướng tới tích hợp AI OCR tự động trích xuất thông tin và nhận diện khuôn mặt sinh trắc học.*  
> *3. **Thông báo Realtime**: Hiện dùng cơ chế REST Polling định kỳ $\rightarrow$ Hướng tới nâng cấp lên giao thức hai chiều WebSocket STOMP.*  
> *4. **Bản đồ trực quan**: Hiện lọc theo Tỉnh/Thành phố dạng danh mục $\rightarrow$ Hướng tới nhúng bản đồ Mapbox/Leaflet tìm xe theo bán kính 5km - 10km quanh người dùng."*

---

### SLIDE 19: LỜI CẢM ƠN & PHIÊN HỎI ĐÁP Q&A (14:35 - 15:00)
> *[Slide chiếu: Lời cảm ơn Thầy Cô & Slide Q&A]*

**Lời thoại:**
> *"Bài thuyết trình báo cáo đề án của nhóm chúng em đến đây là kết thúc.*  
> *Nhóm xin được gửi lời cảm ơn chân thành và sâu sắc nhất đến quý Thầy, Cô trong Hội đồng phản biện và đặc biệt là **Thầy Trương Thanh Bình** đã tận tình hướng dẫn, chỉ bảo nhóm trong suốt quá trình thực hiện đề án.*  
> *Sau đây, nhóm chúng em xin được lắng nghe những nhận xét quý báu và sẵn sàng trả lời các câu hỏi phản biện từ quý Thầy, Cô.*  
> *Em xin trân trọng cảm ơn!"*

---

# 🛡️ MA TRẬN PHÂN CÔNG TRẢ LỜI CÂU HỎI PHẢN BIỆN (Q&A MATRIX)

Dưới đây là 10 câu hỏi "hóc búa" nhất Hội đồng thường hỏi và phân công thành viên trả lời kèm câu trả lời chuẩn:

| STT | Câu hỏi dự kiến từ Hội đồng | Thành viên phụ trách | Gợi ý câu trả lời "Chuẩn chuyên gia" |
|:---:|:---|:---:|:---|
| **1** | *"Làm sao hệ thống của em đảm bảo không có 2 người cùng đặt 1 xe tại 1 thời điểm?"* | **Lâm Chí Vĩ**<br>*(Backend Core)* | *"Dạ thưa Thầy Cô, nhóm sử dụng Khóa bi quan `@Lock(LockModeType.PESSIMISTIC_WRITE)` tại phương thức `CarRepository.findCarForUpdate`. Khi chủ xe bấm duyệt, hàng dữ liệu xe trong PostgreSQL bị khóa độc quyền bằng `SELECT ... FOR UPDATE` cho đến khi commit transaction. Các luồng khác phải chờ, triệt tiêu 100% tình trạng Overbooking."* |
| **2** | *"Quy trình cọc 30% VietQR hoạt động ra sao? Khách không chuyển thì sao?"* | **Chí Tín**<br>*(Payment & Frontend)* | *"Dạ, khi được duyệt, xe kích hoạt Soft Lock 45 phút cho khách cọc 30% qua mã VietQR sinh động. Các đơn khác tạm chuyển sang `ON_HOLD`. Nếu quá 45 phút khách không cọc, Cronjob `RentalExpirationScheduler` tự hủy đơn thành `EXPIRED` và tự động khôi phục các đơn `ON_HOLD` về `PENDING_APPROVAL` để chủ xe duyệt khách khác."* |
| **3** | *"Khiếu nại không nhận xe (Dispute) được giải quyết như thế nào? Có sợ hoàn tiền 2 lần không?"* | **Nguyễn Duy Bảo**<br>*(Tech Lead)* | *"Dạ, khách gửi đơn khiếu nại đính kèm ảnh/video bằng chứng, đơn chuyển `DISPUTED` đóng băng cọc. Admin xem chứng cứ và duyệt `REFUND_RENTER`. Nhóm áp dụng khóa bi quan tại `RentalDisputeRepository.findByIdForUpdate` và kiểm tra trạng thái Idempotent, đảm bảo chỉ giải ngân hoàn cọc đúng 1 lần duy nhất."* |
| **4** | *"Trợ lý ảo AI hoạt động theo nguyên lý gì? Nếu mất mạng thì chatbot có chết không?"* | **Đỗ Ngọc Phát**<br>*(AI & Security)* | *"Dạ, hệ thống kết nối REST API với Google Gemini 2.5 Flash kèm ngữ cảnh xe từ CSDL và lưu vết lịch sử vào bảng `chat_memory`. Để đảm bảo chịu lỗi (Fault-Tolerance), nhóm xây dựng bộ máy Heuristic Regex dự phòng tự bóc tách tiếng Việt (ngày, giá, số chỗ) để query xe ngay cả khi không có mạng hay API Key."* |
| **5** | *"Khách cố tình chiếm dụng xe không trả thì hệ thống xử lý bằng cách nào?"* | **Nguyễn Duy Quân**<br>*(QA & Business Rule)* | *"Dạ, `RentalExpirationScheduler` quét định kỳ, nếu quá hạn `endDate` mà chưa Check-out thì tự chuyển sang `OVERDUE` và tính phạt lũy tiến ($1.5 \times$ giờ nếu $\le 24h$, gấp đôi giá ngày nếu $> 24h$). Quá 24h, hệ thống tự khóa tài khoản `BLOCKED` và kết xuất Hồ sơ pháp lý `ViolationDossierResponse` theo Điều 175 BLHS."* |
| **6** | *"Tại sao các em dùng JWT Stateless thay vì Session truyền thống?"* | **Tấn Khiêm**<br>*(Kiến trúc sư)* | *"Dạ, JWT Stateless giúp hệ thống dễ dàng mở rộng theo chiều ngang (Horizontal Scaling) mà không cần đồng bộ Session bộ nhớ giữa các server. Nhóm bổ sung trường `token_version` trong bảng `users` để có thể vô hiệu hóa token ngay lập tức khi người dùng đổi mật khẩu hoặc bị Admin khóa tài khoản."* |
| **7** | *"Tại sao các em không dùng React hay Vue mà lại chọn Vanilla JS ở Frontend?"* | **Chí Tín**<br>*(Fullstack)* | *"Dạ, giao diện DriveShare tập trung vào tính tương thích cao, tốc độ tải trang tĩnh nhanh và giao tiếp mượt mà qua REST API. Việc dùng Vanilla JS kết hợp Bootstrap 5 giúp giảm thiểu kích thước bundle tải về, dễ dàng kiểm soát DOM và hoạt động độc lập không phụ thuộc node_modules phức tạp."* |
| **8** | *"Hệ thống đã kiểm thử những gì? Có bài kiểm tra tải đồng thời không?"* | **Nguyễn Duy Quân**<br>*(QA Tester)* | *"Dạ, nhóm đã viết 188 bài test tự động bao gồm Unit Tests, Integration Tests và Concurrency Tests (chạy đa luồng bằng ExecutorService) để kiểm chứng khả năng chịu tải và chống đặt trùng xe trước khi đưa lên môi trường thật."* |
| **9** | *"Quy trình bàn giao xe (Check-in/Check-out) có gì đặc biệt?"* | **Lâm Chí Vĩ**<br>*(Backend Core)* | *"Dạ, đó là cơ chế Đồng thuận 2 chiều (Two-Way Handover). Chủ xe lập biên bản với ODO, vạch xăng và ảnh hiện trường, nhưng phải có sự xác nhận điện tử từ phía Khách thuê trên ứng dụng thì chuyến đi mới chính thức bắt đầu hoặc kết thúc, loại bỏ hoàn toàn tranh chấp vết trầy xước cũ."* |
| **10** | *"Phần eKYC các em đã tích hợp AI OCR đọc bằng lái tự động chưa?"* | **Đỗ Ngọc Phát**<br>*(AI & Security)* | *"Dạ thưa Thầy Cô, hiện tại hệ thống mới số hóa quy trình upload ảnh CCCD và GPLX 2 mặt để Admin thẩm định thủ công bằng mắt trên portal quản trị. Tính năng AI OCR tự động trích xuất ký tự và so khớp khuôn mặt là mục tiêu trọng tâm trong hướng phát triển giai đoạn tiếp theo của nhóm ạ."* |
