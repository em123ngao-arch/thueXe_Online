---
name: create-github-pr
description: Use when creating a GitHub pull request for this repo. Defines what a PR must contain (title, description template, checklist) and the push + gh commands.
---

# Create GitHub PR

Quy chuẩn tạo Pull Request chuẩn mực vào nhánh `develop` cho dự án DriveShare.

## Branch Naming
Đặt tên nhánh theo mã task Jira hoặc loại công việc:
- `feature/<task-id>-<slug>` (e.g. `feature/CRP-41-rental-request`)
- `fix/<task-id>-<slug>` (e.g. `fix/profile-avatar-upload`)
*Tuyệt đối không commit trực tiếp vào `develop` hoặc `main`.*

## Pre-flight (Kiểm tra trước khi tạo PR)
1. Chạy toàn bộ bài test:
   ```powershell
   cd backend; .\mvnw.cmd test
   ```
   Bắt buộc phải đạt **`BUILD SUCCESS (103/103 tests pass)`**.
2. Kiểm tra `git status` sạch sẽ, không commit file tạm, file log, mật khẩu hay API key.

## PR Title
Theo chuẩn Conventional Commits kèm mã task:
- `feat(rental): CRP-41 implement rental request submission`
- `fix(auth): fix password reset token expiration check`
- `refactor(car): optimize search query with date availability`

## PR Description Template
```markdown
## 📌 Nhiệm vụ & Mã Jira
- Mã Task: CRP-XX (hoặc mô tả ngắn)
- Người thực hiện: [Tên thành viên]

## 🛠️ Các thay đổi chính
- Thêm API / DTO / Service nào?
- Sửa đổi logic gì trong module?

## 🧪 Kết quả kiểm thử
- [x] Đã chạy `cd backend; .\mvnw.cmd test` (103/103 tests pass)
- [x] Đã test thủ công bằng PowerShell / Postman

## ⚠️ Checklist an toàn
- [x] Không xung đột với nhánh `develop`
- [x] Không commit mật khẩu, JWT secret hay file cấu hình nhạy cảm
```

## Lệnh tạo PR
```bash
git push -u origin <branch_name>
gh pr create --base develop --head <branch_name> --title "feat(...): ..." --body "..."
```
