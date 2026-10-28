# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS)
## DỰ ÁN: NỀN TẢNG CHO THUÊ XE CÁ NHÂN TRỰC TUYẾN — DRIVESHARE
*(Software Requirements Specification — According to IEEE Std 830-1998 / ISO/IEC/IEEE 29148:2018)*

---

### THÔNG TIN DỰ ÁN
- **Tên đề tài:** DriveShare – Nền tảng cho thuê xe cá nhân trực tuyến (P2P Car Rental Platform)
- **Mã môn học / Đồ án:** Đồ án Phát triển Phần mềm / Công nghệ Phần mềm
- **Phiên bản tài liệu:** 1.0.0
- **Ngày phát hành:** Tháng 10/2026
- **Trạng thái:** Hoàn thành Chương 1 (Sẵn sàng nghiệm thu & điểm danh)

---

# CHƯƠNG 1: GIỚI THIỆU (INTRODUCTION)

## 1.1. Mục đích tài liệu (Purpose)
Tài liệu **Đặc tả Yêu cầu Phần mềm (Software Requirements Specification - SRS)** này nhằm mục đích:
1. Xác định, mô tả chi tiết và chuẩn hóa toàn bộ các yêu cầu nghiệp vụ, yêu cầu chức năng (Functional Requirements), yêu cầu phi chức năng (Non-Functional Requirements) cũng như các ràng buộc thiết kế kỹ thuật cho hệ thống **DriveShare – Nền tảng cho thuê xe cá nhân trực tuyến**.
2. Thiết lập cơ sở pháp lý và kỹ thuật thống nhất giữa Giảng viên hướng dẫn, Hội đồng đánh giá và Đội ngũ phát triển dự án (Project Team).
3. Đóng vai trò là kim chỉ nam tham chiếu duy nhất xuyên suốt các giai đoạn:
   - Phân tích & Thiết kế hệ thống (System Analysis & Architecture Design).
   - Hiện thực hóa mã nguồn (Backend, Frontend, Database Implementation).
   - Kiểm thử phần mềm (Verification & Validation Testing).
   - Nghiệm thu, đánh giá và bảo vệ đồ án kết thúc môn.

Tài liệu này áp dụng cho toàn bộ phạm vi phát hành của hệ thống DriveShare (bao gồm phiên bản Web Khách hàng, Web Chủ xe và Phân hệ Quản trị Vận hành).

---

## 1.2. Phạm vi sản phẩm (Scope of the Product)

### 1.2.1. Tên sản phẩm & Định vị
- **Tên thương mại:** **DriveShare** (P2P Car Rental Platform).
- **Mô hình hoạt động:** Sàn thương mại điện tử kết nối người dùng theo mô hình **Peer-to-Peer (P2P)** tương tự Mioto và Turo, ứng dụng cơ chế Sàn giao dịch giữ tiền đảm bảo (**Escrow Model**) nhằm giải quyết bài toán niềm tin giữa người lạ.

### 1.2.2. Bối cảnh & Bài toán thực tiễn
Thị trường thuê xe tự lái tại Việt Nam hiện đang tồn tại nhiều bất cập:
- **Phía Khách thuê:** Khó tìm xe vào mùa cao điểm, thủ tục giữ giấy tờ vật lý (sổ hộ khẩu, CCCD, xe máy cọc) rườm rà, minh bạch giá cả thấp, dễ xảy ra tranh chấp phụ phí vô lý khi trả xe.
- **Phía Chủ xe:** Phương tiện cá nhân nhàn rỗi lớn không sinh lời, rủi ro cao về mất mát tài sản, khách làm hư hỏng hoặc vi phạm giao thông (phạt nguội), lo ngại bị trùng lịch thuê khi nhiều người hỏi cùng lúc.
- **Phía Đơn vị vận hành truyền thống:** Quản lý thủ công bằng sổ sách/tin nhắn Zalo, thiếu cơ chế tự động hóa kiểm soát trạng thái xe và đối soát dòng tiền.

