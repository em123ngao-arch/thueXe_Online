# TÀI LIỆU ĐẶC TẢ NGHIỆP VỤ & THIẾT KẾ HỆ THỐNG CHO THUÊ XE TỰ LÁI (P2P CAR RENTAL)

**Phiên bản tài liệu:** 2.0.0 (hợp nhất bản gốc 1.0.0 + toàn bộ phần bổ sung, vá lỗi)
**Mô hình vận hành:** Peer-to-Peer Car Rental (Khách thuê cá nhân kết nối Chủ xe cá nhân qua Sàn giao dịch giữ tiền đảm bảo — Escrow Model)
**Mục tiêu:** Tài liệu nghiệp vụ (BRD) và đặc tả kỹ thuật tính năng (FSD) đầy đủ cho đội ngũ Product, Backend, Frontend, DBA.

---

## MỤC LỤC

1. Tổng quan luồng nghiệp vụ chính
2. Chi tiết các giai đoạn nghiệp vụ
3. State Machine: vòng đời đơn hàng
4. Quy tắc tài chính, dòng tiền & mô hình ký quỹ (Escrow)
5. Chính sách hủy chuyến & xử lý tranh chấp
6. Chống lách sàn (Disintermediation Prevention)
7. Thế chấp tài sản qua sàn & biên bản bàn giao điện tử
8. Bảo hiểm chuyến đi
9. eKYC — Xác thực danh tính
10. Quy trình xử lý tranh chấp chi tiết (DISPUTED)
11. Yêu cầu kỹ thuật dành cho Backend Developer
12. Danh mục bảng dữ liệu mới

---

## 1. TỔNG QUAN LUỒNG NGHIỆP VỤ CHÍNH (END-TO-END WORKFLOW)

Quy trình áp dụng cơ chế "Duyệt hồ sơ trước — Cọc sau" (Request to Book) kết hợp "Khóa 2 giai đoạn" (Soft Lock & Hard Lock) để giải quyết bài toán chống trùng lịch và bảo vệ tài sản của chủ xe.

```
[Khách tìm xe] ──→ [Gửi yêu cầu thuê] (Nhiều khách gửi cùng lúc)
                           ↓
                  [Chủ xe thẩm định hồ sơ]  ──(quá hạn thẩm định)──→ [AUTO_EXPIRED_NO_HOST_ACTION]
                           ↓
                 [Chủ xe duyệt 1 khách] ──→ (Kích hoạt Soft Lock 45 phút)
                           ↓
             [Khách được chọn thanh toán cọc 30%]
              /                            \
      (Thành công, đúng số tiền)      (Quá hạn 45p / thiếu tiền)
           ↓                                 ↓
[Kích hoạt Hard Lock]              [Hủy giữ chỗ (Release Lock) → EXPIRED]
[Tự động từ chối các đơn trùng]     [Mở lại để chủ duyệt khách khác]
           ↓
[Gặp mặt nhận xe: eKYC đối chiếu, Biên bản bàn giao điện tử, ký HĐ, thế chấp & trả nốt 70%]
           ↓
[Khách trả xe & nghiệm thu tài sản]  ──(có sự cố)──→ [DISPUTED → quy trình xử lý mục 10]
           ↓
[Sàn quyết toán Payout cho Chủ xe & Đóng đơn]
```

---

## 2. CHI TIẾT CÁC GIAI ĐOẠN NGHIỆP VỤ

### Giai đoạn 1: Tìm kiếm & Gửi yêu cầu đặt xe (Multi-Request)

- Khách hàng chọn điểm nhận xe, thời gian bắt đầu ($T_{start}$) và thời gian kết thúc ($T_{end}$).
- **Điều kiện hiển thị:** Xe chỉ hiển thị nếu khoảng thời gian $[T_{start}, T_{end}]$ không giao nhau với bất kỳ đơn thuê nào đang ở trạng thái `WAITING_PAYMENT`, `CONFIRMED`, hoặc `IN_PROGRESS`.
- Khách hàng cung cấp thông tin chuyến đi (mục đích di chuyển, điểm đến) và gửi yêu cầu.
- Hệ thống cho phép nhiều khách hàng cùng gửi yêu cầu trên một khung giờ trống của cùng một chiếc xe.
- Tại giai đoạn này, khách chưa phải thanh toán bất kỳ khoản tiền nào.
- Đơn hàng được tạo với trạng thái: `PENDING_APPROVAL`.
- **Điều kiện tiên quyết (bổ sung):** hồ sơ khách phải ở trạng thái `identity_verifications.status = VERIFIED` (xem mục 9) mới được phép gửi yêu cầu thuê.
- Khách có thể chủ động rút yêu cầu khi đơn còn `PENDING_APPROVAL` → chuyển `WITHDRAWN_BY_GUEST`, không áp dụng chế tài vì chưa phát sinh cam kết tài chính.

