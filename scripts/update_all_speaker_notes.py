import os
from pptx import Presentation

def update_notes():
    pptx_path = 'docs/Slide_Bao_Ve_Do_An_DriveShare_K4_V4_17Slides.pptx'
    prs = Presentation(pptx_path)

    notes_dict = {
        0: (
            "LỜI THOẠI THUYẾT TRÌNH (00:00 - 00:25):\n"
            "Kính thưa quý Thầy, Cô trong Hội đồng phản biện!\n"
            "Em xin đại diện nhóm sinh viên khóa K25 xin được báo cáo đề án tốt nghiệp với đề tài: "
            "\"Nền tảng chia sẻ và cho thuê xe ô tô tự lái trực tuyến DriveShare\", dưới sự hướng dẫn tận tình của Thầy Trương Thanh Bình.\n"
            "Sau đây, em xin phép được bắt đầu phần trình bày của nhóm."
        ),
        1: (
            "LỜI THOẠI THUYẾT TRÌNH (00:25 - 01:00):\n"
            "Mở đầu là lý do chọn đề tài. Hiện nay, thị trường thuê xe truyền thống tồn tại 3 bất cập lớn:\n"
            "1. Thẩm định thủ công: Giữ giấy tờ gốc CCCD gây rủi ro pháp lý cho khách hàng.\n"
            "2. Tiền cọc rủi ro: Cọc tiền mặt dễ bị chiếm dụng và chậm hoàn trả khi trả xe.\n"
            "3. Tranh chấp trầy xước: Thiếu biên bản nghiệm thu minh bạch dẫn đến mâu thuẫn khi trả xe.\n"
            "DriveShare ra đời nhằm số hóa toàn diện quy trình này."
        ),
        2: (
            "LỜI THOẠI THUYẾT TRÌNH (01:00 - 01:40):\n"
            "Để định vị giải pháp, nhóm đã đối chuẩn DriveShare với Mioto và Zoomcar qua 5 tiêu chí:\n"
            "- DriveShare tiên phong áp dụng cơ chế Giữ chỗ Soft Lock 45 phút mà không bắt cọc ngay lập tức.\n"
            "- Áp dụng Ký quỹ VietQR cọc 30% bảo vệ dòng tiền 2 chiều.\n"
            "- Quy trình nghiệm thu xe 2 chiều điện tử kèm ảnh chụp tại chỗ.\n"
            "- Có Trung tâm xử lý khiếu nại (Dispute Center) độc lập.\n"
            "- Và tích hợp Trợ lý AI tư vấn xe thông minh có cơ chế dự phòng ngoại tuyến."
        ),
        3: (
            "LỜI THOẠI THUYẾT TRÌNH (01:40 - 02:15):\n"
            "Từ bài toán đó, đề tài xác định 4 mục tiêu cốt lõi:\n"
            "1. Xây dựng Kiến trúc Hexagonal chịu tải cao, sẵn sàng mở rộng.\n"
            "2. Tự động hóa quy trình ký quỹ cọc 30% qua VietQR.\n"
            "3. Số hóa biên bản bàn giao xe 2 chiều Check-in và Check-out.\n"
            "4. Tích hợp Trợ lý AI tư vấn dòng xe và dự toán chi phí thông minh."
        ),
        4: (
            "LỜI THOẠI THUYẾT TRÌNH (02:15 - 03:00):\n"
            "Bước sang Chương 2, hệ thống được thiết kế theo Kiến trúc Lục giác (Hexagonal Architecture):\n"
            "- Tâm lục giác là Tầng Domain: Viết bằng Pure Java thuần túy, chứa toàn bộ quy tắc nghiệp vụ như tính cọc 30%, tuyệt đối không phụ thuộc Framework hay Database.\n"
            "- Tầng Application bao bọc bên ngoài: Gồm các Inbound Port để đón nhận yêu cầu và Outbound Port để giao tiếp thế giới bên ngoài.\n"
            "- Ngoài cùng là các Adapter: Web Controller nhận REST API, và Persistence Adapter kết nối PostgreSQL 16.\n"
            "Kiến trúc được kiểm soát tự động bằng Bộ 7 luật ArchUnit trong CI/CD."
        ),
        5: (
            "LỜI THOẠI THUYẾT TRÌNH (03:00 - 03:35):\n"
            "Về thiết kế chức năng, hệ thống phục vụ 2 nhóm tác nhân chính:\n"
            "- Khách thuê (Renter): Tìm xe, cọc VietQR 30%, ký biên bản giao nhận và gửi khiếu nại.\n"
            "- Chủ xe (Car Owner): Quản lý đội xe, duyệt đơn thuê, lập biên bản Check-in/out và nhận doanh thu qua ví.\n"
            "Toàn bộ chức năng Quản trị được tách riêng sang Admin Portal độc lập để đảm bảo an toàn vận hành."
        ),
        6: (
            "LỜI THOẠI THUYẾT TRÌNH (03:35 - 04:15):\n"
            "Cơ sở dữ liệu PostgreSQL gồm 4 bảng hạt nhân liên kết chặt chẽ:\n"
            "- Bảng 'users': Quản lý tài khoản, phân quyền RBAC và token_version.\n"
            "- Bảng 'cars': Quản lý xe, lịch bận và trạng thái hoạt động.\n"
            "- Bảng 'rentals': Trái tim hệ thống, quản lý toàn bộ vòng đời hợp đồng thuê.\n"
            "- Bảng 'payments': Quản lý giao dịch ký quỹ cọc 30% VietQR.\n"
            "Bên cạnh đó là các bảng phụ trợ như 'rental_inspections' lưu biên bản bàn giao và 'rental_disputes' lưu hồ sơ khiếu nại."
        ),
        7: (
            "LỜI THOẠI THUYẾT TRÌNH (04:15 - 04:55):\n"
            "Trên màn hình là Máy trạng thái (State Machine) quản lý vòng đời đơn thuê gồm 10 trạng thái:\n"
            "- Điểm đột phá kỹ thuật là trạng thái đệm 'ON_HOLD': Khi chủ xe duyệt 1 đơn sang 'WAITING_PAYMENT', các đơn trùng lịch khác không bị hủy mà chuyển sang 'ON_HOLD'.\n"
            "- Nếu khách không cọc sau 45 phút, Cronjob tự động phục hồi các đơn 'ON_HOLD' về Chờ duyệt để đón khách tiếp theo, tuyệt đối không gây giam xe ảo của chủ xe."
        ),
        8: (
            "LỜI THOẠI THUYẾT TRÌNH (04:55 - 05:40):\n"
            "Để giải quyết triệt để xung đột đồng thời, hệ thống áp dụng Cơ chế Khóa 2 tầng (Two-Tier Locking):\n"
            "- Nửa bên trái là Tầng 1 - Khóa mềm (Soft Lock 45 phút): Tạm giữ xe độc quyền cho khách thanh toán cọc mà không sợ bị cướp chỗ; nếu quá hạn Cronjob sẽ tự động giải phóng xe.\n"
            "- Nửa bên phải là Tầng 2 - Khóa cứng (Hard Lock): Kích hoạt ngay khi nhận cọc 30% VietQR vào tài khoản ký quỹ Escrow, chốt lịch xe vĩnh viễn và tự động từ chối (Auto-Reject) toàn bộ các đơn trùng lịch còn lại."
        ),
        9: (
            "LỜI THOẠI THUYẾT TRÌNH (05:40 - 06:20):\n"
            "Về giải pháp kỹ thuật, slide 2.6 thể hiện 2 điểm sáng:\n"
            "- Về bảo mật: Sử dụng Stateless JWT kèm cơ chế 'token_version' giúp thu hồi token tức thì ngay khi đổi mật khẩu; đồng thời tự động khóa tài khoản sau 5 lần đăng nhập sai.\n"
            "- Về Trợ lý AI: Tích hợp Google Gemini 2.5 Flash kèm dữ liệu xe thực tế từ CSDL. Đáng chú ý, hệ thống có bộ lọc Regex dự phòng ngoại tuyến: nếu mất mạng hoặc lỗi AI, chatbot vẫn tự động bóc tách ngày thuê, mức giá và số chỗ để phục vụ người dùng liên tục 24/7."
        ),
        10: (
            "LỜI THOẠI THUYẾT TRÌNH (06:20 - 06:55):\n"
            "Bước sang Chương 3 thực nghiệm, phân hệ Khách thuê được tối ưu trải nghiệm qua 3 tính năng:\n"
            "1. Bộ lọc tìm xe đa tiêu chí theo Tỉnh/Thành, ngày thuê, khoảng giá và số chỗ.\n"
            "2. Màn hình ký quỹ cọc 30% tự động sinh mã VietQR chuẩn ngân hàng kèm đồng hồ đếm ngược 45 phút.\n"
            "3. Trung tâm khiếu nại (Dispute) cho phép tải ảnh/video bằng chứng tại hiện trường để yêu cầu hoàn cọc."
        ),
        11: (
            "LỜI THOẠI THUYẾT TRÌNH (06:55 - 07:30):\n"
            "Phân hệ Chủ xe là bộ công cụ số hóa toàn diện:\n"
            "1. Quản lý đội xe: Dễ dàng bật/tắt cho thuê hoặc chặn các ngày bận để bảo dưỡng.\n"
            "2. Biên bản bàn giao 2 chiều: Ghi nhận số ODO, vạch xăng và chụp ảnh hiện trường lúc Check-in và Check-out.\n"
            "3. Ví doanh thu: Minh bạch số dư khả dụng, tự động giải ngân 90% doanh thu cuốc xe sau khi hoàn tất đối soát."
        ),
        12: (
            "LỜI THOẠI THUYẾT TRÌNH (07:30 - 08:10):\n"
            "Trung tâm điều hành của sàn là Phân hệ Quản trị (Admin Portal):\n"
            "1. Dashboard tổng quan giám sát thời gian thực số xe, thành viên và dòng tiền cọc.\n"
            "2. Thẩm định eKYC: Đối soát trực tiếp ảnh CCCD, bằng lái xe GPLX và tài khoản ngân hàng.\n"
            "3. Giải quyết khiếu nại (Dispute Center): Phân xử hoàn cọc, phạt vi phạm và xuất hồ sơ Điều 175 BLHS khi khách có hành vi chiếm dụng xe quá hạn."
        ),
        13: (
            "LỜI THOẠI THUYẾT TRÌNH (08:10 - 08:50):\n"
            "Để ngăn ngừa tranh chấp trầy xước, hệ thống áp dụng Quy trình nghiệm thu xe 2 chiều:\n"
            "- Lúc nhận xe (Check-in): Chủ xe lập biên bản ghi nhận hiện trạng và ảnh 4 góc xe, khách thuê xác nhận điện tử -> Đơn chuyển sang IN_PROGRESS.\n"
            "- Lúc trả xe (Check-out): Hai bên đối soát số km và vạch xăng. Nếu đồng thuận, đơn chuyển sang COMPLETED và tất toán tiền thuê; nếu có tranh chấp, đơn lập tức chuyển sang DISPUTED để bảo vệ quyền lợi cả 2 bên."
        ),
        14: (
            "LỜI THOẠI THUYẾT TRÌNH (08:50 - 09:40):\n"
            "Với tinh thần cầu thị, nhóm xin thẳng thắn báo cáo 4 hạn chế hiện tại và hướng phát triển:\n"
            "1. VietQR: Hiện xác nhận qua nút bấm mô phỏng -> Hướng tới tích hợp Webhook biến động số dư tự động qua Casso / SePay.\n"
            "2. eKYC: Hiện Admin duyệt bằng mắt -> Hướng tới tích hợp AI OCR và nhận diện khuôn mặt sinh trắc học.\n"
            "3. Thông báo: Hiện dùng REST Polling -> Hướng tới nâng cấp lên WebSocket STOMP thời gian thực.\n"
            "4. Bản đồ: Hiện lọc theo Tỉnh/Thành -> Hướng tới nhúng bản đồ Mapbox tìm xe theo bán kính 5 - 10km."
        ),
        15: (
            "LỜI THOẠI THUYẾT TRÌNH (09:40 - 10:10):\n"
            "Bài báo cáo khóa luận của nhóm chúng em đến đây xin được hoàn thành.\n"
            "Nhóm xin trân trọng cảm ơn quý Thầy, Cô trong Hội đồng phản biện đã theo dõi, và xin tri ân sâu sắc đến Thầy Trương Thanh Bình đã luôn tận tình hướng dẫn nhóm.\n"
            "Sau đây, nhóm chúng em xin được lắng nghe những góp ý quý báu và sẵn sàng giải đáp mọi câu hỏi phản biện từ Thầy, Cô.\n"
            "Em xin trân trọng cảm ơn!"
        )
    }

    for idx, text in notes_dict.items():
        if idx < len(prs.slides):
            slide = prs.slides[idx]
            notes_slide = slide.notes_slide
            tf = notes_slide.notes_text_frame
            tf.text = text.strip()

    out_path = 'docs/Slide_Bao_Ve_Do_An_DriveShare_K4_V4_17Slides_WithNotes.pptx'
    prs.save(out_path)
    print(f"SUCCESS! Updated speaker notes for all 16 slides in {out_path}!")

if __name__ == '__main__':
    update_notes()
