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
    print("[ERROR] Khong lay duoc GitHub token tu Git Credential Manager!")
    exit(1)

print("[INFO] Da xac thuc token thanh cong.")

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
        "title": "[Sprint 4] [Frontend & UI/UX] Responsive Đa Thiết Bị, Nút & Modal Theo Dõi Hành Trình Chuẩn Shopee",
        "labels": ["frontend", "sprint-4", "ui/ux", "responsive"],
        "body": """### 🎯 VAI TRÒ & TRÁCH NHIỆM
Bạn chịu trách nhiệm toàn bộ giao diện phía người dùng (Frontend Lead). Đảm bảo giao diện hiện đại, chuẩn Responsive 100% không bị tràn màn hình trên điện thoại, đồng thời xây dựng trải nghiệm theo dõi hành trình xe trực quan như Shopee theo nhận xét của Thầy.

---

### 📋 NHIỆM VỤ CỤ THỂ
1. **Chuẩn hóa Responsive Đa Thiết Bị**:
   - **Mobile (360px - 430px)**:
     * Header co lại, bổ sung **Bottom Navigation Bar** dưới đáy màn hình (Trang chủ, Chuyến đi, Quản lý xe, Hồ sơ).
     * Bảng danh sách xe của Chủ xe (`owner.js`) và Lịch sử chuyến đi (`render.js`) tự động chuyển từ thẻ bảng `<table>` thành dạng **Thẻ dọc (Cards View)** khi màn hình dưới 768px.
     * Nút bấm có chiều cao tối thiểu **44px** để chạm ngón tay không bị bấm nhầm.
   - **Tablet (768px - 1024px) & Desktop (1280px+)**: Co giãn mượt mà, không vỡ layout.

2. **Nút Cố Định [📍 Theo dõi hành trình]**:
   - Luôn hiển thị trên từng card đơn của Khách thuê (`render.js`) và Chủ xe (`owner.js`).
   - Nút luôn xuất hiện ở mọi trạng thái: `WAITING_PAYMENT`, `CONFIRMED`, `IN_PROGRESS`, `OVERDUE`, `COMPLETED`.

3. **Modal Theo Dõi Hành Trình Phong Cách Shopee**:
   - Stepper 5 bước có chấm tròn nối dây: [1. Đặt xe] -> [2. Cọc 30%] -> [3. Giao xe] -> [4. Đang đi] -> [5. Hoàn tất].
   - Đồng hồ đếm ngược hạn trả xe (Đang đi: Còn XX giờ YY phút; Quá hạn: Màu đỏ nhấp nháy ĐÃ QUÁ HẠN).
   - Hiển thị biên bản bàn giao: ODO lúc nhận, vạch pin/xăng, 4 ảnh xe.
   - Bảng tài chính: Tổng tiền, tiền đã cọc 30%, tiền còn lại khi trả xe, phụ phí trễ hạn.

4. **Luồng Hoàn Tất Đơn Sau Đánh Giá**:
   - Trả xe xong giao diện hiện thông báo yêu cầu đánh giá -> Đánh giá xong đơn mới chuyển sang ĐÃ HOÀN TẤT.

---

### 🧪 MA TRẬN TEST CASE BẮT BUỘC (SELF-TEST MATRIX)
- [ ] **TC-T01:** Mở F12 chọn iPhone 14 Pro Max (430px) và iPhone SE (375px) -> Bảng chuyển thành Card dọc, không có thanh cuộn ngang tràn viền.
- [ ] **TC-T02:** Bấm nút [📍 Theo dõi hành trình] trên đơn IN_PROGRESS -> Bật Modal Shopee, Stepper sáng đúng bước số 4, đồng hồ đếm ngược chạy đúng.
- [ ] **TC-T03:** Xem đơn OVERDUE -> Modal hiện màu đỏ cảnh báo quá hạn và hiển thị số tiền phạt trễ hạn.
- [ ] **TC-T04:** Bấm đánh giá chuyến đi -> Gửi đánh giá thành công, badge đổi sang ĐÃ HOÀN TẤT.
- [ ] **TC-T05:** Mở F12 Console kiểm tra sạch sẽ 0 dòng chữ màu đỏ.

> ⚠️ **Tiêu chuẩn nghiệm thu:** Test thật trên Chrome & Edge DevTools, đính kèm ảnh chụp màn hình F12 Console 0 lỗi đỏ vào PR.
"""
    },
    {
        "assignee": "technology-web",
        "title": "[Sprint 4] [Backend Rental Core] Enum OVERDUE, Scheduler Quét Quá Hạn & Khép Kín Vòng Đời Sau Đánh Giá",
        "labels": ["backend", "sprint-4", "core", "scheduler"],
        "body": """### 🎯 VAI TRÒ & TRÁCH NHIỆM
Bạn phụ trách lõi nghiệp vụ thuê xe (Rental Core) và tiến trình tự động nền (Scheduled Jobs). Đảm bảo hệ thống phát hiện chính xác khách không trả xe quá hạn, tự động tính phí phạt và khép kín vòng đời đơn sau khi đánh giá.

---

### 📋 NHIỆM VỤ CỤ THỂ
1. **Bổ sung trạng thái `OVERDUE`**:
   - Thêm `OVERDUE` vào enum `ERentalStatus.java`.

2. **Lập trình Scheduler Quét Đơn Quá Hạn**:
   - Thêm phương thức `@Scheduled(cron = "0 0 * * * *")` trong `RentalExpirationScheduler.java`.
   - Quét các đơn đang `IN_PROGRESS` có `endDate < now()`:
     * Chuyển trạng thái sang `OVERDUE`.
     * Tính số giờ trễ: `overdueHours = now - endDate`.
     * Tính tiền phạt: `penaltyFee = overdueHours * (đơn giá giờ * 1.5)`. Quá 24 giờ phạt gấp đôi ngày thuê.

3. **Khép Kín Vòng Đời Sau Đánh Giá**:
   - Cập nhật `ReviewServiceImpl.createReview(...)`: Sau khi lưu đánh giá của khách thành công -> chuyển trạng thái đơn `rental.setStatus(ERentalStatus.COMPLETED)`.

4. **Viết Unit & Integration Tests**:
   - Tối thiểu 6 bài test kiểm tra: chuyển `OVERDUE`, tính đúng tiền phạt trễ hạn, và chuyển `COMPLETED` sau review.

---

### 🧪 MA TRẬN TEST CASE BẮT BUỘC (SELF-TEST MATRIX)
- [ ] **TC-V01:** Tạo đơn có endDate trước thời điểm hiện tại -> Scheduler quét -> Đơn đổi sang status = OVERDUE.
- [ ] **TC-V02:** Kiểm tra công thức tính penalty_fee: trễ 3 giờ với đơn giá 100k/h -> Phí phạt đúng 450.000 đ.
- [ ] **TC-V03:** Trễ trên 24 giờ -> Phạt lũy tiến gấp đôi đơn giá ngày thuê.
- [ ] **TC-V04:** Khách gửi đánh giá đơn -> Lưu đánh giá và cập nhật rental.status thành COMPLETED.
- [ ] **TC-V05:** Chạy `cd backend; .\mvnw.cmd test` đạt 100% BUILD SUCCESS (188+ tests pass).

> ⚠️ **Tiêu chuẩn nghiệm thu:** Toàn bộ test pass 100%, không phá vỡ 188 bài tests có sẵn của hệ thống.
"""
    },
    {
        "assignee": "nguyenduyquan0609-cyber",
        "title": "[Sprint 4] [Backend Admin & Security] API Đơn Quá Hạn, Xuất Hồ Sơ Pháp Lý 1-Click (Dossier) & Blacklist Chặn Đặt Xe",
        "labels": ["backend", "sprint-4", "admin", "security"],
        "body": """### 🎯 VAI TRÒ & TRÁCH NHIỆM
Bạn chịu trách nhiệm về phân hệ Quản trị Admin, Bảo mật tài chính và Hồ sơ pháp lý. Đảm bảo Admin có đầy đủ công cụ kiểm soát các đơn quá hạn, tự động đưa khách vi phạm vào Blacklist và xuất hồ sơ 1-click bàn giao cơ quan chức năng.

---

### 📋 NHIỆM VỤ CỤ THỂ
1. **API Quản Lý Đơn Quá Hạn Cho Admin**:
   - `GET /api/v1/admin/rentals/overdue`: Trả về danh sách đơn quá hạn toàn hệ thống kèm số giờ trễ, tiền phạt, thông tin xe và khách thuê.

2. **API Xuất Hồ Sơ Pháp Lý Vi Phạm (Dossier)**:
   - `GET /api/v1/admin/rentals/{id}/dossier`:
   - Kết xuất tài liệu tổng hợp đầy đủ:
     * Khách thuê: Họ tên, SĐT, Số CCCD, ảnh 2 mặt GPLX.
     * Xe & Chủ xe: Biển số, số khung, hãng xe, thông tin chủ xe hợp pháp.
     * Hợp đồng điện tử, bằng chứng cọc 30% VietQR, ảnh biên bản bàn giao ODO lúc nhận xe.
     * Số giờ chiếm dụng xe và tiền phạt lũy tiến.

3. **Cơ Chế Blacklist & Khóa Đặt Xe**:
   - Khi đơn bị `OVERDUE` quá 24h: Tự động chuyển `user.status = BLOCKED`.
   - Tại `RentalServiceImpl.createRental()`: Kiểm tra nếu khách có status `BLOCKED` hoặc đang có đơn `OVERDUE` -> chặn tạo đơn mới với mã lỗi `USER_BLOCKED_OVERDUE_VIOLATION`.

4. **Viết Unit & Integration Tests**:
   - Tối thiểu 5 bài test kiểm tra: quyền truy cập Admin, xuất đúng dữ liệu dossier, chặn thành công khách Blacklist.

---

### 🧪 MA TRẬN TEST CASE BẮT BUỘC (SELF-TEST MATRIX)
- [ ] **TC-Q01:** User thường gọi API dossier -> Nhận HTTP 403 Forbidden.
- [ ] **TC-Q02:** Admin gọi `GET /api/v1/admin/rentals/1/dossier` -> Trả về đầy đủ CCCD, GPLX, Hợp đồng, Cọc.
- [ ] **TC-Q03:** Khách có đơn OVERDUE quá 24h -> Trạng thái user đổi thành BLOCKED.
- [ ] **TC-Q04:** User bị BLOCKED gửi request tạo đơn mới -> Nhận lỗi 403 USER_BLOCKED_OVERDUE_VIOLATION.
- [ ] **TC-Q05:** Chạy toàn bộ test suite pass 100%.

> ⚠️ **Tiêu chuẩn nghiệm thu:** Viết đủ Unit Tests và kiểm tra dữ liệu dossier xuất ra chuẩn xác.
"""
    },
    {
        "assignee": "em123ngao-arch",
        "title": "[Sprint 4] [Architect & Tech Lead] Migration V8, Trang Điều Khoản Pháp Lý Điều 175 BLHS & CI/CD Quality Gate",
        "labels": ["architecture", "sprint-4", "database", "lead"],
        "body": """### 🎯 VAI TRÒ & TRÁCH NHIỆM
Tech Lead chịu trách nhiệm về kiến trúc cơ sở dữ liệu, quy định pháp lý nền tảng, tích hợp hệ thống và kiểm duyệt Pull Request bảo vệ nhánh develop.

---

### 📋 NHIỆM VỤ CỤ THỂ
1. **Flyway Migration V8**:
   - Tạo `V8__overdue_and_penalty_tracking.sql`:
     * Thêm cột vào bảng `rentals`: `overdue_hours INT DEFAULT 0`, `penalty_fee NUMERIC(12,2) DEFAULT 0.00`, `actual_return_time TIMESTAMP NULL`, `is_blacklisted_triggered BOOLEAN DEFAULT FALSE`.

2. **Trang / Modal Điều Khoản Thuê Xe & Chế Tài Pháp Lý**:
   - Soạn thảo và hiển thị chính sách an toàn tài sản:
     * Nghiêm cấm cầm cố, chuyển nhượng, cho mượn lại phương tiện.
     * Cảnh báo chế tài hình sự theo Điều 175 Bộ luật Hình sự (Tội lạm dụng tín nhiệm chiếm đoạt tài sản).
     * Quy định quyền định vị GPS và đơn phương thu hồi xe của Chủ xe.

3. **Giám Sát CI/CD & Hợp Nhất Hệ Thống**:
   - Review code của Tín, Vĩ, Quân trên GitHub Pull Request.
   - Kiểm tra GitHub Actions CI báo tích xanh (188+ tests pass, JS syntax OK, JaCoCo Coverage).
   - Thực hiện Squash and Merge vào `develop`.
"""
    }
]

print("==================================================================")
print(f" TIẾN HÀNH TẠO 4 GITHUB ISSUES CHO SPRINT 4 TRÊN REPO: {repo}")
print("==================================================================")

for item in issues:
    payload = {
        "title": item["title"],
        "body": item["body"],
        "assignees": [item["assignee"]],
        "labels": item["labels"]
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            res_json = json.loads(resp.read().decode("utf-8"))
            print(f"✔ TẠO THÀNH CÔNG Issue #{res_json['number']}: {res_json['title']}")
            print(f"   Giao cho: @{item['assignee']}")
            print(f"   URL: {res_json['html_url']}")
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode('utf-8')
        print(f"❌ Lỗi tạo Issue cho {item['assignee']}: HTTP {e.code} - {err_msg}")
    except Exception as e:
        print(f"❌ Lỗi: {e}")

print("\n✔ HOÀN TẤT KHỞI TẠO ISSUES TRÊN GITHUB!")