### Giai đoạn 2: Chủ xe thẩm định & Lựa chọn (Host Screening)

- Khi có yêu cầu mới, hệ thống gửi thông báo (Web Push / SMS / App Notification) cho chủ xe.
- Chủ xe truy cập trang quản lý đơn, xem danh sách các ứng viên đang chờ duyệt: điểm đánh giá (rating trung bình, số chuyến đã đi), trạng thái xác thực hồ sơ, tuyến đường dự kiến di chuyển.
- **Quy tắc:** Chủ xe chỉ được bấm duyệt duy nhất 1 khách hàng trong một khoảng lịch giao nhau. Khi chủ xe duyệt một khách, hệ thống kích hoạt Giai đoạn 3.
- **Timeout thẩm định (bổ sung):** nếu `T_start - NOW() < 72 giờ` mà chủ xe chưa duyệt bất kỳ đơn nào cho khung giờ đó, hệ thống gửi cảnh báo khẩn (Push + SMS) cho chủ xe. Nếu còn `< 24 giờ` mà vẫn chưa duyệt, toàn bộ đơn `PENDING_APPROVAL` của khung giờ đó tự động chuyển `AUTO_EXPIRED_NO_HOST_ACTION`, đồng thời hạ điểm phản hồi (response score) của chủ xe.

### Giai đoạn 3: Giữ chỗ tạm thời (Soft Lock & Grace Period)

Ngay khi chủ xe bấm "Đồng ý cho thuê":
- Đơn của khách được chọn chuyển sang: `WAITING_PAYMENT`.
- Thiết lập thời hạn thanh toán: `payment_expires_at = NOW() + INTERVAL '45 MINUTES'`.
- Kích hoạt Soft Lock: tạm thời ẩn khung giờ này trên công cụ tìm kiếm đối với người dùng khác.
- Các yêu cầu khác cùng khung giờ chuyển sang trạng thái tạm giữ: `ON_HOLD` (kèm thông báo: "Chủ xe đang ưu tiên thanh toán cho một lượt đặt trước").
- Hệ thống gửi thông báo yêu cầu khách được chọn tiến hành đặt cọc trước khi hết hạn 45 phút.
- **Race-condition guard (bổ sung — xem chi tiết mục 11.2):** thao tác duyệt của chủ xe phải chạy trong transaction có row-lock trên xe, để double-click hoặc thao tác đa thiết bị không thể duyệt 2 khách trùng lịch cùng lúc.

### Giai đoạn 4: Xác thực thanh toán & Khóa cứng lịch (Hard Lock & Cleanup)

**Trường hợp 4.1 — Khách thanh toán cọc thành công (đúng số tiền, xem đối soát mục 11.3):**
- Khách quét mã VietQR hoặc thanh toán qua cổng điện tử đúng 30% giá trị hợp đồng vào tài khoản của Sàn.
- Webhook từ cổng thanh toán ghi nhận giao dịch thành công và **đối chiếu đúng số tiền** (mục 11.3) → chuyển trạng thái đơn sang `CONFIRMED`.
- Kích hoạt Hard Lock: đóng lịch xe vĩnh viễn trong khoảng $[T_{start}, T_{end}]$.
- Tự động dọn dẹp (Auto-rejection): quét toàn bộ các đơn `PENDING_APPROVAL` hoặc `ON_HOLD` bị trùng khung lịch của xe này, đổi trạng thái sang `REJECTED` với lý do: "Xe đã được chốt cọc bởi khách hàng khác".
- Hệ thống mở kênh liên lạc trực tiếp (số điện thoại, phòng chat nội bộ) giữa Chủ xe và Khách hàng để hẹn giờ giao nhận.
- Kích hoạt phát hành hợp đồng bảo hiểm chuyến đi tự động (xem mục 8).

**Trường hợp 4.2 — Khách quá hạn hoặc thanh toán thiếu (Quá 45 phút / không đủ tiền):**
- Tiến trình chạy ngầm (Scheduled Worker / Cron Job — xem mục 11.4) quét các đơn `WAITING_PAYMENT` có `payment_expires_at < NOW()`, chuyển sang `EXPIRED` và giải phóng Soft Lock.
- Nếu khách chuyển thiếu tiền (amount_received < D_booking): giữ nguyên `WAITING_PAYMENT`, **không** cộng dồn thêm thời gian hết hạn, thông báo khách nộp bổ sung phần còn thiếu trước khi hết hạn 45 phút ban đầu.
- Chuyển toàn bộ các đơn đang `ON_HOLD` trùng khung giờ trở lại trạng thái `PENDING_APPROVAL`.
- Bắn thông báo cho Chủ xe: "Khách hàng đã hết hạn thanh toán cọc. Vui lòng chọn khách hàng khác trong danh sách chờ."

