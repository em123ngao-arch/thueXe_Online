# CẨM NANG HỌC VÀ BẢO VỆ ĐỒ ÁN TỐT NGHIỆP DRIVESHARE (KHÓA K25)
> **Dành riêng cho nhóm sinh viên bảo vệ trước Hội đồng phản biện ITC**  
> *Mục tiêu: Hiểu tận gốc bản chất kỹ thuật, biết rõ từng dòng code nằm ở đâu, trả lời tự tin mọi câu hỏi phản biện của Thầy Cô.*

---

## MỤC LỤC 8 CHỦ ĐỀ CỐT LÕI

1. [Chủ đề 1: Mô hình P2P & Cơ chế Ký quỹ Escrow 30% VietQR (Slide 2, 3, 4)](#chủ-đề-1)
2. [Chủ đề 2: Kiến trúc Decoupled & Tech Stack Thực Tế (Slide 5)](#chủ-đề-2)
3. [Chủ đề 3: Phân tích Use Case & Chuẩn RBAC (Slide 6)](#chủ-đề-3)
4. [Chủ đề 4: Thiết kế CSDL 15 Bảng 3NF & 4 Bảng Hạt Nhân (Slide 7)](#chủ-đề-4)
5. [Chủ đề 5: Vòng đời đơn thuê & State Machine 18 Trạng Thái (Slide 8)](#chủ-đề-5)
6. [Chủ đề 6: ĐIỂM ĂN TIỀN NHẤT — Khóa Bi Quan CSDL `@Lock(PESSIMISTIC_WRITE)` (Slide 9)](#chủ-đề-6)
7. [Chủ đề 7: Cơ chế Khóa 2 Tầng (Two-Tier Locking) & Tự Động Phục Hồi `ON_HOLD` (Slide 10)](#chủ-đề-7)
8. [Chủ đề 8: Bảo mật JWT `token_version`, AI Hybrid Chịu Lỗi & 188 Tests (Slide 11, 15, 16)](#chủ-đề-8)
9. [Chủ đề 9: 4 Hạn chế Thực Tế — Trả lời khôn ngoan khi Thầy Cô hỏi xoáy (Slide 18)](#chủ-đề-9)

---

<a name="chủ-đề-1"></a>
## 1. CHỦ ĐỀ 1: MÔ HÌNH P2P & CƠ CHẾ KÝ QUỸ ESCROW 30% VIETQR (Slide 2, 3, 4)

### ❓ Nó là cái gì?
- **P2P (Peer-to-Peer Car Rental)**: Mô hình kinh tế chia sẻ kết nối trực tiếp chủ xe có xe nhàn rỗi với khách cần thuê xe tự lái. Sàn DriveShare đóng vai trò trung gian công nghệ, bảo đảm an toàn giao dịch.
- **Escrow 30% (Ký quỹ giữ chỗ)**: Khách thuê chỉ cần chuyển khoản trước đúng **30% tổng tiền thuê** vào tài khoản trung gian của Sàn qua mã VietQR chuẩn ngân hàng. 70% còn lại khách thanh toán trực tiếp cho chủ xe khi nhận chìa khóa.

### ❓ Tại sao lại chọn 30% mà không phải 100%?
1. **Giảm áp lực tài chính cho khách**: Thay vì phải chuyển 100% (ví dụ thuê 3 ngày hết 3.000.000đ thì phải chuyển hết), khách chỉ cần cọc 900.000đ để giữ xe.
2. **Đủ sức ràng buộc trách nhiệm**: 30% là số tiền đủ lớn để khách không dám "bỏ bom" (No-Show). Nếu khách tự ý hủy sát giờ hoặc không đến nhận xe, khách sẽ bị phạt mất số tiền cọc này.
3. **Bảo vệ quyền lợi khách thuê**: Nếu chủ xe bỏ hẹn không giao xe, Sàn đang giữ tiền cọc sẽ hoàn trả ngay 100% cọc cho khách và phạt tiền chủ xe.

### ❓ Dòng tiền vận hành như thế nào?
- **Bước 1**: Khách quét mã VietQR chuyển 30% cọc vào tài khoản Sàn DriveShare.
- **Bước 2**: Sàn đóng băng số tiền cọc này (Escrow Holding).
- **Bước 3**: Hai bên giao nhận xe, đi xe và trả xe an toàn (`COMPLETED`).
- **Bước 4**: Sàn giải ngân **90% doanh thu** vào Ví thu nhập của Chủ xe (Owner Earnings). Sàn giữ lại **10% phí dịch vụ nền tảng**. Chủ xe có thể bấm "Rút tiền" về tài khoản ngân hàng bất kỳ lúc nào.

---

<a name="chủ-đề-2"></a>
## 2. CHỦ ĐỀ 2: KIẾN TRÚC DECOUPLED & TECH STACK THỰC TẾ (Slide 5)

### ❓ Kiến trúc Decoupled Client - Server là gì?
- **Frontend và Backend hoàn toàn độc lập**:
  - **Frontend**: Chạy mã nguồn HTML5, CSS3, JavaScript ES6+ và Bootstrap 5. Frontend không kết nối trực tiếp vào CSDL mà chỉ giao tiếp với Backend qua các API HTTP.
  - **Backend**: Xây dựng bằng Java 17/21 và Spring Boot 3.3.4, đóng vai trò RESTful API Server.
- **Chuẩn hóa ApiResponse<T>**: Mọi endpoint API đều trả về định dạng JSON đồng nhất:
  ```json
  {
    "status": 200,
    "message": "Success",
    "data": { ... },
    "timestamp": "2026-10-30T08:00:00Z"
  }
  ```
- **Lợi ích**: Backend là Headless REST API. Sau này nếu làm ứng dụng di động Flutter/React Native, ta chỉ việc tái sử dụng 100% các API hiện có mà không cần sửa 1 dòng code backend nào!

### ❓ Hệ thống chia thành những Module nào?
Backend được tổ chức thành 9 module nghiệp vụ độc lập trong thư mục `backend/src/main/java/com/driveshare/modules/`:
1. `auth`: Đăng ký, đăng nhập JWT, đổi mật khẩu, Refresh Token.
2. `user`: Hồ sơ cá nhân, eKYC CCCD/GPLX, tài khoản ngân hàng.
3. `car`: Đăng xe, quản lý ảnh Cloudinary, khóa lịch bận (Blackout).
4. `rental`: Đặt xe, duyệt đơn, State Machine, phạt quá hạn, tính tiền cọc.
5. `payment`: Tích hợp VietQR, sinh mã QR động `DSPAY...`, xử lý ký quỹ.
6. `ai`: Trợ lý tư vấn chọn xe Gemini 2.5 Flash + Heuristic Regex.
7. `admin`: Dashboard thống kê, duyệt eKYC, Dispute Center, hồ sơ Điều 175.
8. `oauth2`: Đăng nhập nhanh bằng tài khoản Google.
9. `health`: Kiểm tra trạng thái máy chủ và kết nối CSDL.
A
---

<a name="chủ-đề-3"></a>
## 3. CHỦ ĐỀ 3: PHÂN TÍCH USE CASE & CHUẨN PHÂN QUYỀN RBAC (Slide 6)

### ❓ RBAC là gì?
- **RBAC (Role-Based Access Control)**: Phân quyền dựa trên vai trò. Người dùng đăng nhập có Token JWT chứa danh sách quyền (Roles). Hệ thống chia làm 3 Actor chính:
  1. `ROLE_CUSTOMER` (Khách thuê): Tìm xe, cọc 30% VietQR, Check-in/out, Khiếu nại.
  2. `ROLE_CAR_OWNER` (Chủ xe): Đăng xe, chặn lịch bận Blackout, duyệt đơn Soft Lock, lập biên bản ODO/xăng, Ví tiền.
  3. `ROLE_ADMIN` (Quản trị viên): Duyệt eKYC, duyệt xe, phân xử Dispute hoàn cọc, xử phạt Điều 175.

### ❓ Quan hệ `<<include>>` và `<<extend>>` trên sơ đồ Use Case nghĩa là gì?
- **Quan hệ `<<include>>` (Bắt buộc phải thực hiện kèm theo)**:
  - Khi Chủ xe bấm *Duyệt yêu cầu thuê xe* $\rightarrow$ Hệ thống `<<include>>` *Khóa tạm lịch xe (Soft Lock)* 45 phút.
  - Khi Khách thuê *Thanh toán cọc 30% VietQR* $\rightarrow$ Hệ thống `<<include>>` *Giữ cọc Escrow & Hard Lock*.
- **Quan hệ `<<extend>>` (Chỉ thực hiện khi có điều kiện phát sinh)**:
  - Khi hai bên thực hiện *Check-out trả xe*, nếu phát hiện đi vượt quá số km hoặc thiếu xăng $\rightarrow$ Hệ thống `<<extend>>` *Tính phụ phí*.
  - Khi Admin *Phân xử khiếu nại (Dispute)*, nếu xác định lỗi do Chủ xe tự ý bỏ hẹn $\rightarrow$ Hệ thống `<<extend>>` *Phạt chủ xe 500.000đ*.

---

<a name="chủ-đề-4"></a>
## 4. CHỦ ĐỀ 4: THIẾT KẾ CSDL 15 BẢNG 3NF & 4 BẢNG HẠT NHÂN (Slide 7)

### ❓ 3NF là gì? Tại sao phải thiết kế chuẩn 3NF?
- **Chuẩn 3NF (Third Normal Form)**:
  1. Đạt 1NF: Mỗi cột là nguyên tử (không chứa danh sách/mảng dữ liệu lồng nhau).
  2. Đạt 2NF: Mọi thuộc tính không khóa đều phụ thuộc hoàn toàn vào khóa chính (không phụ thuộc một phần).
  3. Đạt 3NF: Không có phụ thuộc bắc cầu (thuộc tính không khóa này không phụ thuộc vào thuộc tính không khóa khác).
- **Lợi ích**: Tránh dư thừa dữ liệu (Data Redundancy), loại bỏ nguy cơ cập nhật sai lệch (Update Anomaly) và tiết kiệm dung lượng lưu trữ trên PostgreSQL.

### ❓ 4 Bảng hạt nhân quan trọng nhất gồm những gì?
1. **`users`**: Khóa chính `id`. Quản lý tài khoản, mật khẩu băm BCrypt, quyền hạn, `token_version` (thu hồi phiên), và `failed_attempts` + `locked_until` (chống brute-force).
2. **`cars`**: Khóa chính `id`, khóa ngoại `owner_id`. Quản lý biển số `plate_number` (ràng buộc `UNIQUE`), đơn giá thuê theo ngày, hãng xe, số chỗ, tọa độ GPS, và trường Soft Delete `deleted_at`.
3. **`rentals`**: Khóa chính `id`, khóa ngoại `car_id`, `renter_id`. Lưu ngày bắt đầu, ngày kết thúc, tổng tiền thuê, tiền cọc 30%, trạng thái đơn `status` (18 trạng thái), và `payment_expires_at` (mốc hết hạn 45 phút).
4. **`payments`**: Khóa chính `id`, khóa ngoại `rental_id`. Lưu số tiền cọc 30%, mã giao dịch `transaction_code` (cú pháp `DSPAY...`), link ảnh QR VietQR, và trạng thái `PAID`.

---

<a name="chủ-đề-5"></a>
## 5. CHỦ ĐỀ 5: VÒNG ĐỜI ĐƠN THUÊ & STATE MACHINE 18 TRẠNG THÁI (Slide 8)

### ❓ Trình bày chu trình đi của một đơn thuê từ A đến Z?
```text
[Khách tạo đơn] ---> PENDING_APPROVAL (Chủ xe có 60 phút để duyệt)
                           │
       ┌───────────────────┴───────────────────┐
(Chủ từ chối/Quá 60m)                    (Chủ duyệt)
       │                                       │
   REJECTED / EXPIRED                 WAITING_PAYMENT (Soft Lock 45m)
                                               │
                           ┌───────────────────┴───────────────────┐
                     (Khách không cọc quá 45m)            (Khách cọc 30% VietQR)
                           │                                       │
                        EXPIRED                                CONFIRMED (Hard Lock chốt xe)
               (Tự phục hồi đơn ON_HOLD)                           │
                                                                   ▼
                                                             IN_PROGRESS (Nhận xe: Check-in ODO, 6 ảnh)
                                                                   │
                                                                   ▼
                                                             COMPLETED (Trả xe: Check-out đối soát ODO)
```

### ❓ Cơ chế đơn `ON_HOLD` hoạt động thông minh thế nào?
- **Tình huống**: Xe A có 2 người cùng muốn thuê ngày 01/11: Khách 1 gửi đơn trước, Khách 2 gửi đơn sau.
- **Xử lý**:
  - Khi Chủ xe duyệt đơn của Khách 1 $\rightarrow$ Đơn Khách 1 chuyển sang `WAITING_PAYMENT` (được giữ chỗ trong 45 phút).
  - Hệ thống tự động chuyển đơn của Khách 2 sang trạng thái tạm hoãn `ON_HOLD` (chưa từ chối ngay vì Khách 1 chưa chắc đã nộp tiền).
  - **Trường hợp A (Khách 1 cọc thành công)**: Đơn Khách 1 lên `CONFIRMED` $\rightarrow$ Đơn Khách 2 tự động bị hủy chuyển thành `REJECTED`.
  - **Trường hợp B (Khách 1 không cọc, quá 45 phút)**: Đơn Khách 1 chuyển sang `EXPIRED`. Ngay lập tức, Cronjob của hệ thống tự động **phục hồi** đơn của Khách 2 từ `ON_HOLD` quay trở lại `PENDING_APPROVAL` để Chủ xe duyệt tiếp cho Khách 2!
  - **Ý nghĩa**: Chủ xe không bị mất khách, xe luôn được tối ưu tỷ lệ cho thuê (Car Utilization Rate).

---

<a name="chủ-đề-6"></a>
## 6. CHỦ ĐỀ 6: ĐIỂM ĂN TIỀN NHẤT — KHÓA BI QUAN CSDL `@Lock(PESSIMISTIC_WRITE)` (Slide 9)

> [!IMPORTANT]
> **Đây là câu hỏi Thầy/Cô Hội đồng CNTT đánh giá cao nhất về năng lực lập trình Backend.**

### ❓ Vấn đề thực tế (Race Condition) là gì?
- Giả sử 2 luồng (Thread) từ 2 thiết bị khác nhau cùng gửi request duyệt thuê cùng 1 chiếc xe trong cùng một mili-giây.
- Nếu không có cơ chế khóa, cả 2 luồng đều đọc thấy xe đang ở trạng thái rảnh (`status = AVAILABLE`), cả 2 luồng cùng chấp nhận đơn $\rightarrow$ **Hậu quả**: Hai khách hàng cùng cọc tiền thuê 1 chiếc xe cùng ngày (**Overbooking**).
- Tương tự với việc hoàn tiền cọc: Lag mạng khiến Admin bấm nút "Hoàn cọc 100%" 2 lần liên tiếp $\rightarrow$ Nếu không khóa, hệ thống sẽ thực hiện chuyển tiền hoàn cọc 2 lần!

### ❓ Tại sao dùng Khóa Bi Quan (Pessimistic Lock) mà không dùng Khóa Lạc Quan (Optimistic Lock)?
- **Optimistic Lock (Dùng `@Version`)**: Không hề khóa dữ liệu lúc đọc. Nó chỉ kiểm tra số version lúc `UPDATE`. Ai đến trước thì thành công, ai đến sau thì bị văng lỗi `OptimisticLockException` và giao dịch bị Rollback.
  - *Nhược điểm*: Khi có xung đột cao (High Contention) trong giao dịch tài chính hoặc giữ chỗ xe, khách hàng hoặc chủ xe sẽ liên tục nhận thông báo lỗi khó chịu và phải thao tác lại từ đầu.
- **Pessimistic Lock (Khóa Bi Quan)**: "Bi quan" vì hệ thống giả định xung đột chắc chắn sẽ xảy ra. Do đó, ngay khi luồng đầu tiên bắt đầu đọc bản ghi để duyệt đơn, nó yêu cầu CSDL khóa chặt dòng dữ liệu đó lại bằng câu lệnh SQL:
  ```sql
  SELECT * FROM cars WHERE id = ? FOR UPDATE;
  ```
- **Cơ chế hoạt động**:
  1. PostgreSQL đặt một ổ khóa độc quyền (Row-level Exclusive Lock) trên dòng xe đó.
  2. Mọi luồng thứ 2, thứ 3 muốn đọc/sửa dòng xe đó **bắt buộc phải xếp hàng chờ (Blocked)** cho đến khi Transaction đầu tiên hoàn tất (`COMMIT` hoặc `ROLLBACK`).
  3. Luồng thứ 2 sau khi được mở khóa đọc lại dữ liệu sẽ thấy lịch xe đã bị chiếm và lập tức từ chối hợp lệ.
  4. **Kết quả**: Triệt tiêu **100%** nguy cơ Overbooking và không bao giờ bị hoàn cọc 2 lần!

### ❓ Chỉ đích danh code nằm ở đâu trong dự án?
1. **Khóa xe chống Overbooking**:
   - File: [`backend/src/main/java/com/driveshare/modules/car/repository/CarRepository.java#L91-L93`](file:///d:/MONHOCITC/K4/Spring_ThucTap_k4/backend/src/main/java/com/driveshare/modules/car/repository/CarRepository.java#L91-L93)
   ```java
   @Lock(LockModeType.PESSIMISTIC_WRITE)
   @Query("SELECT c FROM Car c WHERE c.carId = :carId AND c.deletedAt IS NULL")
   Optional<Car> findCarForUpdate(@Param("carId") Long carId);
   ```
2. **Khóa bản ghi khiếu nại chống hoàn tiền 2 lần (Idempotent Refund)**:
   - File: [`backend/src/main/java/com/driveshare/modules/rental/repository/RentalDisputeRepository.java#L18-L20`](file:///d:/MONHOCITC/K4/Spring_ThucTap_k4/backend/src/main/java/com/driveshare/modules/rental/repository/RentalDisputeRepository.java#L18-L20)
   ```java
   @Lock(LockModeType.PESSIMISTIC_WRITE)
   @Query("SELECT d FROM RentalDispute d WHERE d.id = :id")
   Optional<RentalDispute> findByIdForUpdate(@Param("id") Long id);
   ```

---

<a name="chủ-đề-7"></a>
## 7. CHỦ ĐỀ 7: CƠ CHẾ KHÓA 2 TẦNG (TWO-TIER LOCKING) & CRONJOB TỰ ĐỘNG (Slide 10)

### ❓ Two-Tier Locking vận hành thế nào?
- **Tầng 1 - Soft Lock (Khóa Mềm - 45 phút)**:
  - Khi chủ xe duyệt đơn $\rightarrow$ Đơn chuyển sang `WAITING_PAYMENT`.
  - Xe được giữ tạm thời trong 45 phút. Trường `payment_expires_at = Instant.now().plus(45, ChronoUnit.MINUTES)`.
  - Khách có đủ thời gian mở app ngân hàng quét VietQR cọc 30%.
- **Tầng 2 - Hard Lock (Khóa Cứng vĩnh viễn)**:
  - Khách thanh toán cọc thành công $\rightarrow$ Đơn chuyển sang `CONFIRMED`.
  - Xe bị khóa vĩnh viễn trên lịch thuê của hệ thống.

### ❓ Cronjob tự động phục hồi đơn `ON_HOLD` nằm ở đâu?
- File: [`backend/src/main/java/com/driveshare/modules/rental/scheduler/RentalExpirationScheduler.java#L51-L81`](file:///d:/MONHOCITC/K4/Spring_ThucTap_k4/backend/src/main/java/com/driveshare/modules/rental/scheduler/RentalExpirationScheduler.java#L51-L81)
- Phương thức: `autoExpireWaitingPaymentSoftLocks()`
- Cron biểu thức: `@Scheduled(cron = "${app.rental.expire-softlock-cron:0 * * * * *}")` (Quét định kỳ **mỗi phút một lần**).
- **Đoạn mã cốt lõi tự động phục hồi**:
  ```java
  // 1. Quá 45 phút chưa cọc -> Chuyển sang EXPIRED
  rental.setStatus(ERentalStatus.EXPIRED);

  // 2. Tìm tất cả các đơn ON_HOLD trùng lịch của xe này
  List<Rental> onHoldRentals = rentalRepository.findCompetingRentals(
      rental.getCarId(), rental.getStartDate(), rental.getEndDate(), rental.getRentalId(),
      List.of(ERentalStatus.ON_HOLD)
  );

  // 3. Tự động phục hồi đưa về PENDING_APPROVAL để chủ xe duyệt cho khách tiếp theo
  for (Rental onHold : onHoldRentals) {
      onHold.setStatus(ERentalStatus.PENDING_APPROVAL);
      onHold.setRejectReason(null);
  }
  rentalRepository.saveAll(onHoldRentals);
  ```

---

<a name="chủ-đề-8"></a>
## 8. CHỦ ĐỀ 8: BẢO MẬT JWT `token_version`, AI HYBRID & 188 TESTS (Slide 11, 15, 16)

### ❓ `token_version` giải quyết nhược điểm gì của JWT?
- **Nhược điểm kinh điển của JWT**: JWT vốn là **Stateless** (phi trạng thái). Sau khi cấp cho client, server không thể thu hồi token trước thời hạn hết hạn. Nếu người dùng bị lộ token hoặc bấm "Đổi mật khẩu", kẻ gian vẫn có thể dùng token cũ để đăng nhập.
- **Cách DriveShare giải quyết không cần Redis**:
  1. Trong bảng `users` có trường `token_version` (số nguyên, mặc định = 1).
  2. Khi sinh mã JWT, ta nhúng trường `tokenVersion` này vào Claims của JWT.
  3. Ở mỗi request, [`JwtAuthenticationFilter.java#L38-L40`](file:///d:/MONHOCITC/K4/Spring_ThucTap_k4/backend/src/main/java/com/driveshare/security/JwtAuthenticationFilter.java#L38-L40) bóc tách `tokenVersion` từ JWT so sánh với `session.getTokenVersion()`.
  4. Khi người dùng bấm **"Đổi mật khẩu"** hoặc **"Đăng xuất khỏi tất cả thiết bị"**, hệ thống chỉ cần tăng `token_version` trong CSDL lên 1 đơn vị.
  5. Ngay lập tức, tất cả các JWT cũ mang version cũ sẽ bị từ chối 100% mà không cần dựng cụm Redis Blacklist tốn kém bộ nhớ!

### ❓ Trợ lý AI Hybrid hoạt động thế nào khi mất mạng?
- **Online**: Hệ thống gọi trực tiếp REST API Google Gemini 2.5 Flash qua `java.net.http.HttpClient` (nhẹ hơn và độc lập hơn so với dùng SDK cồng kềnh). Ta truyền ngữ cảnh danh sách xe trống từ CSDL vào prompt để AI tư vấn giá xe và tính trước 30% tiền cọc.
- **Offline / Mất mạng / Hết Quota API**: Bộ máy `CarRentalHeuristicEngine` tự động kích hoạt. Sử dụng biểu thức chính quy (Regex) tiếng Việt phân tích tin nhắn người dùng (tìm từ khóa địa điểm, số chỗ, tầm giá) để lọc xe và tính toán cọc 30% chính xác tuyệt đối mà hệ thống không bao giờ bị đơ hay báo lỗi 500.

### ❓ 188 Tests tự động gồm những bài kiểm thử nào?
- Toàn bộ 188 bài test tự động đều **PASS 100%**:
  1. **Unit Tests**: Kiểm thử công thức tính tiền cọc 30%, công thức tính phạt quá hạn lũy tiến (trễ 1-5h phạt 1.5x tiền giờ, trễ trên 5h phạt 2.0x tiền giờ, quá 24h kích hoạt chế tài Điều 175 BLHS).
  2. **Integration Tests (MockMvc)**: Kiểm thử toàn diện các luồng xác thực JWT, phân quyền truy cập API theo Role, và xử lý Exception tập trung qua `GlobalExceptionHandler`.
  3. **Concurrency Tests**: Sử dụng `ExecutorService` bắn đồng thời 10 luồng đặt xe cùng một lúc để chứng minh Khóa bi quan CSDL hoạt động chính xác và loại bỏ hoàn toàn lỗi Overbooking.

---

<a name="chủ-đề-9"></a>
## 9. CHỦ ĐỀ 9: 4 HẠN CHẾ THỰC TẾ — CÁCH TRẢ LỜI KHÔN NGOAN KHI THẦY CÔ HỎI XOÁY (Slide 18)

> [!TIP]
> **Quy tắc vàng trước Hội đồng**: Đừng cố giấu giếm hay nói dối tính năng chưa làm. Thầy Cô là chuyên gia, chỉ cần hỏi 1 câu kỹ thuật là biết ngay. Việc chủ động nêu rõ 4 hạn chế ở Slide 18 thể hiện **tinh thần trung thực khoa học** và sự am hiểu tường tận hệ thống của nhóm!

Khi Thầy Cô hỏi: *"Dự án của các em còn điểm nào hạn chế hoặc chưa hoàn thiện không?"*, hãy tự tin trả lời 4 ý sau:

1. **Về Thanh toán VietQR**:
   - *Hiện tại*: Để phục vụ việc demo trơn tru tại Hội đồng, hệ thống sử dụng nút bấm mô phỏng Webhook trên giao diện để giả lập ngân hàng báo tiền cọc đã về tài khoản.
   - *Hướng phát triển*: Tích hợp Webhook biến động số dư ngân hàng tự động thời gian thực thông qua dịch vụ Casso.vn hoặc SePay.vn.
2. **Về Thẩm định eKYC**:
   - *Hiện tại*: Admin thẩm định hồ sơ giấy tờ bằng mắt thông qua ảnh chụp CCCD và bằng lái xe tải lên từ người dùng.
   - *Hướng phát triển*: Tích hợp dịch vụ AI OCR (FPT.AI hoặc VNPT eKYC) để tự động quét trích xuất số CCCD, hạn bằng lái và công nghệ Face Matching so khớp khuôn mặt sinh trắc học.
3. **Về Cơ chế Thông báo**:
   - *Hiện tại*: Sử dụng cơ chế REST Polling (gọi API định kỳ) để cập nhật thông báo chuông.
   - *Hướng phát triển*: Nâng cấp lên kết nối hai chiều thời gian thực thông qua WebSocket STOMP Message Broker để thông báo tức thì khi chủ xe duyệt đơn hoặc khách đã cọc tiền.
4. **Về Bản đồ tìm xe**:
   - *Hiện tại*: Dữ liệu tọa độ đã được lưu trong CSDL, nhưng giao diện người dùng đang lọc danh sách xe theo danh mục Tỉnh/Thành phố.
   - *Hướng phát triển*: Nhúng bản đồ tương tác Mapbox hoặc Leaflet OpenStreetMap cho phép khách tìm xe trực quan theo định vị GPS và bán kính (5km, 10km quanh vị trí hiện tại).

---

## TỔNG KẾT BẢN LĨNH PHẢN BIỆN (3 CÂU THẦN CHÚ)

1. **Khi Thầy hỏi về nghiệp vụ cốt lõi**:  
   👉 *"Dạ thưa Thầy, nghiệp vụ cốt lõi của DriveShare xoay quanh cơ chế Ký quỹ Escrow 30% VietQR để bảo vệ tài chính cho cả hai bên và State Machine 18 trạng thái điều khiển tự động quy trình đặt xe."*
2. **Khi Cô hỏi về điểm kỹ thuật khó nhất**:  
   👉 *"Dạ thưa Cô, điểm kỹ thuật thách thức nhất mà nhóm em đã giải quyết thành công là xử lý Race Condition chống Overbooking bằng Khóa bi quan CSDL `@Lock(LockModeType.PESSIMISTIC_WRITE)` tại CarRepository và cơ chế Two-Tier Locking tự động phục hồi đơn `ON_HOLD` qua Cronjob."*
3. **Khi Hội đồng hỏi về kiểm thử chất lượng**:  
   👉 *"Dạ thưa quý Thầy Cô, toàn bộ mã nguồn của nhóm đã được bảo vệ bởi 188 bài test tự động bao gồm Unit Test, Integration Test và Concurrency Test với tỷ lệ đạt 100% trước khi đưa vào báo cáo."*

