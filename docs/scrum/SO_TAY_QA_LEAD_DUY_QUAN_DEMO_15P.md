# SỔ TAY QA LEAD — KỊCH BẢN DEMO 15 PHÚT & BỘ CÂU HỎI VẤN ĐÁP 10 ĐIỂM
**Dành riêng cho:** Nguyễn Duy Quân (`@nguyenduyquan0609-cyber` / Avatar: `QD`)  
**Dự án:** DriveShare — Nền tảng Chia Sẻ & Cho Thuê Xe Trực Tuyến  
**Vai trò bảo vệ:** QA Lead (Trưởng nhóm Đảm bảo Chất lượng & Kiểm thử Nghiệp vụ) — Phụ trách Issue #60

---

## 🎯 PHẦN 1: KỊCH BẢN PHỐI HỢP DEMO 15 PHÚT (DRY RUN WALKTHROUGH)

### Chuẩn bị trước giờ G:
- Mở sẵn **3 Cửa sổ trình duyệt** (đặt cạnh nhau hoặc dùng 3 tab ẩn danh):
  - **Tab 1 (Khách thuê - Renter):** `renter@driveshare.com` / `Renter123@` (hoặc click nút pill `Renter` trên `login.html`).
  - **Tab 2 (Chủ xe - Owner):** `owner@driveshare.com` / `Owner123@` (hoặc click nút pill `Owner` trên `login.html`).
  - **Tab 3 (Quản trị viên - Admin):** `admin@driveshare.com` / `Admin123@` (hoặc click nút pill `Admin` trên `login.html`).

---

### BƯỚC 1: Khách tìm xe & Chatbot AI tư vấn (Thời lượng: 2 phút)
1. **Thao tác:**
   - Trên **Tab 1 (Khách thuê)**: Vào trang chủ `index.html`.
   - Mở widget **Trợ lý ảo AI DriveShare** ở góc phải màn hình.
   - Nhập câu hỏi: *"Tôi cần thuê xe 5 chỗ tự lái đi Vũng Tàu cuối tuần này, tư vấn giúp tôi xe nào tiết kiệm xăng?"*
   - Chatbot AI phân tích System Prompt và cơ sở dữ liệu xe, trả lời gợi ý xe **Mazda 3 Luxury** hoặc **Toyota Vios**.
   - Bấm vào thẻ xe được AI gợi ý để chuyển đến màn hình chi tiết xe.
2. **Quân thuyết minh với Thầy/Cô:**
   > *"Em đã kiểm thử phân hệ AI Chatbot, đảm bảo phản hồi dưới 1.5 giây, chỉ tư vấn đúng các mẫu xe đang ACTIVE trong cơ sở dữ liệu và từ chối lịch sự khi khách hỏi các câu hỏi không liên quan đến dịch vụ thuê xe."*

---

### BƯỚC 2: Khách gửi yêu cầu đặt xe (Thời lượng: 2 phút)
1. **Thao tác:**
   - Chọn ngày nhận xe (ngày mai) và ngày trả xe (sau 3 ngày).
   - Tích chọn điều khoản pháp lý và bấm **"Gửi yêu cầu thuê xe"**.
   - Màn hình hiển thị thông báo thành công. Vào trang **Chuyến đi của tôi**, đơn hiển thị badge màu vàng: `CHỜ DUYỆT (PENDING_APPROVAL)`.
2. **Quân thuyết minh với Thầy/Cô:**
   > *"Tại bước này, hệ thống áp dụng Rule BR-42 do em kiểm thử: Mỗi khách thuê chỉ được gửi tối đa 3 yêu cầu chờ duyệt cùng lúc để chống spam máy chủ; đồng thời kiểm tra giấy tờ GPLX/CCCD phải được VERIFIED trước khi cho phép gửi đơn."*

---

### BƯỚC 3: Chủ xe duyệt đơn & Khóa Soft Lock 45 phút (Thời lượng: 2 phút)
1. **Thao tác:**
   - Chuyển sang **Tab 2 (Chủ xe)**: Vào `owner-cars.html` (Quản lý đơn thuê).
   - Chuông thông báo nhảy số đỏ (WebSocket realtime).
   - Chủ xe thấy yêu cầu thuê mới, xem thông tin khách và bấm **"Duyệt cho thuê (APPROVED)"**.
   - Trạng thái đơn đổi sang `CHỜ ĐẶT CỌC (WAITING_PAYMENT)` kèm đồng hồ đếm ngược 45 phút.
