import pptx
from copy import deepcopy
import sys

sys.stdout.reconfigure(encoding='utf-8')

src_file = 'docs/Slide_Bao_Ve_Do_An_DriveShare_K4_V4_15Slides_WithNotes.pptx'
prs = pptx.Presentation(src_file)

clean_notes = {
    0: """⏱️ [00:00 - 00:20] | SLIDE 1: MỞ ĐẦU
Kính thưa quý Thầy, Cô trong Hội đồng!
Em là Nguyễn Duy Bảo, đại diện nhóm xin báo cáo đề tài khóa luận tốt nghiệp:
"DriveShare — Nền tảng chia sẻ và cho thuê xe tự lái trực tuyến", dưới sự hướng dẫn của Thầy Trương Thanh Bình.""",

    1: """⏱️ [00:20 - 00:45] | SLIDE 2: 1.1 BỐI CẢNH & BẤT CẬP
Lý do nhóm chọn đề tài xuất phát từ 3 bất cập lớn của việc thuê xe truyền thống:
1. Rủi ro tài sản: Khách phải thế chấp xe máy kèm cà-vẹt hoặc bị giữ CCCD gốc.
2. Tranh chấp trầy xước: Dễ cãi vã khi trả xe vì không có biên bản bàn giao minh bạch.
3. Rủi ro chủ xe: Nguy cơ khách giữ xe quá hạn hoặc đem xe đi cầm cố.""",

    2: """⏱️ [00:45 - 01:10] | SLIDE 3: 1.2 BẢNG ĐỐI CHUẨN (MIOTO vs ZOOMCAR vs DRIVESHARE)
So với các nền tảng trên thị trường, DriveShare tạo ra 3 điểm đột phá:
1. Chuẩn hóa bàn giao 2 chiều: Dùng biên bản điện tử kèm 4 ảnh và số ODO.
2. An toàn tiền cọc: Giữ cọc trung gian 30% qua VietQR chuẩn Escrow.
3. Trợ lý AI thông minh: Tích hợp Gemini tư vấn và gợi ý xe theo nhu cầu.""",

    3: """⏱️ [01:10 - 01:30] | SLIDE 4: 1.3 MỤC TIÊU ĐỀ TÀI
Từ các bài toán trên, nhóm xác định 4 mục tiêu cốt lõi:
1. Xây dựng Sàn P2P tiện lợi: Đóng vai trò sàn công nghệ kết nối chủ xe và khách thuê.
2. Chuẩn hóa quy trình: Bàn giao xe 2 chiều Check-in và Check-out số hóa.
3. Minh bạch dòng tiền: Cơ chế ký quỹ cọc VietQR 30% an toàn.
4. Tích hợp công nghệ mới: Ứng dụng AI hỗ trợ tìm xe tự động.""",

    4: """⏱️ [01:30 - 02:00] | SLIDE 5: 2.1 KIẾN TRÚC HEXAGONAL & TECH STACK
• NÓI LƯỚT SƠ ĐỒ: Hệ thống xây dựng theo Kiến trúc Lục giác (Hexagonal Architecture) gồm 3 tầng: Core Domain ở giữa, Use Cases và tầng Adapters giao tiếp bên ngoài qua Ports.
• VÍ DỤ THỰC TẾ: Nghiệp vụ tính cọc 30% nằm trọn trong Core Domain. Sau này nếu đổi cổng thanh toán từ VietQR sang MoMo hay VNPay, nhóm chỉ việc thay Adapter bên ngoài mà không phải sửa một dòng code nghiệp vụ nào bên trong.""",

    5: """⏱️ [02:00 - 02:25] | SLIDE 6: 2.2 BIỂU ĐỒ USE CASE
• NÓI LƯỚT SƠ ĐỒ: Biểu đồ Use Case thể hiện sự phối hợp chặt chẽ giữa 2 tác nhân chính là Khách thuê và Chủ xe trên sàn.
• VÍ DỤ THỰC TẾ: Khi khách gửi yêu cầu thuê, chủ xe sẽ nhận thông báo để phê duyệt. Chỉ khi chủ xe bấm duyệt thì mã VietQR cọc tiền của khách mới được mở ra, giúp chủ xe luôn chủ động quyết định lịch trình xe mình.""",

    6: """⏱️ [02:25 - 03:00] | SLIDE 7: 2.3 THIẾT KẾ CƠ SỞ DỮ LIỆU SERVER
• Ý NGHĨA 4 BẢNG HẠT NHÂN:
  1. users: Quản lý tài khoản và thông tin cá nhân của Khách thuê, Chủ xe và Admin.
  2. cars: Quản lý danh sách xe, biển số, giá thuê và trạng thái xe của chủ.
  3. rentals: Quản lý hợp đồng thuê xe, ngày bắt đầu - ngày kết thúc và trạng thái chuyến đi.
  4. payments: Quản lý dòng tiền, lưu vết khoản cọc 30% và thanh toán qua VietQR.
• VÍ DỤ LIÊN KẾT: Khi khách đặt xe, hệ thống tạo 1 dòng trong rentals để nối user với car, đồng thời sinh 1 giao dịch trong payments để giữ cọc, dữ liệu hoàn toàn đồng bộ và không thể thất thoát.""",

    7: """⏱️ [03:00 - 03:40] | SLIDE 8: 2.4 VÒNG ĐỜI ĐƠN THUÊ (STATE MACHINE)
• LUỒNG CHÍNH 5 BƯỚC (HAPPY PATH):
  1. Khách gửi đơn thuê -> Trạng thái PENDING.
  2. Chủ xe bấm duyệt -> Chuyển sang APPROVED.
  3. Khách quét mã VietQR cọc 30% -> Chuyển sang CONFIRMED (khóa lịch xe).
  4. Hai bên làm biên bản Check-in -> Chuyển sang IN_PROGRESS (xe lăn bánh).
  5. Trả xe Check-out an toàn -> Chuyển sang COMPLETED (hệ thống tự động quyết toán 90% về ví chủ xe).
• NHÁNH PHỤ: Nếu quá 45 phút khách không cọc thì tự sang EXPIRED; nếu có sự cố thì sang DISPUTED để Admin phân xử.""",

    8: """⏱️ [03:40 - 04:15] | SLIDE 9: 2.5 CƠ CHẾ KHÓA 2 TẦNG (TWO-TIER LOCKING)
• NÓI LƯỚT SƠ ĐỒ: Để chặn triệt để việc nhiều người cùng đặt 1 xe tại cùng 1 thời điểm, hệ thống dùng cơ chế Khóa 2 tầng: Tầng 1 Soft Lock 45 phút và Tầng 2 Hard Lock sau cọc.
• VÍ DỤ CỤ THỂ: Khi khách được chủ xe duyệt đơn, hệ thống kích hoạt Soft Lock khóa mềm xe trong 45 phút. Khoảng thời gian này giữ độc quyền xe cho khách an tâm quét mã cọc 30% mà không sợ người khác đặt đè lên. Khi cọc xong, xe chuyển sang Hard Lock khóa cứng vĩnh viễn trên lịch; còn nếu sau 45 phút khách không cọc, hệ thống tự động nhả khóa để khách khác thuê.""",

    9: """⏱️ [04:15 - 04:40] | SLIDE 10: 3.1 THỰC NGHIỆM: PHÂN HỆ KHÁCH THUÊ
Giao diện Khách thuê được tối ưu chuẩn Mobile Responsive:
1. Tìm xe thông minh: Lọc nhanh theo tỉnh thành, số chỗ, mức giá và có AI tư vấn.
2. Thanh toán tiện lợi: Quét mã VietQR động có sẵn số tiền cọc 30% và nội dung chuyển khoản.
3. Quản lý hành trình: Theo dõi chi tiết lịch trình và trạng thái chuyến đi trực tiếp trên điện thoại.""",

    10: """⏱️ [04:40 - 05:05] | SLIDE 11: 3.2 THỰC NGHIỆM: PHÂN HỆ CHỦ XE
Bộ công cụ số hóa giúp chủ xe quản lý tài sản nhàn rỗi:
1. Quản lý đội xe: Chủ động bật/tắt lịch rảnh bận và duyệt các yêu cầu thuê mới.
2. Biên bản số hóa: Lập biên bản bàn giao xe ngay trên web kèm ảnh chụp và số ODO.
3. Quản lý tài chính: Theo dõi ví tiền và nhận 90% doanh thu quyết toán tự động sau chuyến đi.""",

    11: """⏱️ [05:05 - 05:35] | SLIDE 12: 3.3 THỰC NGHIỆM: PHÂN HỆ ADMIN
Trung tâm điều hành kiểm soát rủi ro toàn sàn:
1. Giám sát tổng quan: Theo dõi biểu đồ xe, thành viên và dòng tiền thời gian thực.
2. Xử lý tranh chấp: Dispute Center cho phép hoàn cọc 100% nếu chủ xe bùng kèo.
3. Chế tài xe quá hạn: Xuất Hồ sơ Pháp lý 1-click (Dossier) gồm CCCD, bằng lái, ảnh Check-in để nộp công an xử lý theo Điều 175 Bộ luật Hình sự.""",

    12: """⏱️ [05:35 - 06:15] | SLIDE 13: 3.4 QUY TRÌNH BÀN GIAO 2 CHIỀU (CHECK-IN & CHECK-OUT)
• NÓI LƯỚT SƠ ĐỒ: Slide 3.4 thể hiện quy trình số hóa 2 chiều để loại bỏ hoàn toàn tranh chấp cọ quẹt hư hỏng xe:
• CHECK-IN (LÚC NHẬN XE SẼ CHỤP VÀ GỬI NHỮNG GÌ?):
  Chủ xe chụp thực tế 4 góc quanh xe (đầu, đuôi, sườn trái, sườn phải), ghi nhận số ODO (số km đồng hồ) và mức nhiên liệu/pin. Khách kiểm tra ảnh và số liệu trên máy mình rồi bấm xác nhận điện tử để xe lăn bánh.
• CHECK-OUT (LÚC TRẢ XE):
  Chủ xe đối chiếu số ODO và mở 4 ảnh Check-in ra so sánh xem có vết trầy xước mới nào không. Xe nguyên vẹn thì bấm hoàn tất là hệ thống quyết toán giải phóng cọc ngay, hai bên không ai cãi nhau được.""",

    13: """⏱️ [06:15 - 06:40] | SLIDE 14: KẾT LUẬN & HẠN CHẾ
Với tinh thần cầu thị và trung thực khoa học, nhóm xin báo cáo 4 hạn chế hiện tại và định hướng phát triển:
1. Xác nhận VietQR: Đang dùng nút bấm mô phỏng Webhook và Fast Polling 3s -> Hướng tới tích hợp Webhook biến động số dư tự động qua Casso/SePay.
2. Thẩm định eKYC: Admin đang duyệt thủ công bằng mắt trên ảnh chụp CCCD/GPLX -> Hướng tới tích hợp AI OCR bóc tách giấy tờ và so khớp khuôn mặt sinh trắc.
3. Thông báo Realtime: Đang sử dụng cơ chế Smart Polling 5s đảm bảo ổn định trên Render Cloud -> Hướng tới nâng cấp kết nối hai chiều WebSocket STOMP Broker khi có máy chủ độc lập.
4. Bản đồ tương tác: Đang quản lý tọa độ trong CSDL và lọc theo Tỉnh/Thành -> Hướng tới nhúng bản đồ tương tác Mapbox/Leaflet tìm xe theo bán kính 5 - 10km.
Nhóm đã lên lộ trình kỹ thuật cụ thể để nâng cấp các hạng mục này trong giai đoạn tiếp theo.""",

    14: """⏱️ [06:40 - 07:00] | SLIDE 15: Q&A & CHUYỂN SANG DEMO
Bài báo cáo khóa luận của nhóm em đến đây xin được hoàn tất.
Nhóm xin trân trọng cảm ơn quý Thầy, Cô trong Hội đồng đã chú ý lắng nghe!
Sau đây, nhóm xin kính mời quý Thầy, Cô chuyển sang phần xem video demo sản phẩm thực tế của nền tảng DriveShare!"""
}

for idx, slide in enumerate(prs.slides):
    note_text = clean_notes.get(idx, "")
    tf = slide.notes_slide.notes_text_frame
    tf.text = note_text

prs.save(src_file)
print("Updated Slide_Bao_Ve_Do_An_DriveShare_K4_V4_15Slides_WithNotes.pptx successfully!")

