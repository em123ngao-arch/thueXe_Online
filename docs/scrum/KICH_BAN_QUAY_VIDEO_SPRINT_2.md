# 🎬 KỊCH BẢN QUAY VIDEO DEMO SPRINT 2 (DRIVESHARE)
### Báo Cáo & Nghiệm Thu Sản Phẩm Đồ Án K4 — Dành Cho Giáo Viên Hướng Dẫn

---

## 📌 THÔNG TIN TỔNG QUAN SPRINT 2
- **Dự án**: DriveShare — Nền tảng chia sẻ và cho thuê xe ô tô tự lái trực tuyến.
- **Trọng tâm Sprint 2**: Toàn bộ luồng nghiệp vụ cốt lõi từ **Tìm kiếm xe đa tiêu chí ➔ Đặt xe (Booking) ➔ Chủ xe duyệt đơn (Approval Engine) ➔ Thanh toán cọc VietQR 30% (Payment Gateway) ➔ Báo cáo doanh thu & Lịch trình xe**.
- **Kết quả kiểm thử**: Đạt **123/123 Unit Tests Backend** và **16/16 Ca kiểm thử tích hợp tự động (Pass 100%)**.
- **Thời lượng video khuyến nghị**: **5 – 8 phút**.

---

## 🔑 TÀI KHOẢN & DỮ LIỆU DEMO DÙNG TRONG VIDEO

| Vai trò (Role) | Email đăng nhập | Mật khẩu | Chức năng demo trong video |
| :--- | :--- | :--- | :--- |
| **Khách thuê (Renter)** | `renter@driveshare.com` | `Renter123@` | Tìm xe, chọn ngày trống, gửi đơn thuê, quét mã VietQR cọc 30% |
| **Chủ xe (Car Owner)** | `owner@driveshare.com` | `Owner123@` | Quản lý xe, xem yêu cầu thuê, duyệt đơn, xem thống kê doanh thu |
| **Quản trị viên (Admin)** | `admin@driveshare.com` | `Admin123@` | Xem CSDL qua Adminer, Swagger Docs |

---

## ⏱️ KỊCH BẢN QUAY VIDEO CHI TIẾT THEO TỪNG PHÚT