### 1.2.3. Giải pháp của DriveShare
Hệ thống **DriveShare** cung cấp một nền tảng kỹ thuật số toàn diện với các mục tiêu trọng tâm:
1. **Số hóa thủ tục & Xác minh điện tử (eKYC):** Khách thuê và Chủ xe được định danh qua CCCD/GPLX trực tuyến, giảm thiểu tối đa rủi ro pháp lý và loại bỏ việc giữ giấy tờ gốc tùy tiện.
2. **Cơ chế Khóa 2 giai đoạn (Soft Lock & Hard Lock):** Xử lý triệt để bài toán đồng thời (Concurrency / Race Condition) khi nhiều khách hàng cùng yêu cầu một chiếc xe trong một khung giờ, bảo đảm không bao giờ xảy ra tình trạng "Double-booking".
3. **Mô hình Ký quỹ Escrow an toàn:** Hệ thống đóng vai trò trung gian giữ khoản tiền đặt cọc (Deposit) và chỉ thanh quyết toán cho Chủ xe (Payout) khi hợp đồng thuê kết thúc tốt đẹp và hai bên đã ký biên bản bàn giao điện tử.
4. **Biên bản bàn giao số hóa (Digital Handover Record):** Ghi nhận trực quan chỉ số công tơ mét (ODO), mức nhiên liệu và hình ảnh hiện trạng xe 6 góc tại thời điểm giao/nhận xe, làm căn cứ pháp lý minh bạch để tính phụ phí hoặc phân giải tranh chấp.
5. **Định hướng tích hợp Trí tuệ Nhân tạo (AI Integration):** Hỗ trợ tìm kiếm, gợi ý xe thông minh theo ngữ cảnh tự nhiên và tóm tắt biên bản sự cố phục vụ hỗ trợ khách hàng nhanh chóng.

### 1.2.4. Ranh giới hệ thống (System Boundaries)
- **Thuộc phạm vi hệ thống:**
  - Cổng Web tương tác dành cho Khách thuê (Renter) và Chủ xe (Owner).
  - Cổng Quản trị & Vận hành dành cho Nhân viên hỗ trợ (Staff) và Quản trị viên (Admin).
  - Hệ thống máy chủ ứng dụng Backend (RESTful APIs, Spring Boot).
  - Cơ sở dữ liệu tập trung (MySQL Relational Database v2).
  - Cổng giả lập cổng thanh toán trực tuyến (VietQR / VNPay Sandbox) và cơ chế hoàn tiền.
- **Nằm ngoài phạm vi hệ thống (External Systems):**
  - Hệ thống kết nối trực tiếp thiết bị GPS phần cứng trên ô tô (dùng dữ liệu khai báo qua biên bản ODO).
  - Hệ thống tra cứu phạt nguội tự động từ Cục Cảnh sát Giao thông (thực hiện qua khiếu nại hậu kiểm).

---

## 1.3. Định nghĩa, từ viết tắt và thuật ngữ (Definitions, Acronyms, and Abbreviations)

| Thuật ngữ / Viết tắt | Tên tiếng Anh đầy đủ | Giải thích chi tiết trong hệ thống DriveShare |
|:---|:---|:---|
| **SRS** | Software Requirements Specification | Tài liệu Đặc tả Yêu cầu Phần mềm theo chuẩn công nghệ phần mềm. |
| **P2P** | Peer-to-Peer | Mô hình kinh tế chia sẻ kết nối trực tiếp cá nhân với cá nhân (Chủ xe và Khách thuê). |
| **Renter** | Vehicle Renter | Khách thuê xe cá nhân có giấy phép lái xe hợp lệ. |
| **Owner / Host** | Vehicle Owner | Chủ sở hữu phương tiện cá nhân đăng ký cho thuê xe trên hệ thống. |
| **Staff** | Operation / Support Staff | Nhân viên vận hành của sàn, chịu trách nhiệm duyệt xe, xác thực GPLX và phân giải tranh chấp. |
| **Admin** | System Administrator | Quản trị viên cấp cao, quản trị người dùng, cấu hình tham số chính sách và xem báo cáo kinh doanh. |
| **eKYC** | Electronic Know Your Customer | Quy trình định danh và xác minh danh tính người dùng điện tử qua ảnh chụp CCCD và GPLX. |
| **GPLX** | Driving License | Giấy phép lái xe ô tô hạng B1/B2 trở lên tại Việt Nam. |
| **CCCD** | Citizen Identity Card | Căn cước công dân gắn chip phục vụ định danh cá nhân. |
| **ODO** | Odometer | Chỉ số đồng hồ đo quãng đường đã di chuyển của ô tô (tính bằng km). |
| **Escrow** | Escrow Financial Model | Mô hình ký quỹ trung gian: Sàn giữ tiền cọc của khách và chỉ giải ngân sau khi chuyến đi hoàn tất. |
| **Soft Lock** | Soft Reservation Lock | Khóa giữ chỗ tạm thời (45 phút) sau khi Chủ xe duyệt yêu cầu để khách thanh toán cọc; tạm ẩn xe khỏi kết quả tìm kiếm. |
| **Hard Lock** | Hard Reservation Lock | Khóa cứng lịch xe sau khi khách cọc thành công; tự động từ chối tất cả các yêu cầu khác trùng lịch. |
| **Handover** | Handover Record | Biên bản bàn giao nhận/trả xe điện tử kèm chỉ số xăng, ODO và ảnh chụp hiện trạng. |
| **Dispute** | Dispute / Complaint | Tranh chấp phát sinh giữa hai bên về hư hỏng, phụ phí hoặc vi phạm thỏa thuận cần Staff can thiệp. |
| **JWT** | JSON Web Token | Chuỗi mã hóa stateless dùng để xác thực và ủy quyền truy cập API an toàn. |
| **RBAC** | Role-Based Access Control | Kiểm soát truy cập dựa trên vai trò người dùng (Renter, Owner, Staff, Admin). |
| **VietQR / VNPay** | Payment Gateway Standards | Chuẩn thanh toán mã QR ngân hàng và cổng thanh toán trực tuyến tại Việt Nam. |
| **3NF** | Third Normal Form | Dạng chuẩn 3 trong thiết kế cơ sở dữ liệu quan hệ, loại bỏ dư thừa dữ liệu. |

