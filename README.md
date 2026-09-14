# 🚗 DriveShare - Nền Tảng Cho Thuê Xe Tự Lái Trực Tuyến

> **Dự án thực tập K4 - Mô hình kinh tế chia sẻ xe hơi (Car Sharing Platform)**  
> Tương tự mô hình Mioto, Zoomcar kết nối Chủ xe (Owner) và Khách thuê xe (Renter).

---

## 👥 Đội Ngũ Thực Hiện (Scrum Team)

| STT | Thành Viên | Vai Trò (Role) | Trách Nhiệm Chính |
|:---:|:---|:---|:---|
| 1 | **Lâm Chí Vĩ** | **Scrum Master / Team Lead** | Quản lý dự án, Fullstack, điều phối chung |
| 2 | **Đỗ Ngọc Phát** | **Backend Developer** | Thiết kế API, Auth, Quản lý xe, CSDL |
| 3 | **Hồ Huỳnh Khiêm** | **Backend Developer** | Đặt xe, Thanh toán, Tự động hóa & Scheduler |
| 4 | **Nguyễn Duy Quân** | **Frontend Developer** | Giao diện Web/UI-UX, Tích hợp API |
| 5 | **Nguyễn Hữu Tín** | **QA / Tester** | Viết Test Cases, Kiểm thử API, Báo cáo lỗi |

---

## 📂 Cấu Trúc Thư Mục Dự Án

```plaintext
Spring_ThucTap_k4/
├── docs/                                    # Toàn bộ tài liệu kỹ thuật & quản lý
│   ├── database/                            # Kịch bản khởi tạo CSDL MySQL
│   │   ├── database_schema.sql
│   │   └── DriveShare_Database_Design_v2.sql
│   ├── requirements/                        # Đề bài & yêu cầu thực tập
│   │   └── deBai.docx
│   ├── scrum/                               # Bảng tiến độ Sprint & User Stories
│   │   ├── DriveShare_TienDo.xlsx
│   │   └── Huong_Dan_Scrum_Product_Backlog_DriveShare.docx
│   ├── flow_diagrams.md                     # Sơ đồ 10 luồng nghiệp vụ chính (Mermaid)
│   └── glossary.md                          # Sổ tay 85+ thuật ngữ & câu trả lời bảo vệ
├── frontend/                                # Giao diện Web (HTML/CSS/JS)
├── .gitignore                               # Quy tắc bỏ qua file rác / build
└── README.md                                # Hướng dẫn tổng quan dự án
```

---

## 🛠️ Công Nghệ Dự Kiến (Tech Stack)

- **Backend**: Java 17+, Spring Boot (Spring Security, Spring Data JPA, Spring Validation)
- **Database**: MySQL 8.0 / PostgreSQL
- **Cache & Message**: Redis (nếu mở rộng), Scheduled Tasks (Spring Task Scheduler)
- **Security**: JWT (JSON Web Token), BCrypt Password Hashing, RBAC (Role-Based Access Control)
- **Frontend**: React.js / Vue.js hoặc Thymeleaf + TailwindCSS / Bootstrap
- **Tools**: Git, GitHub, Postman, MySQL Workbench, DBeaver

---

## 📑 Tài Liệu Tham Khảo Nhanh

1. **[Thiết kế Cơ sở dữ liệu (database_schema.sql)](./docs/database/database_schema.sql)**:
   - Bản v2.0 tinh gọn gồm 10-11 bảng cốt lõi, loại bỏ bảng thừa, phân chia rõ ràng theo 3 CSDL: Khách thuê (`driveshare_renter_db`), Chủ xe (`driveshare_owner_db`), Quản trị (`driveshare_admin_db`). Kèm sẵn dữ liệu mẫu (`seed data`).
2. **[Sơ đồ Luồng nghiệp vụ (flow_diagrams.md)](./docs/flow_diagrams.md)**:
   - 10 sơ đồ trực quan: Luồng đăng ký/đăng nhập, Đăng xe & Phê duyệt, Đặt xe & Đặt cọc, Bàn giao xe & Trả xe, Hủy cọc & Hoàn tiền, Đánh giá & Khiếu nại, State Machine đơn xe.
3. **[Sổ tay Thuật ngữ & Trả lời câu hỏi (glossary.md)](./docs/glossary.md)**:
   - Tra cứu nhanh các khái niệm Scrum, REST API, JWT, Optimistic Locking, Soft Delete, Cron Job,... để tự tin khi báo cáo & bảo vệ dự án.

---

## 🚀 Hướng Dẫn Bắt Đầu (Quick Start)

### 1. Khởi tạo Cơ sở Dữ liệu
```bash
# Đăng nhập vào MySQL Server
mysql -u root -p

# Chạy file script schema
source docs/database/database_schema.sql;
```

### 2. Thiết lập Git & Làm Việc Nhóm
- Nhánh chính bảo vệ: `main`
- Nhánh phát triển chung: `develop`
- Nhánh tính năng cá nhân: `feature/<tên-tính-năng>`

---

*© 2026 DriveShare Team - K4 Internship Project.*
