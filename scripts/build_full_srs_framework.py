# -*- coding: utf-8 -*-
"""
Script xây dựng toàn bộ Sườn tài liệu đặc tả chuẩn IEEE 830 / ISO 29148 theo benchmark Doc_ITC.docx
Hoàn thành chi tiết 100% Chương 1 và xây dựng khung sườn chuẩn hóa cho các Chương 2 đến 15 + Phụ lục.
"""
import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

MD_CONTENT = """# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) & THIẾT KẾ HỆ THỐNG (SDS)
## DỰ ÁN: NỀN TẢNG CHIA SẺ VÀ CHO THUÊ XE TỰ LÁI TRỰC TUYẾN DRIVESHARE
### TÍCH HỢP TRỢ LÝ ẢO AI ASSISTANT & CƠ CHẾ KÝ QUỸ ĐẶT CỌC VIETQR ESCROW (30%)

> **Quy chuẩn áp dụng:** IEEE Std 830-1998 / ISO/IEC/IEEE 29148:2018 / Khung quy trình Agile/Scrum  
> **Mã tài liệu:** `SDLC-SRS-DRIVESHARE-2026-V2.0`  
> **Phiên bản hiện hành:** 2.0 (Chuẩn hóa toàn diện theo Khung chương trình thực tập Java Web Fullstack ITC K4)  
> **Đơn vị phát hành:** Nhóm phát triển DriveShare (K4 PRO) & Ban Quy chuẩn Đồ án Thực tập Doanh nghiệp  
> **Ngày phát hành:** 24/10/2026  

---

### BẢNG THUỘC TÍNH TÀI LIỆU (DOCUMENT ATTRIBUTES)

| Thuộc tính tài liệu | Giá trị đặc tả chi tiết |
| :--- | :--- |
| **Mã tài liệu** | `SDLC-SRS-DRIVESHARE-2026-V2.0` |
| **Tên dự án** | **DriveShare** — Peer-to-Peer Car Rental Platform with AI Advisor & Escrow Payment |
| **Phiên bản hiện hành** | **2.0** (Nâng cấp toàn diện bám sát Khung chương trình thực tập Java Web Fullstack) |
| **Quy chuẩn kỹ thuật áp dụng** | **IEEE Std 830-1998** (Software Requirements Specifications), **ISO/IEC/IEEE 29148:2018**, Khung làm việc **Scrum** (Scrum Guide) |
| **Phạm vi triển khai** | Chương trình Đồ án & Thực tập tốt nghiệp K4 (Khung 26 buổi học / 6 Sprint giai đoạn) |
| **Đơn vị thực hiện** | Nhóm sinh viên thực tập **DriveShare (K4 PRO)**: <br>• **Nguyễn Duy Bảo** (Tech Lead & Database Architect)<br>• **Chí Tín** (Frontend Lead & UX/UI Integration)<br>• **Lâm Chí Vĩ** (Backend — Authentication & Security JWT)<br>• **Lộc Khiêm** (Backend — Admin Portal, Dispute & DevOps)<br>• **Duy Quân** (Backend — Profile eKYC & Cloudinary Media)<br>• **Phát** (Backend — Google OAuth2 & Search Specification) |
| **Đối tượng sử dụng** | Thực tập sinh Developer, Thực tập sinh Tester, Mentor/Scrum Master, Hội đồng nghiệm thu (Demo Day) |

---

### LỊCH SỬ CẬP NHẬT TÀI LIỆU (CHANGE LOG)

| Phiên bản | Ngày | Nội dung thay đổi chính | Người thực hiện |
| :---: | :---: | :--- | :---: |
| **1.0** | 15/09/2026 | Khởi tạo tài liệu đặc tả sơ bộ ban đầu: mô tả bài toán P2P Car Rental, 1 use case cơ bản và 3 bảng CSDL mẫu. | Nhóm DriveShare |
| **2.0** | 24/10/2026 | Cấu trúc lại toàn bộ tài liệu theo chuẩn mực **ISO/IEC/IEEE 29148:2018** và **Doc_ITC.docx**: <br>1. Xây dựng trọn vẹn khung sườn 15 Chương và 2 Phụ lục theo quy chuẩn tốt nghiệp ITC.<br>2. **Hoàn thiện 100% Chương 1 (Giới thiệu tổng quan)**: Mục đích, Phạm vi sản phẩm 4 phân hệ, Đối tượng độc giả, 18 Thuật ngữ kỹ thuật, 7 Tài liệu tham khảo, Bảng ánh xạ SDLC vào 6 Sprint (26 buổi học), Phạm vi loại trừ & Định hướng mở rộng.<br>3. Chuẩn hóa khung sườn chi tiết cho các Chương 2 đến 15 (Mô hình CSDL 14 bảng 3NF, Escrow 30% VietQR Napas 247, Soft Lock 45 phút, Khóa bi quan `@Lock(PESSIMISTIC_WRITE)`, NFR định lượng, Ma trận RTM, RACI và Tiêu chuẩn nghiệm thu Demo Day). | Toàn bộ Nhóm K4 PRO |

---

# MỤC LỤC TỔNG THỂ TÀI LIỆU ĐẶC TẢ (TABLE OF CONTENTS)

* **BẢNG THUỘC TÍNH TÀI LIỆU (DOCUMENT ATTRIBUTES)**
* **LỊCH SỬ CẬP NHẬT TÀI LIỆU (CHANGE LOG)**
* **CHƯƠNG 1: GIỚI THIỆU TỔNG QUAN (INTRODUCTION) — [ĐÃ HOÀN TẤT CHI TIẾT 100%]**
  * 1.1. Mục đích tài liệu
  * 1.2. Phạm vi sản phẩm (Product Scope)
  * 1.3. Đối tượng sử dụng tài liệu
  * 1.4. Thuật ngữ và từ viết tắt (Definitions & Acronyms)
  * 1.5. Tài liệu tham khảo
  * 1.6. Quy trình phát triển áp dụng — Ánh xạ SDLC vào khung chương trình thực tập
  * 1.7. Phạm vi loại trừ (Out of Scope) — đề xuất mở rộng (Stretch Goals)
* **CHƯƠNG 2: MÔ TẢ TỔNG QUAN HỆ THỐNG (OVERALL DESCRIPTION) — [SƯỜN ĐẶC TẢ]**
  * 2.1. Bối cảnh sản phẩm (Product Perspective)
  * 2.2. Đối tượng người dùng & đặc điểm sử dụng (User Classes & Characteristics)
  * 2.3. Ràng buộc thiết kế & công nghệ (Design & Implementation Constraints)
  * 2.4. Giả định và phụ thuộc (Assumptions & Dependencies)
* **CHƯƠNG 3: TÁC NHÂN HỆ THỐNG (ACTORS) — [SƯỜN ĐẶC TẢ]**
  * 3.1. Danh mục tác nhân hệ thống
  * 3.2. Ma trận phân quyền tác nhân (Actor Privilege Matrix)
* **CHƯƠNG 4: PRODUCT BACKLOG VÀ LỘ TRÌNH SPRINT (BACKLOG & SPRINT ROADMAP) — [SƯỜN ĐẶC TẢ]**
  * 4.1. Nguyên tắc ánh xạ
  * 4.2. Bảng Sprint Roadmap (chi tiết theo 26 buổi học)
  * 4.3. Định nghĩa Sẵn sàng & Hoàn tất (Definition of Ready / Done)
* **CHƯƠNG 5: YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) — [SƯỜN ĐẶC TẢ]**
  * 5.1. EPIC-AUTH — Xác thực & Quản lý tài khoản
  * 5.2. EPIC-USER — Hồ sơ người dùng & Định danh eKYC
  * 5.3. EPIC-CAR — Quản lý phương tiện & Trạng thái xe (ACTIVE/INACTIVE)
  * 5.4. EPIC-RENTAL — Vòng đời giao dịch đặt xe (Request-to-Book & Screening)
  * 5.5. EPIC-PAYMENT — Cổng thanh toán VietQR Napas 247 & Ký quỹ Escrow 30%
  * 5.6. EPIC-HANDOVER — Biên bản bàn giao kỹ thuật số (Check-in & Check-out)
  * 5.7. EPIC-DISPUTE — Trọng tài xử lý khiếu nại, Hoàn 100% cọc & Phạt chủ xe
  * 5.8. EPIC-WALLET — Quản lý ví doanh thu chủ xe 90% & Phí dịch vụ sàn 10%
  * 5.9. EPIC-AI — Trợ lý ảo AI Assistant tư vấn xe thông minh (RAG Gemini)
  * 5.10. EPIC-ADMIN — Quản trị, Thống kê tài chính GMV & Giám sát hệ thống
* **CHƯƠNG 6: ĐẶC TẢ USE CASE CHI TIẾT (DETAILED USE CASE SPECIFICATION) — [SƯỜN ĐẶC TẢ]**
  * 6.0. Sơ đồ Use Case tổng quan (UML Use Case Diagram)
  * 6.1. UC-AUTH-001: Đăng ký, Đăng nhập & Xác thực JWT Stateless
  * 6.2. UC-BOOK-002: Đặt lịch thuê xe & Thanh toán cọc giữ chỗ VietQR Escrow 30%
  * 6.3. UC-CAR-003: Đăng ký xe mới & Cần gạt bật/tắt nhận khách (ACTIVE/INACTIVE)
  * 6.4. UC-HANDOVER-004: Biên bản giao nhận xe Check-in và nghiệm thu Check-out
  * 6.5. UC-DISPUTE-005: Khởi tạo khiếu nại bùng hẹn & Phân xử cưỡng chế bằng khóa bi quan
* **CHƯƠNG 7: YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS) — [SƯỜN ĐẶC TẢ]**
  * 7.1. Hiệu năng & Khả năng chịu tải (Performance & Concurrency)
  * 7.2. Độ tin cậy & Tính sẵn sàng (Reliability & Availability)
  * 7.3. Tiêu chuẩn bảo mật (Security & OWASP Top 10)
  * 7.4. Khả năng bảo trì & Mở rộng (Maintainability & Extensibility)
  * 7.5. Tính khả dụng & Trải nghiệm giao diện (Usability & Accessibility)
* **CHƯƠNG 8: KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE) — [SƯỜN ĐẶC TẢ]**
  * 8.1. Mô hình kiến trúc đa tầng (Layered Architecture)
  * 8.2. Cơ chế bảo mật — JWT Authentication Filter & Token Versioning
  * 8.3. Cơ chế kiểm soát đồng thời & Ký quỹ — Khóa 2 giai đoạn (2PL) & Pessimistic Lock
  * 8.4. Sơ đồ triển khai hệ thống (Cloud Deployment View on Render)
* **CHƯƠNG 9: THIẾT KẾ UI/UX VÀ WIREFRAME MÀN HÌNH (UI/UX & WIREFRAME DESIGN) — [SƯỜN ĐẶC TẢ]**
  * 9.1. Nguyên tắc thiết kế UI/UX áp dụng
  * 9.2. Wireframe luồng màn hình Khách thuê (Mobile)
  * 9.3. Wireframe màn hình Chủ xe & Quản trị viên (Desktop)
  * 9.4. Sơ đồ luồng chuyển màn hình (Screen Flow Diagram)
* **CHƯƠNG 10: ĐẶC TẢ GIAO DIỆN LẬP TRÌNH ỨNG DỤNG (RESTFUL API SPECIFICATION) — [SƯỜN ĐẶC TẢ]**
  * 10.1. Quy chuẩn thiết kế RESTful & Định dạng bọc dữ liệu ApiResponse<T>
  * 10.2. Nhóm API Xác thực & Hồ sơ (/api/v1/auth, /api/v1/users)
  * 10.3. Nhóm API Phương tiện & Công khai (/api/v1/cars, /api/v1/public/cars)
  * 10.4. Nhóm API Đơn thuê & Thanh toán (/api/v1/rentals, /api/v1/payments)
  * 10.5. Nhóm API Bàn giao, Khiếu nại & Ví (/api/v1/rentals/handover, /api/v1/admin/rentals/disputes, /api/v1/owner/wallets)
  * 10.6. Nhóm API Trợ lý ảo AI Assistant (/api/v1/chat)
* **CHƯƠNG 11: THIẾT KẾ CHI TIẾT CƠ SỞ DỮ LIỆU (DATABASE DESIGN) — [SƯỜN ĐẶC TẢ]**
  * 11.0. Sơ đồ thực thể quan hệ tổng quan (ERD Diagram - 14 Tables 3NF)
  * 11.1. Từ điển dữ liệu chi tiết 14 bảng (Data Dictionary)
  * 11.2. Chiến lược Indexing và Ràng buộc toàn vẹn dữ liệu
* **CHƯƠNG 12: MA TRẬN TRUY VẾT YÊU CẦU (REQUIREMENT TRACEABILITY MATRIX - RTM) — [SƯỜN ĐẶC TẢ]**
  * 12.1. Cấu trúc ma trận truy vết
  * 12.2. Bảng RTM ánh xạ Requirement → Use Case → API → Database → Test Case
* **CHƯƠNG 13: PHÂN CHIA CÔNG VIỆC VÀ CHIẾN LƯỢC KIỂM THỬ (TASK ALLOCATION & TEST STRATEGY) — [SƯỜN ĐẶC TẢ]**
  * 13.1. Ma trận phân công trách nhiệm nhóm K4 PRO (RACI Matrix)
  * 13.2. Chiến lược kiểm thử theo cấp độ (Unit Test, Integration Test, Concurrency Test, E2E)
* **CHƯƠNG 14: TIÊU CHUẨN VÀ TIÊU CHÍ NGHIỆM THU (ACCEPTANCE & GRADING CRITERIA) — [SƯỜN ĐẶC TẢ]**
  * 14.1. Tiêu chí dành cho Developer (DoD mức độ mã nguồn)
  * 14.2. Tiêu chí dành cho Tester (DoD mức độ kiểm thử & Bug Tracking)
  * 14.3. Tiêu chí nghiệm thu cấp Sprint (Sprint Acceptance Criteria)
  * 14.4. Tiêu chí đánh giá Demo Day tốt nghiệp (Graduation Grading Rubric)
* **CHƯƠNG 15: QUẢN TRỊ RỦI RO (RISK MANAGEMENT) — [SƯỜN ĐẶC TẢ]**
  * 15.1. Bảng nhận diện rủi ro kỹ thuật và nghiệp vụ
  * 15.2. Kế hoạch ứng phó và giảm thiểu rủi ro (Risk Mitigation Plan)
* **PHỤ LỤC (APPENDIX) — [SƯỜN ĐẶC TẢ]**
  * Phụ lục A: Checklist các sự kiện Scrum theo 26 buổi học
  * Phụ lục B: Hồ sơ tốt nghiệp & Bằng chứng kiểm thử tự động

---

# CHƯƠNG 1: GIỚI THIỆU TỔNG QUAN (INTRODUCTION)
*(Chương này đã hoàn thiện 100% nội dung chi tiết theo chuẩn mực đào tạo ITC và IEEE 830)*

### 1.1. Mục Đích Tài Liệu (Purpose)
Tài liệu này đặc tả đầy đủ yêu cầu phần mềm (**Software Requirements Specification - SRS**) và thiết kế hệ thống (**Software Design Specification - SDS**) của dự án **DriveShare**, đồng thời đóng vai trò là **tài liệu kỹ thuật nền (Baseline Document)** để thực tập sinh Developer và Tester triển khai dự án theo đúng quy trình phát triển phần mềm SDLC kết hợp mô hình Agile/Scrum, bám sát Khung chương trình thực tập Java Web Fullstack (26 buổi học, 6 Sprint/giai đoạn) của Khoa/Viện đào tạo.

Tài liệu là căn cứ pháp lý và nghiệm thu chính thức giữa nhóm sinh viên thực hiện với Giảng viên hướng dẫn và Hội đồng bảo vệ tại ngày hội **Demo Day**.

Khác với bản đặc tả mô tả nghiệp vụ thông thường, tài liệu V2.0 bổ sung 4 thành tố kỹ thuật cốt lõi:
1. **Product Backlog & Ánh xạ Sprint**: Ánh xạ trực tiếp từng User Story vào 6 Sprint cụ thể của khung chương trình thực tập (từ Sprint 0 đến Sprint Release).
2. **Yêu cầu phi chức năng (NFR) định lượng được**: Đo lường bằng số liệu cụ thể (thời gian phản hồi API P95 < 1000ms, kiểm thử đồng thời Concurrency bằng Apache JMeter chống Overbooking và Double Refund).
3. **Đặc tả API hợp đồng (Contract-first)**: Thống nhất cấu trúc gói tin `ApiResponse<T>` chuẩn RESTful giữa Backend Spring Boot và Frontend Web.
4. **Ma trận truy vết yêu cầu (Requirement Traceability Matrix - RTM)**: Đảm bảo độ bao phủ kiểm thử toàn diện phục vụ kiểm thử và nghiệm thu tại Demo Day.

---

### 1.2. Phạm Vi Sản Phẩm (Product Scope)
Hệ thống **DriveShare** là một ứng dụng Web Fullstack (Java Spring Boot 3 ở Backend, HTML5/CSS3/JavaScript thuần kết hợp Bootstrap 5 ở Frontend) vận hành trên mô hình client-server, hỗ trợ giao diện đáp ứng (Responsive) cho hai nhóm thiết bị: máy tính để bàn (dành cho Chủ xe và Quản trị viên) và thiết bị di động (dành cho Khách thuê xe). 

Hệ thống giải quyết bài toán chia sẻ và cho thuê xe ô tô tự lái ngang hàng (**P2P Car Rental**), tự động hóa cơ chế ký quỹ đảm bảo giữ cọc 30% qua mã VietQR Napas 247, quản lý hồ sơ xe và eKYC giấy tờ trên Cloudinary CDN, quản lý vòng đời đơn thuê bằng máy trạng thái 17 bước, cung cấp biên bản bàn giao điện tử (Check-in/Check-out), quản lý ví doanh thu chủ xe 90% và cơ chế trọng tài xử lý tranh chấp bùng hẹn (Dispute) bảo vệ hoàn 100% cọc cho khách bằng khóa bi quan Pessimistic Locking.

Hệ thống bao gồm 4 phân hệ chức năng chính:

```text
                                  ┌────────────────────────────────────┐
                                  │         NỀN TẢNG DRIVESHARE V2.0   │
                                  └───────────────────┬────────────────┘
                     ┌────────────────────────────────┼────────────────────────────────┐
                     ▼                                ▼                                ▼
       [PHÂN HỆ KHÁCH THUÊ (RENTER)]     [PHÂN HỆ CHỦ XE (OWNER)]          [PHÂN HỆ QUẢN TRỊ (ADMIN)]
        • Tìm kiếm xe đa tiêu chí         • Đăng ký & quản lý hồ sơ xe     • Kiểm duyệt xe mới & eKYC
        • Trợ lý ảo AI tư vấn lộ trình    • Tải cavet, bảo hiểm xe         • Trọng tài xử lý khiếu nại
        • Định danh eKYC (CCCD + GPLX)    • Cần gạt ACTIVE/INACTIVE        • Hoàn 100% cọc & Phạt chủ xe
        • Tạo đơn thuê (Request-to-Book)  • Phê duyệt yêu cầu (Screening)  • Giám sát dòng tiền hoa hồng 10%
        • Quét VietQR cọc ký quỹ 30%      • Biên bản bàn giao Check-in/out 
        • Báo cáo sự cố bùng xe (Dispute) • Ví thu nhập nhận 90% hợp đồng
        • Đánh giá sao chuyến đi          • Rút tiền về tài khoản ngân hàng
```

1. **Phân hệ Khách thuê (Renter Portal):**
   * Tra cứu danh mục xe với bộ lọc động nâng cao (Hãng, dòng xe, số chỗ, loại nhiên liệu, hộp số, mức giá/ngày, ngày trống).
   * Tương tác trò chuyện thời gian thực với **Trợ lý ảo AI (AI Car Advisor)** để nhận tư vấn lộ trình du lịch và gợi ý các mẫu xe phù hợp đang có thật trong Database (kiến trúc RAG).
   * Định danh điện tử (eKYC): Tải lên ảnh Căn cước công dân (CCCD 2 mặt) và Giấy phép lái xe (GPLX), hệ thống kiểm tra định dạng và dung lượng an toàn.
   * Tạo yêu cầu đặt xe, nhận thông báo xác nhận từ chủ xe.
   * Thanh toán ký quỹ đặt cọc giữ chỗ **30% qua mã VietQR Napas 247** động kèm đồng hồ đếm ngược 15 phút.
   * Biên bản bàn giao nhận xe kỹ thuật số (Check-in) và nghiệm thu trả xe (Check-out).
   * Báo cáo sự cố không nhận được xe do lỗi chủ xe (No-Show Dispute), kích hoạt đóng băng cọc và nhận hoàn tiền 100%.
   * Đánh giá và chấm điểm sao uy tín (1-5 sao) sau chuyến đi.

2. **Phân hệ Chủ xe (Car Owner Portal):**
   * Đăng ký phương tiện cho thuê, tải ảnh ngoại thất/nội thất và cavet/đăng kiểm/bảo hiểm xe lên Cloudinary CDN.
   * Bật/tắt trạng thái xe bằng **cần gạt số thông minh**: `ACTIVE` (Nhận khách) $\leftrightarrow$ `INACTIVE` (Tạm ẩn khi bận hoặc tự dùng xe).
   * Thẩm định hồ sơ khách thuê (Host Screening): Xem thông tin GPLX đã duyệt, lịch sử đánh giá của khách trước khi quyết định **Phê duyệt** hoặc **Từ chối**.
   * Lập biên bản bàn giao xe kỹ thuật số (Check-in): Ghi nhận ODO, mức nhiên liệu xăng/pin, chụp ảnh 4 góc xe trước khi giao chìa khóa.
   * Lập biên bản nghiệm thu trả xe (Check-out): Đối soát hư hại, thu 70% số tiền còn lại và hoàn tất chuyến đi.
   * **Quản lý Ví doanh thu chủ xe (Độc quyền Owner)**: Tự động nhận **90% giá trị hợp đồng** vào ví khả dụng (sau khi sàn trích lại 10% phí dịch vụ), xem bảng kê đối soát từng chuyến và tạo lệnh rút tiền về tài khoản ngân hàng thụ hưởng.

3. **Phân hệ Quản trị & Vận hành Sàn (Admin Portal):**
   * Thẩm định hồ sơ xe mới đăng ký trước khi cho phép xuất bản ra thị trường.
   * Kiểm duyệt hồ sơ định danh người dùng (xác thực ảnh CCCD 2 mặt và GPLX).
   * Đóng vai trò **Trọng tài giải quyết khiếu nại (Dispute Resolution)**: Xem xét bằng chứng ảnh/video tại điểm hẹn, thực thi lệnh cưỡng chế hoàn trả **100% tiền cọc (570.000 đ)** từ quỹ Escrow cho khách thuê và áp dụng chế tài **phạt 500.000 VNĐ** đối với chủ xe vi phạm nghĩa vụ bàn giao.
   * Giám sát tài chính toàn sàn: Tổng giá trị giao dịch (GMV), quỹ tiền cọc tạm giữ (Escrow Pool), và doanh thu hoa hồng 10% của sàn.

4. **Cơ chế Ký quỹ & Bảo mật Giao dịch (Security & Escrow System):**
   * Phân quyền truy cập dựa trên vai trò (RBAC) nghiêm ngặt với 3 vai trò: `ROLE_CUSTOMER`, `ROLE_CAR_OWNER`, `ROLE_ADMIN`.
   * **Cơ chế Ký quỹ Đảm bảo (Escrow Service)**: Tiền cọc 30% được sàn giữ an toàn, bảo vệ cả hai bên, chỉ giải ngân cho chủ xe sau khi chuyến đi hoàn tất thành công.
   * **Khóa lịch giữ chỗ 2 giai đoạn (Two-Phase Locking)**:
     - *Soft Lock (45 phút)*: Kích hoạt khi chủ xe bấm duyệt đơn, giữ xe tạm thời để khách quét mã VietQR thanh toán cọc. Tự động hủy nếu quá 45 phút (`RentalExpirationScheduler`).
     - *Hard Lock*: Kích hoạt ngay khi giao dịch cọc 30% được xác nhận thành công, khóa cứng lịch xe, ngăn chặn tuyệt đối tình trạng đặt trùng xe (Overbooking).
   * **Khóa bi quan (Pessimistic Locking `@Lock(PESSIMISTIC_WRITE)`)**: Áp dụng tại mức CSDL (`SELECT ... FOR UPDATE`) trên bảng `rental_disputes` để chống lỗi Concurrency / Double Refund khi Admin giải quyết khiếu nại.
   * **Quản lý phiên làm việc Stateless**: Cột `token_version` trong bảng `users` tự động tăng khi đổi mật khẩu để thu hồi lập tức toàn bộ JWT cũ trên các thiết bị khác.

---

### 1.3. Đối Tượng Sử Dụng Tài Liệu (Intended Audience)

| Đối tượng độc giả | Mục đích và cách sử dụng tài liệu |
| :--- | :--- |
| **Thực tập sinh Developer (Backend & Frontend)** | Đọc kỹ Chương 5 (Yêu cầu chức năng), Chương 6 (Đặc tả Use Case), Chương 8 (Kiến trúc hệ thống), Chương 9 (UI/UX Wireframe), Chương 10 (RESTful API Contract), và Chương 11 (Thiết kế CSDL 14 bảng) để hiện thực hóa mã nguồn chính xác theo từng Sprint được phân công; đảm bảo controller mỏng, xử lý logic tập trung tại Service và bắt lỗi qua `ApiResponse<T>`. |
| **Thực tập sinh Tester (QA/QC)** | Đọc Chương 5, 6 và Chương 7 (Yêu cầu phi chức năng) để thiết kế bộ kịch bản kiểm thử (Test Case Excel); sử dụng Chương 12 (Ma trận truy vết yêu cầu - RTM) để đảm bảo độ bao phủ kiểm thử đạt $\ge 95\%$; xây dựng bộ Postman Automation Collection với `pm.test` assertions; thực hiện Concurrency Testing với Apache JMeter cho luồng cọc và khóa xe. |
| **Mentor / Scrum Master** | Sử dụng Chương 4 (Product Backlog & Lộ trình Sprint) để điều phối các sự kiện Scrum (Sprint Planning, Daily Standup, Sprint Review, Sprint Retrospective); sử dụng Chương 14 (Tiêu chuẩn & Tiêu chí nghiệm thu) để đánh giá mức độ hoàn thành Definition of Done (DoD) của từng thành viên sau mỗi Sprint. |
| **Hội đồng Đánh giá & Giảng viên (Demo Day)** | Sử dụng Chương 14 (Tiêu chí nghiệm thu) và Chương 4.3 (Definition of Done) để chấm điểm sản phẩm tại buổi nghiệm thu cuối khóa: đánh giá độ trọn vẹn của luồng chính, tính ổn định của hệ thống chạy live trên Cloud, độ bao phủ kiểm thử và năng lực phản biện kỹ thuật độc lập của từng thành viên. |

---

### 1.4. Thuật Ngữ Và Từ Viết Tắt (Definitions & Acronyms)

| Thuật ngữ | Diễn giải chi tiết trong hệ thống DriveShare |
| :--- | :--- |
| **SRS** | Software Requirements Specification — Tài liệu đặc tả yêu cầu phần mềm theo chuẩn IEEE 830 / ISO 29148. |
| **SDS** | Software Design Specification — Tài liệu thiết kế chi tiết kiến trúc, API và cơ sở dữ liệu hệ thống. |
| **SDLC** | Software Development Life Cycle — Vòng đời phát triển phần mềm kết hợp mô hình Agile/Scrum. |
| **Scrum / Sprint** | Khung làm việc phát triển phần mềm linh hoạt; mỗi Sprint là chu kỳ cố định tương ứng với 1 giai đoạn G của khóa học. |
| **P2P Car Rental** | Peer-to-Peer Car Rental — Mô hình chia sẻ xe ô tô ngang hàng giữa các chủ xe cá nhân và khách có nhu cầu thuê. |
| **Escrow** | Escrow Account / Dịch vụ ký quỹ trung gian — Cơ chế sàn DriveShare tạm giữ tiền cọc 30% để đảm bảo an toàn giao dịch. |
| **Soft Lock** | Temporary Schedule Lock — Trạng thái khóa tạm thời khung lịch xe trong 45 phút khi chủ xe duyệt để chờ khách thanh toán. |
| **Hard Lock** | Permanent Schedule Lock — Trạng thái khóa cứng khung lịch xe sau khi giao dịch cọc 30% thành công, chống Overbooking. |
| **VietQR** | Chuẩn thanh toán chuyển khoản liên ngân hàng 24/7 của Napas thông qua mã QR động chứa số tài khoản, số tiền và nội dung đơn. |
| **eKYC** | Electronic Know Your Customer — Quy trình định danh điện tử xác thực khách hàng qua tải ảnh CCCD 2 mặt và GPLX. |
| **Host Screening** | Quy trình thẩm định hồ sơ khách thuê của chủ xe (xem GPLX, lịch sử thuê xe) trước khi quyết định phê duyệt. |
| **Dispute** | Rental Dispute — Tranh chấp/khiếu nại bùng xe phát sinh tại thời điểm bàn giao, do Admin phân xử dựa trên bằng chứng ảnh. |
| **Pessimistic Lock** | Khóa bi quan ở mức CSDL (`@Lock(PESSIMISTIC_WRITE)`) để chống tranh chấp đồng thời (Concurrency / Double Refund). |
| **Token Versioning** | Cơ chế thu hồi phiên JWT Stateless; tự động tăng giá trị `token_version` khi người dùng đổi mật khẩu để vô hiệu hóa token cũ. |
| **RBAC** | Role-Based Access Control — Phân quyền người dùng dựa trên vai trò: `ROLE_CUSTOMER`, `ROLE_CAR_OWNER`, `ROLE_ADMIN`. |
| **RAG** | Retrieval-Augmented Generation — Mô hình ngôn ngữ lớn kết hợp truy xuất kho dữ liệu xe khả dụng thực tế trong CSDL để trợ lý ảo AI tư vấn chuẩn xác. |
| **DoR / DoD** | Definition of Ready / Done — Bộ tiêu chí quy định một User Story được phép đưa vào Sprint / được xem là hoàn thành 100%. |
| **RTM** | Requirement Traceability Matrix — Ma trận truy vết yêu cầu phần mềm phục vụ kiểm thử và nghiệm thu đồ án. |
| **NFR** | Non-Functional Requirement — Các yêu cầu phi chức năng (Hiệu năng, độ tin cậy, bảo mật, tính khả dụng). |
| **GMV** | Gross Merchandise Value — Tổng giá trị giao dịch dịch vụ phát sinh trên toàn nền tảng DriveShare. |

---

### 1.5. Tài Liệu Tham Khảo (References)

1. **IEEE Std 830-1998**: *IEEE Recommended Practice for Software Requirements Specifications* — Viện Kỹ sư Điện & Điện tử Quốc tế.
2. **ISO/IEC/IEEE 29148:2018**: *Systems and software engineering — Life cycle processes — Requirements engineering*.
3. **Scrum Guide (2020)**: *The Definitive Guide to Scrum: The Rules of the Game* — Ken Schwaber & Jeff Sutherland (scrumguides.org).
4. **Khung Chương trình Thực tập Java Web Fullstack (26 buổi học / 6 Sprint)**: Ban Quy chuẩn Đồ án & Thực tập Doanh nghiệp (Khoa CNTT - ITC).
5. **Spring Boot Reference Documentation (v3.3.4)** & **Spring Security 6 Architecture Guide**: [https://docs.spring.io/](https://docs.spring.io/).
6. **Tiêu chuẩn Kỹ thuật thanh toán mã VietQR Napas 247**: Công ty Cổ phần Thanh toán Quốc gia Việt Nam (Napas).
7. **Báo cáo Đặc tả Nghiệp vụ & Đối chuẩn 10 Ứng dụng Car Rental Toàn cầu (Mioto, Turo, Zoomcar, Getaround)**: Tài liệu dự án DriveShare.

---

### 1.6. Quy Trình Phát Triển Áp Dụng — Ánh Xạ SDLC Vào Khung Chương Trình Thực Tập

Dự án **DriveShare** tuân thủ mô hình **Agile/Scrum**, chia thành **6 Sprint** tương ứng với 6 giai đoạn (G1 – G6) trong Khung chương trình thực tập Java Web Fullstack 26 buổi học:

| Giai đoạn chương trình | Tương đương Sprint Scrum | Buổi học áp dụng | Đầu ra kỳ vọng (Deliverables) |
| :--- | :--- | :---: | :--- |
| **G1: Khởi tạo & Phân tích yêu cầu** | **Sprint 0: Discovery & Architecture Design** | Buổi 1 – 5 | • Product Backlog đầy đủ User Story và Acceptance Criteria trên Jira.<br>• Sơ đồ Use Case tổng quan, Sơ đồ State Machine 17 trạng thái.<br>• Sơ đồ CSDL chuẩn hóa 3NF gồm 14 bảng quan hệ.<br>• Script DDL PostgreSQL chạy kiểm thử không lỗi; Cấu hình Git Flow và Definition of Done. |
| **G2: Xây dựng nền tảng & Dịch vụ cốt lõi** | **Sprint 1: Core Foundation & Auth Security** | Buổi 6 – 11 | • **EPIC-AUTH**: Xác thực Spring Security 6 Stateless JWT, Token Versioning thu hồi phiên cũ, mã hóa BCrypt.<br>• **EPIC-USER**: Đăng ký hồ sơ, upload giấy tờ định danh eKYC (CCCD 2 mặt + GPLX) tích hợp Cloudinary CDN.<br>• **EPIC-CAR**: Quản lý hồ sơ xe, cavet/bảo hiểm xe, cần gạt số `ACTIVE` $\leftrightarrow$ `INACTIVE`, duyệt xe Admin.<br>• Bộ Unit Test tầng Service đạt $\ge 60\%$ coverage. |
| **G3: Vòng đời giao dịch & Thanh toán ký quỹ** | **Sprint 2: Booking Lifecycle & Escrow Payment** | Buổi 12 – 16 | • **EPIC-RENTAL**: Luồng đặt xe (Request-to-Book), thẩm định khách thuê (Host Screening), cơ chế Soft Lock 45 phút.<br>• **EPIC-PAYMENT**: Tích hợp cổng thanh toán VietQR Napas 247 sinh mã QR cọc đúng 30%, cơ chế Hard Lock.<br>• **Scheduler**: `RentalExpirationScheduler` quét định kỳ mỗi 5 phút tự động hủy đơn quá hạn 45 phút.<br>• Frontend Web tích hợp trọn vẹn luồng Đăng nhập $\rightarrow$ Đặt xe $\rightarrow$ Quét mã VietQR. |
| **G4: Bàn giao, Vận hành & Phân xử tranh chấp** | **Sprint 3: Handover, Disputes & AI Advisor** | Buổi 17 – 20 | • **EPIC-HANDOVER**: Biên bản giao nhận xe kỹ thuật số (Check-in/Check-out) đối soát ODO, xăng và hư hại.<br>• **EPIC-DISPUTE**: Luồng khiếu nại No-Show, áp dụng khóa bi quan `@Lock(PESSIMISTIC_WRITE)` chống Double Refund, hoàn 100% cọc Escrow cho khách và phạt 500k chủ xe vi phạm.<br>• **EPIC-WALLET**: Phân chia dòng tiền 90% ví chủ xe và 10% hoa hồng sàn.<br>• **EPIC-AI**: Trợ lý ảo AI Assistant (RAG Gemini + Regex Tiếng Việt) tư vấn xe tự nhiên. |
| **G5: Kiểm thử tự động & Đảm bảo chất lượng** | **Sprint 4: Verification & Concurrency QA** | Buổi 21 – 23 | • Đạt bộ Unit & Integration Test **186/186 Tests Pass 100%**.<br>• Bộ Test Case Excel bao phủ $\ge 95\%$ yêu cầu chức năng (RTM).<br>• Kiểm thử đồng thời (Concurrency Test) chứng minh không xảy ra Double Booking / Double Refund.<br>• Postman Automation Collection kiểm thử toàn bộ REST API. |
| **G6: Triển khai Cloud & Nghiệm thu tốt nghiệp** | **Sprint Release: Cloud DevOps & Demo Day** | Buổi 24 – 26 | • Đóng gói Dockerfile multi-stage tối ưu bộ nhớ JVM `<512MB RAM`, cấu hình `render.yaml` Blueprint.<br>• Triển khai live thành công trên **Render Cloud Platform** (Backend, Database, Frontend).<br>• Hoàn thiện Slide thuyết trình 15 phút, Video demo và Báo cáo đồ án tốt nghiệp chuẩn IEEE 830.<br>• Tham gia bảo vệ và phản biện trước Hội đồng đánh giá (Demo Day). |

---

### 1.7. Phạm Vi Loại Trừ (Out of Scope) & Định Hướng Mở Rộng (Stretch Goals)

Nhằm đảm bảo tính khả thi, chất lượng mã nguồn cao và hoàn thành đúng tiến độ trong thời gian thực tập 6 tuần, nhóm xác định rõ các ranh giới:

#### ❌ Các hạng mục loại trừ khỏi phạm vi hiện tại (Out of Scope):
1. **Lắp đặt thiết bị định vị GPS / Hộp đen IoT thực tế trên xe**: Do chi phí phần cứng và điều kiện xe cá nhân, hệ thống mô phỏng việc giám sát hành trình thông qua việc chụp ảnh ODO và ghi nhận vạch nhiên liệu tại 2 biên bản điện tử Check-in và Check-out.
2. **Cổng thanh toán thẻ tín dụng quốc tế Visa/Mastercard**: Việc tích hợp thẻ quốc tế đòi hỏi chứng chỉ bảo mật PCI-DSS khắt khe và chi phí cổng cao. Hệ thống tập trung tối ưu vào chuẩn **VietQR Napas 247**, vừa sát với hành vi người dùng Việt Nam vừa miễn phí giao dịch.
3. **Tổng đài gọi thoại trực tiếp qua giao thức VoIP/WebRTC**: Hệ thống ưu tiên phương thức liên lạc qua Số điện thoại đã định danh và thông báo tự động (Notification/Email).

#### 🚀 Các định hướng mở rộng (Stretch Goals) cho giai đoạn phát triển tiếp theo:
1. **Tự động hóa eKYC bằng Trí tuệ Nhân tạo (AI OCR)**: Tích hợp công nghệ nhận diện quang học (Optical Character Recognition) để tự động đọc và trích xuất họ tên, số thẻ từ ảnh CCCD 2 mặt, giảm thiểu tối đa thao tác nhập liệu của người dùng.
2. **Dịch vụ Tra cứu Tài khoản Ngân hàng tự động (Napas 247 Lookup API)**: Tự động xác thực số tài khoản chủ xe và đối soát tên chủ thẻ ngân hàng với tên trên CCCD qua cổng Napas trước khi kích hoạt ví rút tiền.
3. **Mở rộng tính năng thuê xe kèm tài xế (Chauffeur Service)**: Bổ sung biểu phí phụ thu tài xế theo ngày và quản lý hồ sơ tài xế riêng biệt.

---

# CHƯƠNG 2: MÔ TẢ TỔNG QUAN HỆ THỐNG (OVERALL DESCRIPTION)
*(Khung sườn đặc tả chuẩn mực — Sẵn sàng điền nội dung chi tiết theo định hướng DriveShare)*

### 2.1. Bối Cảnh Sản Phẩm (Product Perspective)
* **Vị trí hệ thống:** Hệ thống độc lập (Standalone P2P Car Rental System), tích hợp dịch vụ lưu trữ media đám mây (Cloudinary CDN), cổng chuyển khoản quốc gia (VietQR Napas 247) và mô hình ngôn ngữ lớn (Google Gemini LLM).
* **Mô hình kiến trúc triển khai:** Client-Server phân tán gồm Frontend Web (HTML/JS/Bootstrap 5), Backend REST API (Spring Boot 3) và CSDL quan hệ PostgreSQL 16.

### 2.2. Đối Tượng Người Dùng & Đặc Điểm Sử Dụng (User Classes & Characteristics)
| Nhóm người dùng | Đặc điểm kỹ năng & Môi trường sử dụng | Thiết bị chính | Tần suất sử dụng |
| :--- | :--- | :--- | :--- |
| **Khách thuê xe (Customer / Renter)** | Người dùng đại chúng có bằng lái xe B1/B2, thao tác tìm kiếm xe, quét mã QR thanh toán trên điện thoại. | Smartphone / Tablet | Định kỳ khi có nhu cầu du lịch, công tác |
| **Chủ sở hữu xe (Car Owner)** | Cá nhân có ô tô nhàn rỗi, cần giao diện trực quan để quản lý xe, duyệt khách và theo dõi ví doanh thu. | Laptop / Desktop / Mobile | Hàng ngày để kiểm tra đơn đặt xe |
| **Quản trị viên sàn (Admin / Operator)** | Nhân sự vận hành sàn, có nghiệp vụ thẩm định hồ sơ pháp lý xe, eKYC và đóng vai trò trọng tài xử lý khiếu nại. | Desktop chuyên dụng | Liên tục trong giờ hành chính |

### 2.3. Ràng Buộc Thiết Kế & Công Nghệ (Design & Implementation Constraints)
* **Backend:** Bắt buộc Java 17+, Spring Boot 3.3.4, Spring Security 6, Spring Data JPA, Hibernate.
* **Frontend:** Bắt buộc chuẩn hóa Vanilla HTML5/CSS3/JavaScript, Bootstrap 5, không phụ thuộc nặng nề vào các framework phức tạp khó chuyển giao.
* **Database:** PostgreSQL 16 chạy trên Docker local và Render Managed Database trên Cloud.
* **Chuẩn giao tiếp:** JSON RESTful API bọc trong `ApiResponse<T>`, mã lỗi định danh `ErrorCode`.

### 2.4. Giả Định Và Phụ Thuộc (Assumptions & Dependencies)
* Hệ thống máy chủ mạng có kết nối Internet ổn định để truy vấn API Cloudinary và VietQR.
* Chủ xe và khách thuê tự thỏa thuận chi phí cọc bảo đảm tài sản vật chất (xe) hoặc giữ giấy tờ gốc khi nhận xe thực tế.

---

# CHƯƠNG 3: TÁC NHÂN HỆ THỐNG (ACTORS)
*(Khung sườn đặc tả chuẩn mực)*

### 3.1. Danh Mục Tác Nhân Hệ Thống
| Tác nhân (Actor) | Mã quyền (Role Code) | Mô tả vai trò nghiệp vụ chính |
| :--- | :--- | :--- |
| **Khách thuê xe (Renter)** | `ROLE_CUSTOMER` | Tìm xe, chat với AI, nộp hồ sơ eKYC, đặt xe, quét VietQR cọc 30%, nhận xe, khiếu nại và đánh giá. |
| **Chủ xe (Car Owner)** | `ROLE_CAR_OWNER` | Đăng ký xe, gạt nút ACTIVE/INACTIVE, thẩm định duyệt đơn thuê, bàn giao xe, nhận 90% doanh thu vào ví. |
| **Quản trị viên (Admin)** | `ROLE_ADMIN` | Duyệt xe mới, xác thực eKYC, làm trọng tài phán quyết khiếu nại bùng xe, hoàn cọc và xử phạt vi phạm. |
| **Tiến trình ngầm (System Scheduler)** | `SYSTEM` | Chạy nền định kỳ mỗi 5 phút quét và hủy đơn thuê quá hạn 45 phút chưa thanh toán cọc (`Soft Lock Release`). |

### 3.2. Ma Trận Phân Quyền Tác Nhân (Actor Privilege Matrix)
*(Khung bảng phân quyền CRUD trên các tài nguyên cốt lõi: Xe, Đơn thuê, Thanh toán, Khiếu nại, Ví).*

---

# CHƯƠNG 4: PRODUCT BACKLOG VÀ LỘ TRÌNH SPRINT (BACKLOG & SPRINT ROADMAP)
*(Khung sườn đặc tả chuẩn mực)*

### 4.1. Nguyên Tắc Ánh Xạ
Ánh xạ toàn bộ User Stories vào 6 giai đoạn phát triển theo Khung chương trình thực tập 26 buổi học (Sprint 0 đến Sprint Release).

### 4.2. Bảng Sprint Roadmap (Chi Tiết Theo 26 Buổi Học)
| Sprint | Buổi học | Mục tiêu chính & Sự kiện Scrum | Output bàn giao bắt buộc |
| :---: | :---: | :--- | :--- |
| **Sprint 0** | Buổi 1 – 5 | Kickoff, phân tích yêu cầu, thiết kế ERD 14 bảng, Wireframe UI | Product Backlog Jira, DDL SQL, Sơ đồ Use Case & ERD |
| **Sprint 1** | Buổi 6 – 11 | Kiến trúc JWT Stateless, RBAC, eKYC Cloudinary, CRUD Xe | API Auth, API Car, Unit test Service >= 60% |
| **Sprint 2** | Buổi 12 – 16 | Booking Lifecycle, Soft Lock 45p, VietQR Napas cọc 30%, Hard Lock | Luồng Đặt xe -> Quét QR cọc thành công |
| **Sprint 3** | Buổi 17 – 20 | Handover Check-in/out, Khiếu nại Dispute (@Lock), Ví chủ xe 90%, AI Assistant | Luồng Bàn giao, Luồng hoàn cọc 100% & AI Chatbot |
| **Sprint 4** | Buổi 21 – 23 | Kiểm thử toàn diện: 186 Unit tests, JMeter Concurrency Test, RTM | Báo cáo kiểm thử tự động, Postman Collection |
| **Sprint Release** | Buổi 24 – 26 | Đóng gói Docker multi-stage, Deploy Render Cloud, Demo Day | Website live trên Render, Slide thuyết trình, Video demo |

### 4.3. Định Nghĩa Sẵn Sàng & Hoàn Tất (Definition of Ready / Done)
* **Definition of Ready (DoR):** Cú pháp chuẩn `As a [Role], I want [Action] so that [Benefit]`, kèm Acceptance Criteria `Given-When-Then`.
* **Definition of Done (DoD):** Merge nhánh develop qua PR có review, Pass 100% Unit Tests, API đạt chuẩn `ApiResponse<T>`, giao diện chuẩn Responsive.

---

# CHƯƠNG 5: YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS)
*(Khung sườn đặc tả chuẩn mực gồm 10 EPIC nghiệp vụ của DriveShare)*

* **5.1. EPIC-AUTH — Xác thực & Quản lý tài khoản:** Đăng ký, Đăng nhập JWT, Đổi mật khẩu tăng `token_version`, Đăng nhập Google OAuth2.
* **5.2. EPIC-USER — Hồ sơ người dùng & Định danh eKYC:** Quản lý thông tin cá nhân, Tải ảnh CCCD 2 mặt & GPLX lên Cloudinary.
* **5.3. EPIC-CAR — Quản lý phương tiện & Trạng thái xe:** Đăng ký xe, tải cavet/bảo hiểm, cần gạt bật/tắt nhận khách `ACTIVE`/`INACTIVE`.
* **5.4. EPIC-RENTAL — Vòng đời giao dịch đặt xe (Booking Lifecycle):** Tạo yêu cầu đặt xe, thẩm định khách thuê (Host Screening), cơ chế Soft Lock 45 phút.
* **5.5. EPIC-PAYMENT — Cổng thanh toán VietQR & Ký quỹ Escrow 30%:** Sinh mã VietQR động đúng 30% giá trị, cơ chế Hard Lock lịch xe.
* **5.6. EPIC-HANDOVER — Biên bản bàn giao kỹ thuật số:** Check-in ghi nhận ODO/nhiên liệu trước khi đi; Check-out đối soát hư hại và tất toán 70% còn lại.
* **5.7. EPIC-DISPUTE — Phân xử khiếu nại & Hoàn tiền cọc:** Báo cáo sự cố bùng xe, khóa bi quan `@Lock(PESSIMISTIC_WRITE)`, hoàn 100% cọc và phạt chủ xe 500k.
* **5.8. EPIC-WALLET — Quản lý Ví doanh thu chủ xe:** Tự động cộng 90% giá trị hợp đồng vào ví sau khi trừ 10% phí sàn, lệnh rút tiền về ngân hàng.
* **5.9. EPIC-AI — Trợ lý ảo AI Assistant tư vấn xe thông minh:** Chatbot tư vấn lộ trình và gợi ý xe có thật trong Database theo kiến trúc RAG.
* **5.10. EPIC-ADMIN — Bảng điều khiển quản trị & Báo cáo:** Quản trị người dùng, duyệt xe, phân xử khiếu nại, thống kê doanh thu GMV toàn sàn.

---

# CHƯƠNG 6: ĐẶC TẢ USE CASE CHI TIẾT (DETAILED USE CASE SPECIFICATION)
*(Khung sườn đặc tả chuẩn mực)*

* **6.0. Sơ đồ Use Case tổng quan (UML Use Case Diagram):** Phân chia theo 3 tác nhân chính Renter, Owner, Admin.
* **6.1. UC-AUTH-001: Đăng ký, Đăng nhập & Xác thực JWT Stateless:** Luồng chính, luồng thay thế và điều kiện tiên quyết.
* **6.2. UC-BOOK-002: Đặt lịch thuê xe & Thanh toán cọc giữ chỗ VietQR Escrow 30%:** Máy trạng thái từ PENDING đến CONFIRMED.
* **6.3. UC-CAR-003: Đăng ký xe mới & Cần gạt bật/tắt nhận khách (ACTIVE/INACTIVE):** Quy trình kiểm duyệt và xuất bản xe.
* **6.4. UC-HANDOVER-004: Biên bản giao nhận xe Check-in và nghiệm thu Check-out:** Ghi nhận hiện trạng ODO và mức xăng/pin.
* **6.5. UC-DISPUTE-005: Khởi tạo khiếu nại bùng hẹn & Phân xử cưỡng chế bằng khóa bi quan:** Trọng tài Admin cưỡng chế hoàn cọc 100% (570.000 đ) và phạt chủ xe 500.000 đ.

---

# CHƯƠNG 7: YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)
*(Khung sườn đặc tả chuẩn mực)*

| Mã NFR | Hạng mục | Yêu cầu định lượng & Tiêu chí đo lường | Công cụ kiểm chứng |
| :--- | :--- | :--- | :--- |
| **NFR-PERF-01** | Thời gian phản hồi API | Thời gian đáp ứng P95 < 1000ms đối với toàn bộ các endpoint tra cứu xe và đặt lịch. | Postman / JMeter |
| **NFR-PERF-02** | Khả năng chịu tải đồng thời | Xử lý đồng thời 50-100 người dùng thực hiện tạo đơn và thanh toán cọc không bị lỗi trùng lịch (Double Booking). | Apache JMeter |
| **NFR-SEC-01** | Tiêu chuẩn mã hóa mật khẩu | Mật khẩu người dùng được băm một chiều bằng thuật toán BCrypt với Work Factor = 10. | Spring Security |
| **NFR-SEC-02** | An toàn phiên làm việc | JWT sử dụng thuật toán HMAC-SHA256, thời hạn 24 giờ, hỗ trợ thu hồi tức thì qua `token_version`. | JJWT 0.12.6 |
| **NFR-REL-01** | Tính toàn vẹn giao dịch | Toàn bộ giao dịch giải ngân ví và hoàn cọc bắt buộc chạy trong `@Transactional` cô lập ACID. | Spring Data JPA |
| **NFR-USA-01** | Tính tương thích giao diện | Giao diện tương thích 100% trên các kích thước màn hình phổ biến: Mobile (375px+), Desktop (1200px+). | Chrome DevTools |

---

# CHƯƠNG 8: KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)
*(Khung sườn đặc tả chuẩn mực)*

* **8.1. Mô hình kiến trúc đa tầng (Layered Architecture):** Presentation Layer (Controllers) $\rightarrow$ Business Logic Layer (Services) $\rightarrow$ Data Access Layer (Repositories) $\rightarrow$ Database (PostgreSQL).
* **8.2. Cơ chế bảo mật — JWT Authentication Filter & Token Versioning:** Quy trình trích xuất Header Authorization, xác thực chữ ký số và so khớp `token_version`.
* **8.3. Cơ chế kiểm soát đồng thời & Ký quỹ:** 
  * *Two-Phase Locking (2PL):* Khóa mềm Soft Lock 45 phút $\rightarrow$ Khóa cứng Hard Lock sau thanh toán cọc 30%.
  * *Pessimistic Locking:* `@Lock(PESSIMISTIC_WRITE)` trên bảng `rental_disputes` đảm bảo tính duy nhất khi Admin giải quyết khiếu nại.
* **8.4. Sơ đồ triển khai hệ thống (Cloud Deployment View on Render):** Docker Multi-stage Container, kết nối Render Managed PostgreSQL và Cloudinary CDN.

---

# CHƯƠNG 9: THIẾT KẾ UI/UX VÀ WIREFRAME MÀN HÌNH (UI/UX & WIREFRAME DESIGN)
*(Khung sườn đặc tả chuẩn mực)*

* **9.1. Nguyên tắc thiết kế UI/UX áp dụng:** Thiết kế hiện đại, bảng màu trực quan, tối ưu cho thao tác một tay trên Mobile và bảng điều khiển trực quan trên Desktop.
* **9.2. Wireframe luồng màn hình Khách thuê (Mobile):** Trang chủ, Chi tiết xe, Modal đặt xe, Trang thanh toán VietQR cọc 30%, Lịch sử chuyến đi.
* **9.3. Wireframe màn hình Chủ xe & Quản trị viên (Desktop):** Quản lý xe, Cần gạt ACTIVE/INACTIVE, Phê duyệt đơn thuê, Ví thu nhập 90%, Bảng điều khiển phân xử khiếu nại Admin.
* **9.4. Sơ đồ luồng chuyển màn hình (Screen Flow Diagram):** Ánh xạ từ lúc đăng nhập đến hoàn tất hành trình.

---

# CHƯƠNG 10: ĐẶC TẢ GIAO DIỆN LẬP TRÌNH ỨNG DỤNG (RESTFUL API SPECIFICATION)
*(Khung sườn đặc tả chuẩn mực gồm 24+ REST API bọc trong ApiResponse<T>)*

* **10.1. Quy chuẩn thiết kế RESTful & Định dạng bọc dữ liệu ApiResponse<T>:** Cấu trúc chuẩn `{ code, message, data, timestamp }`.
* **10.2. Nhóm API Xác thực & Hồ sơ:** `/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/users/profile`, `/api/v1/users/profile/ekyc`.
* **10.3. Nhóm API Phương tiện & Công khai:** `/api/v1/public/cars/search`, `/api/v1/cars`, `/api/v1/cars/{id}/status`.
* **10.4. Nhóm API Đơn thuê & Thanh toán:** `/api/v1/rentals`, `/api/v1/rentals/{id}/approve`, `/api/v1/payments/generate-qr`.
* **10.5. Nhóm API Bàn giao, Khiếu nại & Ví:** `/api/v1/rentals/{id}/check-in`, `/api/v1/rentals/{id}/dispute`, `/api/v1/admin/rentals/disputes/{id}/resolve`, `/api/v1/owner/wallets`.
* **10.6. Nhóm API Trợ lý ảo AI Assistant:** `/api/v1/chat` (tích hợp RAG tư vấn xe).

---

# CHƯƠNG 11: THIẾT KẾ CHI TIẾT CƠ SỞ DỮ LIỆU (DATABASE DESIGN)
*(Khung sườn đặc tả chuẩn mực)*

* **11.0. Sơ đồ thực thể quan hệ tổng quan (ERD Diagram - 14 Tables 3NF):** Chuẩn hóa loại bỏ trùng lặp dữ liệu.
* **11.1. Từ điển dữ liệu chi tiết 14 bảng (Data Dictionary):**
  1. `users`: Tài khoản người dùng gốc & `token_version`.
  2. `roles`: Danh mục vai trò hệ thống (`ROLE_CUSTOMER`, `ROLE_CAR_OWNER`, `ROLE_ADMIN`).
  3. `user_roles`: Bảng kết nối quan hệ nhiều-nhiều người dùng - vai trò.
  4. `user_profiles`: Hồ sơ cá nhân, ảnh CCCD 2 mặt & giấy phép lái xe eKYC.
  5. `cars`: Thông tin phương tiện, trạng thái duyệt và cần gạt `ACTIVE`/`INACTIVE`.
  6. `car_photos`: Bộ sưu tập ảnh xe lưu trữ trên Cloudinary.
  7. `car_pricing`: Cấu hình giá thuê theo ngày, phụ phí quá giờ và tiền cọc.
  8. `rentals`: Giao dịch thuê xe, ngày giờ nhận/trả và máy trạng thái 17 bước.
  9. `rental_payments`: Nhật ký thanh toán cọc 30% qua VietQR Napas 247.
  10. `rental_handovers`: Biên bản bàn giao kỹ thuật số Check-in và Check-out (ODO, xăng/pin).
  11. `rental_disputes`: Hồ sơ khiếu nại bùng xe, ảnh chứng cứ và phán quyết Admin.
  12. `owner_wallets`: Ví thu nhập của chủ xe lưu trữ số dư khả dụng (90% hợp đồng).
  13. `wallet_transactions`: Lịch sử biến động số dư ví (Cộng tiền chuyến đi, Rút tiền).
  14. `chat_memory`: Lịch sử hội thoại thời gian thực giữa người dùng và Trợ lý ảo AI.
* **11.2. Chiến lược Indexing và Ràng buộc toàn vẹn dữ liệu:** Tạo B-Tree Index trên các cột tìm kiếm thường xuyên (`email`, `status`, `car_id`, `rental_id`).

---

# CHƯƠNG 12: MA TRẬN TRUY VẾT YÊU CẦU (REQUIREMENT TRACEABILITY MATRIX - RTM)
*(Khung sườn đặc tả chuẩn mực)*

* **12.1. Cấu trúc ma trận truy vết:** Đảm bảo 100% User Stories đều có Use Case, API, Bảng dữ liệu và Test Case tương ứng.
* **12.2. Bảng RTM ánh xạ:**
  * Mã Yêu Cầu $\leftrightarrow$ Mã Use Case $\leftrightarrow$ REST API Endpoint $\leftrightarrow$ Bảng CSDL $\leftrightarrow$ Mã Test Case (TC-xxx).

---

# CHƯƠNG 13: PHÂN CHIA CÔNG VIỆC VÀ CHIẾN LƯỢC KIỂM THỬ (TASK ALLOCATION & TEST STRATEGY)
*(Khung sườn đặc tả chuẩn mực)*

### 13.1. Ma Trận Phân Công Trách Nhiệm Nhóm K4 PRO (RACI Matrix)
| Thành viên | Vai trò chính | Phân hệ phụ trách | Trách nhiệm Deliverables |
| :--- | :--- | :--- | :--- |
| **Nguyễn Duy Bảo** | Tech Lead & DB Architect | Core Architecture, Scheduler & DB | Thiết kế ERD 14 bảng, Soft/Hard Lock, Code Review, CI/CD |
| **Chí Tín** | Frontend Lead | UI/UX Web Portal & AI Widget | Thiết kế giao diện Bootstrap 5, tích hợp API, Widget Chat AI |
| **Lâm Chí Vĩ** | Backend Developer | Authentication & Security JWT | Triển khai Spring Security 6, JWT Filter, Token Versioning |
| **Lộc Khiêm** | Backend Developer | Admin Portal, Dispute & DevOps | Quản trị xe/eKYC, Xử lý khiếu nại `@Lock`, Dockerfile & Render |
| **Duy Quân** | Backend Developer | Profile, eKYC & Media CDN | Quản lý Profile, Tích hợp Cloudinary CDN upload CCCD/GPLX |
| **Phát** | Backend Developer | OAuth2 & Search Specification | Đăng nhập Google OAuth2, Bộ lọc tìm kiếm xe động |

### 13.2. Chiến Lược Kiểm Thử Theo Cấp Độ
* **Cấp độ 1 — Unit Testing:** Viết bài kiểm thử độc lập cho toàn bộ Service methods (Đạt 186/186 tests).
* **Cấp độ 2 — Integration Testing:** Kiểm thử tích hợp luồng DB với MockMvc và H2/PostgreSQL.
* **Cấp độ 3 — Concurrency Testing:** Sử dụng Apache JMeter mô phỏng 50 yêu cầu đồng thời kiểm tra cơ chế chống Overbooking và chống Double Refund.
* **Cấp độ 4 — End-to-End Testing (E2E):** Kiểm thử luồng nghiệp vụ hoàn chỉnh trên trình duyệt qua kịch bản tự động.

---

# CHƯƠNG 14: TIÊU CHUẨN VÀ TIÊU CHÍ NGHIỆM THU (ACCEPTANCE & GRADING CRITERIA)
*(Khung sườn đặc tả chuẩn mực)*

* **14.1. Tiêu chí dành cho Developer:** Tuân thủ Controller mỏng, DTO Records, không lỗi sonar/checkstyle, Pass 100% unit tests.
* **14.2. Tiêu chí dành cho Tester:** File kịch bản Test Case Excel đầy đủ, độ bao phủ RTM $\ge 95\%$, bộ Postman Collection có assertion tự động.
* **14.3. Tiêu chí nghiệm thu cấp Sprint:** Hoàn thành toàn bộ User Story thuộc nhóm 'Must have' của từng Sprint.
* **14.4. Tiêu chí đánh giá Demo Day tốt nghiệp:** 
  * Cấu trúc bài thuyết trình 15 phút (Slide tổng quan, Kiến trúc, Live Demo web chạy thực tế, Phản biện hội đồng).
  * Ổn định của hệ thống trên Cloud Render.
  * Khả năng trả lời và phản biện độc lập của từng thành viên trong nhóm.

---

# CHƯƠNG 15: QUẢN TRỊ RỦI RO (RISK MANAGEMENT)
*(Khung sườn đặc tả chuẩn mực)*

| STT | Rủi ro nhận diện | Khả năng | Ảnh hưởng | Biện pháp giảm thiểu & Kiểm soát |
| :---: | :--- | :---: | :---: | :--- |
| **R01** | Trùng lịch xe khi nhiều người cùng đặt (Overbooking) | Trung bình | Rất cao | Áp dụng khóa 2 giai đoạn: Soft Lock 45 phút và Hard Lock ngay khi nhận cọc 30%. |
| **R02** | Xử lý hoàn tiền khiếu nại trùng lặp (Double Refund) | Thấp | Rất cao | Sử dụng khóa bi quan `@Lock(PESSIMISTIC_WRITE)` trên bảng `rental_disputes` tại mức CSDL. |
| **R03** | Máy chủ Cloud Render miễn phí bị sleep sau 15p không dùng | Cao | Trung bình | Thiết lập cronjob ping định kỳ hoặc khởi động trước 5 phút trước giờ báo cáo Demo Day. |
| **R04** | Người dùng tải lên tệp ảnh dung lượng quá lớn làm nghẽn server | Trung bình | Trung bình | Giới hạn dung lượng upload tối đa 5MB, kiểm tra định dạng ảnh và đẩy trực tiếp lên Cloudinary. |
| **R05** | Khách thuê không thanh toán cọc làm giữ xe của chủ | Cao | Cao | `RentalExpirationScheduler` quét mỗi 5 phút tự động hủy đơn và giải phóng Soft Lock nếu quá 45 phút. |

---

# PHỤ LỤC (APPENDIX)
*(Khung sườn đặc tả chuẩn mực)*

* **Phụ lục A: Checklist các sự kiện Scrum theo 26 buổi học:** Ghi nhận biên bản họp Sprint Planning, Daily Standup và Sprint Retrospective.
* **Phụ lục B: Liên kết hồ sơ tốt nghiệp & Bằng chứng kiểm thử:** Liên kết mã nguồn GitHub, Link website demo live trên Render, Báo cáo kết quả kiểm thử 186 bài Unit test.
"""