### Giai đoạn 5: Bàn giao xe & Thanh toán phần còn lại (Check-in)

Hai bên gặp nhau tại điểm hẹn vào ngày $T_{start}$:
- **Kiểm tra pháp lý:** Chủ xe kiểm tra trực tiếp GPLX và CCCD bản gốc của khách, đối chiếu với kết quả eKYC đã xác thực trên hệ thống (mục 9).
- **Tài sản thế chấp (Security Deposit):** áp dụng một trong hai hình thức (chi tiết mục 7):
  - *(Khuyến nghị)* Khách nộp tiền thế chấp vào ví escrow của Sàn ngay tại bước check-in, xác nhận bằng chữ ký điện tử/OTP.
  - *(Truyền thống)* Khách giao tài sản bảo lãnh vật lý (xe máy chính chủ kèm cà vẹt, hoặc tiền mặt) trực tiếp cho chủ xe giữ — bắt buộc lập biên bản điện tử theo mục 7.2.
- **Biên bản kiểm tra ngoại quan (Digital Handover Record — mục 7.2):** chụp tối thiểu 8 ảnh bắt buộc (4 góc, nội thất, ODO, bình xăng, biển số), cả hai bên ký xác nhận điện tử.
- **Thanh toán phần còn lại:** khách thanh toán nốt 70% tiền thuê còn lại trực tiếp cho chủ xe.
- Chủ xe bấm nút "Bắt đầu chuyến đi" trên web → đơn chuyển sang `IN_PROGRESS`.

### Giai đoạn 6: Hoàn tất chuyến đi & Quyết toán sàn (Check-out & Payout)

Vào ngày $T_{end}$, khách trả xe cho chủ xe:
- Hai bên kiểm tra lại tình trạng xe so với Biên bản bàn giao ban đầu (check-out record theo mẫu mục 7.2).
- Nếu không phát sinh vấn đề, chủ xe hoàn trả lại 100% tài sản thế chấp cho khách (hoặc hệ thống tự động hoàn tiền nếu dùng ví escrow).
- Chủ xe bấm "Hoàn thành chuyến đi" trên web → đơn chuyển sang `COMPLETED`.
- **Điều kiện Payout (bổ sung — chống lách sàn, mục 6.2):** hệ thống chỉ giải ngân Payout nếu ít nhất một bên đã gửi đánh giá, hoặc sau 72 giờ kể từ khi khách trả xe (timeout tự động).
- Hệ thống kích hoạt quy trình Quyết toán (Payout): trích chuyển phần tiền cọc còn lại (sau khi khấu trừ hoa hồng sàn) vào tài khoản ví của chủ xe.
- Mở luồng Đánh giá (Review & Rating) 2 chiều.

---

## 3. STATE MACHINE: ĐỊNH NGHĨA VÒNG ĐỜI ĐƠN HÀNG (bookings.status)

