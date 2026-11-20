import pptx
from copy import deepcopy
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

src_file = 'docs/Slide_Bao_Ve_Do_An_DriveShare_K4_V4_17Slides_WithNotes.pptx'
dest_file_1 = 'docs/Slide_Bao_Ve_Do_An_DriveShare_K4_V4_17Slides_WithNotes.pptx'
dest_file_2 = 'docs/Slide_Bao_Ve_Do_An_DriveShare_K4_V4_17Slides.pptx'

notes_dict = {
    0: """LỜI THOẠI THUYẾT TRÌNH (00:00 - 00:20):
Kính thưa quý Thầy, Cô trong Hội đồng phản biện!
Em là Nguyễn Duy Bảo, đại diện nhóm xin được báo cáo đề tài khóa luận tốt nghiệp: "DriveShare — Nền tảng chia sẻ và cho thuê xe tự lái trực tuyến". Đề tài được thực hiện dưới sự hướng dẫn của Thầy Trương Thanh Bình.""",

    1: """LỜI THOẠI THUYẾT TRÌNH (00:20 - 00:45):
Mở đầu là lý do chọn đề tài. Hiện nay nhu cầu thuê xe tự lái tăng mạnh, nhưng phương thức truyền thống bộc lộ 3 bất cập lớn:
1. Thứ nhất, khách phải thế chấp tài sản lớn như xe máy kèm cà-vẹt hoặc CCCD gốc.
2. Thứ hai, tình trạng tranh chấp trầy xước xe khi trả vì không có biên bản bàn giao minh bạch.
3. Thứ ba, chủ xe đối mặt rủi ro khách lạm dụng xe quá hạn hoặc đem đi cầm cố.""",

    2: """LỜI THOẠI THUYẾT TRÌNH (00:45 - 01:10):
Nhìn vào bảng đối chuẩn trên màn hình: So với Mioto hay Zoomcar, điểm khác biệt mang tính đột phá của DriveShare là:
1. Chuẩn hóa quy trình bàn giao 2 chiều bằng biên bản điện tử có hình ảnh và số ODO.
2. Giải quyết bài toán đặt cọc an toàn qua VietQR ký quỹ 30%.
3. Tích hợp trợ lý AI tư vấn xe thông minh.""",

    3: """LỜI THOẠI THUYẾT TRÌNH (01:10 - 01:30):
Để giải quyết các bất cập trên, đề tài xác định 4 mục tiêu cốt lõi:
1. Xây dựng nền tảng Web kết nối P2P tiện lợi giữa chủ xe và khách thuê.
2. Chuẩn hóa quy trình bàn giao xe 2 chiều Check-in & Check-out.
3. Cơ chế ký quỹ cọc VietQR 30% minh bạch, an toàn dòng tiền.
4. Ứng dụng trợ lý AI tư vấn xe tự động theo nhu cầu.""",

    4: """LỜI THOẠI THUYẾT TRÌNH (01:30 - 02:00) [SƠ ĐỒ 2.1 - KIẾN TRÚC HEXAGONAL]:
• NÓI LƯỚT SƠ ĐỒ: Hệ thống được xây dựng theo Kiến trúc Lục giác (Hexagonal Architecture) chuẩn quốc tế, phân tách thành 3 tầng: Tầng Core Domain ở trung tâm, Tầng Application Use Cases, và Tầng Adapters giao tiếp bên ngoài qua các Ports.
• VÍ DỤ THỰC TẾ: Ví dụ, với nghiệp vụ tính tiền cọc 30%, toàn bộ công thức được đóng gói trong Core Domain. Sau này nếu muốn đổi cổng thanh toán từ VietQR sang MoMo hay VNPay, nhóm chỉ việc cắm thêm Adapter mới mà không cần chỉnh sửa bất kỳ dòng code nghiệp vụ nào.""",

    5: """LỜI THOẠI THUYẾT TRÌNH (02:00 - 02:30) [SƠ ĐỒ 2.1b - BUSINESS FLOW]:
• NÓI LƯỚT SƠ ĐỒ: Đây là dòng chảy nghiệp vụ khép kín gồm 4 giai đoạn: Tìm xe & Đặt chỗ -> Ký quỹ cọc VietQR -> Bàn giao lăn bánh -> Quyết toán doanh thu.
• VÍ DỤ THỰC TẾ: Ví dụ thực tế: Khách thuê xe Vios giá 600.000 đ/ngày trong 2 ngày, tổng 1.200.000 đ. Khách chỉ cần cọc trước 360.000 đ qua VietQR để giữ xe. Sau khi chuyến đi hoàn tất an toàn, hệ thống tự động giải phóng tiền cọc và chuyển thẳng 90% doanh thu là 1.080.000 đ vào ví chủ xe, sàn thu 10% phí dịch vụ.""",

    6: """LỜI THOẠI THUYẾT TRÌNH (02:30 - 02:55) [SƠ ĐỒ 2.2 - BIỂU ĐỒ USE CASE]:
• NÓI LƯỚT SƠ ĐỒ: Biểu đồ Use Case thể hiện sự tương tác thời gian thực giữa 2 tác nhân chính: Khách thuê và Chủ xe cùng vận hành qua nền tảng Web.
• VÍ DỤ THỰC TẾ: Ví dụ: Khi khách gửi yêu cầu thuê, chủ xe sẽ nhận được thông báo để phê duyệt. Chỉ khi chủ xe bấm 'Duyệt đơn' thì cổng thanh toán VietQR của khách mới được mở ra, đảm bảo chủ xe luôn là người chủ động quyết định lịch trình của xe mình.""",

    7: """LỜI THOẠI THUYẾT TRÌNH (02:55 - 03:20) [SƠ ĐỒ 2.3 - CƠ SỞ DỮ LIỆU ERD]:
• NÓI LƯỚT SƠ ĐỒ: Cơ sở dữ liệu PostgreSQL gồm 4 bảng hạt nhân liên kết chặt chẽ: users, cars, rentals và payments.
• VÍ DỤ THỰC TẾ: Ví dụ: Mỗi hợp đồng trong bảng rentals sẽ liên kết khóa ngoại với 1 xe duy nhất trong cars kèm khoảng thời gian thuê cụ thể, và gắn liền với 1 mã giao dịch payments cọc 30%, đảm bảo tính toàn vẹn dữ liệu và không bao giờ bị thất thoát tiền cọc.""",

    8: """LỜI THOẠI THUYẾT TRÌNH (03:20 - 03:50) [SƠ ĐỒ 2.4 - STATE MACHINE]:
• NÓI LƯỚT SƠ ĐỒ: Máy trạng thái điều khiển chu trình đơn thuê từ PENDING -> APPROVED -> CONFIRMED -> IN_PROGRESS -> COMPLETED.
• VÍ DỤ THỰC TẾ: Ví dụ: Khi chủ xe đã duyệt đơn (APPROVED), nếu khách hàng bỏ quên và không quét mã cọc tiền trong vòng 45 phút, hệ thống tự động chuyển đơn sang EXPIRED để mở lại lịch xe cho người khác thuê, chủ xe không lo bị 'chôn chân' giữ chỗ vô ích.""",

    9: """LỜI THOẠI THUYẾT TRÌNH (03:50 - 04:20) [SƠ ĐỒ 2.5 - KHÓA 2 TẦNG SOFT/HARD LOCK]:
• NÓI LƯỚT SƠ ĐỒ: Để giải quyết triệt để nguy cơ 2 người cùng đặt 1 xe tại cùng 1 thời điểm, hệ thống trang bị cơ chế Khóa 2 tầng: Tầng 1 Soft-Lock 45 phút và Tầng 2 Hard-Lock sau cọc.
• VÍ DỤ THỰC TẾ: Ví dụ: Hai khách hàng A và B cùng muốn thuê xe VinFast VF8 đi Vũng Tàu. Khách A bấm đặt và được duyệt trước, xe lập tức kích hoạt Soft-Lock 45 phút khiến Khách B không thể đặt đè lên. Khi Khách A chuyển khoản cọc xong, xe chuyển sang Hard-Lock vĩnh viễn trên lịch.""",

    10: """LỜI THOẠI THUYẾT TRÌNH (04:20 - 04:45) [SƠ ĐỒ 2.6 - BẢO MẬT JWT & AI DỰ PHÒNG]:
• NÓI LƯỚT SƠ ĐỒ: Hệ thống bảo mật bằng Stateless JWT kèm trường token_version để thu hồi token tức thì khi đổi mật khẩu; đồng thời tích hợp Gemini AI kèm bộ lọc Regex dự phòng.
• VÍ DỤ THỰC TẾ: Ví dụ: Khách nhắn 'Tôi cần xe 7 chỗ dưới 1 triệu', AI sẽ hiểu và gợi ý xe; nhưng nếu mạng quốc tế đứt cáp hoặc lỗi API Gemini, bộ lọc Regex tự động bóc tách số chỗ '7' và giá '1 triệu' để truy vấn DB ngay, dịch vụ tìm xe không bao giờ bị gián đoạn.""",

    11: """LỜI THOẠI THUYẾT TRÌNH (04:45 - 05:05):
Bước sang Chương 3 thực nghiệm, giao diện Khách thuê được tối ưu chuẩn Mobile Responsive:
1. Khách dễ dàng tìm kiếm xe theo bộ lọc tỉnh thành, phân khúc và giá tiền.
2. Thanh toán cọc 30% qua mã VietQR động có sẵn số tiền và mã chuyển khoản bảo mật.
3. Sau đó theo dõi toàn bộ lộ trình và chi tiết chuyến đi trực quan, minh bạch.""",

    12: """LỜI THOẠI THUYẾT TRÌNH (05:05 - 05:25):
Đối với Chủ xe, hệ thống cung cấp bộ công cụ số hóa toàn diện:
1. Quản lý đội xe: Chủ xe chủ động bật/tắt lịch rảnh bận và duyệt các yêu cầu thuê.
2. Lập biên bản bàn giao xe điện tử có chụp 4 góc xe và ghi số ODO thực tế.
3. Theo dõi dòng tiền và nhận 90% doanh thu đổ về ví cá nhân theo thời gian thực.""",

    13: """LỜI THOẠI THUYẾT TRÌNH (05:25 - 05:45):
Phân hệ Quản trị Admin đóng vai trò trung tâm điều hành toàn sàn:
1. Giám sát tổng quan xe, thành viên và doanh thu cọc.
2. Xử lý khiếu nại tại Dispute Center (hoàn tiền cọc 100% nếu chủ xe bùng kèo).
3. Đặc biệt là tính năng Quản lý xe quá hạn: Xuất Hồ sơ Pháp lý 1-click gồm CCCD, bằng lái và ảnh bàn giao để nộp cơ quan công an theo Điều 175 Bộ luật Hình sự.""",

    14: """LỜI THOẠI THUYẾT TRÌNH (05:45 - 06:15) [SƠ ĐỒ 3.4 - QUY TRÌNH CHECK-IN & CHECK-OUT]:
• NÓI LƯỚT SƠ ĐỒ: Trên màn hình là Slide 3.4: Sơ đồ tuần tự quy trình bàn giao xe 2 chiều Check-in và Check-out có ký xác nhận điện tử trực tiếp trên web.
• VÍ DỤ THỰC TẾ: Ví dụ thực tế: Lúc giao xe (Check-in), chủ xe chụp 4 bức ảnh quanh xe và ghi số ODO 15.000 km, khách kiểm tra và bấm xác nhận trên điện thoại. Khi trả xe (Check-out), chủ xe đối chiếu thấy ODO 15.200 km và xe không hề phát sinh vết xước mới, bấm hoàn tất là hệ thống quyết toán tiền cọc ngay. Nếu có vết móp mới, hai bên mở lại 4 bức ảnh ngày nhận xe để đối chiếu làm bằng chứng, triệt tiêu hoàn toàn nguy cơ cãi vã.""",

    15: """LỜI THOẠI THUYẾT TRÌNH (06:15 - 06:40):
Với tinh thần cầu thị, nhóm xin thẳng thắn báo cáo 3 hạn chế còn tồn tại:
1. Thanh toán VietQR hiện đang dùng nút mô phỏng Webhook thay vì kết nối cổng SeABank thật.
2. Hệ thống chưa tích hợp phần cứng định vị GPS thực tế trên xe.
3. Chưa hỗ trợ chuyển đổi đa ngôn ngữ cho khách nước ngoài.
Nhóm đã đề ra lộ trình nâng cấp các phần này trong tương lai.""",

    16: """LỜI THOẠI THUYẾT TRÌNH (06:40 - 07:00):
Bài báo cáo khóa luận của nhóm chúng em đến đây xin được hoàn tất.
Nhóm xin trân trọng cảm ơn quý Thầy, Cô trong Hội đồng phản biện đã chú ý lắng nghe!
Sau đây, nhóm xin kính mời Thầy Cô chuyển sang phần xem video demo sản phẩm thực tế của nền tảng DriveShare!"""
}

prs = pptx.Presentation(src_file)

# Reference spTree template from slide 0
ref_sp_tree = prs.slides[0].notes_slide.shapes._spTree
ref_sps = ref_sp_tree.findall('{http://schemas.openxmlformats.org/presentationml/2006/main}sp')

print(f"Total slides found: {len(prs.slides)}")

for idx, slide in enumerate(prs.slides):
    note_text = notes_dict.get(idx, "")
    notes_slide = slide.notes_slide
    
    # Check if notes_text_frame is None
    if notes_slide.notes_text_frame is None:
        sp_tree = notes_slide.shapes._spTree
        for sp in ref_sps:
            sp_tree.append(deepcopy(sp))
            
    tf = notes_slide.notes_text_frame
    tf.text = note_text
    print(f"Slide {idx+1}: Injected note ({len(note_text)} chars)")

# Save to dest_file_1
prs.save(dest_file_1)
print(f"Successfully updated: {dest_file_1}")

# Also update dest_file_2 so both files have full 17 slides and notes
prs.save(dest_file_2)
print(f"Successfully updated: {dest_file_2}")