def set_cell_background(cell, fill_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=70, bottom=70, left=100, right=100):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, color="B0C4DE"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="single" w:sz="6" w:space="0" w:color="1F497D"/>
            <w:bottom w:val="single" w:sz="6" w:space="0" w:color="1F497D"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="{color}"/>
            <w:insideV w:val="single" w:sz="4" w:space="0" w:color="{color}"/>
            <w:left w:val="single" w:sz="4" w:space="0" w:color="{color}"/>
            <w:right w:val="single" w:sz="4" w:space="0" w:color="{color}"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders)

def style_header_cell(cell, text, width):
    cell.width = width
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.space_before = Pt(2)
    r = p.add_run(text)
    r.font.name = 'Times New Roman'
    r.font.bold = True
    r.font.size = Pt(10)
    r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    set_cell_background(cell, "1F497D")
    set_cell_margins(cell, 70, 70, 90, 90)

def style_data_cell(cell, text, width, is_bold=False, bg="FFFFFF"):
    cell.width = width
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.space_before = Pt(2)
    r = p.add_run(text)
    r.font.name = 'Times New Roman'
    r.font.bold = is_bold
    r.font.size = Pt(9.5)
    r.font.color.rgb = RGBColor(0x22, 0x22, 0x22)
    set_cell_background(cell, bg)
    set_cell_margins(cell, 60, 60, 80, 80)

