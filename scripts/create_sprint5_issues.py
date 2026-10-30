import sys
import subprocess
import json
import urllib.request
import urllib.error

sys.stdout.reconfigure(encoding='utf-8')

# 1. Lấy GitHub token từ Git Credential Manager
p = subprocess.run(["git", "credential", "fill"], input="protocol=https\nhost=github.com\n", capture_output=True, text=True)
token = None
for line in p.stdout.splitlines():
    if line.startswith('password='):
        token = line.split('password=', 1)[1].strip()
        break

if not token:
    print("[ERROR] Không lấy được GitHub token từ Git Credential Manager!")
    sys.exit(1)

print("[INFO] Đã lấy GitHub token thành công.")

repo = "em123ngao-arch/thueXe_Online"
url = f"https://api.github.com/repos/{repo}/issues"

headers = {
    "Authorization": f"Bearer {token}",
    "Accept": "application/vnd.github+json",
    "User-Agent": "DriveShare-Automation-Bot",
    "Content-Type": "application/json; charset=utf-8"
}

issues = [
    {
        "assignee": "CTnn1001",
        "title": "[Sprint Final] [Fullstack Realtime] Xây Dựng Hệ Thống Thông Báo Đẩy Thời Gian Thực (Push Notification) Qua WebSocket STOMP",
        "labels": ["enhancement", "websocket", "fullstack", "frontend", "backend"],
        "body": """### 🎯 VAI TRÒ & TRÁCH NHIỆM
Bạn phụ trách toàn diện phân hệ **Thông báo Đẩy Thời gian thực (Realtime Push Notification)** qua WebSocket STOMP. Đảm bảo trải nghiệm tức thì: người dùng không cần bấm F5 vẫn nhận được thông báo nảy lên góc màn hình kèm tiếng chuông khi có sự kiện (đặt xe, duyệt đơn, cọc tiền, bàn giao xe).

---

### 📋 NHIỆM VỤ CỤ THỂ

#### 1. Backend Spring Boot 3 (WebSocket STOMP Broker):
- **Bổ sung dependency**: Thêm `spring-boot-starter-websocket` vào `backend/pom.xml`.
- **Cấu hình WebSocket Broker**: Tạo `WebSocketConfig.java` kế thừa `WebSocketMessageBrokerConfigurer`:
  * Đăng ký Message Broker với tiền tố: `/topic` (kênh chung/broadcast) và `/queue` (kênh riêng tư).
  * Đăng ký Endpoint kết nối: `/ws` hỗ trợ SockJS fallback (cấu hình CORS cho `http://localhost:3000`).
- **Bảo mật kết nối với JWT**:
  * Tạo `WebSocketAuthChannelInterceptor.java`: Đọc header `Authorization: Bearer <token>` từ frame `CONNECT` của STOMP, giải mã lấy `userId` và gán `Principal` an toàn.
- **Xây dựng Dịch vụ Gửi thông báo (`NotificationPushService.java`)**:
  * Phương thức: `sendNotification(Long userId, String title, String content, String type, Long refId)`
  * Vừa lưu vào bảng `notifications` trong DB (lưu vết lịch sử), vừa bắn gói tin STOMP qua `SimpMessagingTemplate` đến destination: `/topic/user/{userId}/notifications`.
- **Gắn Trigger phát sóng vào các luồng nghiệp vụ**:
  * Khi Khách tạo đơn thuê xe -> Bắn thông báo cho Chủ xe: *"Có đơn đặt xe mới từ khách hàng!"*
  * Khi Chủ xe Duyệt đơn -> Bắn thông báo cho Khách: *"Đơn thuê xe của bạn đã được duyệt. Hãy đặt cọc trong 45 phút!"*
  * Khi Khách hoàn tất cọc VietQR -> Bắn thông báo cho cả Khách và Chủ xe: *"Đặt cọc thành công cho chuyến đi #[mã đơn]!"*

#### 2. Frontend Web UI (Pop-up Toast & Quả chuông Navbar):
- **Nhúng thư viện**: Thêm `sockjs.min.js` và `stomp.min.js` qua CDN vào các trang chính (`index.html`, `owner-cars.html`, `profile.html`).
- **Tạo Client Listener**: Viết `frontend/js/websocket-notification.js`:
  * Tự động lấy JWT Token từ `localStorage` để kết nối tới `/ws`.
  * Lắng nghe kênh `/topic/user/{myUserId}/notifications`.
- **Hiển thị Pop-up Toast**: Khi nhận tin nhắn STOMP -> Bật Pop-up Toast góc trên bên phải màn hình (dùng Bootstrap 5 Toast), phát file âm thanh "ting" ngắn, tự tắt sau 5 giây.
- **Icon Quả chuông trên Navbar**: Tự động tăng số đếm màu đỏ (`+1` Unread Badge) và chèn mục thông báo mới vào dropdown mà không cần reload trang.

---

### 🧪 MA TRẬN TEST CASE BẮT BUỘC (SELF-TEST MATRIX)
- [ ] **TC-N01:** Khởi động Backend -> Không bị lỗi bean WebSocket, cổng `/ws` phản hồi Handshake 101 Switching Protocols.
- [ ] **TC-N02:** Mở 2 trình duyệt song song (1 bên đăng nhập Khách, 1 bên đăng nhập Chủ xe).
- [ ] **TC-N03:** Khách bấm đặt xe -> Bên màn hình Chủ xe nảy ngay Pop-up Toast kèm tiếng chuông "Có đơn đặt xe mới" trong vòng < 1 giây, không cần bấm F5.
- [ ] **TC-N04:** Chủ xe bấm Duyệt đơn -> Bên màn hình Khách nảy Pop-up Toast thông báo đã duyệt và nhắc nhở 45 phút đặt cọc.
- [ ] **TC-N05:** Mở F12 Console ở cả 2 trình duyệt -> Đảm bảo kết nối STOMP duy trì (Heartbeat OK), 0 lỗi console đỏ.

> ⚠️ **Tiêu chuẩn nghiệm thu:** Quay video ngắn hoặc chụp ảnh minh chứng 2 tab trình duyệt hiển thị Toast đồng thời nộp kèm Pull Request.
"""
    },
    {
        "assignee": "technology-web",
        "title": "[Sprint Final] [Backend & UI Handover] Nâng Cấp Quy Trình Biên Bản Bàn Giao Xe 2 Chiều (Hai Bên Đồng Thuận Check-in/Check-out)",
        "labels": ["enhancement", "backend", "rental", "handover", "inspection"],
        "body": """### 🎯 VAI TRÒ & TRÁCH NHIỆM
Bạn phụ trách nâng cấp quy trình bàn giao xe (Check-in / Check-out) từ cơ chế 1 chiều (Chủ xe tự nhập tự duyệt) sang cơ chế **Đồng thuận 2 chiều (Two-Way Handover Consensus)**. Giúp bảo vệ khách thuê khỏi việc bị chủ xe cố tình khai gian số ODO, vạch xăng hoặc đổ vạ trầy xước xe.

---

### 📋 NHIỆM VỤ CỤ THỂ

#### 1. Backend Core & API Bàn giao 2 chiều:
- **Cập nhật Enum & Entity**:
  * Thêm trạng thái xác nhận biên bản: `PENDING_RENTER_CONFIRMATION`, `CONFIRMED`, `DISPUTED` vào entity `RentalInspection.java`.
- **Sửa đổi logic Check-in & Check-out trong `RentalInspectionServiceImpl.java`**:
  * Khi Chủ xe tạo biên bản Check-in hoặc Check-out: Lưu biên bản ở trạng thái `PENDING_RENTER_CONFIRMATION`.
  * Đơn thuê chưa chuyển trạng thái sang `IN_PROGRESS` hoặc `COMPLETED` ngay mà chờ Khách xác nhận.
- **Viết mới Endpoint Xác nhận của Khách**:
  * `POST /api/v1/rentals/{rentalId}/inspections/{inspectionId}/confirm`
  * Khách thuê (`ROLE_CUSTOMER`) gửi request xác nhận:
    - Nếu Khách chọn **ĐỒNG Ý**: Biên bản chuyển sang `CONFIRMED`, đơn thuê chính thức chuyển sang `IN_PROGRESS` (lúc nhận xe) hoặc `COMPLETED` (lúc trả xe).
    - Nếu Khách chọn **TỪ CHỐI / KHIẾU NẠI**: Khách gửi kèm mô tả sai lệch và ảnh đối chứng -> Hệ thống tự động khởi tạo khiếu nại `RentalDispute` chuyển lên Admin phân xử.
- **Viết Unit Tests**:
  * Viết tối thiểu 5 tests kiểm tra: Khách xác nhận thành công, người lạ không được xác nhận, từ chối tạo dispute tự động.

#### 2. Frontend Modal Xác nhận cho Khách thuê:
- Khi Khách thuê mở trang Lịch sử chuyến đi, nếu đơn đang ở trạng thái chờ xác nhận biên bản bàn giao:
  * Nổi bật nút bấm: `[📋 Kiểm tra & Ký nhận biên bản bàn giao xe]`.
  * Modal hiển thị rõ: Số ODO, mức vạch xăng, 4 góc ảnh xe do Chủ xe vừa tải lên.
  * Hai nút hành động rõ ràng: `[✅ Đồng ý nhận/trả xe]` và `[⚠️ Khiếu nại sai lệch hiện trạng]`.

---

### 🧪 MA TRẬN TEST CASE BẮT BUỘC (SELF-TEST MATRIX)
- [ ] **TC-I01:** Chủ xe tạo Check-in -> Biên bản mang trạng thái `PENDING_RENTER_CONFIRMATION`, đơn chưa chuyển `IN_PROGRESS`.
- [ ] **TC-I02:** Khách bấm xác nhận biên bản Check-in -> Đơn chính thức chuyển sang `IN_PROGRESS`.
- [ ] **TC-I03:** Chủ xe tạo Check-out -> Khách xem ảnh và số ODO lúc trả xe -> Bấm xác nhận -> Đơn chuyển sang hoàn tất để đánh giá.
- [ ] **TC-I04:** Khách bấm "Khiếu nại sai lệch" trên biên bản -> Tự động sinh bản ghi Dispute trong bảng `rental_disputes` với lý do chính xác.
- [ ] **TC-I05:** Chạy `cd backend; .\\mvnw.cmd test -Dtest=RentalInspection*Test` -> 100% tests pass.

> ⚠️ **Tiêu chuẩn nghiệm thu:** Test chạy qua toàn bộ luồng giao/nhận xe, chụp ảnh Modal ký nhận biên bản và đính kèm vào Pull Request.
"""
    },
    {
        "assignee": "dongocphat007-ctrl",
        "title": "[Sprint Final] [AI & Security] Tinh Chỉnh AI Tư Vấn Xe Chuyên Sâu & Xây Dựng Phân Hệ Xác Thực Mã OTP Độc Lập",
        "labels": ["ai", "security", "backend", "otp"],
        "body": """### 🎯 VAI TRÒ & TRÁCH NHIỆM
Bạn phụ trách phân hệ **Trí tuệ nhân tạo (AI Assistant)** và **Xác thực mã OTP**. Đảm bảo Chatbot AI tư vấn thông minh, chuẩn xác, không bị "ảo giác" và hệ thống có module xác thực OTP bảo mật độc lập phục vụ kích hoạt tài khoản hoặc xác thực nhạy cảm.

---

### 📋 NHIỆM VỤ CỤ THỂ

#### 1. Tinh chỉnh AI System Prompt & RAG Scope:
- Chỉnh sửa file `backend/src/main/resources/prompts/car-advisor-system.txt`:
  * Bổ sung quy tắc nghiêm ngặt: **Chỉ tư vấn và báo giá các dòng xe đang có trong cơ sở dữ liệu DriveShare**.
  * Khi khách hỏi về các dòng xe ngoài hệ thống (xe sang triệu đô, xe tải, xe máy, hoặc xe không có trong kho): AI phải từ chối lịch sự và gợi ý các mẫu xe tương đương hiện có trên sàn.
  * Đảm bảo công thức tính cọc 30% và tiền còn lại 70% luôn chính xác trong mọi câu trả lời.
- Kiểm tra tính ổn định của **Heuristic Rule Fallback Engine** trong `AiChatServiceImpl.java` khi mất kết nối Gemini API.

#### 2. Xây dựng Phân hệ Mã OTP Độc lập (`OtpService`):
- Xây dựng `OtpService.java` và `OtpServiceImpl.java`:
  * Cơ chế sinh mã OTP gồm 6 chữ số ngẫu nhiên an toàn (`SecureRandom`).
  * Lưu trữ mã OTP trong bộ nhớ cache (hoặc database) với thời hạn hết hạn (TTL): **60 - 120 giây**.
  * Chống tấn công Brute-force: Khóa mã OTP nếu nhập sai quá 3 lần liên tiếp.
- Viết API:
  * `POST /api/v1/auth/otp/send`: Gửi mã OTP (ở môi trường dev/demo: in mã ra log console và trả về masked format `123***`).
  * `POST /api/v1/auth/otp/verify`: Xác thực mã OTP người dùng gửi lên.
- Viết bộ Unit Test kiểm thử đầy đủ các trường hợp: mã đúng, mã sai, mã hết hạn, nhập sai quá số lần.

---

### 🧪 MA TRẬN TEST CASE BẮT BUỘC (SELF-TEST MATRIX)
- [ ] **TC-A01:** Chat với AI: *"Tư vấn cho tôi thuê xe Rolls-Royce hoặc Lamborghini"* -> AI trả lời lịch sự từ chối và gợi ý các dòng sedan/SUV sẵn có trên DriveShare.
- [ ] **TC-A02:** Chat với AI: *"Tôi muốn thuê xe 7 chỗ đi Vũng Tàu 3 ngày dưới 1 triệu/ngày"* -> AI gợi ý đúng danh sách xe thỏa mãn và tính đúng tiền cọc 30%.
- [ ] **TC-A03:** Gọi API gửi OTP -> Nhận mã OTP 6 số hợp lệ.
- [ ] **TC-A04:** Nhập sai mã OTP 3 lần -> Hệ thống báo lỗi và hủy mã OTP đó.
- [ ] **TC-A05:** Nhập mã OTP sau khi quá thời gian 120 giây -> Báo lỗi mã đã hết hạn.

> ⚠️ **Tiêu chuẩn nghiệm thu:** Test prompt trực tiếp trên widget Chatbot web, xuất log console chứng minh OTP hoạt động hoàn hảo.
"""
    },
    {
        "assignee": "nguyenduyquan0609-cyber",
        "title": "[Sprint Final] [QA & Testing] Kiểm Thử Hồi Quy Toàn Bộ Luồng Nghiệp Vụ Thực Tế (End-to-End QA) Chuẩn Bị Cho Buổi Demo",
        "labels": ["qa", "testing", "e2e", "demo-prep"],
        "body": """### 🎯 VAI TRÒ & TRÁCH NHIỆM
Bạn phụ trách **Đảm bảo chất lượng (QA Lead)** cho buổi demo chính thức ngày mai. Thực hiện kiểm thử toàn bộ luồng nghiệp vụ từ đầu đến cuối (End-to-End Happy Path) và các trường hợp biên nguy hiểm (Edge Cases) để phát hiện và cảnh báo sớm mọi lỗi giao diện, console hoặc dữ liệu.

---

### 📋 KỊCH BẢN KIỂM THỬ CHI TIẾT (E2E TEST SCENARIOS)

#### 1. Luồng Chuẩn (Happy Path - Kịch bản Demo 15 phút):
- [ ] **BƯỚC 1 (Khách tìm xe):** Đăng nhập `renter_demo / Renter@123` -> Tìm xe theo ngày và địa điểm -> Mở AI Chatbot hỏi tư vấn -> Bấm chọn 1 xe thỏa mãn.
- [ ] **BƯỚC 2 (Đặt xe):** Khách chọn ngày thuê -> Gửi yêu cầu đặt xe -> Kiểm tra trạng thái đơn chuyển sang `PENDING_APPROVAL`.
- [ ] **BƯỚC 3 (Chủ xe duyệt):** Đăng nhập `owner_demo / Owner@123` -> Xem danh sách đơn thuê của xe -> Bấm Duyệt (APPROVED) -> Đơn chuyển sang `WAITING_PAYMENT` có hạn thanh toán 45 phút.
- [ ] **BƯỚC 4 (Thanh toán cọc VietQR):** Khách mở trang thanh toán -> Quét mã VietQR động -> Đơn chuyển sang `CONFIRMED`, xe chuyển sang trạng thái đã được giữ chỗ.
- [ ] **BƯỚC 5 (Bàn giao xe):** Chủ xe làm thủ tục Check-in (chụp 4 ảnh, nhập ODO, vạch xăng) -> Khách bấm xác nhận biên bản -> Chuyến đi chuyển sang `IN_PROGRESS`.
- [ ] **BƯỚC 6 (Trả xe & Đánh giá):** Chủ xe làm thủ tục Check-out -> Khách xác nhận -> Khách thực hiện đánh giá 5 sao kèm nhận xét -> Đơn chuyển sang `COMPLETED`.
- [ ] **BƯỚC 7 (Ví doanh thu):** Chủ xe mở trang `owner-earnings.html` -> Kiểm tra số tiền doanh thu và hoa hồng nền tảng nhảy đúng.

#### 2. Luồng Kiểm thử Ngoại lệ & Trường hợp Biên (Edge Cases):
- [ ] **EC-01 (Chống đặt trùng xe):** Mở 2 tab cùng đặt 1 chiếc xe trong cùng một khoảng ngày -> Khi đơn đầu được duyệt, đơn thứ 2 phải tự động chuyển sang `ON_HOLD`.
- [ ] **EC-02 (Quá hạn 45 phút giữ chỗ):** Tạo đơn, duyệt đơn nhưng không cọc -> Hết 45 phút, kiểm tra đơn có tự động chuyển sang `EXPIRED` và giải phóng đơn `ON_HOLD` không.
- [ ] **EC-03 (Trả xe trễ hạn - OVERDUE):** Kiểm tra đơn trễ hạn có tự động tính tiền phạt lũy tiến x1.5 đúng công thức không.
- [ ] **EC-04 (Hồ sơ vi phạm Admin):** Kiểm tra trang Admin có xuất được Dossier hồ sơ khách vi phạm quá hạn không.

#### 3. Báo cáo Chất lượng Giao diện (UI/UX Checklist):
- [ ] F12 Console ở mọi trang web chính: Sạch sẽ 0 dòng chữ màu đỏ.
- [ ] Kiểm tra responsive trên kích thước iPhone 14 Pro Max (430px) và iPhone SE (375px) không bị thanh cuộn ngang vỡ khung.

> ⚠️ **Tiêu chuẩn nghiệm thu:** Lập bảng tổng kết kết quả kiểm thử (Test Matrix Pass/Fail) và báo cáo ngay các lỗi phát sinh cho đội ngũ dev trước 18h00.
"""
    }
]

created_count = 0
for issue in issues:
    print(f"\n[INFO] Đang tạo Issue: {issue['title']}...")
    payload = {
        "title": issue["title"],
        "body": issue["body"],
        "assignees": [issue["assignee"]],
        "labels": issue["labels"]
    }
    data = json.dumps(payload, ensure_ascii=False).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req) as resp:
            res_data = json.loads(resp.read().decode('utf-8'))
            print(f"✅ Tạo thành công Issue #{res_data['number']}: {res_data['html_url']}")
            print(f"   -> Assignee: {issue['assignee']} | Labels: {', '.join(issue['labels'])}")
            created_count += 1
    except urllib.error.HTTPError as e:
        print(f"❌ Lỗi HTTP {e.code}: {e.reason}")
        err_msg = e.read().decode('utf-8')
        print(f"Chi tiết: {err_msg}")
    except Exception as e:
        print(f"❌ Lỗi ngoại lệ: {e}")

print(f"\n🎉 HOÀN TẤT: Đã tạo thành công {created_count} / {len(issues)} GitHub Issues!")
print(f"Truy cập xem issues: https://github.com/{repo}/issues")