| Mã trạng thái | Diễn giải | Khóa lịch? | Hành động kích hoạt kế tiếp |
|---|---|---|---|
| `PENDING_APPROVAL` | Khách đã gửi yêu cầu, đang chờ chủ xe duyệt hồ sơ. | Không | Chủ xe: Chấp thuận / Từ chối. Khách: rút yêu cầu → `WITHDRAWN_BY_GUEST`. Quá hạn 72h/24h không duyệt → `AUTO_EXPIRED_NO_HOST_ACTION`. |
| `WITHDRAWN_BY_GUEST` *(mới)* | Khách chủ động rút yêu cầu khi chưa được duyệt/chưa cọc. | Không | Trạng thái kết thúc, không chế tài. |
| `AUTO_EXPIRED_NO_HOST_ACTION` *(mới)* | Chủ xe không phản hồi trong thời hạn quy định. | Không | Trạng thái kết thúc, hạ điểm phản hồi chủ xe. |
| `WAITING_PAYMENT` | Chủ xe đã duyệt 1 khách. Đang trong 45 phút giữ chỗ. | Soft Lock | Khách cọc đủ tiền → `CONFIRMED`. Hết 45 phút / thiếu tiền không bổ sung kịp → `EXPIRED`. |
| `ON_HOLD` | Đơn của các khách khác bị tạm hoãn do xe đang trong Soft Lock. | Không | Đơn chính cọc xong → `REJECTED`. Đơn chính hết hạn → quay lại `PENDING_APPROVAL`. |
| `CONFIRMED` | Khách đã thanh toán cọc 30% (đúng số tiền). Chuyến đi đã được chốt. | Hard Lock | Đến ngày giao nhận xe → `IN_PROGRESS`. Có bên hủy đơn → `CANCELLED_BY_*`. |
| `IN_PROGRESS` | Khách đã nhận xe, bàn giao tài sản thế chấp và trả nốt 70%. | Hard Lock | Khách trả xe → `COMPLETED`. Có sự cố → `DISPUTED`. |
| `COMPLETED` | Chuyến đi kết thúc, đã quyết toán tiền cho chủ xe. | Không | Khách và Chủ đánh giá dịch vụ. |
| `EXPIRED` | Khách được chọn không thanh toán đủ cọc trong 45 phút. | Không | Trạng thái kết thúc của phiên giữ chỗ. |
| `REJECTED` | Bị từ chối bởi chủ xe hoặc hệ thống tự từ chối do trùng lịch. | Không | Trạng thái kết thúc. |
| `CANCELLED_BY_GUEST` | Khách hàng chủ động hủy chuyến sau khi đã cọc, hủy trước giờ hẹn. | Không | Áp dụng chế tài phạt theo mục 5.1. |
| `NO_SHOW` *(mới, tách khỏi CANCELLED_BY_GUEST)* | Khách không xuất hiện tại điểm hẹn dù đã cọc, không báo hủy trước. | Không | Chế tài nặng hơn hủy chủ động sớm (mục 5.1), tính riêng cho điểm uy tín. |
| `CANCELLED_BY_HOST` | Chủ xe chủ động hủy chuyến sau khi đã cọc. | Không | Hoàn 100% cho khách, phạt chủ xe (mục 5.2). |
| `DISPUTED` | Có tranh chấp khi giao nhận/trả xe (hỏng hóc, vi phạm hợp đồng). | Hard Lock | Chuyển sang các sub-state xử lý — chi tiết mục 10. |

---

## 4. QUY TẮC TÀI CHÍNH, DÒNG TIỀN & MÔ HÌNH KÝ QUỸ (ESCROW)

Hệ thống đóng vai trò trung gian giữ tiền để đảm bảo nghĩa vụ thực thi hợp đồng từ cả hai phía.

### 4.1. Phân biệt các loại tiền trong hệ thống

| Loại tiền | Nơi giữ | Mục đích | Hoàn trả |
|---|---|---|---|
| Tiền cọc giữ chỗ (Booking Deposit — 30%) | Tài khoản Sàn | Thanh toán trước một phần tiền thuê | Không hoàn nếu khách tự ý bùng xe |
| Tiền thế chấp tài sản (Security Deposit) | Ví escrow Sàn *(khuyến nghị)* hoặc trực tiếp Chủ xe giữ | Bảo đảm khách trả xe nguyên vẹn | Hoàn 100% khi nhận lại xe nguyên vẹn |
| Phí bảo hiểm chuyến đi *(mới — mục 8)* | Chuyển cho đối tác bảo hiểm | Bảo hiểm tai nạn/thiệt hại/TNDS bên thứ ba | Không hoàn (giống phí bảo hiểm thông thường) |

### 4.2. Công thức tính toán và Dòng tiền (Cashflow Formula)

Gọi:
- $P_{total}$: Tổng giá trị gói thuê xe.
- $R_{commission}$: Tỷ lệ hoa hồng sàn thu từ chủ xe (mặc định cấu hình hệ thống: 15%).
- $D_{booking}$: Tiền cọc giữ chỗ qua sàn (mặc định: 30%, có thể điều chỉnh tăng theo mục 6.3 nếu khách/chủ mới hoặc rating thấp).
- $Insurance_{fee}$: Phí bảo hiểm chuyến đi (mặc định 2–5% $P_{total}$, hiển thị tách bạch, xem mục 8).

Các biến số:

$$D_{booking} = P_{total} \times 30\%$$
$$P_{direct} = P_{total} \times 70\%$$
$$Fee_{platform} = P_{total} \times R_{commission} = P_{total} \times 15\%$$
$$Payout_{host} = D_{booking} - Fee_{platform} = P_{total} \times 15\%$$

**Bảng ví dụ hạch toán chi tiết** — Xe thuê 3 ngày, đơn giá 800.000 VNĐ/ngày, $P_{total} = 2.400.000$ VNĐ, hoa hồng sàn 15%:

| Giai đoạn | Bên chuyển | Bên nhận | Số tiền | Phương thức |
|---|---|---|---|---|
| 1. Lúc chốt cọc | Khách thuê | Tài khoản Sàn | 720.000 VNĐ | Cổng thanh toán (VietQR/VNPAY) |
| 2. Lúc nhận xe | Khách thuê | Chủ xe | 1.680.000 VNĐ | Tiền mặt / Chuyển khoản trực tiếp |
| 3. Khi hoàn tất | Sàn | Chủ xe | 360.000 VNĐ | Chuyển khoản tự động (Payout) |
| Thu nhập sàn | Khấu trừ từ cọc | Ví doanh thu Sàn | 360.000 VNĐ | Thu nhập ròng của nền tảng |