def add_styled_heading(doc, text, level):
    p = doc.add_paragraph()
    r = p.add_run(text)
    r.font.name = 'Times New Roman'
    r.font.bold = True
    if level == 1:
        r.font.size = Pt(13.5)
        r.font.color.rgb = RGBColor(0x1F, 0x49, 0x7D)
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
    elif level == 2:
        r.font.size = Pt(11.5)
        r.font.color.rgb = RGBColor(0x1F, 0x49, 0x7D)
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)
    elif level == 3:
        r.font.size = Pt(10.5)
        r.font.color.rgb = RGBColor(0x33, 0x33, 0x33)
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(2)
    return p

def generate_master_docx(docx_path):
    doc = Document()
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)

    style = doc.styles['Normal']
    font = style.font
    font.name = 'Times New Roman'
    font.size = Pt(10.5)
    font.color.rgb = RGBColor(0x22, 0x22, 0x22)
    style.paragraph_format.line_spacing = 1.18
    style.paragraph_format.space_after = Pt(3)

    # 1. HEADER & COVER METADATA
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_inst = p_inst.add_run("Áp dụng chuẩn IEEE Std 830-1998 / ISO/IEC/IEEE 29148:2018 / Khung Agile Scrum\n")
    r_inst.font.size = Pt(9.5)
    r_inst.font.italic = True
    r_inst.font.color.rgb = RGBColor(0x55, 0x55, 0x55)

    r_uni = p_inst.add_run("BÁO CÁO THỰC TẬP TỐT NGHIỆP / ĐỒ ÁN PHÁT TRIỂN PHẦN MỀM (K4)\n")
    r_uni.font.size = Pt(11)
    r_uni.font.bold = True
    r_uni.font.color.rgb = RGBColor(0x33, 0x33, 0x33)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = p_title.add_run("TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) & THIẾT KẾ HỆ THỐNG (SDS)")
    r_title.font.size = Pt(15)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0x1F, 0x49, 0x7D)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = p_sub.add_run("DỰ ÁN: NỀN TẢNG CHIA SẺ VÀ CHO THUÊ XE TỰ LÁI P2P (DRIVESHARE)\n")
    r_sub.font.size = Pt(12)
    r_sub.font.bold = True
    r_sub.font.color.rgb = RGBColor(0x1F, 0x49, 0x7D)
    
    r_desc = p_sub.add_run("TÍCH HỢP TRỢ LÝ ẢO AI ASSISTANT & CƠ CHẾ KÝ QUỸ ĐẶT CỌC VIETQR ESCROW (30%)")
    r_desc.font.size = Pt(10)
    r_desc.font.italic = True
    r_desc.font.color.rgb = RGBColor(0x44, 0x44, 0x44)

    # TABLE 0: THUỘC TÍNH TÀI LIỆU
    t0_data = [
        ("Mã tài liệu", "SDLC-SRS-DRIVESHARE-2026-V2.0"),
        ("Phiên bản hiện hành", "2.0 (Chuẩn hóa toàn diện Khung 15 Chương theo benchmark Doc_ITC.docx)"),
        ("Quy chuẩn áp dụng", "IEEE Std 830-1998; ISO/IEC/IEEE 29148:2018; quy trình Scrum (Scrum Guide)"),
        ("Phạm vi triển khai", "Chương trình đào tạo thực tập sinh Java Web Fullstack (26 buổi học / 6 Sprint)"),
        ("Đơn vị phát hành", "Nhóm phát triển DriveShare (K4 PRO) & Ban Quy chuẩn Đồ án Thực tập Doanh nghiệp"),
        ("Nhóm tác giả (K4 PRO)", "Nguyễn Duy Bảo (Lead), Chí Tín, Lâm Chí Vĩ, Lộc Khiêm, Duy Quân, Phát"),
        ("Đối tượng sử dụng", "Thực tập sinh Developer, Thực tập sinh Tester, Mentor/Scrum Master, Hội đồng nghiệm thu")
    ]
    t0 = doc.add_table(rows=len(t0_data) + 1, cols=2)
    t0.alignment = WD_TABLE_ALIGNMENT.CENTER
    t0.autofit = False
    style_header_cell(t0.rows[0].cells[0], "Thuộc tính tài liệu", Inches(2.2))
    style_header_cell(t0.rows[0].cells[1], "Giá trị đặc tả", Inches(4.5))
    for r_idx, (k, v) in enumerate(t0_data):
        row = t0.rows[r_idx + 1]
        bg = "FFFFFF" if r_idx % 2 == 0 else "F9FBFD"
        style_data_cell(row.cells[0], k, Inches(2.2), is_bold=True, bg="F0F4F8")
        style_data_cell(row.cells[1], v, Inches(4.5), is_bold=False, bg=bg)
    set_table_borders(t0)
    doc.add_paragraph()

    # TABLE 1: CHANGE LOG
    add_styled_heading(doc, "Lịch sử cập nhật tài liệu (Change Log)", 2)
    t1_headers = ["Phiên bản", "Ngày", "Nội dung thay đổi chính", "Người soạn"]
    t1_widths = [Inches(1.0), Inches(1.1), Inches(3.6), Inches(1.0)]
    t1_data = [
        ("1.0", "15/09/2026", "Bản đặc tả SRS sơ bộ ban đầu, 1 use case cơ bản và 3 bảng CSDL mẫu.", "Nhóm DriveShare"),
        ("2.0", "24/10/2026", "Cấu trúc lại toàn bộ theo chuẩn ISO/IEC/IEEE 29148 và Doc_ITC.docx: Xây dựng trọn vẹn khung sườn 15 Chương và 2 Phụ lục; hoàn thiện 100% Chương 1; chuẩn bị đầy đủ khung sườn đặc tả Chương 2 đến 15.", "Toàn nhóm K4 PRO")
    ]
    t1 = doc.add_table(rows=len(t1_data) + 1, cols=4)
    t1.alignment = WD_TABLE_ALIGNMENT.CENTER
    t1.autofit = False
    for c_i, h_text in enumerate(t1_headers):
        style_header_cell(t1.rows[0].cells[c_i], h_text, t1_widths[c_i])
    for r_i, row_data in enumerate(t1_data):
        row = t1.rows[r_i + 1]
        bg = "FFFFFF" if r_i % 2 == 0 else "F9FBFD"
        for c_i, val in enumerate(row_data):
            style_data_cell(row.cells[c_i], val, t1_widths[c_i], is_bold=(c_i==0), bg=bg)
    set_table_borders(t1)
    doc.add_paragraph()

    # TABLE OF CONTENTS SUMMARY
    add_styled_heading(doc, "MỤC LỤC TỔNG THỂ TÀI LIỆU (15 CHƯƠNG & PHỤ LỤC)", 1)
    toc_items = [
        "CHƯƠNG 1: GIỚI THIỆU TỔNG QUAN (INTRODUCTION) — [ĐÃ HOÀN TẤT CHI TIẾT 100%]",
        "CHƯƠNG 2: MÔ TẢ TỔNG QUAN HỆ THỐNG (OVERALL DESCRIPTION) — [SƯỜN ĐẶC TẢ]",
        "CHƯƠNG 3: TÁC NHÂN HỆ THỐNG (ACTORS) — [SƯỜN ĐẶC TẢ]",
        "CHƯƠNG 4: PRODUCT BACKLOG VÀ LỘ TRÌNH SPRINT (BACKLOG & SPRINT ROADMAP) — [SƯỜN ĐẶC TẢ]",
        "CHƯƠNG 5: YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) — [SƯỜN ĐẶC TẢ]",
        "CHƯƠNG 6: ĐẶC TẢ USE CASE CHI TIẾT (DETAILED USE CASE SPECIFICATION) — [SƯỜN ĐẶC TẢ]",
        "CHƯƠNG 7: YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS) — [SƯỜN ĐẶC TẢ]",
        "CHƯƠNG 8: KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE) — [SƯỜN ĐẶC TẢ]",
        "CHƯƠNG 9: THIẾT KẾ UI/UX VÀ WIREFRAME MÀN HÌNH (UI/UX & WIREFRAME DESIGN) — [SƯỜN ĐẶC TẢ]",
        "CHƯƠNG 10: ĐẶC TẢ GIAO DIỆN LẬP TRÌNH ỨNG DỤNG (RESTFUL API SPECIFICATION) — [SƯỜN ĐẶC TẢ]",
        "CHƯƠNG 11: THIẾT KẾ CHI TIẾT CƠ SỞ DỮ LIỆU (DATABASE DESIGN) — [SƯỜN ĐẶC TẢ]",
        "CHƯƠNG 12: MA TRẬN TRUY VẾT YÊU CẦU (REQUIREMENT TRACEABILITY MATRIX - RTM) — [SƯỜN ĐẶC TẢ]",
        "CHƯƠNG 13: PHÂN CHIA CÔNG VIỆC VÀ CHIẾN LƯỢC KIỂM THỬ (TASK ALLOCATION & TEST STRATEGY) — [SƯỜN ĐẶC TẢ]",
        "CHƯƠNG 14: TIÊU CHUẨN VÀ TIÊU CHÍ NGHIỆM THU (ACCEPTANCE & GRADING CRITERIA) — [SƯỜN ĐẶC TẢ]",
        "CHƯƠNG 15: QUẢN TRỊ RỦI RO (RISK MANAGEMENT) — [SƯỜN ĐẶC TẢ]",
        "PHỤ LỤC (APPENDIX): PHỤ LỤC A (SCRUM CHECKLIST) & PHỤ LỤC B (HỒ SƠ TỐT NGHIỆP) — [SƯỜN ĐẶC TẢ]"
    ]
    for it in toc_items:
        p_t = doc.add_paragraph(style='List Bullet')
        r_t = p_t.add_run(it)
        r_t.font.name = 'Times New Roman'
        r_t.font.size = Pt(10)
        if "CHƯƠNG 1" in it:
            r_t.font.bold = True
            r_t.font.color.rgb = RGBColor(0x00, 0x66, 0x00)

    # =========================================================================
    # CHAPTER 1: FULLY COMPLETED (100%)
    # =========================================================================
    add_styled_heading(doc, "CHƯƠNG 1: GIỚI THIỆU TỔNG QUAN (INTRODUCTION)", 1)
    p_c1_note = doc.add_paragraph()
    r_c1_n = p_c1_note.add_run("(Phần này đã được nhóm nghiên cứu và hoàn thiện 100% nội dung đặc tả theo chuẩn mực đào tạo ITC và IEEE 830)")
    r_c1_n.font.italic = True
    r_c1_n.font.color.rgb = RGBColor(0x00, 0x66, 0x00)

    # 1.1
    add_styled_heading(doc, "1.1. Mục đích tài liệu", 2)
    p11 = doc.add_paragraph(
        "Tài liệu này đặc tả đầy đủ yêu cầu phần mềm (Software Requirements Specification - SRS) và thiết kế hệ thống "
        "(Software Design Specification - SDS) của dự án DriveShare, đồng thời đóng vai trò là tài liệu kỹ thuật nền (baseline) "
        "để thực tập sinh Developer và Tester triển khai dự án theo đúng quy trình phát triển phần mềm SDLC kết hợp mô hình "
        "Agile/Scrum, bám sát Khung chương trình thực tập Java Web Fullstack (26 buổi học, 6 Sprint/giai đoạn) của Khoa/Viện đào tạo."
    )
    p11_diff = doc.add_paragraph(
        "Khác với bản đặc tả mô tả nghiệp vụ thông thường, tài liệu V2.0 bổ sung 4 thành tố kỹ thuật cốt lõi: "
        "(1) Product Backlog và ánh xạ trực tiếp từng yêu cầu vào 6 Sprint cụ thể của khung chương trình thực tập; "
        "(2) Yêu cầu phi chức năng (NFR) định lượng được (thời gian phản hồi API P95 < 1000ms, kiểm thử đồng thời Concurrency bằng JMeter); "
        "(3) Đặc tả API hợp đồng (contract-first) thống nhất giữa Backend và Frontend; "
        "(4) Ma trận truy vết yêu cầu (Requirement Traceability Matrix - RTM) phục vụ kiểm thử và nghiệm thu tại Demo Day."
    )

    # 1.2
    add_styled_heading(doc, "1.2. Phạm vi sản phẩm (Product Scope)", 2)
    p12 = doc.add_paragraph(
        "Hệ thống DriveShare là một ứng dụng Web Fullstack (Java Spring Boot 3 ở Backend, HTML5/CSS3/JavaScript thuần "
        "kết hợp Bootstrap 5 ở Frontend) vận hành trên mô hình client-server, hỗ trợ giao diện đáp ứng (Responsive) "
        "cho hai nhóm thiết bị: máy tính để bàn (dành cho Chủ xe và Quản trị viên) và thiết bị di động (dành cho Khách thuê xe). "
        "Hệ thống giải quyết bài toán chia sẻ và cho thuê xe ô tô tự lái ngang hàng (P2P Car Rental), tự động hóa cơ chế ký quỹ "
        "đảm bảo giữ cọc 30% qua VietQR Napas 247, quản lý hồ sơ xe và eKYC giấy tờ trên Cloudinary CDN, quản lý vòng đời đơn thuê "
        "bằng máy trạng thái 17 bước, cung cấp biên bản bàn giao điện tử (Check-in/Check-out), quản lý ví doanh thu chủ xe 90% "
        "và cơ chế trọng tài xử lý tranh chấp bùng hẹn (Dispute) bảo vệ hoàn 100% cọc cho khách bằng khóa bi quan Pessimistic Locking."
    )
    modules = [
        ("Phân hệ Khách thuê (Renter Portal): ", 
         "Tìm kiếm & lọc xe đa tiêu chí; tương tác trò chuyện với Trợ lý ảo AI Assistant theo kiến trúc RAG để nhận tư vấn lộ trình và gợi ý xe có thật trong Database; upload ảnh CCCD 2 mặt & GPLX để định danh eKYC; tạo yêu cầu thuê xe; thanh toán cọc ký quỹ 30% qua VietQR Napas 247 động; lập biên bản nhận/trả xe; báo cáo sự cố chủ xe không giao xe (Dispute) và đánh giá sao chuyến đi."),

        ("Phân hệ Chủ xe (Car Owner Portal): ", 
         "Đăng ký phương tiện, tải ảnh và cavet/bảo hiểm xe lên Cloudinary CDN; bật/tắt nhận khách bằng cần gạt số thông minh (ACTIVE/INACTIVE); thẩm định hồ sơ khách thuê (Host Screening) để phê duyệt/từ chối; ký biên bản bàn giao Check-in và Check-out; quản lý ví thu nhập chủ xe nhận 90% giá trị hợp đồng và gửi lệnh rút tiền về ngân hàng."),

        ("Phân hệ Quản trị & Vận hành Sàn (Admin Portal): ", 
         "Thẩm định xe mới và hồ sơ eKYC người dùng; đóng vai trò Trọng tài giải quyết tranh chấp (Dispute): hoàn 100% cọc (570.000 đ) cho khách thuê và phạt 500.000 VNĐ đối với chủ xe vi phạm giao xe; giám sát dòng tiền toàn sàn (GMV, Quỹ ký quỹ Escrow, 10% hoa hồng sàn)."),

        ("Cơ chế Ký quỹ & Bảo mật Giao dịch (Security & Escrow System): ", 
         "Phân quyền RBAC 3 vai trò (ROLE_CUSTOMER, ROLE_CAR_OWNER, ROLE_ADMIN); cơ chế ký quỹ đảm bảo (Escrow) giữ 30% cọc an toàn; khóa lịch xe 2 giai đoạn (Soft Lock 45 phút -> Hard Lock); khóa bi quan @Lock(PESSIMISTIC_WRITE) trên RentalDispute chống Double Refund; quản lý phiên Stateless JWT kết hợp Token Versioning.")
    ]
    for m_t, m_d in modules:
        p_m = doc.add_paragraph(style='List Bullet')
        r_mt = p_m.add_run(m_t)
        r_mt.font.bold = True
        r_mt.font.color.rgb = RGBColor(0x1F, 0x49, 0x7D)
        p_m.add_run(m_d)

    # 1.3
    add_styled_heading(doc, "1.3. Đối tượng sử dụng tài liệu", 2)
    t2_headers = ["Đối tượng độc giả", "Cách sử dụng tài liệu trong dự án"]
    t2_widths = [Inches(2.2), Inches(4.5)]
    t2_data = [
        ("Thực tập sinh Developer", "Đọc kỹ Chương 5 (Yêu cầu chức năng), Chương 6 (Use Case), Chương 8 (Kiến trúc), Chương 9 (UI/UX Wireframe), Chương 10 (API Contract) và Chương 11 (CSDL 14 bảng) để hiện thực hóa mã nguồn theo đúng Sprint; tuân thủ kiến trúc phân tầng, Controller mỏng, DTO Records và ApiResponse<T>."),
        ("Thực tập sinh Tester", "Đọc Chương 5, 6, 7 (NFR) để thiết kế bộ Test Case Excel; dùng Chương 12 (Ma trận truy vết RTM) để đảm bảo độ phủ kiểm thử >= 95%; xây dựng Postman Collection chạy Automation Test (pm.test) và kịch bản Concurrency Test bằng JMeter cho luồng cọc xe."),
        ("Mentor / Scrum Master", "Dùng Chương 4 (Backlog & Sprint Roadmap) để điều phối các sự kiện Scrum (Planning, Daily, Review, Retro); dùng Chương 14 để chấm điểm nghiệm thu từng Sprint."),
        ("Hội đồng nghiệm thu (Demo Day)", "Dùng Chương 14 (Tiêu chí nghiệm thu) và Chương 4.3 (Definition of Done) để đánh giá sản phẩm cuối khóa: luồng chính end-to-end, kiểm thử tự động, triển khai Cloud và phản biện kỹ thuật của từng thành viên.")
    ]
    t2 = doc.add_table(rows=len(t2_data) + 1, cols=2)
    t2.alignment = WD_TABLE_ALIGNMENT.CENTER
    t2.autofit = False
    for c_i, h_text in enumerate(t2_headers):
        style_header_cell(t2.rows[0].cells[c_i], h_text, t2_widths[c_i])
    for r_i, row_data in enumerate(t2_data):
        row = t2.rows[r_i + 1]
        bg = "FFFFFF" if r_i % 2 == 0 else "F9FBFD"
        for c_i, val in enumerate(row_data):
            style_data_cell(row.cells[c_i], val, t2_widths[c_i], is_bold=(c_i==0), bg=bg)
    set_table_borders(t2)
    doc.add_paragraph()

    # 1.4
    add_styled_heading(doc, "1.4. Thuật ngữ và từ viết tắt (Definitions & Acronyms)", 2)
    t3_headers = ["Thuật ngữ", "Diễn giải chi tiết trong hệ thống DriveShare"]
    t3_widths = [Inches(1.8), Inches(4.9)]
    t3_data = [
        ("SRS", "Software Requirements Specification — Tài liệu đặc tả yêu cầu phần mềm theo chuẩn IEEE 830 / ISO 29148."),
        ("SDS", "Software Design Specification — Tài liệu thiết kế chi tiết kiến trúc, API và cơ sở dữ liệu hệ thống."),
        ("SDLC", "Software Development Life Cycle — Vòng đời phát triển phần mềm kết hợp mô hình Agile/Scrum."),
        ("Scrum / Sprint", "Khung làm việc Agile; Sprint là chu kỳ phát triển cố định tương ứng với 1 giai đoạn G trong khung chương trình."),
        ("DoR / DoD", "Definition of Ready / Done — Tiêu chí một hạng mục được phép bắt đầu / được xem là hoàn tất 100%."),
        ("P2P", "Peer-to-Peer — Mô hình chia sẻ xe ngang hàng kết nối trực tiếp chủ xe cá nhân và khách thuê."),
        ("Escrow", "Escrow Account — Cơ chế sàn giữ trung gian 30% tiền cọc để bảo vệ an toàn quyền lợi cho cả 2 bên."),
        ("Soft Lock", "Temporary Schedule Lock — Khóa tạm thời lịch xe trong vòng 45 phút khi chủ xe duyệt để mở cổng thanh toán VietQR."),
        ("Hard Lock", "Permanent Booking Lock — Khóa cứng vĩnh viễn lịch xe sau khi giao dịch cọc 30% thành công, chống Overbooking."),
        ("VietQR", "Vietnam Quick Response — Chuẩn thanh toán chuyển khoản liên ngân hàng 24/7 của Napas bằng mã QR động."),
        ("eKYC", "Electronic Know Your Customer — Quy trình định danh khách hàng từ xa qua ảnh chụp CCCD 2 mặt và GPLX."),
        ("Dispute", "Rental Dispute — Tranh chấp / Sự cố phát sinh trong quá trình nhận xe (chủ xe không giao xe đúng cam kết)."),
        ("Pessimistic Lock", "Pessimistic Write Lock — Khóa bi quan CSDL (@Lock PESSIMISTIC_WRITE) chống Double Refund trên khiếu nại."),
        ("Token Versioning", "Cơ chế quản lý phiên JWT Stateless; tự động tăng token_version khi đổi mật khẩu để thu hồi token cũ."),
        ("RBAC", "Role-Based Access Control — Kiểm soát truy cập dựa trên vai trò (ROLE_CUSTOMER, ROLE_CAR_OWNER, ROLE_ADMIN)."),
        ("RAG", "Retrieval-Augmented Generation — Mô hình AI kết hợp truy xuất kho xe khả dụng thực tế trong CSDL để tư vấn chính xác."),
        ("RTM", "Requirement Traceability Matrix — Ma trận truy vết yêu cầu phần mềm phục vụ kiểm thử và nghiệm thu."),
        ("NFR", "Non-Functional Requirement — Yêu cầu phi chức năng (Hiệu năng, đồng thời, bảo mật, khả dụng).")
    ]
    t3 = doc.add_table(rows=len(t3_data) + 1, cols=2)
    t3.alignment = WD_TABLE_ALIGNMENT.CENTER
    t3.autofit = False
    for c_i, h_text in enumerate(t3_headers):
        style_header_cell(t3.rows[0].cells[c_i], h_text, t3_widths[c_i])
    for r_i, row_data in enumerate(t3_data):
        row = t3.rows[r_i + 1]
        bg = "FFFFFF" if r_i % 2 == 0 else "F9FBFD"
        for c_i, val in enumerate(row_data):
            style_data_cell(row.cells[c_i], val, t3_widths[c_i], is_bold=(c_i==0), bg=bg)
    set_table_borders(t3)
    doc.add_paragraph()

    # 1.5
    add_styled_heading(doc, "1.5. Tài liệu tham khảo", 2)
    refs = [
        "IEEE Std 830-1998 — IEEE Recommended Practice for Software Requirements Specifications.",
        "ISO/IEC/IEEE 29148:2018 — Systems and software engineering — Life cycle processes — Requirements engineering.",
        "Scrum Guide (scrumguides.org) — Khung lý thuyết Scrum (Sprint, Roles, Events, Artifacts).",
        "Khung Chương trình Thực tập Java Web Fullstack — Căn cứ phân bổ 6 Sprint / 26 buổi học áp dụng cho dự án.",
        "Spring Boot Reference Documentation (v3.3.4) & Spring Security 6 Architecture Guide (docs.spring.io).",
        "Tiêu chuẩn Kỹ thuật thanh toán mã VietQR Napas 247 — Công ty Cổ phần Thanh toán Quốc gia Việt Nam (Napas).",
        "Báo cáo Đặc tả Nghiệp vụ & Đối chuẩn 10 Ứng dụng Car Rental Toàn cầu (Mioto, Turo, Zoomcar, Getaround) — Dự án DriveShare."
    ]
    for rf in refs:
        p_rf = doc.add_paragraph(style='List Bullet')
        p_rf.add_run(rf)

    # 1.6
    add_styled_heading(doc, "1.6. Quy trình phát triển áp dụng — Ánh xạ SDLC vào khung chương trình thực tập", 2)
    p16_desc = doc.add_paragraph(
        "Dự án áp dụng mô hình Agile/Scrum với các Sprint có thời lượng cố định, trùng khớp với cấu trúc 6 giai đoạn "
        "(G1–G6) của Khung chương trình thực tập Java Web Fullstack (26 buổi học). Bảng ánh xạ chi tiết:"
    )
    t4_headers = ["Giai đoạn chương trình", "Tương đương Sprint Scrum", "Tuần / Buổi", "Đầu ra kỳ vọng (Deliverables)"]
    t4_widths = [Inches(1.5), Inches(1.5), Inches(1.0), Inches(2.7)]
    t4_data = [
        ("G1: Khởi tạo & Phân tích yêu cầu", "Sprint 0 (Discovery & Design)", "Tuần 1, Buổi 1-5", "Product Backlog trên Jira; ERD 14 bảng quan hệ được Mentor duyệt; Script SQL PostgreSQL; Git Flow và Definition of Done được thống nhất."),
        ("G2: Nền tảng & Dịch vụ cốt lõi", "Sprint 1 (Core Foundation)", "Tuần 2-3, Buổi 6-11", "Xác thực JWT Stateless, RBAC; Hồ sơ eKYC CCCD/GPLX trên Cloudinary CDN; CRUD xe, duyệt xe Admin, cần gạt ACTIVE/INACTIVE; Unit test Service >= 60%."),
        ("G3: Vòng đời & Thanh toán ký quỹ", "Sprint 2 (Booking & Escrow)", "Tuần 3-4, Buổi 12-16", "Đặt xe (Request-to-Book), duyệt đơn (Host Screening); Soft Lock 45p qua Scheduler; Cổng VietQR cọc 30%, Hard Lock lịch xe; Tích hợp Frontend end-to-end."),
        ("G4: Bàn giao, Tranh chấp & AI", "Sprint 3 (Disputes & AI)", "Tuần 4-5, Buổi 17-20", "Biên bản Check-in/Check-out; Khiếu nại No-Show dùng @Lock PESSIMISTIC_WRITE hoàn 100% cọc & phạt 500k chủ xe; Ví chủ xe 90% & hoa hồng sàn 10%; Trợ lý AI RAG Gemini."),
        ("G5: Kiểm thử & Đảm bảo chất lượng", "Sprint 4 (Verification & QA)", "Tuần 5-6, Buổi 21-23", "Bộ kiểm thử 186/186 Unit/Integration Tests Pass 100%; Concurrency Test chống Double Booking; Postman Automation Collection (pm.test); Test Case Excel phủ >= 95% RTM."),
        ("G6: Triển khai Cloud & Nghiệm thu", "Sprint Release (DevOps & Demo)", "Tuần 6, Buổi 24-26", "Dockerfile multi-stage JVM <512MB, render.yaml; Deploy live thành công trên Render Cloud; Slide thuyết trình 15 phút, video demo; Demo Day và phản biện trước Hội đồng.")
    ]
    t4 = doc.add_table(rows=len(t4_data) + 1, cols=4)
    t4.alignment = WD_TABLE_ALIGNMENT.CENTER
    t4.autofit = False
    for c_i, h_text in enumerate(t4_headers):
        style_header_cell(t4.rows[0].cells[c_i], h_text, t4_widths[c_i])
    for r_i, row_data in enumerate(t4_data):
        row = t4.rows[r_i + 1]
        bg = "FFFFFF" if r_i % 2 == 0 else "F9FBFD"
        for c_i, val in enumerate(row_data):
            style_data_cell(row.cells[c_i], val, t4_widths[c_i], is_bold=(c_i==0), bg=bg)
    set_table_borders(t4)
    doc.add_paragraph()

    # 1.7
    add_styled_heading(doc, "1.7. Phạm vi loại trừ (Out of Scope) & Định hướng mở rộng (Stretch Goals)", 2)
    p17_out = doc.add_paragraph()
    r17_out_t = p17_out.add_run("Phạm vi loại trừ (Out of Scope) trong thời gian thực tập 6 tuần:\n")
    r17_out_t.font.bold = True
    r17_out_t.font.color.rgb = RGBColor(0x99, 0x00, 0x00)
    out_items = [
        "Lắp đặt thiết bị định vị GPS / Hộp đen IoT thực tế trên xe ô tô — Thay thế bằng việc chụp ảnh ODO công-tơ-mét và vạch xăng/pin tại 2 biên bản bàn giao điện tử Check-in và Check-out.",
        "Cổng thanh toán thẻ tín dụng quốc tế Visa/Mastercard đòi hỏi chứng chỉ bảo mật PCI-DSS khắt khe — Tập trung tối ưu thanh toán cọc qua chuẩn VietQR Napas 247 chuyển khoản liên ngân hàng miễn phí, thuận tiện tại Việt Nam.",
        "Tích hợp tổng đài thoại trực tiếp VoIP/WebRTC — Thay thế bằng hình thức liên lạc qua Số điện thoại đã xác thực và hệ thống Notification nội bộ."
    ]
    for oi in out_items:
        p_oi = doc.add_paragraph(style='List Bullet')
        p_oi.add_run(oi)

    p17_str = doc.add_paragraph()
    r17_str_t = p17_str.add_run("Định hướng mở rộng (Stretch Goals) cho giai đoạn phát triển tiếp theo:\n")
    r17_str_t.font.bold = True
    r17_str_t.font.color.rgb = RGBColor(0x00, 0x66, 0x00)
    str_items = [
        "Tự động hóa eKYC bằng Trí tuệ Nhân tạo (AI OCR): Tích hợp OCR (Google Cloud Vision / FPT.AI eKYC) để tự động đọc và trích xuất họ tên, số CCCD từ ảnh chụp 2 mặt, giảm thiểu tối đa thao tác nhập liệu.",
        "Tra cứu tài khoản ngân hàng tự động (Napas 247 Lookup API): Tự động xác thực số tài khoản chủ xe và đối soát chéo tên chủ thẻ in hoa không dấu với tên trên CCCD qua cổng Napas trước khi kích hoạt ví rút tiền.",
        "Mở rộng phân hệ Dịch vụ thuê xe kèm tài xế (Chauffeur Service): Quản lý biểu phí tài xế theo ngày và hồ sơ tài xế chuyên nghiệp."
    ]
    for si in str_items:
        p_si = doc.add_paragraph(style='List Bullet')
        p_si.add_run(si)

    # =========================================================================
    # CHAPTERS 2 TO 15 & APPENDIX: SKELETON FRAMEWORKS
    # =========================================================================
    skeletons = [
        ("CHƯƠNG 2: MÔ TẢ TỔNG QUAN HỆ THỐNG (OVERALL DESCRIPTION)", [
            ("2.1. Bối cảnh sản phẩm (Product Perspective)", 
             "Mô tả vị trí hệ thống DriveShare là nền tảng độc lập, tích hợp các dịch vụ bên thứ ba (Cloudinary Media CDN, Cổng thanh toán VietQR Napas 247, Google Gemini AI LLM) và triển khai trên hạ tầng Container Docker."),
            ("2.2. Đối tượng người dùng & đặc điểm sử dụng", 
             "Bảng phân tích 3 nhóm người dùng: Khách thuê xe (Giao diện Mobile, tìm kiếm, quét QR), Chủ xe (Giao diện Desktop/Mobile, quản lý xe, duyệt khách, ví thu nhập) và Quản trị viên (Desktop, duyệt xe, phân xử khiếu nại)."),
            ("2.3. Ràng buộc thiết kế & công nghệ (Design & Implementation Constraints)", 
             "Ràng buộc bắt buộc theo khung thực tập: Java 17+, Spring Boot 3.3.4, Spring Security 6, PostgreSQL 16, Frontend Vanilla HTML5/CSS3/JavaScript + Bootstrap 5, bọc ApiResponse<T>."),
            ("2.4. Giả định và phụ thuộc (Assumptions & Dependencies)", 
             "Các giả định về hạ tầng Cloud, kết nối Internet ổn định, và quy trình bàn giao hiện trạng xe thực tế giữa 2 bên.")
        ]),

        ("CHƯƠNG 3: TÁC NHÂN HỆ THỐNG (ACTORS)", [
            ("3.1. Danh mục tác nhân hệ thống", 
             "Bảng liệt kê chi tiết 4 tác nhân: ROLE_CUSTOMER (Khách thuê), ROLE_CAR_OWNER (Chủ xe), ROLE_ADMIN (Quản trị viên) và SYSTEM (Tiến trình ngầm RentalExpirationScheduler giải phóng Soft Lock)."),
            ("3.2. Ma trận phân quyền tác nhân (Actor Privilege Matrix)", 
             "Bảng ma trận ma trận quyền hạn CRUD trên các tài nguyên: User Profile, Car, Rental, Payment, Handover, Dispute, Wallet, Admin Portal.")
        ]),

        ("CHƯƠNG 4: PRODUCT BACKLOG VÀ LỘ TRÌNH SPRINT (BACKLOG & SPRINT ROADMAP)", [
            ("4.1. Nguyên tắc ánh xạ", 
             "Nguyên tắc ánh xạ User Stories vào 6 Sprint (G1-G6) và phân loại độ ưu tiên theo phương pháp MoSCoW (Must, Should, Could, Won't)."),
            ("4.2. Bảng Sprint Roadmap (chi tiết theo 26 buổi học)", 
             "Bảng lộ trình chi tiết từng buổi học (Buổi 1-5: Sprint 0; Buổi 6-11: Sprint 1; Buổi 12-16: Sprint 2; Buổi 17-20: Sprint 3; Buổi 21-23: Sprint 4; Buổi 24-26: Sprint Release)."),
            ("4.3. Định nghĩa Sẵn sàng & Hoàn tất (Definition of Ready / Done)", 
             "Bộ tiêu chí chuẩn: DoR (User story theo cú pháp As a... I want... so that..., có Given-When-Then ACs) và DoD (Pass 186 unit tests, merged PR, test Postman, responsive UI).")
        ]),

        ("CHƯƠNG 5: YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS)", [
            ("5.1. EPIC-AUTH — Xác thực & Quản lý tài khoản", "Đăng ký, Đăng nhập Stateless JWT, Đổi mật khẩu thu hồi token cũ qua token_version, Đăng nhập Google OAuth2."),
            ("5.2. EPIC-USER — Hồ sơ người dùng & Định danh eKYC", "Quản lý hồ sơ, Tải ảnh CCCD 2 mặt & GPLX lên Cloudinary CDN để kiểm duyệt."),
            ("5.3. EPIC-CAR — Quản lý phương tiện & Trạng thái xe", "Đăng ký xe, tải cavet/bảo hiểm, kiểm duyệt xe mới, cần gạt bật/tắt nhận khách ACTIVE/INACTIVE."),
            ("5.4. EPIC-RENTAL — Vòng đời giao dịch đặt xe (Booking Lifecycle)", "Tạo yêu cầu thuê xe (Request-to-Book), thẩm định khách thuê (Host Screening), cơ chế Soft Lock 45 phút."),
            ("5.5. EPIC-PAYMENT — Cổng thanh toán VietQR & Ký quỹ Escrow 30%", "Sinh mã VietQR Napas 247 động cọc đúng 30%, cơ chế Hard Lock lịch xe chống Overbooking."),
            ("5.6. EPIC-HANDOVER — Biên bản bàn giao kỹ thuật số", "Check-in ghi nhận ODO/xăng trước khi đi; Check-out nghiệm thu đối soát hư hại và thanh toán 70% còn lại."),
            ("5.7. EPIC-DISPUTE — Trọng tài xử lý khiếu nại & Hoàn tiền cọc", "Báo cáo sự cố bùng xe, khóa bi quan @Lock(PESSIMISTIC_WRITE), hoàn 100% cọc Escrow cho khách và phạt 500k chủ xe."),
            ("5.8. EPIC-WALLET — Quản lý Ví doanh thu chủ xe", "Tự động cộng 90% giá trị hợp đồng vào ví sau khi trừ 10% hoa hồng sàn, đối soát và tạo lệnh rút tiền."),
            ("5.9. EPIC-AI — Trợ lý ảo AI Assistant tư vấn xe thông minh", "Chatbot tư vấn lộ trình và gợi ý xe khả dụng thực tế trong CSDL theo kiến trúc RAG Gemini."),
            ("5.10. EPIC-ADMIN — Quản trị, Thống kê tài chính GMV & Báo cáo", "Bảng điều khiển quản trị người dùng, duyệt xe, phân xử tranh chấp, báo cáo doanh thu GMV.")
        ]),

        ("CHƯƠNG 6: ĐẶC TẢ USE CASE CHI TIẾT (DETAILED USE CASE SPECIFICATION)", [
            ("6.0. Sơ đồ Use Case tổng quan (UML Use Case Diagram)", "Sơ đồ phân rã chức năng theo 3 tác nhân Renter, Owner, Admin."),
            ("6.1. UC-AUTH-001: Đăng ký, Đăng nhập & Xác thực JWT Stateless", "Đặc tả theo chuẩn Cockburn: Pre-conditions, Post-conditions, Main Success Scenario, Alternate Flows."),
            ("6.2. UC-BOOK-002: Đặt lịch thuê xe & Thanh toán cọc giữ chỗ VietQR Escrow 30%", "Đặc tả luồng nghiệp vụ cọc 30% và cơ chế khóa lịch 2 giai đoạn."),
            ("6.3. UC-CAR-003: Đăng ký xe mới & Cần gạt bật/tắt nhận khách (ACTIVE/INACTIVE)", "Đặc tả luồng xuất bản xe và kiểm duyệt hành chính."),
            ("6.4. UC-HANDOVER-004: Biên bản giao nhận xe Check-in và nghiệm thu Check-out", "Đặc tả đối soát ODO, mức xăng/pin và bàn giao chìa khóa."),
            ("6.5. UC-DISPUTE-005: Khởi tạo khiếu nại bùng hẹn & Phân xử cưỡng chế bằng khóa bi quan", "Đặc tả trọng tài Admin hoàn 100% cọc (570k) và chế tài phạt chủ xe vi phạm (500k).")
        ]),

        ("CHƯƠNG 7: YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)", [
            ("7.1. Hiệu năng & Khả năng chịu tải (Performance & Concurrency)", "Chỉ số định lượng: P95 < 1000ms; Concurrency Test Apache JMeter 50-100 requests đồng thời chống Overbooking."),
            ("7.2. Độ tin cậy & Tính toàn vẹn dữ liệu (Reliability & Integrity)", "Giao dịch ACID qua @Transactional, tỷ lệ Uptime 99.9%, tự động phục hồi."),
            ("7.3. Tiêu chuẩn bảo mật (Security & OWASP Top 10)", "Băm mật khẩu BCrypt (factor 10), JWT HMAC-SHA256, Token Versioning chống tái sử dụng token cũ, CORS chặt chẽ."),
            ("7.4. Khả năng bảo trì & Mở rộng (Maintainability & Extensibility)", "Kiến trúc Spring Boot phân tầng rõ ràng, Controller mỏng, DTO Records, Test Coverage cao."),
            ("7.5. Tính khả dụng & Trải nghiệm giao diện (Usability & Accessibility)", "Thiết kế Responsive Mobile-first cho khách thuê xe, Desktop-first cho Admin/Chủ xe.")
        ]),

        ("CHƯƠNG 8: KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)", [
            ("8.1. Mô hình kiến trúc đa tầng (Layered Architecture)", "Sơ đồ thành phần: Presentation (Controllers) -> Business (Services) -> Persistence (Repositories) -> Database."),
            ("8.2. Cơ chế bảo mật — JWT Authentication Filter & Token Versioning", "Sơ đồ luồng Filter trích xuất token, nạp UserDetails và đối soát token_version."),
            ("8.3. Cơ chế kiểm soát đồng thời & Ký quỹ", "Chi tiết Two-Phase Locking (Soft Lock 45 phút -> Hard Lock) và Pessimistic Locking @Lock(PESSIMISTIC_WRITE) trên bảng rental_disputes."),
            ("8.4. Sơ đồ triển khai hệ thống (Cloud Deployment View on Render)", "Kiến trúc Docker multi-stage tối ưu JVM <512MB RAM, Render PostgreSQL, Cloudinary CDN.")
        ]),

        ("CHƯƠNG 9: THIẾT KẾ UI/UX VÀ WIREFRAME MÀN HÌNH (UI/UX & WIREFRAME DESIGN)", [
            ("9.1. Nguyên tắc thiết kế UI/UX áp dụng", "Bảng màu hiện đại, tối ưu tương tác người dùng, hạn chế thao tác thừa."),
            ("9.2. Wireframe luồng màn hình Khách thuê (Mobile)", "Bố cục màn hình Tìm kiếm, Chi tiết xe, Modal đặt xe, Quét mã VietQR cọc 30%."),
            ("9.3. Wireframe màn hình Chủ xe & Quản trị viên (Desktop)", "Bố cục màn hình Quản lý xe, Cần gạt ACTIVE/INACTIVE, Ví thu nhập 90%, Bảng phân xử khiếu nại."),
            ("9.4. Sơ đồ luồng chuyển màn hình (Screen Flow Diagram)", "Sơ đồ luồng điều hướng tổng thể từ khi người dùng truy cập trang chủ đến khi hoàn tất chuyến đi.")
        ]),

        ("CHƯƠNG 10: ĐẶC TẢ GIAO DIỆN LẬP TRÌNH ỨNG DỤNG (RESTFUL API SPECIFICATION)", [
            ("10.1. Quy chuẩn thiết kế RESTful & Định dạng bọc dữ liệu ApiResponse<T>", "Cấu trúc phản hồi thống nhất: { code, message, data, timestamp }."),
            ("10.2. Nhóm API Xác thực & Hồ sơ (/api/v1/auth, /api/v1/users)", "Bảng đặc tả endpoints đăng ký, đăng nhập, đổi mật khẩu, upload eKYC."),
            ("10.3. Nhóm API Phương tiện & Công khai (/api/v1/cars, /api/v1/public/cars)", "Bảng đặc tả endpoints tìm kiếm xe công khai, đăng ký xe, bật/tắt ACTIVE/INACTIVE."),
            ("10.4. Nhóm API Đơn thuê & Thanh toán (/api/v1/rentals, /api/v1/payments)", "Bảng đặc tả endpoints tạo đơn, duyệt đơn, sinh mã VietQR cọc 30%."),
            ("10.5. Nhóm API Bàn giao, Khiếu nại & Ví", "Bảng đặc tả endpoints check-in, check-out, tạo khiếu nại bùng xe, Admin phán quyết hoàn cọc, ví chủ xe."),
            ("10.6. Nhóm API Trợ lý ảo AI Assistant (/api/v1/chat)", "Bảng đặc tả endpoint trò chuyện tư vấn xe thông minh.")
        ]),

        ("CHƯƠNG 11: THIẾT KẾ CHI TIẾT CƠ SỞ DỮ LIỆU (DATABASE DESIGN)", [
            ("11.0. Sơ đồ thực thể quan hệ tổng quan (ERD Diagram - 14 Tables 3NF)", "Sơ đồ ERD 14 bảng chuẩn hóa 3NF không dư thừa dữ liệu."),
            ("11.1. Từ điển dữ liệu chi tiết 14 bảng (Data Dictionary)", "Đặc tả cấu trúc cột, kiểu dữ liệu, ràng buộc khóa chính/khóa ngoại của 14 bảng: users, roles, user_roles, user_profiles, cars, car_photos, car_pricing, rentals, rental_payments, rental_handovers, rental_disputes, owner_wallets, wallet_transactions, chat_memory."),
            ("11.2. Chiến lược Indexing và Ràng buộc toàn vẹn dữ liệu", "Bảng tổng hợp các chỉ mục B-Tree (email, status, car_id, rental_id) và khóa ngoại ON DELETE RESTRICT/CASCADE.")
        ]),

        ("CHƯƠNG 12: MA TRẬN TRUY VẾT YÊU CẦU (REQUIREMENT TRACEABILITY MATRIX - RTM)", [
            ("12.1. Cấu trúc ma trận truy vết", "Nguyên tắc thiết lập ma trận liên kết đa chiều bảo đảm độ bao phủ kiểm thử 100%."),
            ("12.2. Bảng RTM ánh xạ Requirement -> Use Case -> API -> Database -> Test Case", "Bảng ma trận truy vết chi tiết từng yêu cầu nghiệp vụ.")
        ]),

        ("CHƯƠNG 13: PHÂN CHIA CÔNG VIỆC VÀ CHIẾN LƯỢC KIỂM THỬ (TASK ALLOCATION & TEST STRATEGY)", [
            ("13.1. Ma trận phân công trách nhiệm nhóm K4 PRO (RACI Matrix)", "Bảng phân định vai trò R (Responsible), A (Accountable), C (Consulted), I (Informed) cho 6 thành viên trong nhóm."),
            ("13.2. Chiến lược kiểm thử theo cấp độ", "Quy trình kiểm thử 4 tầng: Unit Test (186 tests), Integration Test, Concurrency Test (JMeter), E2E Test.")
        ]),

        ("CHƯƠNG 14: TIÊU CHUẨN VÀ TIÊU CHÍ NGHIỆM THU (ACCEPTANCE & GRADING CRITERIA)", [
            ("14.1. Tiêu chí dành cho Developer", "DoD mã nguồn: Kiến trúc phân tầng, Controller mỏng, DTO Records, Pass 186 unit tests, clean code."),
            ("14.2. Tiêu chí dành cho Tester", "DoD kiểm thử: Test Case Excel bao phủ >= 95% RTM, Postman Automation Collection chạy tự động, báo cáo bug."),
            ("14.3. Tiêu chí nghiệm thu cấp Sprint", "Tiêu chuẩn tối thiểu để được Mentor ký xác nhận qua từng Sprint."),
            ("14.4. Tiêu chí đánh giá Demo Day tốt nghiệp", "Thang điểm và tiêu chuẩn đánh giá của Hội đồng bảo vệ: Cấu trúc bài thuyết trình 15 phút, Live Demo web thực tế, Phản biện kỹ thuật cá nhân.")
        ]),

        ("CHƯƠNG 15: QUẢN TRỊ RỦI RO (RISK MANAGEMENT)", [
            ("15.1. Bảng nhận diện rủi ro kỹ thuật và nghiệp vụ", "Bảng phân tích 7 rủi ro chính (Overbooking, Double Refund, Render Cloud sleep, File upload dung lượng lớn, Khách bùng thanh toán cọc)."),
            ("15.2. Kế hoạch ứng phó và giảm thiểu rủi ro (Risk Mitigation Plan)", "Biện pháp kiểm soát: Khóa 2 giai đoạn (Soft/Hard Lock), Khóa bi quan @Lock(PESSIMISTIC_WRITE), Cloudinary CDN, Cronjob liveness, RentalExpirationScheduler.")
        ]),

        ("PHỤ LỤC (APPENDIX)", [
            ("Phụ lục A: Checklist các sự kiện Scrum theo 26 buổi học", "Checklist kiểm tra việc thực hiện các sự kiện Scrum (Sprint Planning, Daily Standup, Review, Retrospective) xuyên suốt 26 buổi."),
            ("Phụ lục B: Hồ sơ tốt nghiệp & Bằng chứng kiểm thử tự động", "Tổng hợp liên kết kho mã nguồn GitHub, Link triển khai Cloud Render, và bằng chứng 186/186 bài Unit test Pass 100%.")
        ])
    ]

    for chap_title, sub_sections in skeletons:
        add_styled_heading(doc, chap_title, 1)
        p_sk_note = doc.add_paragraph()
        r_sk_n = p_sk_note.add_run("(Khung sườn đặc tả chuẩn mực — Định hướng sẵn sàng để triển khai chi tiết cho hệ thống DriveShare)")
        r_sk_n.font.italic = True
        r_sk_n.font.color.rgb = RGBColor(0x66, 0x66, 0x66)

        for s_title, s_desc in sub_sections:
            add_styled_heading(doc, s_title, 2)
            p_sd = doc.add_paragraph(s_desc)

    doc.save(docx_path)
    print(f"SUCCESS: Master SRS Docx generated at: {docx_path}")

def main():
    std_md = r"d:\MONHOCITC\K4\Spring_ThucTap_k4\docs\requirements\BAO_CAO_SRS_DRIVESHARE_K4_PRO_V2.0.md"
    std_docx = r"d:\MONHOCITC\K4\Spring_ThucTap_k4\docs\requirements\BAO_CAO_SRS_DRIVESHARE_K4_PRO_V2.0.docx"

    with open(std_md, "w", encoding="utf-8") as f:
        f.write(MD_CONTENT)
    print(f"SUCCESS: Master SRS Markdown generated at: {std_md}")

    generate_master_docx(std_docx)
    print(f"SUCCESS: Master SRS Docx generated at: {std_docx}")

if __name__ == "__main__":
    main()