2. **Quân thuyết minh với Thầy/Cô:**
   > *"Cơ chế Soft Lock được kích hoạt: Khoảng thời gian này tạm thời bị ẩn khỏi bộ tìm kiếm công khai để khách có 45 phút hoàn tất thanh toán cọc mà không bị khách khác cướp xe."*

---

### BƯỚC 4: Khách cọc 30% VietQR & Kích hoạt Hard Lock (Thời lượng: 2 phút)
1. **Thao tác:**
   - Quay lại **Tab 1 (Khách thuê)**: Đơn tự động nhảy sang `CHỜ ĐẶT CỌC`. Bấm nút **"Thanh toán cọc 30%"**.
   - Trang `payment.html` hiển thị mã **VietQR động** chứa chính xác số tiền cọc (30% tổng giá trị chuyến đi) và nội dung chuyển khoản có chứa mã đơn.
   - Bấm nút giả lập quét mã thành công. Đơn nhảy sang trạng thái `ĐÃ XÁC NHẬN (CONFIRMED)`.
2. **Quân thuyết minh với Thầy/Cô:**
   > *"Khi cọc 30% thành công, hệ thống chuyển sang Hard Lock: Đóng lịch xe vĩnh viễn trong CSDL và tự động từ chối (REJECTED) tất cả các đơn của khách khác đang chờ trong cùng khung giờ."*

---

### BƯỚC 5: Biên bản bàn giao Check-in 2 chiều (Thời lượng: 3 phút)
1. **Thao tác:**
   - Trên **Tab 2 (Chủ xe)**: Mở đơn thuê, bấm **"Lập biên bản bàn giao xe (Check-in)"**.
   - Nhập số ODO ban đầu (ví dụ: `15,200 km`), mức nhiên liệu (90%), đính kèm 4 ảnh hiện trạng các góc xe và bấm **"Ký biên bản giao xe"**.
   - Trên **Tab 1 (Khách thuê)**: Modal Shopee-style hiển thị biên bản bàn giao để khách đối chiếu. Khách bấm **"Đồng ý nhận xe"**.
   - Đơn chuyển trạng thái sang `ĐANG DIỄN RA (IN_PROGRESS)`.
2. **Quân thuyết minh với Thầy/Cô:**
   > *"Em đã kiểm thử tính toàn vẹn 2 chiều của biên bản bàn giao: Cả hai bên đều phải xác nhận thông số ODO và ảnh chụp hiện trạng để làm căn cứ pháp lý minh bạch nếu phát sinh tranh chấp hoặc va quẹt sau này."*

---

### BƯỚC 6: Trả xe Check-out & Đánh giá 5 sao đóng vòng đời (Thời lượng: 2 phút)
1. **Thao tác:**
   - Trên **Tab 2 (Chủ xe)**: Bấm **"Nghiệm thu trả xe (Check-out)"**, xác nhận xe không trầy xước.
   - Trên **Tab 1 (Khách thuê)**: Modal đánh giá hiện ra với 5 ngôi sao. Khách bấm chọn **5 sao**, nhập: *"Xe chạy rất êm, chủ xe nhiệt tình hỗ trợ 10/10!"* và bấm **"Gửi đánh giá"**.
   - Đơn lập tức đổi sang badge màu xanh lá: `ĐÃ HOÀN TẤT (COMPLETED)`.
2. **Quân thuyết minh với Thầy/Cô:**
   > *"Vòng đời đơn được đóng kín hoàn hảo: Sau khi đánh giá được lưu thành công, trạng thái chuyển COMPLETED và điểm trung bình rating của xe/chủ xe được tự động tái tính toán hiển thị lên trang chủ."*

---

### BƯỚC 7: Đối soát ví doanh thu 90/10 (Thời lượng: 2 phút)
1. **Thao tác:**
   - Trên **Tab 2 (Chủ xe)**: Vào trang `owner-earnings.html` (Ví thu nhập).
   - Kiểm tra bảng lịch sử: Đơn vừa hoàn tất được đối soát, hiển thị **90% tổng tiền** (Doanh thu thực nhận của chủ xe), và **10% hoa hồng** thuộc về nền tảng DriveShare.
2. **Quân thuyết minh với Thầy/Cô:**
   > *"Toàn bộ luồng tiền 90/10 được tính toán độc lập ở backend, đảm bảo không có sai lệch làm tròn số học giữa các giao dịch."*

---

## ⚡ PHẦN 2: KỊCH BẢN DEMO CÁC CA BIÊN NGUY HIỂM (EDGE CASES)

Khi Hội đồng yêu cầu: *"Em hãy demo xem hệ thống xử lý các lỗi hoặc ca biên như thế nào?"*, Quân mở ngay các màn hình sau:

### 1. Ca biên EC-01: Chống đặt trùng xe (Pessimistic Race Condition Guard)
- **Kịch bản:** Hai khách hàng A và B cùng gửi yêu cầu thuê 1 chiếc xe trong khoảng ngày trùng nhau.
- **Hệ thống xử lý:** Khi Chủ xe bấm duyệt đơn của khách A $\rightarrow$ Đơn của khách B tự động chuyển sang trạng thái `ON_HOLD` (Tạm giữ chờ).
- **Kỹ thuật:** Sử dụng `Pessimistic Locking (SELECT FOR UPDATE)` trong tầng Repository và cơ chế `findCompetingRentals`.

### 2. Ca biên EC-02: Quá hạn 45 phút giữ chỗ không đặt cọc
- **Kịch bản:** Khách được duyệt nhưng quên hoặc cố tình không thanh toán cọc VietQR trong 45 phút.
- **Hệ thống xử lý:** Scheduler nền `autoExpireWaitingPaymentSoftLocks()` quét định kỳ:
  - Tự động chuyển đơn sang `EXPIRED`.
  - Giải phóng Soft Lock xe.
  - Tự động hồi sinh đơn đang bị `ON_HOLD` trước đó về trạng thái `PENDING_APPROVAL` để chủ xe duyệt cho khách tiếp theo.

### 3. Ca biên EC-03: Chiếm dụng xe quá hạn trả (OVERDUE & Phạt x1.5)
- **Kịch bản:** Khách không trả xe đúng ngày kết thúc hợp đồng (`endDate < today`).
- **Hệ thống xử lý:**
  - Scheduler `autoDetectOverdueRentals()` tự động chuyển trạng thái sang `OVERDUE`.
  - Tự động tính số giờ trễ và tiền phạt lũy tiến:  
    $$\text{Phí phạt} = \text{Đơn giá ngày} \times 1.5 \times \text{Số ngày trễ}$$
  - Trên giao diện khách hiển thị hộp cảnh báo màu đỏ nhấp nháy: `CẢNH BÁO: CHUYẾN ĐI ĐÃ QUÁ HẠN!`.

### 4. Ca biên EC-04: Kích hoạt Blacklist & Xuất hồ sơ pháp lý 1-Click (Dossier)
- **Kịch bản:** Khách chiếm dụng xe trễ quá 24 giờ.
- **Hệ thống xử lý:**
  - Tự động chuyển trạng thái tài khoản `user.status = BLOCKED`. Khách này đăng nhập tạo đơn mới lập tức bị chặn với mã lỗi HTTP 403 `USER_BLOCKED_OVERDUE_VIOLATION`.
  - Trên **Tab 3 (Admin)**: Mở `admin.html`, vào tab Đơn quá hạn, bấm **"Xuất hồ sơ vi phạm 1-click"** $\rightarrow$ Kết xuất ngay lập tức bản báo cáo pháp lý gom đủ:
    - CCCD và GPLX 2 mặt của khách thuê.
    - Biển số, số khung, hãng xe.
    - Hợp đồng điện tử có điều khoản chế tài hình sự theo **Điều 175 Bộ luật Hình sự (Tội lạm dụng tín nhiệm chiếm đoạt tài sản)**.
    - Bằng chứng thanh toán cọc VietQR 30% và biên bản bàn giao ODO lúc nhận xe.

---

## 🎓 PHẦN 3: BỘ CÂU HỎI VẤN ĐÁP DÀNH CHO DUY QUÂN (10 ĐIỂM TUYỆT ĐỐI)

#### Câu 1: *"Với tư cách là QA Lead, em làm thế nào để đảm bảo hệ thống không bị crash hoặc vỡ giao diện trong buổi demo?"*
> **Quân trả lời:**  
> *"Dạ thưa Thầy/Cô, em đã triển khai kiểm thử theo mô hình kim tự tháp (Testing Pyramid):*  
> *1. Ở tầng Backend: Em cùng nhóm duy trì và chạy 203 bài Unit, Integration và Concurrency Tests đạt 100% BUILD SUCCESS, kiểm tra chặt chẽ tính toán tiền tệ BigDecimal và khóa luồng đồng thời.*  
> *2. Ở tầng Frontend: Em đã lập trình script tự động Node.js (`scripts/qa_lead_final_demo_e2e.js`) quét sạch 100% lỗi Console F12 trên toàn bộ 6 trang web chính.*  
> *3. Về độ tương thích hiển thị: Em đã kiểm tra responsive trên kích thước iPhone 14 Pro Max (430px) và iPhone SE (375px), bảo đảm timeline Shopee co giãn mượt mà, không bị thanh cuộn ngang vỡ khung hình."*