$$\text{Tổng thu thực tế của Chủ xe} = 1.680.000 + 360.000 = 2.040.000 \text{ VNĐ} \quad (85\% \text{ giá trị đơn})$$

---

## 5. CHÍNH SÁCH HỦY CHUYẾN & XỬ LÝ TRANH CHẤP (CANCELLATION POLICY)

### 5.1. Khách hàng hủy chuyến (Guest Cancellation)

Căn cứ vào thời điểm khách bấm nút "Hủy đơn" so với giờ nhận xe $T_{start}$:

- **Trước ≥ 7 ngày:** Hoàn lại 100% tiền cọc (720.000 VNĐ) về tài khoản khách. Sàn và chủ xe không thu phí.
- **Từ 24 giờ đến dưới 7 ngày:** Hoàn 70% tiền cọc cho khách; trích 20% chuyển vào ví bồi thường Chủ xe; Sàn thu 10% làm phí xử lý.
- **Dưới 24 giờ (`CANCELLED_BY_GUEST`):** khách mất 100% tiền cọc; Chủ xe nhận bồi thường 70% (504.000 VNĐ); Sàn giữ lại 30% (216.000 VNĐ).
- **Không đến nhận xe (`NO_SHOW` — mới, tách riêng khỏi hủy trước 24h):** áp dụng chế tài như trên **cộng thêm** hạ điểm uy tín ở mức nặng hơn so với hủy chủ động, vì gây thiệt hại thời gian chờ thực tế cho chủ xe tại điểm hẹn. Ghi nhận riêng biệt trong hồ sơ khách để tính vào ngưỡng khóa tài khoản nếu tái phạm.

### 5.2. Chủ xe hủy chuyến / Không giao xe (Host Cancellation)

Nếu chủ xe không thể giao xe đúng cam kết hoặc bấm hủy sau khi khách đã cọc:
- **Quyền lợi khách hàng:** hệ thống khởi tạo lệnh hoàn tiền ngay lập tức trong nội bộ (trạng thái ví/đơn hàng cập nhật tức thời); **tiền thực tế về tài khoản khách trong vòng 1–5 ngày làm việc** tùy cổng thanh toán trung gian (điều chỉnh so với cam kết "ngay lập tức" không khả thi ở bản gốc — cần hiển thị rõ trên UI). Đồng thời cấp 1 Voucher ưu đãi cho lần đặt tiếp theo.
- **Chế tài xử phạt chủ xe:** trừ 300.000 VNĐ/lần vi phạm vào ví hệ thống (số dư âm bị khóa quyền nhận khách mới cho đến khi nạp bù); tự động hạ điểm xếp hạng và ẩn xe khỏi trang tìm kiếm 7 ngày; vi phạm 2 lần trong 3 tháng → khóa tài khoản vĩnh viễn.

---

## 6. CHỐNG LÁCH SÀN (DISINTERMEDIATION PREVENTION)

**Vấn đề:** chỉ 30% giá trị hợp đồng đi qua sàn, 70% + toàn bộ thế chấp có thể giao dịch tiền mặt offline → chủ xe và khách có động cơ khai thấp $P_{total}$ trên hệ thống để giảm cọc/hoa hồng, rồi thỏa thuận giá thật ngoài app.

### 6.1. Giá sàn tối thiểu theo phân khúc xe (Price Floor)
Mỗi hạng xe (Hatchback / Sedan / SUV 5 chỗ / SUV 7 chỗ / Bán tải...) có `min_price_per_day` do Admin cấu hình theo giá thị trường khu vực. Hệ thống từ chối tạo tin đăng hoặc từ chối duyệt đơn nếu `P_total / số_ngày < min_price_per_day × 0.7`. Cảnh báo Admin (flag review) nếu xe liên tục đăng giá sát mức sàn trong khi rating cao.

### 6.2. Bắt buộc đánh giá 2 chiều mới giải ngân Payout
Booking chỉ mở khóa Payout nếu ít nhất một bên đã gửi đánh giá, hoặc sau 72 giờ kể từ khi khách trả xe (timeout tự động). Bổ sung câu hỏi ẩn (chỉ Admin thấy): "Bạn có thực hiện thanh toán nào ngoài số tiền hiển thị trên hệ thống không?" — phục vụ mô hình phát hiện gian lận giá, không công khai.

