import sys
import subprocess
import json
import urllib.request
import urllib.error

sys.stdout.reconfigure(encoding='utf-8')

# Lấy token từ Git Credential
p = subprocess.run(["git", "credential", "fill"], input="protocol=https\nhost=github.com\n", capture_output=True, text=True)
token = None
for line in p.stdout.splitlines():
    if line.startswith('password='):
        token = line.split('password=', 1)[1].strip()
        break

if not token:
    print("[ERROR] Không lấy được GitHub token!")
    exit(1)

repo = "em123ngao-arch/thueXe_Online"
headers = {
    "Authorization": f"Bearer {token}",
    "Accept": "application/vnd.github+json",
    "User-Agent": "DriveShare-Automation-Bot",
    "Content-Type": "application/json; charset=utf-8"
}

comments = [
    {
        "issue_number": 48,
        "member": "@CTnn1001",
        "branch": "feature/48-frontend-responsive-trip-timeline",
        "body": """👋 Chào @CTnn1001,

Tech Lead Nguyễn Duy Bảo (@em123ngao-arch) đã tạo sẵn nhánh làm việc chính thức cho bạn:
👉 **Nhánh:** `feature/48-frontend-responsive-trip-timeline` (đã đồng bộ code mới nhất từ `develop`).

### 🚀 Hướng Dẫn Bắt Đầu & Quy Trình Làm Việc:
1. **Kéo nhánh về máy local**:
   ```bash
   git fetch origin
   git checkout feature/48-frontend-responsive-trip-timeline
   git pull origin feature/48-frontend-responsive-trip-timeline
   ```
2. **Triển khai nhiệm vụ theo mô tả Issue**:
   - Tối ưu Responsive đa thiết bị (Mobile thẻ dọc Cards View + Bottom Navigation Bar).
   - Nút cố định `[📍 Theo dõi hành trình]` và Modal Shopee-Style Timeline 5 bước.
   - Luồng hoàn tất chuyến đi sau khi đánh giá.
3. **Kiểm tra tự kiểm thử**: Mở F12 DevTools (iPhone 14 Pro Max & iPhone SE), đảm bảo 0 lỗi console đỏ.
4. **Mở Pull Request vào nhánh `develop`**:
   - Tiêu đề: `feat(ui): responsive layout & shopee trip timeline (Closes #48)`
   - Trong nội dung PR ghi bắt buộc: `Closes #48` và tag `@em123ngao-arch` để review.
5. **Giao tiếp sửa lỗi**: Tech Lead sẽ review và comment trực tiếp trên từng dòng code trong tab `Files changed` để bạn fix nhanh nhất! Chúc bạn hoàn thành xuất sắc! 🎯"""
    },
    {
        "issue_number": 49,
        "member": "@technology-web",
        "branch": "feature/49-rental-overdue-core",
        "body": """👋 Chào @technology-web,

Tech Lead Nguyễn Duy Bảo (@em123ngao-arch) đã tạo sẵn nhánh làm việc chính thức cho bạn:
👉 **Nhánh:** `feature/49-rental-overdue-core` (đã đồng bộ code mới nhất từ `develop` bao gồm Migration V8 & Entity fields).

### 🚀 Hướng Dẫn Bắt Đầu & Quy Trình Làm Việc:
1. **Kéo nhánh về máy local**:
   ```bash
   git fetch origin
   git checkout feature/49-rental-overdue-core
   git pull origin feature/49-rental-overdue-core
   ```
2. **Triển khai nhiệm vụ theo mô tả Issue**:
   - Lõi nghiệp vụ trạng thái `OVERDUE`.
   - Scheduler quét quá hạn tự động tính tiền phạt lũy tiến (150% đơn giá thuê theo giờ).
   - Cập nhật khép kín vòng đời `COMPLETED` sau khi khách gửi review thành công.
3. **Kiểm tra tự kiểm thử**: Chạy `cd backend; .\\mvnw.cmd test` đảm bảo pass 100% (188+ tests).
4. **Mở Pull Request vào nhánh `develop`**:
   - Tiêu đề: `feat(rental): overdue scheduler and review completion lifecycle (Closes #49)`
   - Trong nội dung PR ghi bắt buộc: `Closes #49` và tag `@em123ngao-arch` để review.
5. **Giao tiếp sửa lỗi**: Tech Lead sẽ review và comment trực tiếp trên từng dòng code trong tab `Files changed` để bạn trao đổi và hoàn thiện. Cố lên nhé! 🔥"""
    },
    {
        "issue_number": 50,
        "member": "@nguyenduyquan0609-cyber",
        "branch": "feature/50-admin-overdue-dossier",
        "body": """👋 Chào @nguyenduyquan0609-cyber,

Tech Lead Nguyễn Duy Bảo (@em123ngao-arch) đã tạo sẵn nhánh làm việc chính thức cho bạn:
👉 **Nhánh:** `feature/50-admin-overdue-dossier` (đã đồng bộ code mới nhất từ `develop` bao gồm Migration V8 & Entity fields).

### 🚀 Hướng Dẫn Bắt Đầu & Quy Trình Làm Việc:
1. **Kéo nhánh về máy local**:
   ```bash
   git fetch origin
   git checkout feature/50-admin-overdue-dossier
   git pull origin feature/50-admin-overdue-dossier
   ```
2. **Triển khai nhiệm vụ theo mô tả Issue**:
   - API `GET /api/v1/admin/rentals/overdue` (Danh sách đơn trễ hạn).
   - API `GET /api/v1/admin/rentals/{id}/dossier` (Xuất hồ sơ vi phạm 1-click gồm CCCD, GPLX, hợp đồng, cọc VietQR).
   - Cơ chế Blacklist khóa tài khoản khách vi phạm và chặn tạo đơn mới.
3. **Kiểm tra tự kiểm thử**: Viết test cases đầy đủ, chạy `cd backend; .\\mvnw.cmd test` pass 100%.
4. **Mở Pull Request vào nhánh `develop`**:
   - Tiêu đề: `feat(admin): overdue rentals management and dossier export (Closes #50)`
   - Trong nội dung PR ghi bắt buộc: `Closes #50` và tag `@em123ngao-arch` để review.
5. **Giao tiếp sửa lỗi**: Tech Lead sẽ review và comment trực tiếp trên từng dòng code trong tab `Files changed` của PR để hai bên fix lỗi dễ dàng. Cùng làm việc hiệu quả nhé! 🛡️"""
    }
]

print("==================================================================")
print(" TIẾN HÀNH BÌNH LUẬN & GẮN THẺ THÀNH VIÊN TRÊN GITHUB ISSUES")
print("==================================================================")

for c in comments:
    issue_num = c["issue_number"]
    url = f"https://api.github.com/repos/{repo}/issues/{issue_num}/comments"
    payload = {"body": c["body"]}
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            res_json = json.loads(resp.read().decode("utf-8"))
            print(f"✔ ĐÃ BÌNH LUẬN THÀNH CÔNG VÀO Issue #{issue_num} ({c['member']})")
            print(f"   Comment URL: {res_json['html_url']}")
    except urllib.error.HTTPError as e:
        print(f"❌ Lỗi bình luận Issue #{issue_num}: HTTP {e.code} - {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"❌ Lỗi: {e}")

print("\n✔ HOÀN TẤT BÌNH LUẬN VÀ GẮN THẺ TẤT CẢ THÀNH VIÊN!")
