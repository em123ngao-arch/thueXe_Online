# 📋 KẾ HOẠCH PHÂN CÔNG HOÀN THIỆN TÀI LIỆU SRS TOÀN DIỆN (DRIVESHARE K4)

> **Mục tiêu:** Hoàn thiện 100% tài liệu **Đặc tả Yêu cầu Phần mềm (SRS - Software Requirements Specification)** theo chuẩn **Doc_ITC** của trường và khớp chuẩn xác 100% với mã nguồn Backend Spring Boot, Frontend Vanilla JS, và Database PostgreSQL 16 của dự án DriveShare.  
> **Nhân sự thực hiện chính:** **Lâm Chí Vĩ (`VL`)** và **Lộc Khiêm (`KT`)**.  
> **Chỉ đạo & Thẩm định:** **Nguyễn Duy Bảo (`NB` - Tech Lead & Database Architect)**.

---

## 1. TỔNG QUAN PHÂN VAI & NGUYÊN TẮC THỰC HIỆN

- **Lâm Chí Vĩ (`VL` - Functional & Business Lead)**:
  - Sở trường: Đã nắm rõ toàn bộ luồng Auth, Nghiệp vụ đặt thuê xe của Renter, Giới hạn 3 đơn PENDING, và Biên bản bàn giao 2 chiều (Inspection 2-Way Check-in/Check-out).
  - Trọng tâm: Phụ trách toàn bộ phần **Nghiệp vụ, Tác nhân, Yêu cầu chức năng (FRs), Đặc tả 5 Use Case chi tiết, Thiết kế UI/UX và Tiêu chí nghiệm thu chức năng**.
- **Lộc Khiêm (`KT` - System Architect & Tech Lead)**:
  - Sở trường: Đã thiết kế Sơ đồ Tuần tự (Sequence Diagram), Kiến trúc Lục giác (Hexagonal), Admin API duyệt tài khoản/xe, và thuật toán Auto-Reject đơn trùng lịch cạnh tranh.
  - Trọng tâm: Phụ trách toàn bộ phần **Kiến trúc hệ thống, Yêu cầu phi chức năng (NFR), Đặc tả 53 REST APIs, Thiết kế 15 Bảng CSDL, Ma trận RTM 54 REQs, Chiến lược kiểm thử tự động, và Quản trị rủi ro kỹ thuật**.

---

## 2. MA TRẬN PHÂN CHIA 15 CHƯƠNG CHI TIẾT

