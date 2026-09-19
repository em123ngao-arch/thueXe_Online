# 📚 THƯ MỤC TÀI LIỆU DRIVESHARE

> Đây là điểm xuất phát khi bạn cần tìm bất kỳ tài liệu nào của dự án.
> Tất cả file `.md` đều đọc được trực tiếp trên GitHub.

---

## 🗂️ Cấu trúc thư mục

```
docs/
├── README.md                    ← Bạn đang ở đây
├── BACKEND_CONVENTION.md        ← Quy ước code Backend (Java/Spring Boot)
├── FRONTEND_CONVENTION.md       ← Quy ước code Frontend (JS/HTML/CSS)
├── GIT_WORKFLOW.md              ← Quy trình Git: branch, commit, PR
├── flow_diagrams.md             ← Sơ đồ luồng nghiệp vụ
├── glossary.md                  ← Bảng thuật ngữ dự án
│
├── scrum/
│   └── NHIEM_VU_THANH_VIEN.md  ← Phân công nhiệm vụ từng thành viên ⭐
│
├── requirements/
│   └── business-rules.md       ← Luật nghiệp vụ đã xác nhận (Sprint 1 Fix) ⭐
│
├── api/                         ← Đặc tả API endpoints
├── auth/                        ← Tài liệu xác thực & bảo mật
└── database/                    ← Schema & migration DB
```

---

## 🚀 Đọc ngay nếu bạn là thành viên mới vào Sprint 1 Fix

### Bước 1 — Xem nhiệm vụ của mình
📄 [NHIEM_VU_THANH_VIEN.md](./scrum/NHIEM_VU_THANH_VIEN.md)

> Tìm tên mình → đọc task → đọc Acceptance Criteria → bắt đầu code.

### Bước 2 — Hiểu luật nghiệp vụ trước khi code
📄 [business-rules.md](./requirements/business-rules.md)

> Đây là nguồn sự thật duy nhất (Single Source of Truth) về hành vi hệ thống.
> **Mọi ambiguity phải hỏi lại trước khi code**, không tự suy đoán.

### Bước 3 — Tuân thủ quy ước code
📄 [BACKEND_CONVENTION.md](./BACKEND_CONVENTION.md) | [FRONTEND_CONVENTION.md](./FRONTEND_CONVENTION.md)

### Bước 4 — Tuân thủ quy trình Git
📄 [GIT_WORKFLOW.md](./GIT_WORKFLOW.md)

> Tóm tắt nhanh: `develop` → tạo nhánh `fix/tên-task` → PR → Bảo review → merge

---

## 📋 Thứ tự merge Sprint 1 Fix (tránh conflict)

```
Bước 1 (song song):
  Vĩ    → fix/CRP-auth-security
  Quân  → fix/CRP-profile-upload
  Phát  → feature/google-oauth2

Bước 2 (sau khi BE merge xong):
  Khiêm → fix/CRP-admin-extend
  Tín   → fix/FE-sprint1

Bước 3:
  Bảo   → fix/DB-migration (review & merge tất cả)
```

---

> **Cập nhật lần cuối:** 19/09/2026 — Sprint 1 Fix & Bổ sung
