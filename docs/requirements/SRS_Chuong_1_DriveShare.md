# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)
## DỰ ÁN: NỀN TẢNG CHIA SẺ VÀ CHO THUÊ XE TRỰC TUYẾN DRIVESHARE
**Mã học phần:** Thực tập tốt nghiệp / Đồ án phát triển phần mềm (K4)  
**Nhóm thực hiện:** Nhóm DriveShare (K4 PRO)  
**Phiên bản tài liệu:** 1.0  
**Ngày hoàn thiện:** 23/10/2026  

---

# CHƯƠNG 1: GIỚI THIỆU TỔNG QUAN (INTRODUCTION)

### 1.1 Mục Đích Tài Liệu (Purpose)
Tài liệu Đặc tả Yêu cầu Phần mềm (Software Requirements Specification - SRS) này nhằm mô tả chi tiết, đầy đủ và chuẩn hóa toàn bộ các yêu cầu chức năng (Functional Requirements), yêu cầu phi chức năng (Non-functional Requirements), ràng buộc nghiệp vụ (Business Rules), kiến trúc hệ thống và luồng giao dịch cốt lõi của dự án **DriveShare**. 

Tài liệu là cơ sở pháp lý và kỹ thuật giữa nhóm phát triển với Giảng viên hướng dẫn / Hội đồng đánh giá, đồng thời là kim chỉ nam định hướng cho quá trình phân tích, thiết kế cơ sở dữ liệu, hiện thực mã nguồn (Backend & Frontend) và kiểm thử chất lượng (QA/QC) xuyên suốt các chu kỳ Sprint.

### 1.2 Phạm Vi Sản Phẩm (Scope of the System)
**DriveShare** là nền tảng công nghệ trung gian kết nối mạng ngang hàng (Peer-to-Peer Car Rental Platform) cho phép các cá nhân sở hữu xe ô tô nhàn rỗi (**Chủ xe - Car Owner**) kết nối trực tiếp với những người có nhu cầu thuê xe ô tô tự lái ngắn ngày hoặc dài ngày (**Khách thuê - Renter**).

**Các phân hệ chính trong phạm vi hệ thống:**
1. **Phân hệ Khách thuê (Renter Portal):**
   - Tra cứu, tìm kiếm xe đa tiêu chí (địa điểm, thời gian, hãng xe, số chỗ, loại nhiên liệu, hộp số, mức giá).
   - Tương tác với **Trợ lý ảo AI (AI Car Advisor)** để nhận đề xuất xe tự nhiên theo lộ trình di chuyển.
   - Định danh điện tử (eKYC): Tải lên Căn cước công dân (CCCD 2 mặt) và Giấy phép lái xe (GPLX).
   - Tạo yêu cầu đặt xe, theo dõi trạng thái đơn hàng thời gian thực.
   - Thanh toán tiền đặt cọc giữ chỗ 30% qua cổng **VietQR Napas 247**.
   - Báo cáo sự cố bàn giao xe (No-Show Dispute) và yêu cầu hoàn cọc nếu chủ xe vi phạm.
   - Đánh giá và chấm điểm sao chuyến đi sau khi hoàn tất.

2. **Phân hệ Chủ xe (Car Owner Portal):**
   - Đăng ký hồ sơ chủ xe, khai báo thông tin tài khoản ngân hàng thụ hưởng.
   - Đăng tải thông tin phương tiện, tải lên bộ sưu tập ảnh và cavet/bảo hiểm (tích hợp Cloudinary CDN).
   - Bật/tắt trạng thái xe bằng cần gạt số thông minh: `ACTIVE` (Sẵn sàng chạy) vs `INACTIVE` (Tạm ẩn).
   - Thẩm định hồ sơ khách thuê và phê duyệt/từ chối yêu cầu đặt xe (Request-to-Book).
   - Quản lý ví thu nhập chủ xe (nhận 90% giá trị hợp đồng, sàn giữ 10% phí dịch vụ) và gửi yêu cầu rút tiền về ngân hàng.

3. **Phân hệ Quản trị & Vận hành Sàn (Staff / Admin Portal):**
   - Thẩm định hồ sơ người dùng (duyệt CCCD, duyệt GPLX hợp lệ).
   - Kiểm duyệt chất lượng xe mới đăng trước khi cho phép xuất bản ra thị trường.
   - Giám sát toàn bộ đơn đặt xe và luồng tiền luân chuyển toàn sàn (Tổng GMV, Tiền cọc Escrow, Doanh thu hoa hồng 10%).
   - Xử lý tranh chấp, khiếu nại (Disputes): Phân xử trường hợp chủ xe bùng hẹn, kích hoạt lệnh hoàn cọc 100% cho khách thuê và áp dụng chế tài phạt 500.000 VNĐ đối với chủ xe vi phạm.

4. **Cơ chế Bảo mật & Ký quỹ Đảm bảo (Security & Escrow System):**
   - Phân quyền truy cập dựa trên vai trò (Role-Based Access Control - RBAC) với 3 vai trò: `ROLE_RENTER`, `ROLE_OWNER`, `ROLE_ADMIN`.
   - Cơ chế ký quỹ đảm bảo (Escrow): Tiền cọc 30% được sàn giữ an toàn, chỉ giải ngân cho chủ xe sau khi chuyến đi hoàn tất thành công.
   - Khóa giữ chỗ 2 giai đoạn (Soft Lock 45 phút khi chủ xe duyệt $\rightarrow$ Hard Lock khi khách cọc thành công).

### 1.3 Thuật Ngữ & Định Nghĩa (Definitions, Acronyms, and Abbreviations)