### 6.3. Tăng dần tỷ lệ cọc qua sàn theo uy tín
Khách/chủ mới (< 3 chuyến) hoặc rating thấp: `D_booking` có thể áp cao hơn mặc định (ví dụ 50%) để giảm động cơ giao dịch ngầm và giảm rủi ro no-show. Khách/chủ có ≥ 10 chuyến hoàn tất và rating ≥ 4.8: hạ `D_booking` xuống mức ưu đãi.

### 6.4. Cơ chế thưởng giữ khách trên sàn
Voucher/hoàn xu (cashback) cho các đơn đặt lại (repeat booking) qua đúng flow của sàn.

---

## 7. THẾ CHẤP TÀI SẢN QUA SÀN (SECURITY DEPOSIT ĐIỆN TỬ)

**Vấn đề gốc:** thế chấp cà vẹt xe máy/tiền mặt giao trực tiếp ngoài sàn → sàn không có dữ liệu để xử lý tranh chấp, tiềm ẩn rủi ro pháp lý khi giữ giấy tờ tài sản của người khác ngoài khuôn khổ tổ chức được cấp phép.

### 7.1. Khuyến nghị: Thế chấp bằng tiền qua ví Escrow của Sàn
- Khách nộp `Security_Deposit` vào ví tạm giữ (escrow) của Sàn tại thời điểm nhận xe, xác nhận bằng chữ ký điện tử/OTP.
- Sàn giữ hộ (không phải chủ xe giữ trực tiếp) → tránh tranh chấp "chủ xe không trả lại tài sản" hoặc "tài sản thế chấp giả/xe gian".
- Khi khách trả xe, nếu không phát sinh sự cố, Sàn tự động hoàn 100% vào ví khách trong vòng X giờ làm việc.
- Nếu hai bên vẫn muốn giữ hình thức thế chấp vật lý (cà vẹt xe máy) theo thỏa thuận riêng, hệ thống bắt buộc lập biên bản điện tử (mục 7.2) và cả hai bên ký xác nhận điện tử.
- **Lưu ý pháp lý:** cầm giữ giấy tờ xe của bên thứ ba như một hình thức bảo đảm nghĩa vụ ngoài hợp đồng tín dụng/cầm đồ có giấy phép là vùng xám pháp lý tại Việt Nam; nên tư vấn pháp lý riêng trước khi vận hành chính thức, và ưu tiên phương án ví escrow làm mặc định.

### 7.2. Biên bản bàn giao điện tử bắt buộc (Digital Handover Record)

Bảng `handover_records`:

| Trường | Mô tả |
|---|---|
| booking_id | Khóa ngoại đơn thuê |
| type | CHECK_IN / CHECK_OUT |
| odo_reading | Số km công tơ mét |
| fuel_level | Mức nhiên liệu (%) |
| photos[] | Tối thiểu 8 ảnh bắt buộc (4 góc xe, nội thất, ODO, bình xăng, biển số) |
| deposit_asset_type | CASH / MOTORBIKE / OTHER |
| deposit_asset_ref | Ảnh/mã tham chiếu tài sản thế chấp (nếu có) |
| guest_signature_at | Thời điểm khách xác nhận điện tử |
| host_signature_at | Thời điểm chủ xe xác nhận điện tử |

Đây là bằng chứng bắt buộc để Admin xử lý khi đơn chuyển `DISPUTED` (mục 10).

---

## 8. BẢO HIỂM CHUYẾN ĐI (TRIP INSURANCE)

- Mỗi đơn cộng thêm phí bảo hiểm chuyến đi (bắt buộc hoặc tùy chọn): $Insurance_{fee} = P_{total} \times 2\text{–}5\%$, hiển thị tách bạch trên hóa đơn, không gộp vào tiền cọc.
- Tích hợp API đối tác bảo hiểm (Bảo Việt, PVI, hoặc bảo hiểm vi mô qua ví điện tử) để phát hành hợp đồng tự động ngay khi đơn chuyển `CONFIRMED`.
- Phạm vi tối thiểu: tai nạn, thiệt hại thân vỏ xe, trách nhiệm dân sự bên thứ ba trong thời gian thuê.
- Đơn `DISPUTED` liên quan tai nạn/hư hỏng cần link trực tiếp tới mã hợp đồng bảo hiểm để Admin đối chiếu bồi thường thay vì xử lý phạt thủ công giữa hai bên.
- Khuyến nghị bổ sung thiết bị định vị GPS gắn xe (với xe giá trị cao) để hỗ trợ xử lý tranh chấp mất xe/vượt phạm vi cam kết.

---

## 9. eKYC — XÁC THỰC DANH TÍNH

