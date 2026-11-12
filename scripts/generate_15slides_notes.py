import pptx
from copy import deepcopy
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

# Read from locked file in read mode
src_file = 'docs/Slide_Bao_Ve_Do_An_DriveShare_K4_V4_17Slides.pptx'
dest_file = 'docs/Slide_Bao_Ve_Do_An_DriveShare_K4_V4_15Slides_WithNotes.pptx'

prs = pptx.Presentation(src_file)
print(f"Total slides in presentation: {len(prs.slides)}")

# 15 Slides Exact Mapping
notes_15_slides = {
    # Slide 1: Bìa
    0: """LỜI THOẠI (00:00 - 00:20):
Kính thưa quý Thầy, Cô trong Hội đồng!
Em là Nguyễn Duy Bảo, đại diện nhóm xin báo cáo khóa luận tốt nghiệp: "DriveShare — Nền tảng chia sẻ và cho thuê xe tự lái trực tuyến", dưới sự hướng dẫn của Thầy Trương Thanh Bình.""",

    # Slide 2: 1.1 Bối Cảnh
    1: """LỜI THOẠI (00:20 - 00:45):
Lý do chọn đề tài xuất phát từ 3 bất cập lớn của việc thuê xe truyền thống:
1. Khách phải thế chấp tài sản lớn như xe máy, cà-vẹt hoặc giữ CCCD gốc.
2. Dễ phát sinh tranh chấp trầy xước xe khi trả vì không có bằng chứng bàn giao rõ ràng.
3. Chủ xe chịu rủi ro khách lạm dụng xe quá hạn hoặc đem xe đi cầm cố.""",

    # Slide 3: 1.2 Bảng Đối Chuẩn
    2: """LỜI THOẠI (00:45 - 01:10):
So với các nền tảng như Mioto hay Zoomcar, DriveShare tạo ra 3 điểm đột phá:
1. Chuẩn hóa quy trình bàn giao xe 2 chiều bằng biên bản điện tử kèm 4 ảnh và số ODO.
2. Cơ chế cọc giữ chỗ an toàn qua VietQR ký quỹ 30%.
3. Tích hợp trợ lý ảo AI tư vấn xe thông minh.""",

    # Slide 4: 1.3 Mục Tiêu Đề Tài
    3: """LỜI THOẠI (01:10 - 01:30):
Từ đó, nhóm xác định 4 mục tiêu cốt lõi:
1. Xây dựng sàn kết nối P2P tiện lợi giữa chủ xe và khách thuê.
2. Chuẩn hóa quy trình bàn giao xe 2 chiều Check-in & Check-out.
3. Ký quỹ cọc VietQR 30% minh bạch, đảm bảo an toàn dòng tiền.
4. Trợ lý AI hỗ trợ gợi ý xe tự động theo nhu cầu.""",

    # Slide 5: 2.1 Kiến Trúc Hexagonal [SƠ ĐỒ]
    4: """LỜI THOẠI (01:30 - 02:00) [SƠ ĐỒ 2.1 - KIẾN TRÚC HEXAGONAL]:
• NÓI LƯỚT SƠ ĐỒ: Hệ thống áp dụng Kiến trúc Lục giác (Hexagonal Architecture), phân tách 3 tầng: Core Domain ở giữa, Use Cases, và tầng Adapters giao tiếp bên ngoài qua Ports.
• VÍ DỤ THỰC TẾ: Ví dụ, nghiệp vụ tính cọc 30% được đóng gói ở Core Domain. Sau này nếu đổi cổng thanh toán từ VietQR sang MoMo hay VNPay, nhóm chỉ việc thay Adapter bên ngoài mà không cần sửa một dòng code nghiệp vụ nào bên trong.""",

    # Slide 6: 2.2 Biểu Đồ Use Case [SƠ ĐỒ]
    5: """LỜI THOẠI (02:00 - 02:25) [SƠ ĐỒ 2.2 - BIỂU ĐỒ USE CASE]:
• NÓI LƯỚT SƠ ĐỒ: Biểu đồ Use Case thể hiện sự phối hợp chặt chẽ giữa 2 tác nhân chính là Khách thuê và Chủ xe.
• VÍ DỤ THỰC TẾ: Ví dụ, khi khách bấm gửi yêu cầu đặt xe, chủ xe nhận thông báo để phê duyệt. Chỉ khi chủ xe bấm duyệt thì cổng thanh toán VietQR của khách mới được mở ra, đảm bảo chủ xe luôn chủ động quyết định lịch trình xe mình.""",

    # Slide 7: 2.3 Thiết Kế CSDL [SƠ ĐỒ - USER'S EMPHASIS]
    6: """LỜI THOẠI (02:25 - 03:00) [SƠ ĐỒ 2.3 - THIẾT KẾ CƠ SỞ DỮ LIỆU]:
• NÓI LƯỚT SƠ ĐỒ: Cơ sở dữ liệu PostgreSQL gồm 4 bảng hạt nhân liên kết chặt chẽ với nhau:
  1. users: Bảng lưu tài khoản và thông tin người dùng (gồm Khách thuê, Chủ xe và Quản trị viên).
  2. cars: Bảng lưu thông tin các dòng xe, biển số, giá thuê theo ngày và trạng thái xe của chủ.
  3. rentals: Bảng lưu hợp đồng thuê xe, ngày bắt đầu - ngày kết thúc và trạng thái của chuyến đi.
  4. payments: Bảng lưu lịch sử thanh toán tiền cọc 30% và các giao dịch qua VietQR.
• VÍ DỤ THỰC TẾ: Ví dụ, khi khách đặt 1 chiếc xe, hệ thống tạo 1 hợp đồng trong rentals, nối user của khách với car của chủ xe, và tạo 1 giao dịch trong payments để lưu vết tiền cọc, dữ liệu hoàn toàn đồng bộ và không thể thất thoát.""",

    # Slide 8: 2.4 State Machine [SƠ ĐỒ - USER'S EMPHASIS]
    7: """LỜI THOẠI (03:00 - 03:40) [SƠ ĐỒ 2.4 - VÒNG ĐỜI ĐƠN THUÊ]:
• LUỒNG CHÍNH ĐƠN THUÊ (HAPPY PATH): Vòng đời đơn thuê được điều khiển tự động qua các trạng thái:
  1. Sau khi khách gửi đơn thuê -> Đơn ở trạng thái PENDING.
  2. Chủ xe xem xét và bấm duyệt -> Chuyển sang APPROVED.
  3. Khách quét mã VietQR cọc 30% -> Chuyển sang CONFIRMED (chính thức giữ chỗ xe).
  4. Đến ngày nhận xe và lập biên bản Check-in -> Chuyển sang IN_PROGRESS (xe đang lăn bánh).
  5. Khách trả xe an toàn và chủ xe Check-out -> Chuyển sang COMPLETED (hoàn tất chuyến đi, tiền tự động quyết toán vào ví chủ xe).
• NHÁNH PHỤ: Ngoài ra, nếu sau khi duyệt mà quá 45 phút khách không cọc thì đơn tự chuyển sang EXPIRED; nếu có sự cố thì chuyển sang DISPUTED để Admin phân xử.""",

    # Slide 9: 2.5 Cơ Chế Khóa 2 Tầng [SƠ ĐỒ - USER'S EMPHASIS]
    8: """LỜI THOẠI (03:40 - 04:15) [SƠ ĐỒ 2.5 - CƠ CHẾ KHÓA 2 TẦNG TWO-TIER LOCKING]:
• NÓI LƯỚT SƠ ĐỒ: Để giải quyết triệt để vấn đề nhiều khách cùng đặt 1 xe tại cùng 1 khung giờ, hệ thống áp dụng cơ chế Khóa 2 tầng: Tầng 1 Soft Lock 45 phút và Tầng 2 Hard Lock.
• VÍ DỤ THỰC TẾ: Ví dụ, sau khi khách được chủ xe duyệt đơn, hệ thống kích hoạt Soft Lock khóa mềm xe trong 45 phút. Khoảng thời gian này giúp giữ độc quyền chiếc xe cho khách an tâm quét mã chuyển khoản cọc 30% mà không sợ người khác đặt đè lên. Khi khách cọc tiền thành công thì chuyển sang Hard Lock khóa cứng vĩnh viễn trên lịch; còn nếu sau 45 phút khách không cọc, hệ thống tự động nhả khóa để khách khác vào thuê.""",

    # Slide 10: 3.1 Khách Thuê
    9: """LỜI THOẠI (04:15 - 04:40):
Bước sang Chương 3 thực nghiệm, giao diện Khách thuê được tối ưu chuẩn Mobile Responsive:
1. Khách dễ dàng tìm kiếm xe theo bộ lọc tỉnh thành, phân khúc và giá thuê.
2. Thanh toán cọc 30% qua mã VietQR động có sẵn số tiền và nội dung chuyển khoản.
3. Theo dõi toàn bộ lộ trình và trạng thái chuyến đi trực quan ngay trên điện thoại.""",

    # Slide 11: 3.2 Chủ Xe
    10: """LỜI THOẠI (04:40 - 05:05):
Đối với Chủ xe, hệ thống cung cấp bộ công cụ quản lý số hóa toàn diện:
1. Chủ động bật/tắt lịch rảnh bận của từng xe và duyệt các đơn thuê mới.
2. Lập biên bản bàn giao xe điện tử ngay trên web có chụp ảnh thực tế và số ODO.
3. Theo dõi ví tiền và nhận 90% doanh thu quyết toán tự động sau mỗi chuyến đi.""",

    # Slide 12: 3.3 Quản Trị Admin
    11: """LỜI THOẠI (05:05 - 05:35):
Phân hệ Quản trị Admin là trung tâm điều hành toàn bộ sàn:
1. Giám sát tổng quan số xe, người dùng và doanh thu cọc theo thời gian thực.
2. Xử lý tranh chấp tại Dispute Center: Hoàn cọc 100% cho khách nếu chủ xe bùng kèo.
3. Quản lý xe quá hạn: Cho phép xuất Hồ sơ Pháp lý 1-click gồm CCCD, bằng lái và ảnh bàn giao để nộp cơ quan công an xử lý theo Điều 175 Bộ luật Hình sự.""",

    # Slide 13: 3.4 Quy Trình Bàn Giao 2 Chiều [SƠ ĐỒ - USER'S EMPHASIS]
    12: """LỜI THOẠI (05:35 - 06:15) [SƠ ĐỒ 3.4 - QUY TRÌNH CHECK-IN & CHECK-OUT]:
• NÓI LƯỚT SƠ ĐỒ: Slide 3.4 thể hiện quy trình bàn giao xe 2 chiều Check-in và Check-out số hóa trực tiếp trên web để triệt tiêu tranh chấp hư hỏng:
• CHECK-IN (LÚC NHẬN XE): Chủ xe chụp thực tế 4 góc ngoại quan quanh xe (đầu xe, đuôi xe, sườn trái, sườn phải), ghi nhận chỉ số ODO (số km trên đồng hồ) và mức nhiên liệu hoặc pin. Khách thuê kiểm tra hình ảnh và số liệu trên điện thoại rồi bấm xác nhận điện tử để bắt đầu chuyến đi.
• CHECK-OUT (LÚC TRẢ XE): Chủ xe đối chiếu lại số ODO đã chạy và mở 4 bức ảnh lúc Check-in ra đối chiếu xem có phát sinh vết trầy xước mới nào không. Nếu xe nguyên vẹn, chủ xe bấm hoàn tất là hệ thống quyết toán giải phóng tiền cọc ngay, hai bên hoàn toàn không lo cãi vã.""",

    # Slide 14: Kết Luận
    13: """LỜI THOẠI (06:15 - 06:40):
Nhóm xin thẳng thắn báo cáo 3 hạn chế hiện tại:
1. Thanh toán VietQR đang dùng nút mô phỏng Webhook thay vì kết nối cổng SeABank thật.
2. Hệ thống chưa tích hợp phần cứng định vị GPS thực tế trên xe.
3. Chưa hỗ trợ chuyển đổi đa ngôn ngữ cho khách nước ngoài.
Nhóm đã lên lộ trình nâng cấp các tính năng này trong tương lai.""",

    # Slide 15: Q&A
    14: """LỜI THOẠI (06:40 - 07:00):
Bài báo cáo khóa luận của nhóm chúng em đến đây xin được hoàn tất.
Nhóm xin trân trọng cảm ơn quý Thầy, Cô trong Hội đồng đã chú ý lắng nghe!
Sau đây, nhóm xin kính mời Thầy Cô chuyển sang phần xem video demo sản phẩm thực tế của nền tảng DriveShare!"""
}

# Ensure notes shapes exist
ref_sp_tree = prs.slides[0].notes_slide.shapes._spTree
ref_sps = ref_sp_tree.findall('{http://schemas.openxmlformats.org/presentationml/2006/main}sp')

for idx, slide in enumerate(prs.slides):
    note_text = notes_15_slides.get(idx, "")
    notes_slide = slide.notes_slide
    if notes_slide.notes_text_frame is None:
        sp_tree = notes_slide.shapes._spTree
        for sp in ref_sps:
            sp_tree.append(deepcopy(sp))
    tf = notes_slide.notes_text_frame
    tf.text = note_text
    print(f"Slide {idx+1}: Injected note ({len(note_text)} chars)")

prs.save(dest_file)
print(f"\nSuccessfully generated updated presentation: {dest_file}")