| Thuật ngữ / Viết tắt | Tên tiếng Anh đầy đủ | Giải nghĩa trong hệ thống DriveShare |
| :--- | :--- | :--- |
| **P2P** | Peer-to-Peer | Mô hình chia sẻ xe ngang hàng giữa cá nhân với cá nhân thông qua nền tảng. |
| **RBAC** | Role-Based Access Control | Kiểm soát quyền truy cập tài nguyên dựa trên vai trò người dùng (Renter, Owner, Admin). |
| **JWT** | JSON Web Token | Chuỗi token mã hóa dùng để xác thực phiên người dùng Stateless qua HTTP Header. |
| **Escrow** | Escrow Service (Tài khoản ký quỹ) | Cơ chế sàn giữ tiền cọc 30% trung gian để bảo vệ quyền lợi cả khách thuê và chủ xe. |
| **Soft Lock** | Temporary Schedule Lock | Cơ chế khóa tạm thời lịch xe trong vòng 45 phút để khách thanh toán tiền cọc. |
| **Hard Lock** | Permanent Booking Lock | Cơ chế khóa cứng lịch xe sau khi giao dịch cọc 30% được xác nhận thành công. |
| **VietQR** | Vietnam Quick Response | Chuẩn thanh toán chuyển khoản nhanh Napas 247 liên ngân hàng thông qua mã QR động. |
| **eKYC** | Electronic Know Your Customer | Quy trình xác thực danh tính khách hàng từ xa qua ảnh chụp CCCD và Giấy phép lái xe. |
| **GMV** | Gross Merchandise Value | Tổng giá trị giao dịch phát sinh trên toàn sàn trong một chu kỳ tính toán. |
| **Dispute** | Rental Dispute | Tranh chấp / Sự cố phát sinh trong quá trình nhận xe (chủ xe vắng mặt, không giao xe). |
| **LLM / RAG** | Large Language Model / Retrieval-Augmented Generation | Mô hình ngôn ngữ lớn kết hợp truy xuất dữ liệu xe thực tế phục vụ Trợ lý AI tư vấn. |

### 1.4 Đối Tượng Độc Giả & Cách Tiếp Cận (Intended Audience and Reading Suggestions)
- **Giảng viên hướng dẫn & Hội đồng bảo vệ:** Đọc Chương 1 để nắm nhanh mục tiêu, phạm vi và bài toán kinh doanh; đối chiếu với kết quả demo thực tế.
- **Lập trình viên Backend:** Tập trung vào các quy tắc nghiệp vụ (Business Rules), thiết kế cơ sở dữ liệu (ERD) và ràng buộc khóa giao dịch (Transaction/Locking).
- **Lập trình viên Frontend:** Đọc kỹ luồng tương tác người dùng (UI Flow), trạng thái đơn hàng (State Machine) và cơ chế xử lý lỗi/thông báo toast.
- **Kiểm thử viên (QA/Tester):** Sử dụng các tiêu chí nghiệm thu (Acceptance Criteria) và kịch bản lỗi biên (Edge Cases) để viết Test Case tự động và Test thủ công.

### 1.5 Tổng Quan Hệ Thống & Kiến Trúc Công Nghệ (System Overview & Tech Stack)
Hệ thống **DriveShare** được thiết kế theo kiến trúc **Spring Boot Layered Modular Architecture** kết hợp phân hệ **AI Chatbot Service**:

- **Tầng Trình Diễn (Presentation Layer):**
  - Web Client: HTML5, CSS3 hiện đại, Vanilla JavaScript Module, Bootstrap 5, FontAwesome 6.
  - Widget AI Chatbot: Giao diện nổi hỗ trợ trò chuyện thời gian thực.
- **Tầng Xử Lý Nghiệp Vụ (Application & Domain Layer):**
  - Framework: **Spring Boot 3.3.4** chạy trên nền tảng **Java 21 LTS**.
  - Bảo mật: **Spring Security 6** kết hợp thư viện `jjwt 0.12.6` (Access Token 24h, Refresh Token 7 ngày).
  - Phân tích & AI: Tích hợp Google Gemini Generative AI kết hợp phân tích mẫu câu RegEx thuần Việt.
- **Tầng Dữ Liệu & Lưu Trữ (Data & Storage Layer):**
  - Cơ sở dữ liệu: **PostgreSQL 16** (quản lý bởi Docker), kết nối qua Spring Data JPA / Hibernate.
  - Lưu trữ Media: **Cloudinary Cloud Storage** (ảnh xe, ảnh CCCD 2 mặt, video bằng chứng sự cố).
- **Quy trình triển khai:** Docker Compose, Flyway DB Migration, Hỗ trợ Production trên Render Cloud Platform.

### 1.6 Tài Liệu Tham Khảo (References)
1. **IEEE Std 830-1998**: IEEE Recommended Practice for Software Requirements Specifications.
2. **Spring Boot Reference Documentation (v3.3.4)**: [https://docs.spring.io/spring-boot/docs/3.3.4/reference/html/](https://docs.spring.io/spring-boot/docs/3.3.4/reference/html/)
3. **Spring Security 6 Architecture & JWT Authentication**: [https://docs.spring.io/spring-security/reference/](https://docs.spring.io/spring-security/reference/)
4. **Tiêu chuẩn Kỹ thuật VietQR Napas 247**: Công ty Cổ phần Thanh toán Quốc gia Việt Nam (Napas).
5. **Đặc tả nghiệp vụ & Nghiên cứu đối chuẩn 10 ứng dụng Car Rental toàn cầu (Mioto, Turo, Zoomcar, Getaround)**: [`docs/driveshare_workflow_and_10_product_benchmark.md`](file:///d:/MONHOCITC/K4/Spring_ThucTap_k4/docs/driveshare_workflow_and_10_product_benchmark.md).