### 9.1. Luồng xác thực 3 lớp
1. **OCR + đối chiếu MRZ/QR trên CCCD gắn chip**: dùng SDK eKYC (VNPT eKYC, FPT.AI, hoặc tích hợp VNeID) để đọc thông tin chip, không chỉ OCR ảnh chụp.
2. **Xác thực khuôn mặt sống (liveness detection)**: yêu cầu quay video ngắn/chớp mắt để đối chiếu khuôn mặt với ảnh CCCD, chống giả mạo bằng ảnh tĩnh.
3. **Đối chiếu GPLX với dữ liệu ngành GTVT** (nếu có API tra cứu công khai) để xác nhận bằng lái còn hiệu lực, đúng hạng xe.

### 9.2. Bảng `identity_verifications`
Trạng thái: `PENDING` → `VERIFIED` / `REJECTED` / `EXPIRED_DOCUMENT`. Khách có hồ sơ `REJECTED` không được gửi yêu cầu thuê xe cho tới khi xác thực lại (điều kiện tiên quyết của Giai đoạn 1, mục 2).

---

## 10. QUY TRÌNH XỬ LÝ TRẠNG THÁI DISPUTED (CHI TIẾT)

### 10.1. Sub-state của DISPUTED
```
DISPUTED
 ├── DISPUTED_UNDER_REVIEW      (Admin đang thu thập bằng chứng — SLA 24h kể từ khi mở)
 ├── DISPUTED_AWAITING_EVIDENCE (Chờ 1 hoặc cả 2 bên bổ sung ảnh/video/biên bản)
 ├── DISPUTED_RESOLVED_GUEST    (Xử lý có lợi cho khách — hoàn tiền/miễn trừ)
 ├── DISPUTED_RESOLVED_HOST     (Xử lý có lợi cho chủ xe — trừ ví/thế chấp)
 └── DISPUTED_ESCALATED         (Vượt SLA hoặc giá trị tranh chấp lớn → chuyển bộ phận pháp lý)
```

### 10.2. Quy tắc đóng băng dòng tiền khi có tranh chấp
- Ngay khi đơn chuyển `DISPUTED`, toàn bộ Payout cho chủ xe bị tạm giữ (không giải ngân mục 4.2 cho tới khi có kết luận).
- Nếu thế chấp là tiền qua ví Sàn (mục 7.1): tự động khóa (freeze), không hoàn cho khách cho tới khi có kết luận.
- SLA mặc định: 48 giờ làm việc kể từ khi đủ bằng chứng từ cả hai bên; quá hạn tự động escalate lên cấp xử lý cao hơn.

### 10.3. Bằng chứng bắt buộc để mở tranh chấp
Chỉ chấp nhận yêu cầu tranh chấp nếu có tối thiểu: ảnh/video hiện trạng xe tại check-in và check-out (Digital Handover Record, mục 7.2), và mô tả cụ thể sai lệch. Không xử lý tranh chấp "nói miệng" không kèm bằng chứng số.

---

## 11. YÊU CẦU KỸ THUẬT DÀNH CHO BACKEND DEVELOPER

### 11.1. Logic kiểm tra trùng lịch (Overlap Checking Query)

Hai khoảng thời gian $[A_{start}, A_{end}]$ và $[B_{start}, B_{end}]$ giao nhau khi và chỉ khi:

$$A_{start} < B_{end} \quad \text{AND} \quad A_{end} > B_{start}$$

```sql
SELECT id FROM bookings
WHERE car_id = :car_id
  AND status IN ('WAITING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS')
  AND (start_time < :requested_end_time AND end_time > :requested_start_time)
LIMIT 1;
```

Nếu trả về record → xe bận, từ chối tạo/duyệt đơn.

### 11.2. Chống Race Condition — mở rộng sang cả bước Chủ xe duyệt và bước Khách cọc

Bản gốc chỉ áp dụng lock tại bước thanh toán. Cần áp dụng **cùng cơ chế lock tại bước chủ xe bấm "Đồng ý cho thuê"**, vì double-click hoặc thao tác đa thiết bị có thể duyệt 2 khách trùng lịch cùng lúc trước khi transaction đầu tiên kịp commit.

**Tại bước Chủ xe duyệt:**
```sql
BEGIN;
SELECT id FROM cars WHERE id = :car_id FOR UPDATE;

-- Kiểm tra: đã có đơn nào của xe này đang WAITING_PAYMENT/CONFIRMED trùng khung giờ chưa
-- Nếu có -> Rollback, trả 409 Conflict ("Xe đã có khách khác đang giữ chỗ")
-- Nếu không -> Update đơn được chọn sang WAITING_PAYMENT, set payment_expires_at,
--              chuyển các đơn PENDING_APPROVAL trùng lịch khác sang ON_HOLD
COMMIT;
```

