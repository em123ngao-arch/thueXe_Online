# 🌿 QUY CHUẨN PHÂN NHÁNH VÀ LÀM VIỆC VỚI GIT (DRIVESHARE)

> **Dành cho:** Tất cả 6 thành viên nhóm DriveShare (Bảo, Chí Vĩ, Lộc Khiêm, Phát, Quân, Chí Tín).  
> **Mục tiêu:** Đảm bảo 100% không mất code, triệt tiêu xung đột (Merge Conflict), quy trình PR và kiểm duyệt rõ ràng, chuyên nghiệp.

---

## 1. 🌳 Cấu Trúc Các Nhánh (Branch Strategy)

Dự án áp dụng mô hình **Feature Branch Workflow**:

```
main (Chỉ dành cho bản nộp / demo hoàn chỉnh)
  ▲
develop (Nhánh tích hợp chung - Code đang chạy ổn định của cả nhóm)
  ▲
  ├── feature/CRP-10-owner-registration (Quân)
  ├── feature/CRP-12-login-jwt          (Chí Vĩ)
  ├── feature/CRP-19-admin-users        (Lộc Khiêm)
  └── feature/CRP-23-owner-list-car     (Phát)
```

### 📌 Quy tắc bất biến:
1. **`main`:** Nhánh bàn giao cuối kỳ. **CẤM TUYỆT ĐỐI** push trực tiếp vào `main`.
2. **`develop`:** Nhánh hoạt động chính của cả nhóm. **CẤM PUSH TRỰC TIẾP**. Mọi thay đổi đều phải thông qua **Pull Request (PR)** và được Reviewer duyệt.
3. **`feature/*`:** Nhánh tính năng cá nhân. Mỗi khi làm 1 task trên Jira, dev tạo 1 nhánh feature từ `develop`.

---

## 2. 🏷️ Quy Chuẩn Đặt Tên Nhánh

Tên nhánh phải gắn liền với **Mã Task trên Jira** để dễ truy vết:

| Loại nhánh | Cú pháp | Ví dụ mẫu |
| :--- | :--- | :--- |
| **Tính năng mới** | `feature/<Mã-Jira>-<tên-ngắn-gọn>` | `feature/CRP-10-owner-registration`<br>`feature/CRP-16-rbac-security`<br>`feature/CRP-23-owner-list-car` |
| **Sửa lỗi (Bugfix)** | `fix/<Mã-Jira>-<tên-lỗi>` | `fix/CRP-13-password-hash`<br>`fix/CRP-12-expired-token` |
| **Tối ưu / Cấu hình** | `refactor/<tên-nội-dung>` hoặc `chore/<tên>` | `refactor/database-v2-migration`<br>`chore/setup-swagger-docs` |

---

## 3. 💬 Quy Chuẩn Commit Message (Conventional Commits)

Không được commit với nội dung vô nghĩa như `"update"`, `"fix"`, `"asdasd"`, `"xong"`.  
Cú pháp chuẩn:

```
<loại>(<phạm vi>): <mô tả ngắn gọn bằng tiếng Việt có dấu> [<Mã-Jira>]
```

### Các loại (`type`):
* `feat`: Thêm tính năng mới (Feature)
* `fix`: Sửa lỗi (Bug fix)
* `docs`: Cập nhật tài liệu (README, docs...)
* `refactor`: Tái cấu trúc code (không đổi logic, chỉ làm code sạch hơn)
* `style`: Chỉnh format code, khoảng trắng, thụt lề
* `test`: Thêm hoặc sửa test case
* `chore`: Cấu hình build tool, pom.xml, .gitignore...

### Ví dụ mẫu:
```bash
git commit -m "feat(auth): thêm API đăng ký tài khoản Owner CRP-10"
git commit -m "feat(security): cấu hình Spring Security và JwtFilter CRP-16"
git commit -m "fix(user): sửa lỗi không lưu số điện thoại khi cập nhật Profile CRP-17"
git commit -m "feat(car): xây dựng API tạo tin đăng xe mới CRP-23"
git commit -m "docs(api): cập nhật hợp đồng dữ liệu cho module Admin CRP-19"
```

---

## 4. 🔄 Quy Trình 5 Bước Làm Task Hàng Ngày (Cheatsheet)

### Bước 1: Luôn cập nhật code mới nhất từ `develop`
Trước khi bắt đầu bất kỳ việc gì:
```bash
# 1. Chuyển về nhánh develop
git checkout develop

# 2. Kéo code mới nhất cả nhóm về
git pull origin develop
```

### Bước 2: Tạo nhánh tính năng mới từ `develop`
```bash
# Tạo và chuyển ngay sang nhánh mới
git checkout -b feature/CRP-10-owner-registration
```

### Bước 3: Code và Commit đều đặn
```bash
git add .
git commit -m "feat(auth): viết DTO và Validation cho form đăng ký CRP-10"
```

### Bước 4: Đồng bộ trước khi tạo Pull Request (Chống Conflict)
Trước khi đẩy code lên, kéo cập nhật mới nhất từ `develop` vào nhánh của mình để tự giải quyết conflict (nếu có) trên máy mình trước:
```bash
git fetch origin
git merge origin/develop
# Nếu có conflict -> Mở VS Code / IntelliJ resolve conflict -> Commit lại
```

### Bước 5: Đẩy nhánh lên GitHub và tạo Pull Request (PR)
```bash
git push -u origin feature/CRP-10-owner-registration
```
* Lên giao diện GitHub, bấm **New Pull Request**:
  * **Base branch:** `develop`  <---  **Compare branch:** `feature/CRP-10-...`
  * Tiêu đề PR: `[CRP-10] Hoàn thiện API Đăng ký tài khoản Owner`
  * Assignee: Gán tên bạn.
  * Reviewer: Chọn **Bảo (Lead)** hoặc thành viên liên quan.
* Sau khi PR được duyệt và merge vào `develop`:
  * Xóa nhánh feature trên GitHub.
  * Ở máy local:
    ```bash
    git checkout develop
    git pull origin develop
    git branch -d feature/CRP-10-owner-registration
    ```

---

## 5. 🛡️ Vai Trò Reviewer (Gatekeeper)

* **Bảo (Project Lead):**
  * Chịu trách nhiệm kiểm tra PR: code có biên dịch được không (`mvn clean compile`), có vi phạm cấu trúc chung không.
  * Nếu đạt: Bấm **Merge Pull Request** (Ưu tiên dùng `Squash and merge` hoặc `Rebase and merge` để giữ lịch sử git sạch đẹp).
  * Nếu chưa đạt: Viết comment nhận xét yêu cầu tác giả sửa lại.

---

## 6. ❌ CÁC ĐIỀU CẤM KỴ (Tuyệt đối không làm)
1. 🚫 **KHÔNG BAO GIỜ dùng `git push --force`** lên các nhánh chung (`main`, `develop`).
2. 🚫 **KHÔNG commit file rác / file bí mật:** Mật khẩu DB cá nhân, token bí mật, thư mục `target/`, thư mục `.idea/`, `node_modules/`. Luôn kiểm tra `.gitignore` trước khi commit.
3. 🚫 **KHÔNG ôm nhánh cá nhân quá lâu:** Mỗi task làm từ 1–3 ngày phải hoàn thành và tạo PR ngay, tránh để 2 tuần mới gộp code.