| Chương | Tên Chương (Theo chuẩn Doc_ITC) | Người Phụ Trách | Trọng Tâm Cần Hoàn Thiện | Nguồn Dữ Liệu Tham Chiếu Thực Tế Trong Dự Án |
| :---: | :--- | :---: | :--- | :--- |
| **Ch. 1** | **Giới thiệu tổng quan (Introduction)** | **Lâm Chí Vĩ** | - Bối cảnh thị trường thuê xe tự lái và vấn đề nhức nhối.<br>- Mục tiêu cốt lõi của DriveShare (Minh bạch cọc, chống trùng lịch, AI tư vấn).<br>- Phạm vi dự án (Renter Portal, Owner Portal, Admin Portal, AI Chatbot). | `docs/Slide_Bao_Ve_Do_An_DriveShare_K4_V4_15Slides_WithNotes.pptx` |
| **Ch. 2** | **Mô tả tổng quan hệ thống (Overall Description)** | **Lâm Chí Vĩ** | - Mô hình tương tác giữa Khách thuê, Chủ xe và Quản trị viên.<br>- Giả định & Ràng buộc vận hành (Cọc 30% VietQR, tuổi lái xe $\ge 21$, thời hạn duyệt đơn 60 phút). | `docs/requirements/business-rules.md` |
| **Ch. 3** | **Tác nhân hệ thống (Actors)** | **Lâm Chí Vĩ** | - Đặc tả 3 tác nhân con người: Khách thuê (`RENTER`), Chủ xe (`OWNER`), Quản trị viên (`ADMIN`).<br>- Đặc tả tác nhân hệ thống bên ngoài: VietQR Napas247, Google OAuth2, Google Gemini AI (LLM), Cloudinary CDN. | `backend/src/main/java/com/driveshare/common/enums/ERole.java` |
| **Ch. 4** | **Product Backlog & Lộ trình Sprint** | **Lộc Khiêm** | - Bảng tổng hợp Product Backlog qua 5 Sprints.<br>- Bảng User Stories, Story Points, Phân bổ nguồn lực 6 thành viên nhóm qua các Sprint. | `docs/scrum/NHIEM_VU_THANH_VIEN.md` & `docs/scrum/sprint5_task_assignment_final_demo.md` |
| **Ch. 5** | **Yêu cầu chức năng chi tiết (FRs)** | **Lâm Chí Vĩ** | Phân loại và lập bảng đầy đủ các Functional Requirements:<br>- `REQ-AUT`: Đăng ký/đăng nhập, OTP 300s, Google OAuth2.<br>- `REQ-CAR`: Quản lý xe, duyệt xe, chặn lịch bận tự động.<br>- `REQ-BOK`: Đặt xe, giới hạn 3 đơn PENDING, auto-expire sau 60p.<br>- `REQ-PAY`: Thanh toán cọc 30% VietQR, đối soát giao dịch.<br>- `REQ-HND`: Biên bản bàn giao 2 chiều (Check-in/Check-out, Odo, Xăng).<br>- `REQ-DSP`: Khiếu nại đền bù cọc, Admin phân xử.<br>- `REQ-AI`: Tư vấn xe thông minh kết hợp RAG. | `scripts/generate_srs_chapters_6_to_12.py` & `docs/requirements/business-rules.md` |
| **Ch. 6** | **Đặc tả 5 Use Case chi tiết** | **Lâm Chí Vĩ** | Lập bảng đặc tả kịch bản chuẩn IEEE (Mô tả, Tác nhân, Tiền điều kiện, Luồng cơ bản Happy Path, Luồng nhánh thay thế, Ngoại lệ, Hậu điều kiện):<br>1. `UC-AUT-001`: Đăng ký tài khoản kèm tải 2 mặt CCCD và GPLX.<br>2. `UC-CAR-002`: Chủ xe đăng ký xe mới & Chặn lịch bận.<br>3. `UC-BOK-003`: Khách tạo đơn thuê & Thanh toán cọc 30% VietQR.<br>4. `UC-HND-004`: Biên bản bàn giao xe 2 chiều (Check-in / Check-out).<br>5. `UC-DSP-005`: Mở khiếu nại tranh chấp cọc & Admin giải quyết. | `docs/diagrams/USE_CASE_SPECIFICATION_FULL.md` & `backend/src/main/java/com/driveshare/modules/rental/` |
| **Ch. 7** | **Yêu cầu phi chức năng (NFRs)** | **Lộc Khiêm** | - **Bảo mật:** JWT Stateless (24h Access / 7d Refresh), RBAC, Rate Limiting (chặn IP sai 5 lần / khóa OTP sai 3 lần), CORS an toàn.<br>- **Hiệu năng:** B-Tree Composite Indexing, Tắt Open-Session-In-View (`open-in-view: false`), HikariCP Connection Pool, DTO Projections.<br>- **Toàn vẹn & Tương tranh:** Pessimistic Locking (`@Lock(PESSIMISTIC_WRITE)`) chống Double-booking, Giao dịch ACID. | `backend/src/main/resources/application-dev.yml` & `SecurityConfig.java` |
| **Ch. 8** | **Kiến trúc hệ thống (System Architecture)** | **Lộc Khiêm** | - Mô hình Kiến trúc Lục giác (Hexagonal Architecture / Ports & Adapters) 3 tầng độc lập.<br>- Bộ 7 luật ArchUnit tự động kiểm thử cấu trúc.<br>- **Sơ đồ Máy trạng thái (State Machine):** Vòng đời 17 trạng thái của Đơn thuê xe (`PENDING`, `APPROVED`, `CONFIRMED`, `IN_PROGRESS`, `OVERDUE`, `COMPLETED`, `DISPUTED`...). | `AGENTS.md` & `ArchitectureRulesTest.java` |
| **Ch. 9** | **Thiết kế UI/UX & Wireframe** | **Lâm Chí Vĩ** | - Sơ đồ Sitemap chuyển hướng giao diện giữa Khách thuê, Chủ xe và Quản trị viên.<br>- Ảnh chụp giao diện thực tế 4 màn hình chính: Trang chủ tìm kiếm xe, Trang chi tiết và đặt xe, Bảng điều khiển Chủ xe duyệt đơn, Giao diện chuyển khoản VietQR tự động. | `frontend/` & `docs/screenshots/` |
| **Ch. 10** | **Đặc tả 53 RESTful APIs** | **Lộc Khiêm** | Lập bảng đặc tả chi tiết **53 Endpoints RESTful** đang chạy thực tế trên Backend:<br>- STT, Module, Method (GET/POST/PUT/DELETE), Endpoint URL, Quyền truy cập, Mô tả chức năng.<br>- Chuẩn hóa định dạng phản hồi bọc trong `ApiResponse<T>`. | `Swagger UI` (`/swagger-ui.html`) & `OpenApiConfig.java` |
| **Ch. 11** | **Thiết kế chi tiết CSDL (Database Design)** | **Lộc Khiêm** | - **Sơ đồ ERD tổng thể** (quan hệ 1-N, N-N).<br>- Đặc tả chi tiết **15 Bảng PostgreSQL**: Tên cột, Kiểu dữ liệu, Khóa chính (PK), Khóa ngoại (FK), Ràng buộc Nullable/Check, Default.<br>- Danh mục các **chỉ mục B-Tree (Indexes)** được đánh để tối ưu tốc độ tìm kiếm. | 8 file SQL trong `backend/src/main/resources/db/migration/` |
| **Ch. 12** | **Ma trận truy vết yêu cầu (RTM)** | **Lộc Khiêm** | Bảng Ma trận **RTM (Requirement Traceability Matrix)** gồm **đúng 54 dòng REQ**:<br>- Cột: Mã YC (REQ-XXX-yyy) ↔ Mô tả YC ↔ Endpoint API tương ứng (Ch.10) ↔ Bảng CSDL lưu trữ (Ch.11) ↔ Mã Test Case kiểm thử (TC-XXX). | Đã sinh tự động trong file `BAO_CAO_SRS_DRIVESHARE_K4_PRO_V2_2_Ch1_to_Ch12.docx` |
| **Ch. 13** | **Chiến lược kiểm thử (Test Strategy)** | **Lộc Khiêm** | - Quy trình kiểm thử: Unit Test Mockito, SpringBootTest Integration, Concurrency Test (10 luồng cùng đặt xe).<br>- Báo cáo kết quả kiểm thử thực tế: **240 bài test, 239 PASS, 0 FAIL, 100% pass 7 luật ArchUnit**. | `backend/src/test/` |
| **Ch. 14** | **Tiêu chuẩn & Tiêu chí nghiệm thu** | **Lâm Chí Vĩ** | - Bảng Acceptance Criteria (AC) cho từng tính năng.<br>- Tiêu chí nghiệm thu của Hội đồng chấm tốt nghiệp ITC. | `docs/requirements/business-rules.md` |
| **Ch. 15** | **Quản trị rủi ro kỹ thuật (Risk Management)** | **Lộc Khiêm** | Ma trận nhận diện và giải pháp xử lý 4 rủi ro lớn nhất:<br>1. Xung đột đặt trùng lịch xe (Giải pháp: Soft-Lock 5 phút + Khóa bi quan).<br>2. Thất thoát tiền cọc hoặc gian lận (Giải pháp: Idempotency Key + Chặn can thiệp giá từ Server).<br>3. LLM AI phản hồi chậm hoặc sập (Giải pháp: Fallback Regex Intent Extraction).<br>4. Quá hạn trả xe (Giải pháp: Tự động phạt 150% giá/giờ sau mốc 2 giờ). | `AiChatUseCaseImpl.java` & `V8__overdue_and_penalty_tracking.sql` |

---

## 3. CÔNG CỤ VÀ TÀI NGUYÊN SẴN CÓ CHO NHÓM

1. **File Word khung sườn đã sinh sẵn dữ liệu:**  
   - File: `BAO_CAO_SRS_DRIVESHARE_K4_PRO_V2_2_Ch1_to_Ch12.docx` (đã có sẵn khung chuẩn Doc_ITC, đầy đủ 53 APIs, 15 Bảng DB, 54 REQs và 17 States).
2. **Script kiểm tra tự động:**  
   - Chạy lệnh: `python scripts/audit_srs_v2_2.py` để kiểm tra độ đầy đủ và nhất quán của tài liệu trước khi nộp.