**Tại bước khách cọc:**
```sql
BEGIN;
SELECT id FROM cars WHERE id = :car_id FOR UPDATE;
-- Kiểm tra lại logic trùng lịch (mục 11.1)
-- Nếu thỏa mãn: Update trạng thái -> COMMIT
-- Nếu vi phạm: Rollback và trả về lỗi HTTP 409 Conflict
COMMIT;
```

Có thể thay thế bằng Distributed Lock qua Redis (`key: lock:car_booking:{car_id}`, TTL 10 giây) nếu hệ thống chạy đa instance không dùng chung một DB transaction.

### 11.3. Idempotency & đối soát số tiền cho Webhook cổng thanh toán

Webhook từ đối tác ngân hàng/cổng thanh toán có thể được retry nhiều lần, đồng thời cần đối soát đúng số tiền, không chỉ chống trùng:

```
Khi nhận Webhook:
1. Tra transaction_reference (Unique Index) → nếu đã tồn tại và booking đã CONFIRMED
   → trả HTTP 200 OK, dừng, không thực hiện lại logic nghiệp vụ (idempotency).
2. Nếu chưa tồn tại:
   a. Đối chiếu amount_received == D_booking (booking đang chờ), sai số cho phép = 0đ.
   b. amount_received < D_booking → giữ nguyên WAITING_PAYMENT, ghi nhận PARTIAL_PAYMENT,
      KHÔNG cộng dồn thêm thời gian hết hạn, thông báo khách nộp bổ sung.
   c. amount_received > D_booking → chuyển CONFIRMED, phần dư tự động ghi có vào ví khách hàng.
   d. amount_received == D_booking → chuyển CONFIRMED, kích hoạt Hard Lock + auto-rejection (mục 2, Giai đoạn 4.1).
```

### 11.4. Scheduled Job (Cron Worker) — đã vá lỗi suy luận theo time-window

**Lỗi cần tránh:** dùng `car_id` + cửa sổ thời gian ước lượng (ví dụ "updated_at trong 2 phút gần nhất") để suy luận đơn `ON_HOLD` nào cần mở lại — có thể vô tình mở lại các đơn thuộc khung giờ khác không liên quan, và không an toàn khi cron chạy trễ dưới tải cao.

**Chạy định kỳ mỗi 60 giây, xử lý trong cùng transaction, đối chiếu đúng khung giờ trùng lịch:**

```sql
BEGIN;

-- 1. Khóa và cập nhật các đơn quá hạn thanh toán, trả về khung giờ cụ thể vừa expired
WITH expired AS (
  SELECT id, car_id, start_time, end_time
  FROM bookings
  WHERE status = 'WAITING_PAYMENT'
    AND payment_expires_at < NOW()
  FOR UPDATE SKIP LOCKED
)
UPDATE bookings b
SET status = 'EXPIRED', updated_at = NOW()
FROM expired e
WHERE b.id = e.id
RETURNING e.car_id, e.start_time, e.end_time;

-- 2. Với mỗi (car_id, start_time, end_time) trả về ở bước 1,
--    chỉ mở lại đúng các đơn ON_HOLD thực sự trùng khung giờ đó
UPDATE bookings
SET status = 'PENDING_APPROVAL', updated_at = NOW()
WHERE status = 'ON_HOLD'
  AND car_id = :expired_car_id
  AND start_time < :expired_end_time
  AND end_time > :expired_start_time;

COMMIT;
```

`FOR UPDATE SKIP LOCKED` cho phép nhiều worker instance chạy song song mà không giẫm lên nhau khi nhiều xe hết hạn cùng lúc.

---

## 12. DANH MỤC BẢNG DỮ LIỆU MỚI

| Bảng | Mục đích |
|---|---|
| `handover_records` | Biên bản bàn giao điện tử (check-in/check-out), bằng chứng cho tranh chấp |
| `identity_verifications` | Trạng thái eKYC 3 lớp |
| `insurance_policies` | Liên kết booking với hợp đồng bảo hiểm đối tác |
| `disputes` | Sub-state, SLA, bằng chứng, người xử lý, kết luận |
| `price_floor_config` | Cấu hình giá sàn tối thiểu theo hạng xe |
| `escrow_wallet_holds` | Theo dõi tiền thế chấp/cọc đang bị freeze do tranh chấp |

---

*Tài liệu v2.0.0 — hợp nhất toàn bộ nội dung gốc và phần bổ sung, dùng làm bản duy nhất tham chiếu cho Product/Backend/DBA khi lên kế hoạch triển khai. Phần thế chấp tài sản vật lý (mục 7.1) nên có tư vấn pháp lý riêng trước khi go-live.*