---

## 1.4. Tài liệu tham khảo (References)
Tài liệu SRS này được xây dựng dựa trên các tiêu chuẩn và tài liệu nguồn sau:
1. **IEEE Std 830-1998**: *IEEE Recommended Practice for Software Requirements Specifications*.
2. **ISO/IEC/IEEE 29148:2018**: *Systems and software engineering — Life cycle processes — Requirements engineering*.
3. **Đề cương & Đề bài đồ án**: *DriveShare – Nền tảng cho thuê xe cá nhân trực tuyến*, Giảng viên bộ môn Công nghệ Phần mềm, 2026.
4. **Tài liệu Đặc tả Nghiệp vụ v2.0**: `dac-ta-p2p-car-rental-hoan-chinh-v2.0.md`, DriveShare Engineering Team.
5. **Quy tắc nghiệp vụ**: `docs/requirements/business-rules.md`, DriveShare Sprint 1 Specs.
6. **Mô hình kiến trúc CSDL v2**: `docs/database/DriveShare_Database_Design_v2.sql`.
7. **Luật Giao thông đường bộ số 23/2008/QH12** và các quy định hiện hành về giao dịch thương mại điện tử tại Việt Nam.

---

## 1.5. Đối tượng độc giả mục tiêu (Intended Audience)
Tài liệu được biên soạn phục vụ các nhóm độc giả sau:
1. **Giảng viên hướng dẫn & Hội đồng chấm thi:** Sử dụng để đánh giá tính đầy đủ, tính khả thi, chuẩn mực kỹ thuật và mức độ hoàn thiện của đề tài so với yêu cầu ban đầu.
2. **Nhóm Lập trình viên Backend (Backend Developers):** Căn cứ vào các luồng nghiệp vụ và quy tắc dữ liệu để thiết kế REST API, State Machine của Booking, Transaction Locking và các Worker tự động.
3. **Nhóm Lập trình viên Frontend (Frontend Developers):** Nắm bắt các luồng màn hình, trạng thái tương tác của người dùng, phân quyền hiển thị và tích hợp API.
4. **Nhóm Kiểm thử (QA / QC Testers):** Xây dựng Ma trận truy xuất nguồn gốc (Traceability Matrix), thiết kế Test Cases (Unit Test, Integration Test, E2E Test) và kịch bản nghiệm thu (User Acceptance Testing - UAT).
5. **Quản trị viên Cơ sở dữ liệu (DBA):** Tham chiếu quan hệ thực thể, ràng buộc toàn vẹn, chiến lược tạo chỉ mục (Index) và bảo đảm hiệu năng truy vấn.

---

## 1.6. Tổng quan cấu trúc tài liệu (Document Overview)
Tài liệu SRS của hệ thống DriveShare được bố cục thành 5 chương chính:
- **Chương 1: Giới thiệu (Introduction)** *(Chương hiện tại)*: Cung cấp mục đích, phạm vi sản phẩm, bảng thuật ngữ, tài liệu tham khảo và đối tượng độc giả.
- **Chương 2: Mô tả tổng quan hệ thống (Overall Description)**: Trình bày bối cảnh sản phẩm, chân dung các Actor, sơ đồ Use Case tổng quát, các giả định và phụ thuộc công nghệ.
- **Chương 3: Yêu cầu giao diện & Hệ thống bên ngoài (External Interface Requirements)**: Mô tả giao diện người dùng (User Interfaces), giao diện phần cứng, phần mềm và giao thức mạng/API.
- **Chương 4: Yêu cầu chức năng chi tiết (System Features / Functional Requirements)**: Đặc tả chi tiết từng Use Case cho 5 phân hệ (Quản lý tài khoản & eKYC, Quản lý phương tiện, Đặt xe & Khóa lịch, Bàn giao & Phụ phí, Thanh toán & Tranh chấp).
- **Chương 5: Yêu cầu phi chức năng & Ràng buộc thiết kế (Non-Functional Requirements & Design Constraints)**: Đặt ra các tiêu chuẩn về bảo mật (Security), độ tin cậy (Reliability), hiệu năng xử lý (Performance) và tính toàn vẹn đồng thời (Concurrency Handling).
