import pptx
from copy import deepcopy
import sys

sys.stdout.reconfigure(encoding='utf-8')

notes_10m = {
    # Slide 1: Bìa & Giới Thiệu (00:00 - 00:25 | 25s)
    0: """⏱️ [00:00 - 00:25] | SLIDE 1: BÌA ĐỀ TÀI & GIỚI THIỆU
Kính thưa quý Thầy, Cô trong Hội đồng phản biện!
Em là Nguyễn Duy Bảo, đại diện nhóm xin được báo cáo đề tài khóa luận tốt nghiệp:
"DriveShare — Nền tảng chia sẻ và cho thuê xe tự lái trực tuyến".
Đề tài của chúng em được thực hiện dưới sự hướng dẫn tận tình của Thầy Trương Thanh Bình.
Sau đây, em xin phép được trình bày tổng quan về bối cảnh, kiến trúc hệ thống và kết quả đạt được của dự án.""",

    # Slide 2: 1.1 Bối Cảnh & 3 Bất Cập (00:25 - 01:00 | 35s)
    1: """⏱️ [00:25 - 01:00] | SLIDE 2: 1.1 BỐI CẢNH & 3 BẤT CẬP THUÊ XE TRUYỀN THỐNG
Mở đầu là lý do chọn đề tài. Hiện nay nhu cầu thuê xe tự lái phục vụ du lịch, công tác tăng trưởng rất nhanh. Tuy nhiên, phương thức thuê xe truyền thống bộc lộ 3 bất cập lớn:
1. Rủi ro giữ tài sản: Khách bị ép thế chấp tài sản lớn như xe máy kèm cà-vẹt gốc hoặc bị giữ CCCD gốc, gây tâm lý e ngại.
2. Tranh chấp trầy xước: Dễ xảy ra cãi vã khi trả xe do khâu bàn giao ban đầu chỉ thỏa thuận bằng miệng, không có hình ảnh minh bạch.
3. Rủi ro cho chủ xe: Chủ phương tiện đối mặt nguy cơ khách sử dụng xe quá hạn, tắt định vị hoặc đem xe đi cầm cố trái phép.""",

    # Slide 3: 1.2 Bảng Đối Chuẩn (01:00 - 01:35 | 35s)
    2: """⏱️ [01:00 - 01:35] | SLIDE 3: 1.2 BẢNG ĐỐI CHUẨN (MIOTO vs ZOOMCAR vs DRIVESHARE)
Để định vị giải pháp, nhóm đã đối chuẩn DriveShare với các nền tảng hàng đầu hiện nay. Chúng em tập trung giải quyết 3 bài toán đột phá:
1. Chuẩn hóa quy trình bàn giao 2 chiều: Ứng dụng biên bản số hóa đối chiếu trực tiếp 4 góc xe và chỉ số ODO trên web.
2. Cơ chế bảo vệ tài chính Escrow: Khách chỉ cần cọc giữ chỗ 30% qua VietQR, tiền được sàn giữ trung gian an toàn.
3. Trợ lý AI thế hệ mới: Tích hợp mô hình Gemini 2.5 Flash tư vấn lộ trình và gợi ý xe theo ngôn ngữ tự nhiên.""",

    # Slide 4: 1.3 4 Mục Tiêu Cốt Lõi (01:35 - 02:00 | 25s)
    3: """⏱️ [01:35 - 02:00] | SLIDE 4: 1.3 4 MỤC TIÊU CỐT LÕI CỦA ĐỀ TÀI
Từ các bất cập thực tế, đề tài xác định 4 mục tiêu cốt lõi:
1. Xây dựng Sàn P2P tiện lợi: Kết nối trực tiếp chủ xe có phương tiện nhàn rỗi với khách thuê có nhu cầu.
2. Chuẩn hóa quy trình bàn giao: Số hóa 100% biên bản Check-in và Check-out 2 chiều có ký nhận điện tử.
3. Minh bạch dòng tiền: Ứng dụng ký quỹ cọc VietQR 30% an toàn cho cả hai bên.
4. Tích hợp AI thông minh: Hỗ trợ tìm kiếm, phân tích nhu cầu và gợi ý xe tức thì.""",

    # Slide 5: 2.1 Kiến Trúc Hexagonal & Tech Stack (02:00 - 02:50 | 50s) [SƠ ĐỒ]
    4: """⏱️ [02:00 - 02:50] | SLIDE 5: 2.1 KIẾN TRÚC HEXAGONAL MODULAR & TECH STACK
• NÓI LƯỚT SƠ ĐỒ: Hệ thống được thiết kế theo Kiến trúc Lục giác (Hexagonal Architecture — Ports & Adapters) gồm 3 tầng phân lập:
  - Tầng 1 (Core Domain): Trung tâm nghiệp vụ thuần Java (Pure Java), tuyệt đối không phụ thuộc Framework.
  - Tầng 2 (Application): Chứa Use Cases và định nghĩa các Ports giao tiếp (Inbound Ports & Outbound Ports).
  - Tầng 3 (Infrastructure Adapters): REST Controllers ở Web Adapter và Spring Data JPA ở Persistence Adapter.
• VÍ DỤ THỰC TẾ: Nghiệp vụ tính cọc 30% và kiểm tra điều kiện hợp đồng nằm hoàn toàn trong Core Domain. Sau này nếu muốn đổi cổng thanh toán từ VietQR sang MoMo hay VNPay, hoặc đổi DB sang MongoDB, nhóm chỉ việc viết Adapter mới cắm vào Outbound Port mà không phải sửa một dòng code nghiệp vụ nào bên trong.
• KIỂM SOÁT KIẾN TRÚC: Toàn bộ 7 luật kiến trúc được kiểm tra tự động qua bài test ArchUnit (ArchitectureRulesTest.java).""",

    # Slide 6: 2.2 Biểu Đồ Use Case (02:50 - 03:35 | 45s) [SƠ ĐỒ]
    5: """⏱️ [02:50 - 03:35] | SLIDE 6: 2.2 THIẾT KẾ CHỨC NĂNG HỆ THỐNG (BIỂU ĐỒ USE CASE)
• NÓI LƯỚT SƠ ĐỒ: Biểu đồ Use Case thể hiện sự phối hợp chặt chẽ giữa 2 tác nhân chính là Khách thuê (Renter) và Chủ xe (Owner), dưới sự giám sát của Quản trị viên (Admin).
• VÍ DỤ THỰC TẾ: Khi khách gửi yêu cầu thuê xe, hệ thống tạo đơn ở trạng thái chờ. Chủ xe nhận được thông báo để thẩm định lịch trình và bấm "Duyệt đơn". Chỉ khi chủ xe phê duyệt thì cổng thanh toán VietQR cọc tiền của khách mới được kích hoạt. Thiết kế này đảm bảo chủ xe luôn giữ quyền chủ động quản lý tài sản, tránh việc khách cọc tiền khi chủ xe chưa sẵn sàng giao xe.""",

    # Slide 7: 2.3 Thiết Kế CSDL Server (03:35 - 04:35 | 60s) [SƠ ĐỒ]
    6: """⏱️ [03:35 - 04:35] | SLIDE 7: 2.3 THIẾT KẾ CƠ SỞ DỮ LIỆU SERVER (15 BẢNG CHUẨN 3NF)
• Ý NGHĨA 4 BẢNG HẠT NHÂN: Cơ sở dữ liệu PostgreSQL gồm 15 bảng, trong đó 4 bảng hạt nhân liên kết mật thiết:
  1. users: Quản lý tài khoản, mã hóa BCrypt, quyền hạn RBAC và trường token_version thu hồi JWT tức thì.
  2. cars: Quản lý đội xe, biển số xe (Unique), giá thuê ngày, và trường deleted_at phục vụ Xóa mềm (Soft Delete).
  3. rentals: Trọng tâm hợp đồng, lưu ngày bắt đầu - kết thúc, tổng tiền, cọc 30% và hạn chót thanh toán 45 phút.
  4. payments: Quản lý giao dịch dòng tiền cọc, lưu mã chuyển khoản duy nhất (Idempotent) và trạng thái thanh toán.
• TẠI SAO GỘP VỀ 1 DATABASE?: Ban đầu nhóm từng cân nhắc tách 3 DB, nhưng nhận thấy sẽ mất toàn vẹn khóa ngoại (Foreign Key) và phải xử lý Distributed Transaction (Saga) rất dễ lệch dữ liệu khi cọc tiền. Gộp về 1 DB chuẩn 3NF giúp tận dụng trọn vẹn ACID Transaction của PostgreSQL, đảm bảo tính toàn vẹn 100%.
• TỐI ƯU TRUY VẤN: Nhóm đánh Composite Index idx_rentals_car_range trên (car_id, start_date, end_date), giúp thuật toán kiểm tra trùng lịch chạy cực nhanh O(log N) thay vì quét cạn toàn bảng.""",

    # Slide 8: 2.4 State Machine Vòng Đời Đơn Thuê (04:35 - 05:35 | 60s) [SƠ ĐỒ]
    7: """⏱️ [04:35 - 05:35] | SLIDE 8: 2.4 VÒNG ĐỜI ĐƠN THUÊ & STATE MACHINE
• LUỒNG CHÍNH 5 BƯỚC XƯƠNG SỐNG (HAPPY PATH):
  1. Khách gửi yêu cầu thuê -> Đơn ở trạng thái PENDING.
  2. Chủ xe thẩm định và bấm duyệt -> Chuyển sang APPROVED, kích hoạt Soft-Lock giữ chỗ 45 phút.
  3. Khách quét mã VietQR cọc 30% -> Chuyển sang CONFIRMED, khóa cứng lịch xe vĩnh viễn trên CSDL.
  4. Đến ngày giao xe, hai bên lập biên bản Check-in -> Chuyển sang IN_PROGRESS (xe lăn bánh).
  5. Trả xe an toàn và chủ xe Check-out -> Chuyển sang COMPLETED, hợp đồng hoàn tất, ví chủ xe nhận ngay 90% doanh thu.
• CÁC NHÁNH NGOẠI LỆ:
  - Nếu sau 45 phút khách không cọc tiền, Cronjob chạy ngầm sẽ tự động đổi đơn sang EXPIRED để nhả xe cho người khác.
  - Nếu chủ xe bùng kèo, khách bấm Báo sự cố -> Đơn chuyển sang DISPUTED, tiền cọc bị đóng băng để Admin xử lý hoàn cọc 100%.""",

    # Slide 9: 2.5 Cơ Chế Khóa 2 Tầng Two-Tier Locking (05:35 - 06:30 | 55s) [SƠ ĐỒ]
    8: """⏱️ [05:35 - 06:30] | SLIDE 9: 2.5 GIẢI PHÁP KỸ THUẬT: CƠ CHẾ KHÓA 2 TẦNG (TWO-TIER LOCKING)
• NÓI LƯỚT SƠ ĐỒ: Để giải quyết triệt để nguy cơ 2 khách hàng cùng đặt 1 xe tại cùng một thời điểm (Overbooking), hệ thống trang bị cơ chế Khóa 2 tầng tuần tự:
  - Tầng 1: Khóa mềm 45 phút (Soft Lock) sau khi chủ xe duyệt.
  - Tầng 2: Khóa cứng vĩnh viễn (Hard Lock) sau khi khách cọc tiền.
• VÍ DỤ CỤ THỂ: Hai khách hàng A và B cùng thích chiếc VinFast VF8 đi Vũng Tàu cuối tuần. Khách A bấm đặt và được chủ xe duyệt trước. Ngay lập tức, hệ thống kích hoạt Soft Lock 45 phút, tạm khóa chiếc xe cho khách A an tâm chuyển khoản cọc 30% mà khách B không thể đặt đè lên. Khi khách A cọc tiền xong, xe chuyển sang Hard Lock vĩnh viễn. Nếu quá 45 phút khách A không cọc, hệ thống tự động nhả khóa để khách B vào thuê.
• KHÓA BI QUAN CSDL: Tại tầng Database, nhóm áp dụng @Lock(LockModeType.PESSIMISTIC_WRITE) sinh câu lệnh SELECT ... FOR UPDATE để khóa dòng bản ghi xe, ngăn chặn tuyệt đối lỗi Race Condition.""",

    # Slide 10: 3.1 Thực Nghiệm: Khách Thuê (06:30 - 07:05 | 35s)
    9: """⏱️ [06:30 - 07:05] | SLIDE 10: 3.1 KẾT QUẢ THỰC NGHIỆM: PHÂN HỆ KHÁCH THUÊ (RENTER)
Bước sang Chương 3 thực nghiệm, giao diện Khách thuê được tối ưu chuẩn Mobile Responsive:
1. Tìm xe thông minh: Tích hợp bộ lọc đa tiêu chí theo tỉnh thành, số chỗ, mức giá và Trợ lý AI tư vấn trực quan.
2. Thanh toán tiện lợi: Mã VietQR động NAPAS247 tự động điền sẵn số tiền cọc 30% và cú pháp chuyển khoản an toàn.
3. Quản lý hành trình: Khách theo dõi trạng thái đơn thuê, xem biên bản bàn giao điện tử và đánh giá chất lượng chuyến đi ngay trên điện thoại.""",

    # Slide 11: 3.2 Thực Nghiệm: Chủ Xe (07:05 - 07:40 | 35s)
    10: """⏱️ [07:05 - 07:40] | SLIDE 11: 3.2 KẾT QUẢ THỰC NGHIỆM: PHÂN HỆ CHỦ XE (CAR OWNER)
Đối với Chủ xe, hệ thống cung cấp bộ công cụ số hóa tài sản toàn diện:
1. Quản lý đội xe: Chủ động bật/tắt trạng thái hoạt động, khóa lịch bận bảo dưỡng xe và phê duyệt đơn thuê.
2. Biên bản số hóa: Lập biên bản bàn giao xe Check-in và Check-out trực tiếp trên web có chụp ảnh 4 góc xe và ghi nhận số ODO.
3. Ví thu nhập tự động: Hệ thống quyết toán tự động 90% doanh thu hợp đồng vào ví sau khi chuyến đi hoàn tất, hỗ trợ yêu cầu rút tiền về tài khoản ngân hàng bất kỳ lúc nào.""",

    # Slide 12: 3.3 Thực Nghiệm: Quản Trị Admin (07:40 - 08:20 | 40s)
    11: """⏱️ [07:40 - 08:20] | SLIDE 12: 3.3 KẾT QUẢ THỰC NGHIỆM: PHÂN HỆ QUẢN TRỊ (ADMIN PORTAL)
Phân hệ Quản trị Admin là trung tâm điều hành và kiểm soát rủi ro toàn sàn:
1. Dashboard tổng quan: Giám sát thời gian thực tổng số xe, thành viên, số cuốc thuê và tổng doanh thu hoa hồng 10% của sàn.
2. Dispute Center: Tiếp nhận khiếu nại bùng kèo No-Show, xem ảnh bằng chứng và phân xử hoàn cọc 100% cho khách hàng.
3. Quản lý xe quá hạn & Chế tài Điều 175 BLHS: Hệ thống tự động tính phạt trễ lũy tiến (150% và 200%), đồng thời cho phép Admin xuất Hồ sơ Pháp lý 1-Click (Violation Dossier) gồm CCCD, GPLX, log cọc và ảnh Check-in để chuyển thẳng Cơ quan Công an xử lý hành vi lạm dụng tín nhiệm chiếm đoạt tài sản.""",

    # Slide 13: 3.4 Quy Trình Bàn Giao 2 Chiều (08:20 - 09:10 | 50s) [SƠ ĐỒ]
    12: """⏱️ [08:20 - 09:10] | SLIDE 13: 3.4 QUY TRÌNH NGHIỆM THU XE 2 CHIỀU & HỢP ĐỒNG ĐIỆN TỬ
• NÓI LƯỚT SƠ ĐỒ: Slide 3.4 thể hiện quy trình số hóa bàn giao 2 chiều Check-in và Check-out để triệt tiêu hoàn toàn nguy cơ tranh chấp trầy xước:
• CHECK-IN (LÚC NHẬN XE SẼ CHỤP VÀ GỬI NHỮNG GÌ?):
  Chủ xe dùng điện thoại chụp thực tế 4 góc ngoại quan quanh xe (đầu xe, đuôi xe, sườn trái, sườn phải), ghi nhận chỉ số ODO (số km đồng hồ) và mức nhiên liệu/pin. Khách thuê kiểm tra hình ảnh và số liệu trên máy mình rồi bấm xác nhận điện tử để xe chính thức lăn bánh.
• CHECK-OUT (LÚC TRẢ XE):
  Chủ xe đối chiếu số ODO đã chạy và mở lại 4 bức ảnh lúc Check-in ra so sánh xem có phát sinh vết trầy xước, móp méo mới nào không. Xe nguyên vẹn thì bấm hoàn tất là hệ thống quyết toán giải phóng cọc ngay. Nếu có vết xước mới, 4 bức ảnh ban đầu là bằng chứng pháp lý minh bạch để hai bên đối soát, không ai cãi cọ được.""",

    # Slide 14: Kết Luận & Hạn Chế (09:10 - 09:40 | 30s)
    13: """⏱️ [09:10 - 09:40] | SLIDE 14: KẾT LUẬN — NHỮNG HẠN CHẾ CÒN TỒN TẠI & HƯỚNG PHÁT TRIỂN
Với tinh thần cầu thị và trung thực khoa học, nhóm xin báo cáo 3 hạn chế hiện tại:
1. Cổng thanh toán: VietQR hiện đang dùng nút mô phỏng Webhook phục vụ việc demo trơn tru tại Hội đồng, hướng tới sẽ tích hợp API biến động số dư SePay/Casso tự động.
2. Giám sát thực tế: Chưa tích hợp thiết bị phần cứng định vị GPS thực tế trên xe.
3. Đa ngôn ngữ: Chưa hỗ trợ chuyển đổi giao diện tiếng Anh cho khách nước ngoài.
Nhóm đã lên lộ trình nâng cấp các tính năng này trong giai đoạn tiếp theo.""",

    # Slide 15: Q&A & Chuyển Sang Demo (09:40 - 10:00 | 20s)
    14: """⏱️ [09:40 - 10:00] | SLIDE 15: Q&A — PHIÊN VẤN ĐÁP & CHUYỂN SANG PHẦN DEMO
Bài báo cáo slide của nhóm chúng em đến đây xin được hoàn tất.
Nhóm xin trân trọng cảm ơn quý Thầy, Cô trong Hội đồng phản biện đã chú ý lắng nghe!
Sau đây, nhóm xin kính mời Thầy Cô chuyển sang phần xem video demo sản phẩm thực tế trên nền tảng DriveShare!"""
}

def update_presentation(file_path):
    prs = pptx.Presentation(file_path)
    ref_sp_tree = prs.slides[0].notes_slide.shapes._spTree
    ref_sps = ref_sp_tree.findall('{http://schemas.openxmlformats.org/presentationml/2006/main}sp')
    
    for idx, slide in enumerate(prs.slides):
        if idx in notes_10m:
            note_text = notes_10m[idx]
            notes_slide = slide.notes_slide
            if notes_slide.notes_text_frame is None:
                sp_tree = notes_slide.shapes._spTree
                for sp in ref_sps:
                    sp_tree.append(deepcopy(sp))
            tf = notes_slide.notes_text_frame
            tf.text = note_text
            
    prs.save(file_path)
    print(f"Successfully updated 10m notes in: {file_path}")

target_files = [
    'docs/Slide_Bao_Ve_Do_An_DriveShare_K4_V4_15Slides_WithNotes.pptx',
    'docs/Slide_Bao_Ve_Do_An_DriveShare_K4_V4_17Slides.pptx'
]

for f in target_files:
    try:
        update_presentation(f)
    except Exception as e:
        print(f"Error updating {f}: {e}")
