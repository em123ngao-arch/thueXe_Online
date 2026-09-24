---
name: driveshare-sprint-testing
description: >-
  Hướng dẫn chạy kiểm thử tự động Sprint 1 và Sprint 2 cho dự án DriveShare bằng script PowerShell.
  Kích hoạt khi người dùng yêu cầu test sprint, kiểm thử API backend, chạy kịch bản test hoặc kiểm tra lỗi Sprint 1/Sprint 2.
---

# DriveShare Sprint Testing Workflow

Quy trình chạy test và kiểm tra toàn diện các API của dự án DriveShare.

## Khi Nào Kích Hoạt
- Người dùng yêu cầu chạy test sprint 1 hoặc sprint 2
- Cần kiểm tra hoạt động của các API: Auth (Register, Login), Car (Browse, Filter, CRUD), Rental, Admin
- Cần đối soát lỗi sau khi sửa code backend

## Các Bước Thực Hiện

### Bước 1: Đảm bảo Backend đang chạy
Backend phải đang chạy ở cổng `8080` (hoặc profile dev/test):
```powershell
# Chạy backend nếu chưa bật:
cd backend
.\mvnw.cmd spring-boot:run
```

### Bước 2: Chạy Script Test Sprint 1 Tự Động
Script test tự động thực hiện toàn bộ các ca kiểm thử:
```powershell
powershell -ExecutionPolicy Bypass -File ./test_sprint1_fix.ps1
```

### Bước 3: Đọc Kết Quả và Đối Soát
- Nếu có ca test nào FAILED: Mở file [SPRINT1_FIX_GUIDE.md](file:///d:/MONHOCITC/K4/Spring_ThucTap_k4/SPRINT1_FIX_GUIDE.md) để tra cứu nguyên nhân và giải pháp sửa lỗi.
- Đảm bảo các status code trả về đúng chuẩn (200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden).