### 🎬 PHẦN 1: MỞ ĐẦU & TỔNG QUAN SPRINT 2 (0:00 - 0:45)
* **Thao tác trên màn hình:**
  1. Mở trang chủ DriveShare tại **[http://localhost:3000](http://localhost:3000)**.
  2. Mở lướt qua bảng Jira Backlog Sprint 2 hoặc file `NHIEM_VU_THANH_VIEN.md`.
* **Lời thoại gợi ý:**
  > *"Em xin chào Thầy/Cô. Hôm nay nhóm em xin phép trình bày video báo cáo nghiệm thu kết quả thực hiện Sprint 2 của dự án DriveShare - Nền tảng cho thuê xe tự lái trực tuyến.*  
  > *Trong Sprint 2, nhóm em tập trung hoàn thành trọn vẹn luồng nghiệp vụ phức tạp nhất của dự án, bao gồm: Tìm kiếm xe đa tiêu chí & lọc lịch trống, luồng đặt xe với ràng buộc tối đa 3 đơn chờ, hệ thống chủ xe phê duyệt/từ chối đơn kèm chống trùng lịch, và phân hệ thanh toán cọc 30% tích hợp mã VietQR động."*

---

### 🎬 PHẦN 2: KHÁCH THUÊ TÌM XE & TÍNH NĂNG SMART CALENDAR (0:45 - 2:15)
* **Thao tác trên màn hình:**
  1. Tại trang chủ [http://localhost:3000](http://localhost:3000), rê chuột vào các thẻ xe.
  2. **Chỉ rõ nhãn Badge cảnh báo màu đỏ**: `Bận 02/10 - 05/10` trên ảnh xe đang có đơn giữ chỗ.
  3. Sử dụng thanh tìm kiếm Hero Banner:
     - Chọn hãng xe: `VinFast` hoặc `Mitsubishi`.
     - Lọc theo số chỗ (5 chỗ / 7 chỗ) hoặc khoảng giá.
  4. Bấm **"Thuê xe"** trên xe VinFast VF8:
     - Cho giáo viên thấy **Thông báo màu xanh ngọc**: *"Đã tự động chọn khoảng ngày trống gần nhất khả dụng cho xe này..."* (Thuật toán Smart Date Finder).
     - Bấm **"Thay đổi lịch trình"**: Mở bộ chọn ngày `MiotoTimePicker`, chỉ cho thầy cô thấy các ô ngày xe bận đã bị **gạch chéo đỏ và làm mờ**, không cho click vào ngày bận.
     - Thử chọn trùng ngày bận để thấy cảnh báo lỗi màu đỏ tại chỗ và nút Đặt xe tự động bị **Vô hiệu hóa (Disable)**, triệt tiêu hoàn toàn popup alert.
  5. Chọn khoảng ngày trống hợp lệ (ví dụ: ngày 20 đến ngày 22 tháng tới).
  6. Điền ghi chú và bấm **"Gửi yêu cầu thuê xe"**.
* **Lời thoại gợi ý:**
  > *"Đầu tiên là phân hệ tìm kiếm và đặt xe của khách hàng. Điểm cải tiến nổi bật của nhóm em trong Sprint 2 là tính năng Smart Calendar và chống đặt trùng xe:*  
  > *- Ngoài trang chủ, xe nào đã có người cọc hoặc chủ xe bận bảo dưỡng đều được gắn nhãn cảnh báo đỏ rõ ràng.*  
  > *- Khi khách mở form thuê xe, hệ thống tự động tìm khoảng ngày trống gần nhất khả dụng, tránh việc mặc định gán ngày bận gây ức chế cho người dùng.*  
  > *- Bộ chọn ngày của nhóm tự động làm mờ và khóa các ngày xe bận. Khách không thể chọn sai, form hiển thị tính toán số ngày, đơn giá, tổng tiền và tiền cọc 30% minh bạch."*

---

### 🎬 PHẦN 3: XEM CHUYẾN ĐI CỦA TÔI & RÀNG BUỘC TỐI ĐA 3 ĐƠN (2:15 - 3:15)
* **Thao tác trên màn hình:**
  1. Sau khi gửi đơn, hệ thống chuyển hướng hoặc mở trang **Chuyến đi của tôi** (`profile.html` hoặc `trips.html`).
  2. Cho giáo viên thấy đơn vừa tạo hiển thị ở trạng thái **`CHỜ DUYỆT (PENDING)`**.
  3. Khách có nút **"Hủy yêu cầu"** (rút đơn khi chủ xe chưa duyệt).
  4. Nêu rõ nghiệp vụ: Hệ thống giới hạn tối đa 3 đơn `PENDING` cho 1 khách hàng để chống spam giữ chỗ ảo, và scheduler quét tự động hết hạn sau 60 phút nếu chủ xe không phản hồi.
* **Lời thoại gợi ý:**
  > *"Tại trang quản lý chuyến đi của khách, đơn thuê vừa được tạo ở trạng thái Chờ duyệt. Nhóm em đã cài đặt 2 Business Rules quan trọng theo đặc tả:*  
  > *1. Mỗi khách chỉ được có tối đa 3 đơn chờ duyệt cùng lúc.*  
  > *2. Đơn chờ duyệt quá 60 phút mà chủ xe không duyệt sẽ tự động chuyển sang trạng thái EXPIRED."*

---

### 🎬 PHẦN 4: CHỦ XE PHÊ DUYỆT ĐƠN & TỰ ĐỘNG HỦY ĐƠN TRÙNG (3:15 - 4:45)
* **Thao tác trên màn hình:**
  1. Đăng xuất tài khoản khách, đăng nhập tài khoản **Chủ xe**: `owner@driveshare.com` / `Owner123@`.
  2. Mở trang **Quản lý xe của tôi** (`owner-cars.html`): xem danh sách các xe đang cho thuê của chủ xe.
  3. Mở trang **Yêu cầu thuê xe**:
     - Thấy ngay đơn thuê của khách vừa gửi đến kèm thông tin người thuê, số điện thoại, ngày nhận - trả, tổng tiền.
     - **Thử bấm Từ chối nhưng không nhập lý do**: Hệ thống chặn lại và báo lỗi bắt buộc nhập lý do từ chối.
     - **Bấm nút Phê duyệt đơn**: Đơn chuyển sang trạng thái **`ĐÃ DUYỆT / CHỜ CỌC (WAITING_PAYMENT)`**.
     - Giới thiệu thuật toán: Khi duyệt đơn này, tất cả các đơn `PENDING` khác của xe bị trùng lịch sẽ tự động bị từ chối với lý do 'Xe đã được duyệt cho khách khác'.
* **Lời thoại gợi ý:**
  > *"Bây giờ em chuyển sang giao diện của Chủ xe. Chủ xe có thể xem toàn bộ xe của mình và danh sách các yêu cầu thuê gửi đến.*  
  > *Chủ xe có toàn quyền duyệt hoặc từ chối đơn. Khi chủ xe bấm Phê duyệt, hệ thống sẽ mở cổng thanh toán giữ chỗ 45 phút cho khách hàng, đồng thời thuật toán Approval Engine tự động quét và từ chối các đơn cạnh tranh khác bị trùng ngày để đảm bảo tính nhất quán tuyệt đối."*

---

### 🎬 PHẦN 5: THANH TOÁN TIỀN CỌC VIETQR 30% & XÁC NHẬN THÀNH CÔNG (4:45 - 6:30)
* **Thao tác trên màn hình:**
  1. Đăng nhập lại tài khoản **Khách thuê** (`renter@driveshare.com`).
  2. Vào lại trang chuyến đi, đơn thuê hiện chữ **"Chủ xe đã duyệt - Vui lòng đặt cọc"**.
  3. Bấm nút **"Thanh toán cọc ngay"** ➔ Mở trang thanh toán `payment.html`:
     - Hiển thị tóm tắt: Đơn giá, 30% tiền cọc cần chuyển (ví dụ 600.000 VNĐ).
     - **Mã QR VietQR chuẩn ngân hàng** (MB Bank / VietinBank) được sinh tự động kèm số tiền và mã giao dịch chuẩn xác.
     - Đồng hồ đếm ngược 45 phút giữ chỗ.
  4. Bấm nút **"Mô phỏng quét mã & Thanh toán thành công (Mock Gateway)"**.
  5. Màn hình báo thành công với hiệu ứng confetti / badge xanh: Đơn thuê chính thức chuyển sang trạng thái **`ĐÃ CỌC (CONFIRMED)`**, lịch xe được khóa an toàn.
* **Lời thoại gợi ý:**
  > *"Đây là phân hệ Thanh toán do bạn Chí Tín phụ trách trọn gói. Khách hàng nhận được thông báo đơn đã được duyệt và bấm vào thanh toán.*  
  > *Hệ thống tự động tính chính xác 30% tiền cọc và tích hợp cổng VietQR sinh mã QR động. Khách hàng quét mã này bằng ứng dụng ngân hàng bất kỳ.*  
  > *Khi thanh toán hoàn tất, trạng thái thanh toán chuyển sang SUCCESS và đơn thuê chuyển sang CONFIRMED. Lịch xe lúc này chính thức được khóa."*

---

### 🎬 PHẦN 6: BÁO CÁO DOANH THU CHỦ XE & MINH CHỨNG KIỂM THỬ (6:30 - 7:30)
* **Thao tác trên màn hình:**
  1. Đăng nhập lại **Chủ xe**, vào trang **Doanh thu** (`owner-earnings.html`):
     - Chỉ cho thầy cô thấy số tiền cọc vừa nhận được cập nhật tức thì vào doanh thu, danh sách lịch sử giao dịch tăng lên.
  2. Mở cửa sổ Terminal và chạy lệnh test tự động toàn bộ Sprint 2:
     ```powershell
     powershell -ExecutionPolicy Bypass -File .\scripts\test_sprint2_all.ps1
     ```
     - Cho thầy cô thấy bảng kết quả **16/16 bài test PASS 100%** bao phủ từ Auth, Car Search, Booking, Approval đến VietQR Payment.
  3. Mở nhanh tab **Swagger Docs** tại [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html) và **Adminer DB** tại [http://localhost:8088](http://localhost:8088).
* **Lời thoại kết luận:**
  > *"Cuối cùng, chủ xe có trang theo dõi doanh thu và dòng tiền minh bạch. Số tiền cọc vừa rồi được ghi nhận tức thì vào lịch sử dòng tiền.*  
  > *Về mặt kỹ thuật, nhóm em đã xây dựng kịch bản kiểm thử tự động toàn diện test_sprint2_all.ps1 với 16/16 ca kiểm thử đạt kết quả PASS 100% cùng 123 bài Unit Test Backend.*  
  > *Trên đây là toàn bộ phần demo sản phẩm Sprint 2 của nhóm em. Em xin chân thành cảm ơn Thầy/Cô đã theo dõi!"*

---

## 💡 MẸO ĐỂ VIDEO ĐẠT ĐIỂM CAO TUYỆT ĐỐI
1. **Âm thanh rõ ràng**: Dùng micro tai nghe, nói to, rõ ràng, dứt khoát.
2. **Độ phân giải màn hình**: Quay full HD 1080p (tỉ lệ 16:9), phóng to cỡ chữ terminal và trình duyệt (nhấn `Ctrl + +`) để thầy cô dễ đọc chữ.
3. **Thao tác mượt mà**: Đi đúng kịch bản từ Khách -> Chủ xe -> Khách cọc -> Chủ xe xem tiền. Không bấm linh tinh gây mất thời gian.
