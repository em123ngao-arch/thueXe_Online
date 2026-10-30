# BẢNG PHÂN CHIA NHIỆM VỤ SPRINT FINAL DEMO (HOÀN TẤT DỰ ÁN)
> **Dự án**: DriveShare - Nền tảng chia sẻ và cho thuê xe trực tuyến P2P (Spring Boot 3 & Modern Web)  
> **Phiên bản**: Sprint Final - Realtime WebSocket Notifications, Two-Way Handover & Demo Preparation  
> **Tech Lead phê duyệt**: Nguyễn Duy Bảo (`@em123ngao-arch`)  
> **Nhân sự thực hiện**: 6 thành viên (Tín, Vĩ, Phát, Quân, Bảo, Khiêm)

---

## 📌 QUY TẮC BẮT BUỘC TRONG NGÀY
1. **Làm trên nhánh riêng**: Tạo nhánh riêng theo định dạng `feature/<mã-issue>-<tên-ngắn-gọn>`. Tuyệt đối không commit trực tiếp vào `develop` hoặc `main`.
2. **Kiểm thử chi tiết tại máy cá nhân**:
   - Backend: Bắt buộc chạy `cd backend; .\mvnw.cmd test` (phải đạt 100% pass, không làm vỡ 203 bài test sẵn có).
   - Frontend: F12 Console sạch sẽ 0 lỗi đỏ, kiểm tra responsive mượt mà trên cả Mobile (375px/430px) và Desktop.
3. **Mở Pull Request vào `develop`**: Điền đầy đủ Checklist và ảnh chụp minh chứng nghiệm thu thực tế trước khi xin merge.

---

## 📊 BẢNG MA TRẬN PHÂN CÔNG TỔNG THỂ

| STT | Thành Viên | Tài Khoản GitHub | Vai Trò | Trọng Tâm Nhiệm Vụ | Mã Issue |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **1** | **Chí Tín** | `@CTnn1001` | Fullstack Dev | **Hệ thống Thông báo Đẩy Thời gian thực (WebSocket STOMP)**<br>- Spring Boot WebSocket Broker `/ws`<br>- Interceptor JWT xác thực kết nối<br>- Giao diện Pop-up Toast + Quả chuông Navbar nhảy số | Sẽ sinh tự động |
| **2** | **Lâm Chí Vĩ** | `@technology-web` | Backend Core | **Biên bản Bàn giao xe 2 chiều (Inspection 2-Way)**<br>- Trạng thái `PENDING_RENTER_CONFIRMATION`<br>- API Khách duyệt biên bản / Khiếu nại ODO, xăng<br>- Modal cho Khách xem ảnh và bấm xác nhận | Sẽ sinh tự động |
| **3** | **Ngọc Phát** | `@dongocphat007-ctrl` | AI & Security | **Tối ưu AI Chatbot & Xây dựng Module Mã OTP**<br>- Tinh chỉnh System Prompt giới hạn tư vấn xe trong DB<br>- Xây dựng `OtpService` sinh mã 6 số, TTL 60-120s | Sẽ sinh tự động |
| **4** | **Duy Quân** | `@nguyenduyquan0609-cyber` | QA Tester | **Kiểm thử Hồi quy Toàn bộ Luồng Nghiệp vụ (End-to-End QA)**<br>- Kiểm thử luồng Happy Path chuẩn bị cho demo 15 phút<br>- Rà soát các ca biên: chống trùng lịch, phạt trễ hạn, hồ sơ dossier | Sẽ sinh tự động |
| **5** | **Duy Bảo** | `@em123ngao-arch` | Project Lead | **Slide Thuyết Trình & Biểu Đồ Use Case**<br>- Biên soạn Slide thuyết trình 15 phút bảo vệ đồ án<br>- Hoàn thiện Biểu đồ Use Case Diagram chuẩn UML | Slide thuyết trình |
| **6** | **Lộc Khiêm** | `@TanKhiem` | Kiến trúc sư | **Biểu Đồ Trình Tự (Sequence Diagram)**<br>- Thiết kế Biểu đồ Sequence Diagram cho luồng Đặt xe & Thanh toán<br>- Thiết kế Biểu đồ Sequence Diagram cho Bàn giao xe & Khiếu nại | Biểu đồ Sequence |

---

## ⏰ LỊCH TRÌNH TÁC CHIẾN CHUẨN BỊ CHO BUỔI DEMO

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🌅 CA SÁNG: TRIỂN KHAI TÍNH NĂNG & DỰNG KHUNG SLIDE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Tín: Cấu hình Spring Boot WebSocket Broker & Viết NotificationPushService │
│ • Vĩ: Thêm enum trạng thái biên bản bàn giao & viết API cho Khách duyệt    │
│ • Phát: Tinh chỉnh prompt AI từ chối xe ngoài sàn & viết OtpService        │
│ • Bảo & Khiêm: Lên dàn ý 15 slide thuyết trình + Dựng khung sơ đồ UML       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 🌇 CA CHIỀU: GHÉP NỐI GIAO DIỆN & KIỂM THỬ HỒI QUY                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Tín: Viết websocket-notification.js + Giao diện Toast Pop-up & Chuông     │
│ • Vĩ: Ghép Modal ký nhận biên bản cho Khách trên trang Chuyến đi           │
│ • Quân: Bắt đầu chạy bộ kịch bản E2E Test Scenarios, bắt lỗi và báo dev     │
│ • Bảo & Khiêm: Vẽ xong Biểu đồ Use Case & Sequence Diagram chèn vào Slide   │
├─────────────────────────────────────────────────────────────────────────────┤
│ 🌙 CA TỐI: CHẠY THỬ TOÀN DIỆN & TỔNG DUYỆT (DRY RUN)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Cả nhóm: Mở 2 máy demo thử kịch bản 15 phút từ đầu đến cuối              │
│ • Kiểm tra WebSocket bắn thông báo tức thì 0 độ trễ                        │
│ • Đảm bảo .\mvnw.cmd test 100% xanh và F12 Console 0 lỗi đỏ                 │
│ • Tech Lead Bảo Squash Merge các PR vào develop và main chuẩn bị sáng mai   │
└─────────────────────────────────────────────────────────────────────────────┘
```

