import pptx
from copy import deepcopy
import sys

sys.stdout.reconfigure(encoding='utf-8')

notes_5m = {
    0: """⏱️ [00:00 - 00:15] | SLIDE 1: MỞ ĐẦU
Kính thưa quý Thầy, Cô trong Hội đồng!
Em là Nguyễn Duy Bảo, đại diện nhóm xin báo cáo khóa luận tốt nghiệp: "DriveShare — Nền tảng chia sẻ và cho thuê xe tự lái trực tuyến", dưới sự hướng dẫn của Thầy Trương Thanh Bình.""",

    1: """⏱️ [00:15 - 00:35] | SLIDE 2: 1.1 BỐI CẢNH & 3 BẤT CẬP THUÊ XE TRUYỀN THỐNG
Lý do nhóm chọn đề tài xuất phát từ 3 bất cập lớn:
1. Rủi ro giữ tài sản: Khách bị ép thế chấp xe máy kèm cà-vẹt hoặc giữ CCCD gốc.
2. Tranh chấp trầy xước: Dễ cãi vã khi trả xe do không có biên bản bàn giao rõ ràng.
3. Rủi ro chủ xe: Nguy cơ khách giữ xe quá hạn hoặc đem xe đi cầm cố.""",

    2: """⏱️ [00:35 - 00:55] | SLIDE 3: 1.2 BẢNG ĐỐI CHUẨN (MIOTO vs ZOOMCAR vs DRIVESHARE)
So với các nền tảng hiện nay, DriveShare tạo ra 3 điểm đột phá:
1. Chuẩn hóa bàn giao 2 chiều bằng biên bản điện tử kèm 4 ảnh và số ODO.
2. Giữ cọc trung gian 30% qua VietQR chuẩn Escrow an toàn.
3. Tích hợp trợ lý AI Gemini tư vấn gợi ý xe thông minh.""",

    3: """⏱️ [00:55 - 01:10] | SLIDE 4: 1.3 4 MỤC TIÊU CỐT LÕI
Từ các bài toán đó, nhóm xác định 4 mục tiêu:
1. Xây dựng Sàn P2P tiện lợi: Đóng vai trò sàn công nghệ kết nối chủ xe và khách thuê.
2. Chuẩn hóa quy trình: Bàn giao xe 2 chiều Check-in & Check-out số hóa.
3. Minh bạch dòng tiền: Ký quỹ cọc VietQR 30% an toàn.
4. Ứng dụng AI: Hỗ trợ tìm xe tự động theo nhu cầu.""",

    4: """⏱️ [01:10 - 01:35] | SLIDE 5: 2.1 KIẾN TRÚC HEXAGONAL & TECH STACK
• NÓI LƯỚT SƠ ĐỒ: Hệ thống áp dụng Kiến trúc Lục giác (Hexagonal) phân tách 3 tầng: Core Domain ở giữa, Use Cases, và tầng Adapters giao tiếp qua Ports.
• VÍ DỤ THỰC TẾ: Nghiệp vụ tính cọc 30% nằm trọn trong Core Domain. Sau này nếu đổi cổng thanh toán từ VietQR sang MoMo hay VNPay, nhóm chỉ việc thay Adapter bên ngoài mà không sửa một dòng code nghiệp vụ nào bên trong.""",

    5: """⏱️ [01:35 - 01:55] | SLIDE 6: 2.2 BIỂU ĐỒ USE CASE
• NÓI LƯỚT SƠ ĐỒ: Biểu đồ Use Case thể hiện sự phối hợp chặt chẽ giữa 2 tác nhân chính là Khách thuê và Chủ xe trên sàn.
• VÍ DỤ THỰC TẾ: Khi khách gửi yêu cầu thuê, chủ xe nhận thông báo để phê duyệt. Chỉ khi chủ xe bấm duyệt thì mã VietQR cọc tiền của khách mới được mở ra, đảm bảo chủ xe luôn chủ động quyết định lịch trình xe mình.""",

    6: """⏱️ [01:55 - 02:20] | SLIDE 7: 2.3 THIẾT KẾ CƠ SỞ DỮ LIỆU SERVER
• Ý NGHĨA 4 BẢNG HẠT NHÂN:
  1. users: Quản lý thông tin tài khoản Khách thuê, Chủ xe và Admin.
  2. cars: Quản lý danh sách xe, biển số, giá thuê và trạng thái xe của chủ.
  3. rentals: Quản lý hợp đồng thuê xe, ngày bắt đầu - kết thúc và trạng thái chuyến đi.
  4. payments: Quản lý dòng tiền, lưu vết khoản cọc 30% và thanh toán qua VietQR.
• VÍ DỤ LIÊN KẾT: Khi khách đặt xe, hệ thống tạo 1 hợp đồng trong rentals nối user với car, đồng thời sinh 1 giao dịch trong payments để giữ cọc, dữ liệu hoàn toàn đồng bộ.""",

    7: """⏱️ [02:20 - 02:50] | SLIDE 8: 2.4 VÒNG ĐỜI ĐƠN THUÊ (STATE MACHINE)
• LUỒNG CHÍNH 5 BƯỚC (HAPPY PATH):
  1. Khách gửi đơn thuê -> Trạng thái PENDING.
  2. Chủ xe bấm duyệt -> Chuyển sang APPROVED.
  3. Khách quét VietQR cọc 30% -> Chuyển sang CONFIRMED (khóa lịch xe).
  4. Bàn giao Check-in -> Chuyển sang IN_PROGRESS (xe lăn bánh).
  5. Trả xe Check-out an toàn -> Chuyển sang COMPLETED (tự động quyết toán 90% về ví chủ xe).
• NHÁNH PHỤ: Quá 45 phút không cọc thì tự sang EXPIRED; có sự cố thì sang DISPUTED để Admin phân xử.""",

    8: """⏱️ [02:50 - 03:15] | SLIDE 9: 2.5 CƠ CHẾ KHÓA 2 TẦNG (TWO-TIER LOCKING)
• NÓI LƯỚT SƠ ĐỒ: Để chặn việc nhiều người cùng đặt 1 xe cùng thời điểm, hệ thống dùng cơ chế Khóa 2 tầng: Tầng 1 Soft Lock 45 phút và Tầng 2 Hard Lock sau cọc.
• VÍ DỤ CỤ THỂ: Khi khách được chủ xe duyệt đơn, hệ thống kích hoạt Soft Lock khóa mềm xe trong 45 phút để giữ xe cho khách an tâm chuyển cọc 30% mà không sợ người khác đặt đè lên. Khi cọc xong, xe chuyển sang Hard Lock khóa cứng vĩnh viễn trên lịch; nếu quá 45 phút không cọc thì tự động nhả khóa để khách khác thuê.""",

    9: """⏱️ [03:15 - 03:35] | SLIDE 10: 3.1 THỰC NGHIỆM: PHÂN HỆ KHÁCH THUÊ
Giao diện Khách thuê được tối ưu chuẩn Mobile Responsive:
1. Tìm xe thông minh: Lọc nhanh theo tỉnh thành, số chỗ, giá thuê và có AI tư vấn.
2. Thanh toán tiện lợi: Quét mã VietQR động có sẵn số tiền cọc 30% và nội dung chuyển khoản.
3. Quản lý hành trình: Theo dõi chi tiết lộ trình và trạng thái chuyến đi trực tiếp trên điện thoại.""",

    10: """⏱️ [03:35 - 03:55] | SLIDE 11: 3.2 THỰC NGHIỆM: PHÂN HỆ CHỦ XE
Bộ công cụ số hóa giúp chủ xe quản lý tài sản nhàn rỗi:
1. Quản lý đội xe: Chủ động bật/tắt lịch rảnh bận và duyệt các yêu cầu thuê mới.
2. Biên bản số hóa: Lập biên bản bàn giao xe ngay trên web kèm ảnh chụp 4 góc và số ODO.
3. Quản lý tài chính: Theo dõi ví tiền và nhận 90% doanh thu quyết toán tự động sau chuyến đi.""",

    11: """⏱️ [03:55 - 04:15] | SLIDE 12: 3.3 THỰC NGHIỆM: PHÂN HỆ ADMIN
Trung tâm điều hành kiểm soát rủi ro toàn sàn:
1. Giám sát tổng quan: Theo dõi biểu đồ xe, thành viên và dòng tiền thời gian thực.
2. Xử lý tranh chấp: Dispute Center cho phép hoàn cọc 100% nếu chủ xe bùng kèo.
3. Chế tài xe quá hạn: Xuất Hồ sơ Pháp lý 1-click (Dossier) gồm CCCD, bằng lái, ảnh Check-in để nộp công an xử lý theo Điều 175 Bộ luật Hình sự.""",

    12: """⏱️ [04:15 - 04:40] | SLIDE 13: 3.4 QUY TRÌNH BÀN GIAO 2 CHIỀU (CHECK-IN & CHECK-OUT)
• NÓI LƯỚT SƠ ĐỒ: Slide 3.4 thể hiện quy trình số hóa 2 chiều triệt tiêu hoàn toàn tranh chấp cọ quẹt:
• CHECK-IN (NHẬN XE): Chủ xe chụp thực tế 4 góc quanh xe (đầu, đuôi, 2 bên sườn), ghi nhận số ODO và mức nhiên liệu/pin. Khách kiểm tra ảnh và số liệu trên máy mình rồi bấm xác nhận điện tử để xe lăn bánh.
• CHECK-OUT (TRẢ XE): Chủ xe đối chiếu số ODO và mở 4 ảnh Check-in ra so sánh xem có vết trầy xước mới nào không. Xe nguyên vẹn thì bấm hoàn tất là hệ thống quyết toán giải phóng cọc ngay.""",

    13: """⏱️ [04:40 - 04:55] | SLIDE 14: KẾT LUẬN & HẠN CHẾ
Với tinh thần cầu thị, nhóm xin báo cáo 3 hạn chế hiện tại:
1. Cổng thanh toán: VietQR đang dùng nút mô phỏng Webhook thay vì kết nối ngân hàng thật.
2. Giám sát thực tế: Chưa tích hợp thiết bị phần cứng định vị GPS trên xe.
3. Ngôn ngữ: Chưa hỗ trợ chuyển đổi đa ngôn ngữ cho khách nước ngoài.
Nhóm đã lên kế hoạch nâng cấp các phần này trong tương lai.""",

    14: """⏱️ [04:55 - 05:05] | SLIDE 15: Q&A & CHUYỂN SANG DEMO
Bài báo cáo khóa luận của nhóm em đến đây xin được hoàn tất.
Nhóm xin trân trọng cảm ơn quý Thầy, Cô trong Hội đồng đã chú ý lắng nghe!
Sau đây, nhóm xin kính mời quý Thầy, Cô chuyển sang phần xem video demo sản phẩm thực tế kéo dài 10 phút của nền tảng DriveShare!"""
}

def update_pptx(file_path):
    prs = pptx.Presentation(file_path)
    ref_sp_tree = prs.slides[0].notes_slide.shapes._spTree
    ref_sps = ref_sp_tree.findall('{http://schemas.openxmlformats.org/presentationml/2006/main}sp')
    
    for idx, slide in enumerate(prs.slides):
        if idx in notes_5m:
            note_text = notes_5m[idx]
            notes_slide = slide.notes_slide
            if notes_slide.notes_text_frame is None:
                sp_tree = notes_slide.shapes._spTree
                for sp in ref_sps:
                    sp_tree.append(deepcopy(sp))
            tf = notes_slide.notes_text_frame
            tf.text = note_text
            
    prs.save(file_path)
    print(f"Updated successfully: {file_path}")

for f in ['docs/Slide_Bao_Ve_Do_An_DriveShare_K4_V4_15Slides_WithNotes.pptx', 'docs/Slide_Bao_Ve_Do_An_DriveShare_K4_V4_17Slides.pptx']:
    try:
        update_pptx(f)
    except Exception as e:
        print(f"Error on {f}: {e}")