#### Câu 2: *"Cơ chế Blacklist do em phụ trách hoạt động ra sao và vì sao lại chọn mốc 24 giờ?"*
> **Quân trả lời:**  
> *"Dạ thưa Thầy/Cô, theo đặc tả nghiệp vụ cho thuê xe thực tế, chậm trả xe dưới 24 giờ thường do sự cố kẹt xe hoặc phát sinh lịch trình, hệ thống sẽ áp dụng chế tài dân sự là phạt trễ hạn 150% đơn giá.*  
> *Tuy nhiên, nếu trễ vượt quá 24 giờ mà khách không liên hệ, hành vi này có dấu hiệu chiếm dụng phương tiện. Lúc này Scheduler tự động kích hoạt cờ `isBlacklistedTriggered = true` và khóa tài khoản `BLOCKED`, chặn vĩnh viễn quyền đặt xe tiếp theo. Đồng thời, API Dossier do em xây dựng cho phép Admin xuất hồ sơ pháp lý 1-click để nộp Cơ quan Công an theo Điều 175 Bộ luật Hình sự và yêu cầu bồi thường bảo hiểm."*

#### Câu 3: *"Làm thế nào để hai người dùng cùng bấm nút thuê xe tại một tích tắc mà xe không bị cho thuê 2 lần?"*
> **Quân trả lời:**  
> *"Dạ thưa Thầy/Cô, hệ thống bảo vệ 2 lớp:*  
> *1. Tại tầng Controller & Service: Khi Chủ xe bấm duyệt, phương thức được bọc trong `@Transactional` với Pessimistic Locking (`SELECT FOR UPDATE`), chỉ 1 giao dịch được khóa bản ghi xe tại một thời điểm.*  
> *2. Tại tầng CSDL: Bảng `rentals` có composite index trên `(car_id, start_date, end_date, status)`. Khi đơn thứ nhất được duyệt sang WAITING_PAYMENT, truy vấn `findCompetingRentals` sẽ tìm tất cả các đơn trùng lịch còn lại và tự động chuyển sang ON_HOLD, triệt tiêu hoàn toàn rủi ro Race Condition."*

---

## 📋 PHẦN 4: BẢNG TỔNG KẾT NGHIỆM THU TEST MATRIX (QA FINAL REPORT)

| Mã Test | Phân hệ Kiểm thử | Kết quả | Ghi chú nghiệm thu |
| :---: | :--- | :---: | :--- |
| **HP-01** | Tìm xe & AI Chatbot tư vấn | **PASS** | Chatbot trả lời chuẩn xe trong CSDL sàn |
| **HP-02** | Đặt xe `PENDING_APPROVAL` | **PASS** | Giới hạn tối đa 3 đơn chờ duyệt |
| **HP-03** | Duyệt đơn & Soft Lock 45 phút | **PASS** | Đếm ngược 45 phút giữ chỗ |
| **HP-04** | Cọc VietQR 30% & Hard Lock | **PASS** | Đổi `CONFIRMED`, đóng lịch vĩnh viễn |
| **HP-05** | Check-in bàn giao ODO 2 chiều | **PASS** | 4 góc ảnh, đối chiếu ODO và xăng |
| **HP-06** | Trả xe & Đánh giá 5 sao | **PASS** | Đóng vòng đời sang `COMPLETED` |
| **HP-07** | Ví thu nhập chủ xe 90/10 | **PASS** | Tách bạch 90% doanh thu và 10% phí sàn |
| **EC-01** | Chống đặt trùng xe | **PASS** | Đơn thứ 2 tự chuyển `ON_HOLD` |
| **EC-02** | Quá hạn 45p cọc tự hủy | **PASS** | Đơn chuyển `EXPIRED`, giải phóng `ON_HOLD` |
| **EC-03** | Trả trễ hạn OVERDUE phạt x1.5 | **PASS** | Tự động tính phí phạt lũy tiến |
| **EC-04** | Xuất Dossier & Khóa Blacklist | **PASS** | Xuất hồ sơ Điều 175 BLHS, chặn đặt xe mới |
| **UI-01** | Kiểm toán F12 Console | **PASS** | 0 lỗi đỏ trên tất cả các trang |
| **UI-02** | Mobile Responsive (430px / 375px) | **PASS** | Shopee timeline co giãn mượt mà |

**Kết luận:** Hệ thống DriveShare đã sẵn sàng 100% cho buổi bảo vệ và demo chính thức! 🔥💪

