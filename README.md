# 🚗 DriveShare - Nền Tảng Cho Thuê Xe Tự Lái Trực Tuyến

> **Dự án thực tập K4 - Mô hình kinh tế chia sẻ xe hơi (Car Sharing Platform)**  
> Tương tự mô hình Mioto, Zoomcar kết nối Chủ xe (Owner) và Khách thuê xe (Renter).

---

## 👥 Đội Ngũ Thực Hiện (Scrum Team)

| STT | Thành Viên | Vai Trò (Role) | Trách Nhiệm Chính |
|:---:|:---|:---|:---|
| 1 | **Bảo** | **Project Lead / Database** | Quản lý dự án, Thiết kế & Tối ưu CSDL v2, Review & Merge PR, CI/CD, Điều phối chung |
| 2 | **Lộc Khiêm** | **Backend Core (Transaction Engine)** | **Gánh phần khó nhất**: Vòng đời Booking & State Machine, Concurrency Locking chống đặt trùng xe, Schedulers tự động hóa, Giao - Trả xe & Tính phụ phí (US-06, US-07, US-09, US-10) |
| 3 | **Chí Vĩ** | **Backend Developer (Auth & Admin)** | Xác thực & Phân quyền RBAC, Quản lý User/Profile, Trang Quản trị Admin & Dashboard (US-01, US-02, US-14) |
| 4 | **Phát** | **Backend Developer (Car & AI)** | Quản lý xe, Bộ lọc tìm kiếm đa tiêu chí, Tích hợp AI gợi ý xe & tóm tắt khiếu nại (US-03, US-04, US-05, US-15) |
| 5 | **Quân** | **Backend Developer (Services)** | Hỗ trợ BE Thanh toán, Lịch sử giao dịch, Đánh giá, Khiếu nại, WebSocket Thông báo (US-08, US-11, US-12, US-13) |
| 6 | **Chí Tín** | **Frontend / QA & Tester (Payment Specialist)** | Phụ trách toàn bộ Web UI, **Chủ trì phân hệ Thanh toán (Payment)** do đã có kinh nghiệm, Viết Test Cases & QA toàn bộ 15 Stories |

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
4. **[Quy Chuẩn Git & Làm Việc Nhóm (GIT_WORKFLOW.md)](./docs/GIT_WORKFLOW.md)**:
   - Hướng dẫn phân nhánh `feature/*`, quy tắc commit, tạo Pull Request vào `develop` và chống xung đột (merge conflict).
5. **[Quy Chuẩn Lập Trình Backend (BACKEND_CONVENTION.md)](./docs/BACKEND_CONVENTION.md)**:
   - Cấu trúc package theo module, chuẩn RESTful URL, bọc dữ liệu `ApiResponse`, bắt lỗi tập trung `GlobalExceptionHandler`.
6. **[Quy Chuẩn Frontend & Tích Hợp API (FRONTEND_CONVENTION.md)](./docs/FRONTEND_CONVENTION.md)**:
   - Cấu trúc thư mục UI, quản lý JWT token và header, chuẩn hóa Fetch/Axios, bảng mã màu Design Tokens.
7. **[Đặc Tả Chi Tiết Nhiệm Vụ Thành Viên (NHIEM_VU_THANH_VIEN.md)](./docs/scrum/NHIEM_VU_THANH_VIEN.md)**:
   - Bản phân rã công việc chi tiết cho từng người (NB, CN, KT, QD, VL, Phát): API, DTO, logic xử lý và điều kiện nghiệm thu theo đúng Jira Sprint 0.

---

## 🚀 Hướng Dẫn Khởi Chạy Dự Án (Quick Start)

> 📖 **Xem tài liệu chi tiết đầy đủ tại**: [HUONG_DAN_CHAY_DU_AN.md](./HUONG_DAN_CHAY_DU_AN.md)

### Bước 1: Khởi động Cơ sở Dữ liệu & Adminer (Docker)
Mở terminal tại thư mục gốc của dự án:
```powershell
docker-compose up -d
```
- **PostgreSQL 16**: Cổng `5432` (`driveshare_db` / user: `postgres` / pass: `postgrespassword`).
- **Adminer (Web DB GUI)**: Truy cập tại **[http://localhost:8088](http://localhost:8088)**
  - Hệ thống: `PostgreSQL` | Máy chủ: `postgres` | Tài khoản: `postgres` | Mật khẩu: `postgrespassword` | CSDL: `driveshare_db`.

---

### Bước 2: Khởi chạy Backend (Spring Boot 3)
Mở một cửa sổ terminal mới:
```powershell
.\run-backend.ps1
# hoặc:
cd backend
.\mvnw.cmd spring-boot:run
```
- **Cổng Backend API**: [http://localhost:8080](http://localhost:8080)
- **Kiểm tra sức khỏe**: [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health) (Trả về `UP`).
- **Tài liệu Swagger / OpenAPI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html).

---

### Bước 3: Khởi chạy Frontend (Giao diện Web)
Mở thêm một cửa sổ terminal khác:
```powershell
cd frontend
python -m http.server 3000
```
- **Giao diện Web**: Truy cập ngay tại **[http://localhost:3000](http://localhost:3000)**.

---

## 🔑 Tài Khoản Dùng Thử (Demo Accounts)

| Vai trò (Role) | Email đăng nhập | Mật khẩu mặc định | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Khách thuê xe (Renter)** | `renter@driveshare.com` | `Password123@` | Có nút bấm nhanh "Demo Renter" tại trang Login |
| **Chủ xe (Car Owner)** | `owner@driveshare.com` | `Password123@` | Có nút bấm nhanh "Demo Owner" tại trang Login |
| **Quản trị viên (Admin)** | `admin@driveshare.com` | `Password123@` | Quản trị toàn hệ thống tại `/admin.html` |

---

## 🌐 Danh Mục Cổng & Dịch Vụ Hệ Thống

| Dịch vụ | Cổng (Port) | Địa chỉ URL | Mô tả |
| :--- | :---: | :--- | :--- |
| **Frontend Web** | `3000` | [http://localhost:3000](http://localhost:3000) | Giao diện người dùng DriveShare |
| **Backend API** | `8080` | [http://localhost:8080](http://localhost:8080) | Dịch vụ API RESTful Spring Boot 3 |
| **Swagger UI** | `8080` | [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html) | Đặc tả & tương tác thử nghiệm API |
| **Adminer** | `8088` | [http://localhost:8088](http://localhost:8088) | Giao diện đồ họa quản lý CSDL PostgreSQL |
| **PostgreSQL** | `5432` | `localhost:5432` | Hệ quản trị cơ sở dữ liệu chính |

---

*© 2026 DriveShare Team - K4 Internship Project.*


