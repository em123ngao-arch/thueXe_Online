# -*- coding: utf-8 -*-
"""
Script: generate_srs_chapters_6_to_12.py
Purpose: Complete Chapters 6 through 12 in the DriveShare SRS document
         following the Doc_ITC format and 100% verified codebase facts.
Output: BAO_CAO_SRS_DRIVESHARE_K4_PRO_V2_2_Ch1_to_Ch12.docx
"""

import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

sys.stdout.reconfigure(encoding='utf-8')

INPUT_DOCX = 'BAO_CAO_SRS_DRIVESHARE_K4_PRO_V2_1_fixed_final_v3 (1).docx'
OUTPUT_DOCX = 'docs/BAO_CAO_SRS_DRIVESHARE_K4_PRO_V2_2_Ch1_to_Ch12.docx'

def set_cell_margins(cell, top=60, bottom=60, left=80, right=80):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_cell_shading(cell, color_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}" w:val="clear"/>')
    tcPr.append(shd)

def set_cell_borders(cell, color_hex="BFBFBF", sz="4"):
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:top w:val="single" w:sz="{sz}" w:space="0" w:color="{color_hex}"/>
            <w:left w:val="single" w:sz="{sz}" w:space="0" w:color="{color_hex}"/>
            <w:bottom w:val="single" w:sz="{sz}" w:space="0" w:color="{color_hex}"/>
            <w:right w:val="single" w:sz="{sz}" w:space="0" w:color="{color_hex}"/>
        </w:tcBorders>
    ''')
    tcPr.append(borders)

def style_table(table, col_widths, is_rtm=False):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    header_tr = table.rows[0]._tr.get_or_add_trPr()
    header_tr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
    
    for row in table.rows:
        trPr = row._tr.get_or_add_trPr()
        trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
        
    for r_idx, row in enumerate(table.rows):
        is_header = (r_idx == 0)
        for c_idx, cell in enumerate(row.cells):
            w_dxa = col_widths[c_idx]
            cell.width = w_dxa
            tcPr = cell._tc.get_or_add_tcPr()
            tcW = parse_xml(f'<w:tcW {nsdecls("w")} w:w="{w_dxa}" w:type="dxa"/>')
            tcPr.append(tcW)
            
            set_cell_borders(cell, "BFBFBF", "4")
            set_cell_margins(cell, top=50, bottom=50, left=70, right=70)
            
            if is_header:
                set_cell_shading(cell, "1F4E79")
            else:
                set_cell_shading(cell, "FFFFFF")
                
            for p in cell.paragraphs:
                p.paragraph_format.line_spacing = 1.15
                p.paragraph_format.space_after = Pt(2)
                p.paragraph_format.space_before = Pt(2)
                for run in p.runs:
                    run.font.name = 'Arial'
                    if is_header:
                        run.font.size = Pt(8.5 if is_rtm else 9.5)
                        run.font.bold = True
                        run.font.color.rgb = RGBColor(255, 255, 255)
                    else:
                        run.font.size = Pt(8.0 if is_rtm else 9.0)
                        run.font.color.rgb = RGBColor(0, 0, 0)

class DocBuilder:
    def __init__(self, doc, target_p):
        self.doc = doc
        self.target = target_p

    def add_p(self, text, bold_prefix="", space_after=4):
        p = self.doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.space_before = Pt(0)
        
        if bold_prefix:
            r_bold = p.add_run(bold_prefix)
            r_bold.font.name = 'Arial'
            r_bold.font.size = Pt(11)
            r_bold.font.bold = True
            r_bold.font.color.rgb = RGBColor(0, 0, 0)
            
        r_text = p.add_run(text)
        r_text.font.name = 'Arial'
        r_text.font.size = Pt(11)
        r_text.font.color.rgb = RGBColor(0, 0, 0)
        
        self.target._p.addprevious(p._p)
        return p

    def add_h(self, text, level):
        h = self.doc.add_heading(text, level=level)
        h.paragraph_format.space_before = Pt(12 if level == 1 else (8 if level == 2 else 6))
        h.paragraph_format.space_after = Pt(6 if level == 1 else (4 if level == 2 else 2))
        for r in h.runs:
            r.font.name = 'Arial'
            if level == 1:
                r.font.size = Pt(15.0)
                r.font.bold = True
                r.font.color.rgb = RGBColor(31, 78, 121)
            elif level == 2:
                r.font.size = Pt(12.5)
                r.font.bold = True
                r.font.color.rgb = RGBColor(31, 78, 121)
            else:
                r.font.size = Pt(11.5)
                r.font.bold = True
                r.font.color.rgb = RGBColor(51, 51, 51)
        self.target._p.addprevious(h._p)
        return h

    def add_img(self, img_path, caption_text, width_inches=None, height_inches=None):
        if os.path.exists(img_path):
            p_img = self.doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(6)
            p_img.paragraph_format.space_after = Pt(2)
            r = p_img.add_run()
            if height_inches is not None:
                r.add_picture(img_path, height=Inches(height_inches))
            elif width_inches is not None:
                r.add_picture(img_path, width=Inches(width_inches))
            else:
                r.add_picture(img_path, width=Inches(6.0))
            self.target._p.addprevious(p_img._p)
            
            p_cap = self.doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_before = Pt(2)
            p_cap.paragraph_format.space_after = Pt(8)
            r_cap = p_cap.add_run(caption_text)
            r_cap.font.name = 'Arial'
            r_cap.font.size = Pt(10)
            r_cap.font.italic = True
            r_cap.font.color.rgb = RGBColor(89, 89, 89)
            self.target._p.addprevious(p_cap._p)
        else:
            print(f"Warning: Image not found {img_path}")

    def add_tbl(self, headers, data, col_widths, is_rtm=False):
        table = self.doc.add_table(rows=len(data) + 1, cols=len(headers))
        for c_idx, h in enumerate(headers):
            cell = table.cell(0, c_idx)
            cell.text = h
            cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
            
        for r_idx, row in enumerate(data):
            for c_idx, val in enumerate(row):
                cell = table.cell(r_idx + 1, c_idx)
                cell.text = str(val)
                p = cell.paragraphs[0]
                if c_idx == 0:
                    p.alignment = WD_ALIGN_PARAGRAPH.CENTER if is_rtm or len(val) < 15 else WD_ALIGN_PARAGRAPH.LEFT
                else:
                    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                    
        style_table(table, col_widths, is_rtm=is_rtm)
        self.target._p.addprevious(table._tbl)
        
        p_space = self.doc.add_paragraph()
        p_space.paragraph_format.space_before = Pt(0)
        p_space.paragraph_format.space_after = Pt(6)
        p_space.paragraph_format.line_spacing = 1.0
        self.target._p.addprevious(p_space._p)
        return table

def build_chapters():
    print(f"Loading {INPUT_DOCX}...")
    doc = docx.Document(INPUT_DOCX)
    
    # Locate Chapter 6 start and Chapter 13 start
    p96 = doc.paragraphs[96]
    p116 = doc.paragraphs[116]
    
    print(f"p96: {p96.text[:40]}")
    print(f"p116: {p116.text[:40]}")
    
    # Elements to remove are paragraphs 96 to 115 inclusive
    body = doc._body._element
    elements_to_remove = [doc.paragraphs[i]._p for i in range(96, 116)]
    for el in elements_to_remove:
        body.remove(el)
        
    print(f"Removed {len(elements_to_remove)} placeholder elements.")
    
    # Builder will insert before p116
    b = DocBuilder(doc, p116)
    
    # =========================================================================
    # CHƯƠNG 6: ĐẶC TẢ USE CASE CHI TIẾT
    # =========================================================================
    print("Generating Chapter 6...")
    b.add_h("CHƯƠNG 6: ĐẶC TẢ USE CASE CHI TIẾT (DETAILED USE CASE SPECIFICATION)", level=1)
    
    b.add_h("6.0. Sơ đồ Use Case tổng quan (UML Use Case Diagram)", level=2)
    b.add_p("Hệ thống DriveShare gồm 3 nhóm tác nhân chính: Khách thuê (Customer/Renter), Chủ xe (Car Owner), và Quản trị viên (Admin). Sơ đồ Use Case tổng quan mô tả các ca sử dụng cốt lõi của hệ thống từ giai đoạn xác thực, đăng xe, kiểm soát giữ chỗ chống trùng lịch, bàn giao xe kỹ thuật hai chiều đến xử lý tranh chấp bùng xe qua trọng tài sàn.")
    b.add_img("docs/image_diagram/diagram_driveshare.png", "Hình 6.1 — Sơ đồ Use Case tổng quan hệ thống DriveShare, thể hiện quan hệ giữa 3 tác nhân chính và các nhóm Use Case.", height_inches=6.5)
    
    # UC-AUT-001
    b.add_h("UC-AUT-001: Đăng ký, Đăng nhập & Phân quyền RBAC", level=2)
    b.add_p("Customer, Car Owner, Admin.", bold_prefix="Tác nhân chính: ")
    b.add_p("Người dùng chưa có tài khoản (đăng ký) hoặc đã có tài khoản hợp lệ, chưa bị khóa (đăng nhập).", bold_prefix="Tiền điều kiện: ")
    b.add_p("Tài khoản mới được cấp vai trò tương ứng trong bảng user_roles; hoặc Client nhận được JWT Bearer Token hợp lệ để truy cập hệ thống.", bold_prefix="Hậu điều kiện: ")
    b.add_p("(1) Người dùng cung cấp họ tên, email, mật khẩu, số điện thoại và chọn vai trò. (2) Hệ thống kiểm tra trùng lặp email và số điện thoại trong bảng users. (3) Hệ thống băm mật khẩu bằng BCrypt (độ phức tạp 10), cấp vai trò ROLE_CUSTOMER hoặc ROLE_CAR_OWNER, kích hoạt tài khoản. (4) Trả về HTTP 201 Created kèm dữ liệu tài khoản (ẩn mật khẩu).", bold_prefix="Luồng xử lý chính (Đăng ký): ")
    b.add_p("(1) Người dùng gửi email và mật khẩu qua form đăng nhập. (2) Hệ thống xác thực qua AuthenticationManager. (3) Nếu thành công, sinh Access Token (HMAC-SHA256, hạn 24h = 86.400.000 ms) và Refresh Token (hạn 7 ngày = 604.800.000 ms), lưu phiên vào auth_sessions, trả về HTTP 200 kèm JWT. (4) Nếu sai, tăng biến đếm thất bại; nếu vượt 5 lần liên tiếp sẽ tạm khóa tài khoản để phòng vệ brute-force.", bold_prefix="Luồng xử lý chính (Đăng nhập): ")
    b.add_p("Email đã tồn tại → HTTP 409 Conflict. Sai mật khẩu hoặc tài khoản bị khóa (status = LOCKED) → HTTP 401 Unauthorized / HTTP 423 Locked. Sai định dạng dữ liệu đầu vào → HTTP 400 Bad Request.", bold_prefix="Luồng ngoại lệ: ")
    
    # UC-CAR-002
    b.add_h("UC-CAR-002: Đăng xe mới, Cấu hình bảng giá & Quản lý lịch bận", level=2)
    b.add_p("Car Owner.", bold_prefix="Tác nhân chính: ")
    b.add_p("Người dùng đã đăng nhập với vai trò ROLE_CAR_OWNER và đã được Admin phê duyệt giấy phép/CCCD.", bold_prefix="Tiền điều kiện: ")
    b.add_p("Phương tiện được tạo mới trong bảng cars, lưu ảnh vào car_images, lưu lịch bận vào car_calendar_blocks và sẵn sàng hiển thị khi ở trạng thái ACTIVE.", bold_prefix="Hậu điều kiện: ")
    b.add_p("(1) Chủ xe nhập thông tin phương tiện (hãng xe, dòng xe, năm sản xuất, biển số, loại hộp số, loại nhiên liệu), cấu hình giá thuê theo ngày, phụ phí vượt km và phụ phí trả trễ hạn. (2) Chủ xe tải lên tối thiểu 3 ảnh thực tế của xe; hệ thống tải lên Cloudinary CDN và lưu URL vào bảng car_images. (3) Chủ xe chủ động thiết lập khoảng ngày bận hoặc lịch bảo dưỡng xe; hệ thống tạo bản ghi trong car_calendar_blocks để tự động chặn các lượt đặt trùng. (4) Hệ thống lưu thông tin và trả về HTTP 201 Created.", bold_prefix="Luồng xử lý chính: ")
    b.add_p("Biển số xe đã đăng ký trên sàn → HTTP 400 Bad Request / 409 Conflict. Ảnh tải lên vượt dung lượng tối đa (10MB) hoặc sai định dạng → HTTP 400 Bad Request. Người dùng chưa kích hoạt vai trò chủ xe → HTTP 403 Forbidden.", bold_prefix="Luồng ngoại lệ: ")
    
    # UC-BOK-003
    b.add_h("UC-BOK-003: Đặt xe & Kiểm soát đồng thời giữ chỗ Two-Phase Lock", level=2)
    b.add_p("Customer, Car Owner, Hệ thống (Scheduled Job).", bold_prefix="Tác nhân chính: ")
    b.add_p("Khách thuê đã đăng nhập (ROLE_CUSTOMER), đã xác thực GPLX; xe đang ở trạng thái ACTIVE và không bị chặn lịch trong khoảng thời gian yêu cầu.", bold_prefix="Tiền điều kiện: ")
    b.add_p("Đơn thuê xe chuyển trạng thái theo máy trạng thái 17 bước; lịch xe được khóa an toàn (không xảy ra Double Booking); khoản cọc 30% được ký quỹ Escrow.", bold_prefix="Hậu điều kiện: ")
    b.add_p("(1) Khách thuê chọn xe, thời gian nhận - trả và gửi yêu cầu đặt xe (POST /api/v1/rentals). Hệ thống tạo đơn ở trạng thái PENDING_APPROVAL. (2) Chủ xe duyệt yêu cầu (PUT /owner/rentals/{id}/approve). Hệ thống kích hoạt Soft Lock thời hạn 45 phút, đưa đơn vào trạng thái WAITING_PAYMENT, đồng thời tự động đẩy các đơn khác cùng xe/trùng lịch sang trạng thái ON_HOLD. (3) Hệ thống sinh mã VietQR Napas 247 cho khoản đặt cọc 30% giá trị hợp đồng gốc. (4) Khách hàng quét mã chuyển khoản. Cổng thanh toán gửi Webhook xác nhận (POST /payments/{id}/confirm); hệ thống kích hoạt Hard Lock, chuyển trạng thái đơn sang CONFIRMED và khóa cứng lịch xe.", bold_prefix="Luồng xử lý chính: ")
    b.add_img("docs/diagrams/04_sequence_booking_and_deposit.png", "Hình 6.2 — Sơ đồ trình tự luồng đặt xe và thanh toán giữ chỗ Two-Phase Lock UC-BOK-003, bao gồm giai đoạn Soft Lock (45 phút) và Hard Lock (sau khi cọc 30% Napas 247).", height_inches=5.8)
    b.add_p("Hết 45 phút Soft Lock mà khách không thanh toán cọc → Tiến trình Cron (@Scheduled RentalExpirationJob) tự động hủy đơn sang EXPIRED, đồng thời tự động phục hồi các đơn ON_HOLD trước đó sang PENDING_APPROVAL. Trùng lịch đặt xe đồng thời do hai giao dịch tranh chấp → Hệ thống chặn bằng Pessimistic Lock (@Lock(PESSIMISTIC_WRITE)) và trả về HTTP 409 Conflict.", bold_prefix="Luồng ngoại lệ: ")
    
    # UC-HND-004
    b.add_h("UC-HND-004: Bàn giao kỹ thuật xe hai chiều Check-in & Check-out", level=2)
    b.add_p("Car Owner, Customer.", bold_prefix="Tác nhân chính: ")
    b.add_p("Đơn thuê ở trạng thái CONFIRMED (đối với Check-in nhận xe) hoặc IN_PROGRESS (đối với Check-out trả xe).", bold_prefix="Tiền điều kiện: ")
    b.add_p("Biên bản nghiệm thu bàn giao kỹ thuật hai chiều được lưu trữ trong rental_inspections; hợp đồng được cập nhật trạng thái IN_PROGRESS hoặc COMPLETED; chi phí chuyến đi được quyết toán.", bold_prefix="Hậu điều kiện: ")
    b.add_p("(1) Tại thời điểm giao nhận, Chủ xe kiểm tra giấy phép lái xe của Khách, ghi nhận chỉ số ODO, vạch xăng hiện tại và chụp tối thiểu 4 góc ảnh ngoại thất/nội thất xe lên hệ thống (POST /owner/rentals/{id}/check-in). (2) Khách thuê nhận thông báo, kiểm tra thông số trên thiết bị di động và bấm nút xác nhận đồng thuận (POST /rentals/{id}/inspections/{inspectionId}/confirm). Đơn thuê chuyển sang trạng thái IN_PROGRESS.", bold_prefix="Luồng xử lý chính (Check-in nhận xe): ")
    b.add_p("(1) Khi trả xe, Chủ xe kiểm tra lại số ODO, mức xăng, tình trạng nguyên vẹn và lập biên bản Check-out (POST /owner/rentals/{id}/check-out). (2) Hệ thống tự động đối soát: nếu số km thực tế vượt hạn mức, tính phụ phí vượt quãng đường (VND/km); nếu xăng thiếu so với lúc nhận, tính phụ phí xăng; nếu trả xe trễ hạn, tính phụ phí quá giờ. (3) Khách thuê thanh toán 70% giá trị hợp đồng còn lại cộng toàn bộ phụ phí phát sinh. (4) Chủ xe bấm xác nhận hoàn tất chuyến đi (PUT /owner/rentals/{id}/complete). Đơn chuyển sang COMPLETED, giải phóng xe và kích hoạt phân chia doanh thu 90/10.", bold_prefix="Luồng xử lý chính (Check-out trả xe): ")
    b.add_img("docs/diagrams/05_sequence_two_way_handover.png", "Hình 6.3 — Sơ đồ trình tự bàn giao xe kỹ thuật hai chiều UC-HND-004, ghi nhận chỉ số ODO, mức nhiên liệu, ảnh hiện trạng và tính phụ phí phát sinh.", width_inches=6.0)
    b.add_p("Hai bên không đạt được thỏa thuận về vết trầy xước phát sinh hoặc mức phụ phí tính toán → Đơn chuyển sang trạng thái DISPUTED để trọng tài Admin vào cuộc giải quyết. Khách giữ xe quá hạn không trả và không liên lạc được → Hệ thống tự động đánh dấu đơn sang OVERDUE và kích hoạt lập hồ sơ vi phạm.", bold_prefix="Luồng ngoại lệ: ")
    
    # UC-DSP-005
    b.add_h("UC-DSP-005: Xử lý tranh chấp bùng xe & Hoàn cọc Escrow (Trọng tài Admin)", level=2)
    b.add_p("Customer, Car Owner, Admin.", bold_prefix="Tác nhân chính: ")
    b.add_p("Đơn thuê phát sinh sự cố vi phạm cam kết (chủ xe không giao xe đúng hẹn, khách bùng kèo, hoặc mâu thuẫn phụ phí hư hỏng).", bold_prefix="Tiền điều kiện: ")
    b.add_p("Khoản tiền cọc 30% Escrow được giải ngân hoặc hoàn trả cho bên bị hại theo đúng phán quyết trọng tài; toàn bộ diễn biến được lưu vết trong audit_logs.", bold_prefix="Hậu điều kiện: ")
    b.add_p("(1) Bên bị hại gửi báo cáo khiếu nại kèm mô tả sự cố (POST /api/v1/rentals/{id}/report-no-show). (2) Hệ thống kích hoạt DisputeLockPolicy: lập tức đóng băng hợp đồng và khoản tiền cọc 30% trong bảng payments, chuyển trạng thái đơn sang DISPUTED. (3) Quản trị viên truy cập màn hình quản lý tranh chấp (GET /api/v1/admin/rentals/disputes), thẩm định các bằng chứng hình ảnh, biên bản Check-in và lịch sử tin nhắn. (4) Quản trị viên ra phán quyết (POST /admin/rentals/disputes/{id}/resolve): nếu lỗi do chủ xe, hoàn 100% cọc Escrow cho khách thuê và phạt hạ uy tín chủ xe; nếu lỗi do khách bùng kèo, giải ngân tiền cọc bồi thường cho chủ xe. (5) Toàn bộ thao tác phán quyết được tự động ghi nhận vào audit_logs.", bold_prefix="Luồng xử lý chính: ")
    b.add_p("Bằng chứng không rõ ràng hoặc thiếu biên bản nghiệm thu hai chiều → Admin yêu cầu hai bên bổ sung ảnh và chứng từ trong vòng 24 giờ trước khi tiến hành phán quyết cuối cùng.", bold_prefix="Luồng ngoại lệ: ")
    
    # =========================================================================
    # CHƯƠNG 7: YÊU CẦU PHI CHỨC NĂNG (NFR)
    # =========================================================================
    print("Generating Chapter 7...")
    b.add_h("CHƯƠNG 7: YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)", level=1)
    b.add_p("Chương này xác lập bộ 12 chỉ tiêu định lượng phi chức năng cho nền tảng DriveShare, được trích xuất trực tiếp từ cấu hình mã nguồn (application.yml, application-dev.yml) và bộ kiểm thử tự động của hệ thống:")
    
    nfr_headers = ["Hạng mục", "Yêu cầu định lượng / tiêu chí đo lường"]
    nfr_data = [
        ["Hiệu năng API (Performance)", "Thời gian phản hồi API trung bình đo kiểm đạt tiêu chuẩn hệ thống với P95 < 1000ms (khớp mục tiêu thiết kế tại Chương 1.1)."],
        ["Kiểm soát đồng thời (Concurrency)", "Ngăn chặn tuyệt đối hiện tượng đặt trùng xe (Double Booking) khi mô phỏng 50 luồng đồng thời (kiểm chứng bằng bài test ConcurrencyBookingOverlapTest qua Two-Phase Locking và Soft Lock 45 phút)."],
        ["Bảo vệ hoàn cọc (Double Refund)", "Ngăn chặn tuyệt đối hoàn cọc trùng khi 50-100 luồng đồng thời gọi lệnh giải ngân cọc Escrow (kiểm chứng bằng bài test ConcurrencyDisputeRefundTest qua khóa bi quan @Lock(PESSIMISTIC_WRITE))."],
        ["Bảo mật & Token (Security)", "JWT mã hóa HMAC-SHA256 với secret key 256-bit; thời hạn Access Token 24 giờ (86.400.000 ms), Refresh Token 7 ngày (604.800.000 ms); Mật khẩu mã hóa BCrypt độ phức tạp 10."],
        ["Phân quyền người dùng (RBAC)", "Kiểm soát truy cập nghiêm ngặt dựa trên 3 vai trò: ROLE_CUSTOMER (khách thuê), ROLE_CAR_OWNER (chủ xe), và ROLE_ADMIN (quản trị viên) qua SecurityConfig và @PreAuthorize."],
        ["Toàn vẹn kiến trúc (Architecture)", "Mã nguồn tuân thủ nghiêm ngặt 7 luật kiến trúc Hexagonal (ArchUnit Rules): Tầng Domain tuyệt đối không import framework Spring/JPA; Controller không gọi trực tiếp Database; Giao tiếp liên module bắt buộc qua Inbound Port."],
        ["Tự động giải phóng đơn (Job)", "Tiến trình nền @Scheduled RentalExpirationJob tự động quét định kỳ các đơn giữ chỗ hết hạn (45 phút) để giải phóng xe và phục hồi đơn chờ ON_HOLD sang PENDING_APPROVAL."],
        ["Giới hạn tải tệp (Upload Limit)", "Cấu hình Spring Multipart giới hạn kích thước tệp tải lên tối đa 10MB cho mỗi ảnh xe/giấy tờ, tổng dung lượng request tối đa 30MB (cấu hình trong application.yml)."],
        ["Toàn vẹn dữ liệu tài chính", "Mọi giao dịch thanh toán cọc VietQR Napas 247 và quyết toán ví thu nhập 90/10 đều được thực thi trong transaction @Transactional kết hợp khóa dòng cơ sở dữ liệu."],
        ["Chất lượng kiểm thử tự động", "Toàn bộ 186/186 bài kiểm thử tự động (Unit Test, Integration Test, Concurrency Test, ArchUnit Test) vượt qua 100% trong quy trình CI/CD Maven Surefire trước khi phát hành."],
        ["Tương thích giao diện (Usability)", "Giao diện Web hiển thị đáp ứng responsive trên máy tính để bàn (dành cho Chủ xe và Admin đối soát số liệu) và thiết bị di động (dành cho Khách thuê đặt xe)."],
        ["Bảo mật thông tin eKYC (Privacy)", "Ảnh chụp giấy tờ tùy thân CCCD và Giấy phép lái xe được lưu trữ bảo mật trên Cloudinary CDN, kiểm soát quyền truy cập chỉ dành cho Quản trị viên thẩm định."]
    ]
    b.add_tbl(nfr_headers, nfr_data, [2600, 6426])
    
    # =========================================================================
    # CHƯƠNG 8: KIẾN TRÚC HỆ THỐNG
    # =========================================================================
    print("Generating Chapter 8...")
    b.add_h("CHƯƠNG 8: KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)", level=1)
    
    b.add_h("8.1. Kiến trúc phân tầng mở rộng Hexagonal (Ports & Adapters)", level=2)
    b.add_p("Hệ thống DriveShare được thiết kế dựa trên kiến trúc Hexagonal (Ports & Adapters), tổ chức thành 11 module độc lập (car, rental, payment, user, auth, admin, ai, rag, notification, oauth2, health). Mỗi module được phân chia thành 3 phân tầng ranh giới rõ ràng:")
    b.add_p("Chứa các thực thể dữ liệu bất biến (*Record.java) và quy tắc nghiệp vụ thuần túy (*Policy.java như RentalStatusPolicy, DisputeLockPolicy). Tầng này hoàn toàn độc lập, tuyệt đối không phụ thuộc vào bất kỳ thư viện framework nào của Spring Boot, JPA hay Hibernate.", bold_prefix="1. Tầng Domain Core (Pure Java): ")
    b.add_p("Định nghĩa các cổng giao tiếp Inbound Port (giao diện cho Controller hoặc module khác gọi) và Outbound Port (giao diện truy xuất CSDL hoặc dịch vụ ngoài), cùng các lớp Use Case thực thi nghiệp vụ (*UseCase.java).", bold_prefix="2. Tầng Application (Ports & Use Cases): ")
    b.add_p("Gồm Inbound Web Adapters (REST Controllers tiếp nhận HTTP requests từ Client) và Outbound Persistence Adapters (triển khai Outbound Port sử dụng Spring Data JPA Repositories để kết nối PostgreSQL, Cloudinary CDN, Napas Gateway).", bold_prefix="3. Tầng Infrastructure Adapters (Web & Persistence): ")
    b.add_p("Tính toàn vẹn kiến trúc của toàn bộ hệ thống được tự động bảo vệ thông qua bộ 7 luật ArchUnit (ArchitectureRulesTest.java), bảo đảm không xảy ra phụ thuộc vòng hoặc vi phạm ranh giới phân tầng.")
    b.add_img("docs/diagrams/hexagonal_architecture_diagram.png", "Hình 8.1 — Sơ đồ kiến trúc Hexagonal (Ports & Adapters) và ranh giới phân tầng dự án DriveShare, tuân thủ 7 luật kiểm thử ArchUnit (rộng 15,24 cm / 6,0 inch).", width_inches=6.0)
    
    b.add_h("8.2. Cơ chế bảo mật — JWT Authentication Filter & Phân quyền RBAC", level=2)
    b.add_p("Mọi yêu cầu HTTP gửi từ Client lên Backend đều phải đi qua bộ lọc bảo mật JwtAuthenticationFilter chặn ở đầu FilterChain. Luồng xử lý chi tiết:")
    b.add_p("(1) Trích xuất chuỗi JWT từ header 'Authorization: Bearer <token>'. (2) Giải mã chữ ký số HMAC-SHA256 bằng secret key 256-bit; kiểm tra tính hợp lệ và thời hạn sống của token (Access Token 24 giờ). (3) Trích xuất thông tin định danh (userId, username) và danh sách vai trò (roles). (4) Nạp đối tượng CustomUserDetails và gán vào SecurityContextHolder để Spring Security nhận diện phiên đăng nhập. Nếu token không hợp lệ hoặc hết hạn, request vẫn được chuyển tiếp nhưng không có Authentication, dẫn đến mã lỗi HTTP 401 hoặc 403 ở tầng Controller khi gọi endpoint bảo vệ.")
    b.add_p("Hệ thống kiểm soát phân quyền dựa trên vai trò (RBAC) với 3 nhóm chính: ROLE_CUSTOMER, ROLE_CAR_OWNER, và ROLE_ADMIN. Các phương thức nghiệp vụ tại Web Controller được bảo vệ bởi annotation @PreAuthorize(\"hasRole('ROLE_...')\").")
    
    b.add_h("8.3. Cơ chế kiểm soát đồng thời & Ký quỹ (Concurrency & Escrow Lock)", level=2)
    b.add_p("Nhằm giải quyết triệt để nguy cơ Double Booking khi nhiều khách hàng cùng đặt một phương tiện tại cùng thời điểm, hệ thống DriveShare thiết lập cơ chế kiểm soát đồng thời Two-Phase Lock:")
    b.add_p("Khi chủ xe duyệt yêu cầu đặt xe (PUT /owner/rentals/{id}/approve), đơn được chuyển sang trạng thái WAITING_PAYMENT. Hệ thống áp dụng Soft Lock trong thời hạn đúng 45 phút, đồng thời tự động đẩy toàn bộ các đơn khác cùng xe/trùng lịch sang trạng thái ON_HOLD. Nếu hết 45 phút mà khách không cọc, tiến trình nền tự động hủy đơn sang EXPIRED và hồi sinh các đơn ON_HOLD trở lại trạng thái PENDING_APPROVAL.", bold_prefix="Giai đoạn 1 — Soft Lock (45 phút): ")
    b.add_p("Khi khách hàng chuyển khoản đặt cọc 30% VietQR Napas 247 thành công, Webhook xác nhận kích hoạt Hard Lock: đơn chuyển sang CONFIRMED và hệ thống ghi bản ghi khóa cứng lịch xe vào bảng car_calendar_blocks, đảm bảo không thể bị ghi đè bởi bất kỳ giao dịch nào khác.", bold_prefix="Giai đoạn 2 — Hard Lock (Cọc 30% thành công): ")
    b.add_p("Vòng đời đơn thuê xe được quản lý chặt chẽ thông qua máy trạng thái 17 bước chuẩn hóa từ mã nguồn com.driveshare.common.enums.ERentalStatus, đối chiếu chính xác theo các mốc chuyển trạng thái:")
    b.add_p("1. PENDING: Khách gửi yêu cầu thuê ban đầu (chuẩn tương thích ngược v1.0);\n"
            "2. PENDING_APPROVAL: Khách đã gửi yêu cầu thuê xe, đang chờ chủ xe duyệt hồ sơ (chuẩn đặc tả v2.0.0);\n"
            "3. WAITING_PAYMENT: Chủ xe đã duyệt 1 khách, kích hoạt Soft Lock 45 phút giữ chỗ để khách cọc 30%;\n"
            "4. APPROVED: Chủ xe đã duyệt đơn (chuẩn tương thích ngược v1.0 trước khi tách giai đoạn Soft Lock);\n"
            "5. ON_HOLD: Đơn của các khách khác bị tạm hoãn do xe đang trong Soft Lock 45 phút với khách được duyệt;\n"
            "6. CONFIRMED: Khách đã cọc 30% Napas 247 thành công, kích hoạt Hard Lock khóa cứng lịch xe;\n"
            "7. IN_PROGRESS: Đã hoàn tất biên bản bàn giao xe Check-in, xe đang trong hành trình di chuyển;\n"
            "8. OVERDUE: Quá hạn trả xe theo hợp đồng nhưng chưa hoàn tất thủ tục Check-out trả xe;\n"
            "9. COMPLETED: Đã Check-out trả xe thành công và hoàn tất quyết toán chuyến đi (90% chủ xe, 10% sàn);\n"
            "10. EXPIRED: Hết hạn 45 phút giữ chỗ Soft Lock mà khách không thanh toán cọc;\n"
            "11. AUTO_EXPIRED_NO_HOST_ACTION: Quá thời hạn quy định mà chủ xe không phản hồi duyệt đơn;\n"
            "12. REJECTED: Bị từ chối bởi chủ xe hoặc hệ thống tự động từ chối do lịch xe đã đóng;\n"
            "13. WITHDRAWN_BY_GUEST: Khách thuê chủ động rút yêu cầu khi chủ xe chưa duyệt hoặc chưa thanh toán cọc;\n"
            "14. CANCELLED: Khách hủy đơn trước khi thanh toán cọc (chuẩn tương thích ngược v1.0);\n"
            "15. CANCELLED_BY_GUEST: Khách hủy chuyến sau khi đã đặt cọc (áp dụng chính sách khấu trừ phạt cọc);\n"
            "16. CANCELLED_BY_HOST: Chủ xe hủy chuyến sau khi đã nhận cọc (hệ thống hoàn cọc cho khách và phạt chủ xe);\n"
            "17. DISPUTED: Phát sinh khiếu nại tranh chấp sự cố trong giao nhận/trả xe, chuyển trọng tài Admin giải quyết.")
    b.add_p("Cơ chế ký quỹ Escrow: Khoản cọc 30% được sàn giữ an toàn trong tài khoản trung gian. Chỉ khi chuyến đi hoàn tất thành công (COMPLETED), hệ thống kích hoạt RevenueShareService tự động giải ngân 90% cho chủ xe và trích 10% phí hoa hồng vận hành sàn.")
    
    b.add_h("8.4. Sơ đồ triển khai hệ thống (Deployment View)", level=2)
    b.add_p("Hệ thống DriveShare được đóng gói và vận hành trên nền tảng đám mây Render Cloud:")
    b.add_p("Trình duyệt máy tính hoặc thiết bị di động gửi request bảo mật qua HTTPS.", bold_prefix="Client Layer: ")
    b.add_p("Cloudflare / Render Reverse Proxy tiếp nhận TLS Termination, chống tấn công DDoS và cân bằng tải.", bold_prefix="Gateway & Reverse Proxy: ")
    b.add_p("Container Docker OpenJDK 17 thực thi Spring Boot ứng dụng, expose cổng 8080, cấu hình bộ nhớ Heap JVM.", bold_prefix="Backend Service: ")
    b.add_p("PostgreSQL 16 Managed Database lưu trữ dữ liệu nghiệp vụ toàn vẹn, kết nối qua HikariCP connection pool.", bold_prefix="Database Layer: ")
    b.add_p("Cloudinary CDN phục vụ lưu trữ hình ảnh xe, tài liệu eKYC; Napas VietQR Gateway tiếp nhận Webhook xử lý thanh toán tự động.", bold_prefix="External Services: ")
    
    # =========================================================================
    # CHƯƠNG 9: THIẾT KẾ UI/UX VÀ WIREFRAME MÀN HÌNH
    # =========================================================================
    print("Generating Chapter 9...")
    b.add_h("CHƯƠNG 9: THIẾT KẾ UI/UX VÀ WIREFRAME MÀN HÌNH (UI/UX & WIREFRAME DESIGN)", level=1)
    
    b.add_h("9.1. Nguyên tắc thiết kế UI/UX áp dụng", level=2)
    b.add_p("Giao diện người dùng DriveShare được xây dựng dựa trên các chuẩn mực thương mại điện tử hiện đại:")
    b.add_p("Mobile-first đối với luồng khách thuê nhằm tối ưu trải nghiệm chạm vuốt trên màn hình cảm ứng di động; Desktop-first đối với phân hệ quản trị của Chủ xe và Admin nhằm phục vụ đối soát bảng dữ liệu lớn.", bold_prefix="1. Đáp ứng linh hoạt (Responsive): ")
    b.add_p("Luồng đặt xe được tối giản chỉ trong 3 bước chạm: Tìm xe → Xem chi tiết & báo giá → Gửi yêu cầu đặt xe.", bold_prefix="2. Tối thiểu hóa thao tác: ")
    b.add_p("Tiến trình hợp đồng thuê xe được thể hiện trực quan qua Stepper 5 bước: Chờ duyệt → Chờ cọc → Đã cọc → Đang thuê → Hoàn tất.", bold_prefix="3. Minh bạch trạng thái: ")
    b.add_p("Sử dụng Toast Notifications và Modal xác nhận để thông báo tức thời các biến động trạng thái (duyệt xe, thanh toán thành công, biên bản bàn giao) mà không cần reload trang.", bold_prefix="4. Phản hồi thời gian thực: ")
    
    b.add_h("9.2. Wireframe luồng màn hình Khách thuê (Mobile)", level=2)
    b.add_p("Bảng cấu trúc các màn hình cốt lõi luồng Khách thuê trên thiết bị di động:")
    ui_m_headers = ["Màn hình", "Thành phần UI chính", "Yêu cầu liên quan"]
    ui_m_data = [
        ["1. Trang chủ & Tìm kiếm xe", "Thanh tìm kiếm địa điểm, bộ chọn khoảng ngày nhận/trả xe, bộ lọc đơn giá thuê và loại hộp số, danh sách thẻ xe dạng lưới hiển thị ảnh đại diện, thương hiệu, đơn giá và số sao đánh giá.", "REQ-CAR-05, REQ-CAR-06"],
        ["2. Chi tiết xe & Đặt xe", "Slider bộ sưu tập hình ảnh xe, bảng thông số kỹ thuật (hộp số, nhiên liệu, số ghế), bảng kê chi phí thuê tạm tính, nút 'Yêu cầu thuê xe' mở modal xác nhận đặt đơn.", "REQ-CAR-06, REQ-BOK-01"],
        ["3. Thanh toán cọc VietQR", "Thông tin chi tiết đơn thuê, số tiền đặt cọc 30% Napas 247, đồng hồ đếm ngược thời gian Soft Lock 45 phút, hình ảnh mã VietQR thanh toán tự động, nút xác nhận thanh toán.", "REQ-PAY-01, REQ-PAY-03"],
        ["4. Ký nhận biên bản Check-in", "Bảng hiển thị số ODO xe ban đầu, mức vạch xăng/pin, bộ sưu tập 4 góc ảnh ngoại thất/nội thất do chủ xe vừa chụp tải lên, nút 'Đồng thuận ký nhận bàn giao'.", "REQ-HND-01, REQ-HND-02"],
        ["5. Trả xe & Đánh giá chuyến đi", "Bảng kê tổng hợp chi phí tất toán 70% và các phụ phí phát sinh (vượt km, tiền xăng bù trừ, quá hạn giờ), nút xác nhận thanh toán, form đánh giá chấm 1-5 sao kèm nhận xét.", "REQ-HND-04, REQ-HND-05"],
        ["6. Widget Trợ lý ảo AI Assistant", "Cửa sổ chat nổi góc phải màn hình, danh sách gợi ý câu hỏi nhanh, ô nhập tin nhắn văn bản tư vấn lộ trình, thẻ gợi ý phương tiện phù hợp kèm nút 'Xem chi tiết xe'.", "REQ-AI-01, REQ-AI-02, REQ-AI-03"]
    ]
    b.add_tbl(ui_m_headers, ui_m_data, [2000, 4826, 2200])
    b.add_p("Hình 9.1 — Bảng mô tả cấu trúc Wireframe các màn hình chính luồng Khách thuê trên thiết bị di động.", bold_prefix="", space_after=6)
    
    b.add_h("9.3. Wireframe màn hình Chủ xe & Quản trị viên (Desktop)", level=2)
    b.add_p("Bảng cấu trúc các màn hình nghiệp vụ Chủ xe và Quản trị viên trên máy tính để bàn:")
    ui_d_headers = ["Màn hình", "Thành phần UI chính", "Yêu cầu liên quan"]
    ui_d_data = [
        ["1. Quản lý xe của tôi (Owner Cars)", "Bảng danh sách xe đang niêm yết, nút 'Đăng xe mới', nút công tắc bật/tắt trạng thái xe ACTIVE/INACTIVE, modal thiết lập lịch bận bảo dưỡng phương tiện.", "REQ-CAR-01, REQ-CAR-03, REQ-CAR-04"],
        ["2. Quản lý đơn thuê (Owner Rentals)", "Bảng danh sách đơn thuê phân loại theo tabs trạng thái, nút 'Duyệt yêu cầu' (kích hoạt Soft Lock 45p), nút 'Lập biên bản Check-in', nút 'Lập biên bản Check-out & Tính phụ phí'.", "REQ-BOK-02, REQ-HND-01, REQ-HND-03"],
        ["3. Ví thu nhập Chủ xe (Owner Earnings)", "Thẻ hiển thị số dư khả dụng, tổng doanh thu lũy kế, bảng kê chi tiết từng lượt nhận 90% cọc và tiền quyết toán, modal cập nhật thông tin tài khoản ngân hàng nhận tiền.", "REQ-WAL-01, REQ-WAL-02, REQ-WAL-03"],
        ["4. Bảng điều khiển Quản trị (Admin Stats)", "Biểu đồ phân tích doanh thu sàn GMV theo tháng, các thẻ KPI thống kê số lượt thuê xe, tổng số phương tiện, tỷ lệ giải quyết tranh chấp thành công, danh sách cảnh báo vi phạm.", "REQ-ADM-04, REQ-OPS-03"],
        ["5. Thẩm định & Trọng tài sàn (Admin)", "Danh sách xe chờ duyệt niêm yết kèm nút 'Duyệt xe', danh sách hồ sơ CCCD/GPLX chờ thẩm định eKYC, bảng quản lý hồ sơ tranh chấp bùng xe kèm nút 'Phán quyết hoàn cọc'.", "REQ-ADM-01, REQ-ADM-02, REQ-DSP-03, REQ-DSP-04"]
    ]
    b.add_tbl(ui_d_headers, ui_d_data, [2200, 4626, 2200])
    b.add_p("Hình 9.2 — Bảng mô tả cấu trúc Wireframe các màn hình nghiệp vụ Chủ xe và Quản trị viên trên Desktop.", bold_prefix="", space_after=6)
    
    b.add_h("9.4. Liên kết Wireframe với luồng chuyển màn hình (Screen Flow & State Transition)", level=2)
    b.add_p("Luồng tương tác chuyển đổi màn hình liên kết chặt chẽ với máy trạng thái 17 bước của đơn thuê:")
    b.add_p("Khách tìm xe trên Trang chủ → Xem thông số tại màn hình Chi tiết xe → Gửi yêu cầu đặt xe (POST /rentals) đưa đơn vào trạng thái PENDING_APPROVAL → Chủ xe nhận thông báo và duyệt đơn (PUT /approve) chuyển sang WAITING_PAYMENT → Màn hình khách thuê tự động chuyển sang Thanh toán cọc VietQR 45 phút → Khách cọc thành công, Webhook Napas kích hoạt đơn chuyển sang CONFIRMED → Tại thời điểm giao nhận, hai bên thao tác trên màn hình Ký nhận bàn giao Check-in chuyển đơn sang IN_PROGRESS → Khi kết thúc hành trình, Chủ xe mở màn hình Lập biên bản Check-out đối soát ODO/xăng và khách tất toán 70% chuyển đơn sang COMPLETED → Trường hợp phát sinh mâu thuẫn giao nhận, màn hình chuyển sang Tranh chấp bùng xe (DISPUTED) để chuyển tiếp hồ sơ sang Bảng điều khiển Quản trị viên Admin xử lý.")
    
    # =========================================================================
    # CHƯƠNG 10: ĐẶC TẢ GIAO DIỆN LẬP TRÌNH ỨNG DỤNG (RESTFUL API SPECIFICATION)
    # =========================================================================
    print("Generating Chapter 10...")
    b.add_h("CHƯƠNG 10: ĐẶC TẢ GIAO DIỆN LẬP TRÌNH ỨNG DỤNG (RESTFUL API SPECIFICATION)", level=1)
    b.add_p("Hợp đồng API (API Contract) giữa Backend và Frontend tuân thủ nghiêm ngặt chuẩn kiến trúc RESTful. Mọi phản hồi từ hệ thống đều được bọc đồng nhất trong đối tượng ApiResponse<T> bao gồm: mã trạng thái nghiệp vụ (code), thông điệp mô tả (message) và dữ liệu kết quả (data). Khi xảy ra lỗi, GlobalExceptionHandler chuyển đổi tự động thành mã HTTP tương ứng kèm chi tiết nguyên nhân vi phạm.")
    b.add_p("Bảng danh mục chi tiết đúng 53 Endpoints RESTful API cốt lõi của hệ thống DriveShare, bao phủ trọn vẹn các yêu cầu chức năng (các cơ chế nền tảng như Servlet Filter, Domain Policy và Scheduled Cron Job được đặc tả tại Chương 8):")
    
    api_headers = ["Method", "Endpoint", "Mô tả nghiệp vụ / Quyền truy cập", "HTTP Status"]
    api_data = [
        ["POST", "/api/v1/auth/register", "Đăng ký tài khoản người dùng mới (Public)", "201, 400, 409"],
        ["POST", "/api/v1/auth/login", "Đăng nhập tài khoản, xác thực cấp JWT Access Token và Refresh Token (Public)", "200, 401, 423"],
        ["POST", "/api/v1/auth/refresh-token", "Làm mới Access Token khi token cũ hết hạn (Public)", "200, 401"],
        ["POST", "/api/v1/auth/change-password", "Đổi mật khẩu tài khoản người dùng (Authenticated)", "200, 400"],
        ["POST", "/api/v1/auth/logout", "Đăng xuất tài khoản và thu hồi phiên làm việc trong auth_sessions (Authenticated)", "200"],
        ["POST", "/api/v1/auth/forgot-password", "Yêu cầu gửi mã OTP đặt lại mật khẩu qua email (Public)", "200, 400"],
        ["POST", "/api/v1/auth/reset-password", "Xác thực mã OTP và cập nhật mật khẩu mới (Public)", "200, 400"],
        ["POST", "/api/v1/oauth2/complete-registration", "Hoàn tất đăng ký / đăng nhập nhanh qua Google OAuth2 (Public)", "200, 400"],
        ["GET", "/api/v1/users/me", "Lấy thông tin tài khoản người dùng hiện tại (Authenticated)", "200, 401"],
        ["PUT", "/api/v1/users/me", "Cập nhật thông tin cá nhân của người dùng (Authenticated)", "200, 400"],
        ["POST", "/api/v1/users/me/avatar", "Tải lên ảnh đại diện cá nhân lên Cloudinary CDN (Authenticated)", "200, 400"],
        ["POST", "/api/v1/users/me/cccd", "Tải lên ảnh chụp CCCD định danh eKYC (ROLE_CUSTOMER, ROLE_CAR_OWNER)", "200, 400"],
        ["POST", "/api/v1/users/me/gplx", "Tải lên ảnh chụp Giấy phép lái xe phục vụ thuê xe (ROLE_CUSTOMER)", "200, 400"],
        ["GET", "/api/v1/users/me/owner-profile", "Lấy thông tin hồ sơ chủ xe và tài khoản ngân hàng liên kết (ROLE_CAR_OWNER)", "200"],
        ["PUT", "/api/v1/users/me/owner-profile", "Cập nhật số tài khoản ngân hàng chính chủ phục vụ rút tiền (ROLE_CAR_OWNER)", "200, 400"],
        ["POST", "/api/v1/cars", "Đăng ký thông tin phương tiện cho thuê mới (ROLE_CAR_OWNER)", "201, 400"],
        ["POST", "/api/v1/cars/{carId}/photos", "Tải lên bộ sưu tập hình ảnh thực tế của xe (ROLE_CAR_OWNER)", "201, 400"],
        ["PUT", "/api/v1/cars/{id}", "Cập nhật thông tin chi tiết xe và cấu hình bảng giá thuê (ROLE_CAR_OWNER)", "200, 400"],
        ["PATCH", "/api/v1/cars/{id}/status", "Bật/tắt trạng thái xe khả dụng ACTIVE/INACTIVE (ROLE_CAR_OWNER)", "200, 403"],
        ["POST", "/api/v1/cars/{id}/calendar/blocks", "Thiết lập chặn lịch bận hoặc lịch bảo dưỡng xe (ROLE_CAR_OWNER)", "201, 400"],
        ["GET", "/api/v1/public/cars/search", "Tìm kiếm và lọc xe theo địa điểm, thời gian, mức giá (Public)", "200"],
        ["GET", "/api/v1/public/cars/{carId}", "Xem chi tiết thông số kỹ thuật và hình ảnh xe công khai (Public)", "200, 404"],
        ["POST", "/api/v1/rentals", "Khởi tạo đơn yêu cầu thuê xe mới (ROLE_CUSTOMER)", "201, 400, 409"],
        ["GET", "/api/v1/rentals/me", "Tra cứu danh sách đơn thuê của cá nhân khách hàng (ROLE_CUSTOMER)", "200"],
        ["PUT", "/api/v1/rentals/{id}/cancel", "Hủy đơn thuê xe theo chính sách hủy cọc (ROLE_CUSTOMER)", "200, 400"],
        ["GET", "/api/v1/owner/rentals", "Tra cứu danh sách yêu cầu thuê xe gửi đến chủ xe (ROLE_CAR_OWNER)", "200"],
        ["PUT", "/api/v1/owner/rentals/{id}/approve", "Chủ xe duyệt yêu cầu thuê xe (Kích hoạt Soft Lock 45 phút)", "200, 409"],
        ["POST", "/api/v1/rentals/{rentalId}/payment", "Sinh mã thanh toán đặt cọc 30% VietQR Napas 247 (ROLE_CUSTOMER)", "201, 400"],
        ["POST", "/api/v1/payments/{paymentId}/confirm", "Webhook xác nhận giao dịch thanh toán cọc thành công (Hard Lock)", "200, 404"],
        ["GET", "/api/v1/payments/rental/{rentalId}", "Tra cứu biên lai và lịch sử thanh toán của đơn thuê (ROLE_CUSTOMER)", "200"],
        ["PUT", "/api/v1/payments/{paymentId}/status", "Giả lập cập nhật trạng thái thanh toán môi trường thử nghiệm (Tester)", "200"],
        ["POST", "/api/v1/owner/rentals/{id}/check-in", "Lập biên bản bàn giao xe Check-in (ODO, xăng, ảnh) (ROLE_CAR_OWNER)", "201, 400"],
        ["POST", "/api/v1/rentals/{rentalId}/inspections/{inspectionId}/confirm", "Khách thuê xác nhận đồng thuận biên bản Check-in (ROLE_CUSTOMER)", "200, 400"],
        ["POST", "/api/v1/owner/rentals/{id}/check-out", "Lập biên bản Check-out trả xe và tính phụ phí phát sinh (ROLE_CAR_OWNER)", "200, 400"],
        ["PUT", "/api/v1/owner/rentals/{id}/complete", "Chủ xe xác nhận hoàn tất chuyến đi và giải phóng xe (ROLE_CAR_OWNER)", "200, 400"],
        ["POST", "/api/v1/rentals/{rentalId}/reviews", "Khách gửi đánh giá chấm điểm và nhận xét chuyến đi (ROLE_CUSTOMER)", "201, 400"],
        ["POST", "/api/v1/rentals/{id}/report-no-show", "Khách gửi khiếu nại báo cáo sự cố bùng xe (ROLE_CUSTOMER)", "201, 400"],
        ["GET", "/api/v1/admin/rentals/disputes", "Tra cứu danh sách các hồ sơ tranh chấp sự cố (ROLE_ADMIN)", "200"],
        ["POST", "/api/v1/admin/rentals/disputes/{id}/resolve", "Quản trị viên ra phán quyết xử lý tranh chấp và hoàn cọc Escrow (ROLE_ADMIN)", "200, 404"],
        ["GET", "/api/v1/owner/earnings", "Tra cứu bảng kê chi tiết số dư ví và thu nhập của chủ xe (ROLE_CAR_OWNER)", "200"],
        ["POST", "/api/v1/admin/rentals/{rentalId}/payout", "Quản trị viên duyệt và thực hiện chuyển khoản quyết toán ví (ROLE_ADMIN)", "200, 400"],
        ["GET", "/api/v1/admin/rentals/{id}/dossier", "Tra cứu hồ sơ vi phạm và trích xuất nhật ký kiểm toán (ROLE_ADMIN)", "200"],
        ["POST", "/api/v1/chat", "Gửi tin nhắn trò chuyện với Trợ lý ảo AI tư vấn xe (Public / Khách thuê)", "200"],
        ["POST", "/api/v1/rag/ask", "Truy vấn thông tin chi tiết xe bằng kiến trúc RAG AI (Public / Khách thuê)", "200"],
        ["GET", "/api/v1/chat/{sessionId}/history", "Tra cứu lịch sử hội thoại 5 lượt gần nhất với Trợ lý AI (Public / Khách thuê)", "200"],
        ["GET", "/api/v1/chat/my-sessions", "Tra cứu danh sách các phiên trò chuyện của người dùng hiện tại (Authenticated)", "200"],
        ["GET", "/api/v1/admin/chat-history", "Quản trị viên giám sát chất lượng và lịch sử phản hồi của AI (ROLE_ADMIN)", "200"],
        ["PATCH", "/api/v1/admin/cars/{carId}/approve", "Quản trị viên thẩm định và phê duyệt xe niêm yết (ROLE_ADMIN)", "200, 400"],
        ["PATCH", "/api/v1/admin/users/{userId}/approve-license", "Quản trị viên thẩm định và duyệt hồ sơ eKYC giấy phép lái xe (ROLE_ADMIN)", "200, 400"],
        ["PATCH", "/api/v1/admin/users/{userId}/status", "Quản trị viên khóa hoặc mở khóa tài khoản người dùng (ROLE_ADMIN)", "200, 400"],
        ["GET", "/api/v1/admin/stats", "Tra cứu báo cáo Dashboard phân tích doanh thu và số liệu toàn sàn (ROLE_ADMIN)", "200"],
        ["GET", "/api/v1/notifications/my-notifications", "Lấy danh sách thông báo của người dùng hiện tại (Authenticated)", "200"],
        ["GET", "/api/v1/health", "Kiểm tra trạng thái sức khỏe hoạt động của hệ thống Backend (Public)", "200"]
    ]
    b.add_tbl(api_headers, api_data, [1000, 3600, 3226, 1200])
    
    # =========================================================================
    # CHƯƠNG 11: THIẾT KẾ CHI TIẾT CƠ SỞ DỮ LIỆU
    # =========================================================================
    print("Generating Chapter 11...")
    b.add_h("CHƯƠNG 11: THIẾT KẾ CHI TIẾT CƠ SỞ DỮ LIỆU (DATABASE DESIGN)", level=1)
    b.add_p("Cơ sở dữ liệu của hệ thống DriveShare được thiết kế và chuẩn hóa ở mức 3NF trên hệ quản trị PostgreSQL 16. Hệ thống bao gồm 14 bảng quan hệ nghiệp vụ cốt lõi đã được Mentor thẩm định tại Sprint 1, cùng 1 bảng mở rộng chat_memory phục vụ lưu trữ ngữ cảnh hội thoại đa lượt của phân hệ Trợ lý AI Assistant (tương tự như bảng refresh_tokens mở rộng trong cấu trúc mẫu ITC). Toàn bộ cấu trúc bảng, kiểu dữ liệu, quan hệ khóa ngoại và chỉ mục đều được đồng bộ chặt chẽ với các thực thể JPA trong mã nguồn backend.")
    
    b.add_h("11.0. Sơ đồ thực thể quan hệ tổng quan (ERD Diagram)", level=2)
    b.add_p("Sơ đồ thực thể mối quan hệ thể hiện đầy đủ 14 bảng quan hệ nghiệp vụ trung tâm và bảng mở rộng chat_memory phục vụ phân hệ AI:")
    b.add_img("docs/diagrams/02_erd_database_workbench.png", "Hình 11.1 — Sơ đồ thực thể mối quan hệ (ERD) hệ thống DriveShare chuẩn hóa 3NF trên hệ quản trị CSDL PostgreSQL 16 (rộng 15,24 cm / 6,0 inch).", width_inches=6.0)
    
    b.add_h("11.1. Đặc tả chi tiết từng bảng", level=2)
    
    db_col_widths = [1600, 1600, 1800, 1000, 3026]
    db_table_headers = ["Trường (Column)", "Kiểu dữ liệu", "Ràng buộc", "Mặc định", "Mô tả nghiệp vụ"]
    
    tables_dict = [
        ("Bảng 1: users — Thực thể người dùng trung tâm", [
            ["user_id", "BIGSERIAL", "PRIMARY KEY", "—", "Khóa chính tự tăng định danh người dùng toàn hệ thống."],
            ["username", "VARCHAR(50)", "UNIQUE, NOT NULL", "—", "Tên đăng nhập duy nhất."],
            ["email", "VARCHAR(100)", "UNIQUE, NOT NULL", "—", "Địa chỉ email dùng xác thực và liên lạc."],
            ["password_hash", "VARCHAR(255)", "NOT NULL", "—", "Mật khẩu mã hóa băm BCrypt độ phức tạp 10."],
            ["full_name", "VARCHAR(100)", "NOT NULL", "—", "Họ và tên đầy đủ của người dùng."],
            ["phone_number", "VARCHAR(20)", "NULL", "—", "Số điện thoại liên hệ cá nhân."],
            ["cccd_number", "VARCHAR(20)", "NULL", "—", "Số thẻ CCCD định danh eKYC."],
            ["driver_license_number", "VARCHAR(20)", "NULL", "—", "Số Giấy phép lái xe phục vụ thuê xe."],
            ["status", "VARCHAR(20)", "NOT NULL", "'ACTIVE'", "Trạng thái tài khoản (ACTIVE, LOCKED, PENDING)."],
            ["created_at", "TIMESTAMP", "NOT NULL", "CURRENT_TIMESTAMP", "Thời điểm khởi tạo tài khoản."],
            ["updated_at", "TIMESTAMP", "NOT NULL", "CURRENT_TIMESTAMP", "Thời điểm cập nhật thông tin gần nhất."]
        ]),
        ("Bảng 2: roles — Danh mục vai trò trong hệ thống (RBAC)", [
            ["role_id", "SERIAL", "PRIMARY KEY", "—", "Khóa chính định danh vai trò người dùng."],
            ["role_name", "VARCHAR(50)", "UNIQUE, NOT NULL", "—", "Mã vai trò (ROLE_CUSTOMER, ROLE_CAR_OWNER, ROLE_ADMIN)."],
            ["description", "VARCHAR(255)", "NULL", "—", "Mô tả phạm vi quyền hạn của vai trò trong hệ thống."]
        ]),
        ("Bảng 3: user_roles — Bảng quan hệ N-N giữa người dùng và vai trò", [
            ["user_id", "BIGINT", "PRIMARY KEY, FK", "—", "Khóa ngoại tham chiếu đến users(user_id)."],
            ["role_id", "INT", "PRIMARY KEY, FK", "—", "Khóa ngoại tham chiếu đến roles(role_id)."]
        ]),
        ("Bảng 4: auth_sessions — Quản lý phiên đăng nhập và thu hồi token", [
            ["session_id", "BIGSERIAL", "PRIMARY KEY", "—", "Khóa chính định danh phiên làm việc."],
            ["user_id", "BIGINT", "FK, NOT NULL", "—", "Khóa ngoại tham chiếu đến users(user_id)."],
            ["refresh_token", "VARCHAR(512)", "UNIQUE, NOT NULL", "—", "Chuỗi JWT Refresh Token cấp cho Client."],
            ["ip_address", "VARCHAR(45)", "NULL", "—", "Địa chỉ IP thực hiện đăng nhập."],
            ["user_agent", "VARCHAR(255)", "NULL", "—", "Thông tin trình duyệt và hệ điều hành của Client."],
            ["is_revoked", "BOOLEAN", "NOT NULL", "FALSE", "Cờ đánh dấu phiên đã bị thu hồi khi đăng xuất/đổi pass."],
            ["expires_at", "TIMESTAMP", "NOT NULL", "—", "Thời điểm Refresh Token hết hiệu lực."]
        ]),
        ("Bảng 5: password_reset_tokens — Quản lý mã OTP và token đặt lại mật khẩu", [
            ["id", "BIGSERIAL", "PRIMARY KEY", "—", "Khóa chính định danh bản ghi OTP."],
            ["user_id", "BIGINT", "FK, NOT NULL", "—", "Khóa ngoại tham chiếu đến users(user_id)."],
            ["otp_code", "VARCHAR(6)", "NOT NULL", "—", "Mã số bí mật 6 chữ số có hiệu lực 10 phút."],
            ["token", "VARCHAR(255)", "UNIQUE, NOT NULL", "—", "Chuỗi token dùng xác thực khi gọi API reset password."],
            ["expires_at", "TIMESTAMP", "NOT NULL", "—", "Thời điểm hết hạn hiệu lực của mã OTP."],
            ["is_used", "BOOLEAN", "NOT NULL", "FALSE", "Cờ đánh dấu mã OTP đã được sử dụng hay chưa."]
        ]),
        ("Bảng 6: cars — Thông tin phương tiện cho thuê", [
            ["car_id", "BIGSERIAL", "PRIMARY KEY", "—", "Khóa chính tự tăng định danh phương tiện."],
            ["owner_id", "BIGINT", "FK, NOT NULL", "—", "Khóa ngoại tham chiếu đến chủ sở hữu xe users(user_id)."],
            ["brand", "VARCHAR(50)", "NOT NULL", "—", "Hãng sản xuất xe (Toyota, Mazda, Honda...)."],
            ["model", "VARCHAR(50)", "NOT NULL", "—", "Dòng xe cụ thể (Mazda 3, Fortuner, VF8...)."],
            ["year", "INT", "NOT NULL", "—", "Năm sản xuất xuất xưởng của phương tiện."],
            ["license_plate", "VARCHAR(20)", "UNIQUE, NOT NULL", "—", "Biển kiểm soát xe duy nhất toàn quốc."],
            ["price_per_day", "DECIMAL(12,2)", "NOT NULL", "—", "Đơn giá thuê cơ sở theo ngày (VND/ngày)."],
            ["overdue_hourly_rate", "DECIMAL(12,2)", "NOT NULL", "—", "Mức phụ phí phạt trễ hạn tính theo giờ (VND/giờ)."],
            ["excess_km_rate", "DECIMAL(12,2)", "NOT NULL", "—", "Mức phụ phí vượt quãng đường cho phép (VND/km)."],
            ["status", "VARCHAR(20)", "NOT NULL", "'ACTIVE'", "Trạng thái xe hoạt động (ACTIVE, INACTIVE, RENTED)."],
            ["approval_status", "VARCHAR(20)", "NOT NULL", "'PENDING'", "Trạng thái thẩm định của Admin (PENDING, APPROVED, REJECTED)."]
        ]),
        ("Bảng 7: car_images — Bộ sưu tập hình ảnh xe", [
            ["image_id", "BIGSERIAL", "PRIMARY KEY", "—", "Khóa chính tự tăng định danh hình ảnh."],
            ["car_id", "BIGINT", "FK, NOT NULL", "—", "Khóa ngoại tham chiếu đến cars(car_id)."],
            ["image_url", "VARCHAR(512)", "NOT NULL", "—", "Đường dẫn URL ảnh lưu trữ an toàn trên Cloudinary CDN."],
            ["is_primary", "BOOLEAN", "NOT NULL", "FALSE", "Cờ đánh dấu ảnh đại diện chính của xe."]
        ]),
        ("Bảng 8: car_calendar_blocks — Lịch bận và thời gian bảo dưỡng xe", [
            ["block_id", "BIGSERIAL", "PRIMARY KEY", "—", "Khóa chính định danh khoảng lịch chặn."],
            ["car_id", "BIGINT", "FK, NOT NULL", "—", "Khóa ngoại tham chiếu đến cars(car_id)."],
            ["start_date", "TIMESTAMP", "NOT NULL", "—", "Thời điểm bắt đầu khoảng chặn lịch xe."],
            ["end_date", "TIMESTAMP", "NOT NULL", "—", "Thời điểm kết thúc khoảng chặn lịch xe."],
            ["reason", "VARCHAR(255)", "NULL", "—", "Lý do chặn lịch (bảo dưỡng định kỳ, chủ xe có việc bận)."]
        ]),
        ("Bảng 9: rentals — Hợp đồng thuê xe & vòng đời 17 bước", [
            ["rental_id", "BIGSERIAL", "PRIMARY KEY", "—", "Khóa chính tự tăng định danh đơn thuê xe."],
            ["renter_id", "BIGINT", "FK, NOT NULL", "—", "Khóa ngoại tham chiếu đến khách thuê users(user_id)."],
            ["car_id", "BIGINT", "FK, NOT NULL", "—", "Khóa ngoại tham chiếu đến xe thuê cars(car_id)."],
            ["start_date", "TIMESTAMP", "NOT NULL", "—", "Thời điểm bắt đầu hành trình thuê."],
            ["end_date", "TIMESTAMP", "NOT NULL", "—", "Thời điểm kết thúc hành trình theo hợp đồng."],
            ["total_price", "DECIMAL(12,2)", "NOT NULL", "—", "Tổng giá trị hợp đồng thuê gốc (chưa tính phụ phí)."],
            ["deposit_amount", "DECIMAL(12,2)", "NOT NULL", "—", "Số tiền đặt cọc 30% ký quỹ Napas Escrow."],
            ["status", "VARCHAR(30)", "NOT NULL", "'PENDING'", "Trạng thái đơn theo máy trạng thái 17 bước ERentalStatus."],
            ["payment_expires_at", "TIMESTAMP", "NULL", "—", "Thời điểm hết hạn 45 phút Soft Lock giữ chỗ."],
            ["cancel_reason", "VARCHAR(255)", "NULL", "—", "Lý do hủy đơn hoặc từ chối đơn thuê."]
        ]),
        ("Bảng 10: payments — Giao dịch cọc VietQR Napas 247 & dòng tiền Escrow", [
            ["payment_id", "BIGSERIAL", "PRIMARY KEY", "—", "Khóa chính tự tăng định danh giao dịch thanh toán."],
            ["rental_id", "BIGINT", "FK, NOT NULL", "—", "Khóa ngoại tham chiếu đến rentals(rental_id)."],
            ["user_id", "BIGINT", "FK, NOT NULL", "—", "Khóa ngoại tham chiếu đến người thanh toán users(user_id)."],
            ["amount", "DECIMAL(12,2)", "NOT NULL", "—", "Số tiền giao dịch thực tế (VND)."],
            ["payment_method", "VARCHAR(30)", "NOT NULL", "'VIETQR'", "Phương thức thanh toán (VIETQR, WALLET, ESCROW)."],
            ["status", "VARCHAR(20)", "NOT NULL", "'PENDING'", "Trạng thái giao dịch (PENDING, SUCCESS, FAILED, REFUNDED)."],
            ["transaction_ref", "VARCHAR(100)", "UNIQUE, NULL", "—", "Mã đối soát giao dịch duy nhất từ cổng Napas 247."],
            ["pay_url", "VARCHAR(512)", "NULL", "—", "URL mã QR chuyển khoản VietQR."]
        ]),
        ("Bảng 11: rental_inspections — Biên bản nghiệm thu xe Check-in / Check-out", [
            ["inspection_id", "BIGSERIAL", "PRIMARY KEY", "—", "Khóa chính định danh biên bản kiểm tra."],
            ["rental_id", "BIGINT", "FK, NOT NULL", "—", "Khóa ngoại tham chiếu đến đơn thuê rentals(rental_id)."],
            ["inspection_type", "VARCHAR(20)", "NOT NULL", "—", "Loại biên bản (CHECK_IN lúc giao, CHECK_OUT lúc nhận)."],
            ["odo_reading", "INT", "NOT NULL", "—", "Chỉ số ODO đồng hồ công tơ mét tại thời điểm kiểm tra."],
            ["fuel_level", "VARCHAR(20)", "NOT NULL", "—", "Mức nhiên liệu vạch xăng/pin hiện tại."],
            ["exterior_photos", "TEXT", "NULL", "—", "Chuỗi JSON lưu danh sách URL 4 góc ảnh chụp xe."],
            ["customer_confirmed", "BOOLEAN", "NOT NULL", "FALSE", "Cờ xác nhận đồng thuận ký biên bản từ khách thuê."]
        ]),
        ("Bảng 12: rental_disputes — Hồ sơ khiếu nại sự cố bùng xe & phân xử trọng tài", [
            ["dispute_id", "BIGSERIAL", "PRIMARY KEY", "—", "Khóa chính định danh hồ sơ tranh chấp."],
            ["rental_id", "BIGINT", "FK, UNIQUE, NOT NULL", "—", "Khóa ngoại 1-1 tham chiếu đến rentals(rental_id)."],
            ["reporter_id", "BIGINT", "FK, NOT NULL", "—", "Khóa ngoại tham chiếu người gửi khiếu nại users(user_id)."],
            ["reason", "TEXT", "NOT NULL", "—", "Mô tả chi tiết nguyên nhân sự cố hoặc hành vi vi phạm."],
            ["status", "VARCHAR(20)", "NOT NULL", "'PENDING'", "Trạng thái xử lý tranh chấp (PENDING, RESOLVED, REJECTED)."],
            ["resolution", "TEXT", "NULL", "—", "Nội dung phán quyết giải quyết tranh chấp của Admin."],
            ["refund_amount", "DECIMAL(12,2)", "NULL", "0", "Số tiền cọc Escrow quyết định hoàn trả cho bên bị hại."]
        ]),
        ("Bảng 13: notifications — Hàng đợi thông báo đẩy đa kênh", [
            ["notification_id", "BIGSERIAL", "PRIMARY KEY", "—", "Khóa chính tự tăng định danh thông báo."],
            ["user_id", "BIGINT", "FK, NOT NULL", "—", "Khóa ngoại tham chiếu đến người nhận users(user_id)."],
            ["title", "VARCHAR(150)", "NOT NULL", "—", "Tiêu đề ngắn gọn của thông báo."],
            ["content", "TEXT", "NOT NULL", "—", "Nội dung chi tiết của thông báo gửi tới người dùng."],
            ["is_read", "BOOLEAN", "NOT NULL", "FALSE", "Cờ đánh dấu người dùng đã đọc thông báo hay chưa."],
            ["type", "VARCHAR(30)", "NOT NULL", "'SYSTEM'", "Phân loại thông báo (BOOKING, PAYMENT, DISPUTE, SYSTEM)."]
        ]),
        ("Bảng 14: audit_logs — Nhật ký kiểm toán và vết thao tác hệ thống", [
            ["log_id", "BIGSERIAL", "PRIMARY KEY", "—", "Khóa chính tự tăng định danh bản ghi kiểm toán."],
            ["user_id", "BIGINT", "NULL", "—", "ID người dùng thực hiện thao tác (nếu có)."],
            ["action", "VARCHAR(50)", "NOT NULL", "—", "Mã hành động nghiệp vụ (LOGIN, APPROVE_CAR, RESOLVE_DISPUTE...)."],
            ["resource", "VARCHAR(50)", "NOT NULL", "—", "Đối tượng thực thể bị tác động (RENTAL, CAR, USER, PAYMENT)."],
            ["ip_address", "VARCHAR(45)", "NULL", "—", "Địa chỉ IP thực hiện thao tác."],
            ["details", "TEXT", "NULL", "—", "Chi tiết thay đổi dữ liệu hoặc thông số phán quyết."],
            ["created_at", "TIMESTAMP", "NOT NULL", "CURRENT_TIMESTAMP", "Thời điểm ghi nhận thao tác."]
        ]),
        ("Bảng 15: chat_memory — Bộ nhớ hội thoại đa lượt của Trợ lý AI (Bảng mở rộng)", [
            ["id", "BIGSERIAL", "PRIMARY KEY", "—", "Khóa chính tự tăng định danh câu thoại."],
            ["user_id", "BIGINT", "NULL", "—", "ID người dùng tham gia trò chuyện (nếu đã đăng nhập)."],
            ["session_id", "VARCHAR(100)", "NOT NULL", "—", "Mã phiên hội thoại định danh duy nhất của Client."],
            ["role", "VARCHAR(20)", "NOT NULL", "—", "Vai trò phát ngôn trong hội thoại (USER hoặc MODEL/AI)."],
            ["content", "TEXT", "NOT NULL", "—", "Nội dung câu hỏi hoặc lời tư vấn của Trợ lý AI."],
            ["created_at", "TIMESTAMP", "NOT NULL", "CURRENT_TIMESTAMP", "Thời điểm phát sinh lượt hội thoại."]
        ])
    ]
    
    for tbl_title, tbl_rows in tables_dict:
        b.add_h(tbl_title, level=3)
        b.add_tbl(db_table_headers, tbl_rows, db_col_widths)
        
    b.add_h("Quan hệ khóa ngoại chính (Relationship Summary)", level=3)
    b.add_p("users (1) — (n) user_roles (n) — (1) roles: Quan hệ nhiều - nhiều phân quyền bảo mật RBAC.")
    b.add_p("users (1, Car Owner) — (n) cars: Một chủ xe sở hữu nhiều phương tiện cho thuê trên sàn.")
    b.add_p("cars (1) — (n) car_images: Một xe có nhiều ảnh ngoại thất, nội thất lưu trữ CDN.")
    b.add_p("cars (1) — (n) car_calendar_blocks: Một xe có nhiều khoảng thời gian chặn lịch bảo dưỡng.")
    b.add_p("users (1, Renter) — (n) rentals; cars (1) — (n) rentals: Khách thuê và phương tiện liên kết chặt chẽ trong hợp đồng thuê xe.")
    b.add_p("rentals (1) — (n) payments: Một đơn thuê phát sinh nhiều giao dịch tài chính (cọc 30%, thanh toán 70%, hoàn tiền cọc Escrow).")
    b.add_p("rentals (1) — (n) rental_inspections: Một đơn thuê có hai biên bản bàn giao kỹ thuật (Check-in nhận xe và Check-out trả xe).")
    b.add_p("rentals (1) — (0..1) rental_disputes: Một đơn thuê phát sinh tối đa một hồ sơ khiếu nại tranh chấp bùng xe gửi trọng tài.")
    b.add_p("users (1) — (n) notifications: Một người dùng nhận nhiều thông báo biến động đơn và thanh toán.")
    b.add_p("users (1) — (n) audit_logs: Nhật ký kiểm toán hệ thống ghi nhận vết thao tác của người dùng và Quản trị viên.")
    
    b.add_h("11.2. Chiến lược Indexing và Ràng buộc toàn vẹn", level=2)
    b.add_p("Để bảo đảm hiệu năng truy vấn P95 < 1000ms, hệ thống triển khai chiến lược đánh chỉ mục chi tiết:")
    b.add_p("Chỉ mục B-Tree tự động được kích hoạt trên toàn bộ các cột khóa chính (*_id) của các bảng quan hệ.", bold_prefix="Primary Key Indexing: ")
    b.add_p("Tạo Unique Index trên users(email), users(username), cars(license_plate) để chống trùng lặp dữ liệu tuyệt đối từ tầng CSDL.", bold_prefix="Unique Constraints: ")
    b.add_p("Tạo Composite Index trên rentals(car_id, start_date, end_date, status) để tăng tốc độ kiểm tra xung đột lịch giữ chỗ và tìm kiếm xe khả dụng.", bold_prefix="Composite Indexing: ")
    b.add_p("Áp dụng Indexing trên tất cả các cột khóa ngoại tham chiếu (payments.rental_id, rental_inspections.rental_id, notifications.user_id) nhằm tối ưu hóa các câu lệnh JOIN bảng.", bold_prefix="Foreign Key Indexing: ")
    b.add_p("Áp dụng ràng buộc ON DELETE RESTRICT đối với các thực thể tài chính và hợp đồng (rentals, payments, rental_inspections) để ngăn ngừa hành vi xóa nhầm dữ liệu lịch sử.", bold_prefix="Ràng buộc toàn vẹn: ")
    
    # =========================================================================
    # CHƯƠNG 12: MA TRẬN TRUY VẾT YÊU CẦU (RTM)
    # =========================================================================
    print("Generating Chapter 12...")
    b.add_h("CHƯƠNG 12: MA TRẬN TRUY VẾT YÊU CẦU (REQUIREMENT TRACEABILITY MATRIX - RTM)", level=1)
    b.add_p("Ma trận truy vết yêu cầu (RTM) bảo đảm mối liên kết xuyên suốt hai chiều giữa các yêu cầu nghiệp vụ tại Chương 5 với Use Case thiết kế (Chương 6), Endpoint RESTful API xử lý (Chương 10), Bảng CSDL lưu trữ (Chương 11) và Mã kiểm thử tự động của Tester. Bảng RTM được đặc tả chi tiết gồm ĐÚNG 54 DÒNG ĐƠN LẺ, bảo đảm độ phủ 100% và không có bất kỳ yêu cầu mồ côi nào.")
    
    rtm_col_widths = [1350, 1350, 2750, 2376, 1200]
    rtm_headers = ["Mã YC", "Use Case", "API Endpoint xử lý", "Bảng CSDL liên quan", "Mã Test Case"]
    
    rtm_data = [
        ["REQ-AUT-01", "UC-AUT-001", "POST /api/v1/auth/register & POST /api/v1/users/me/cccd", "users, roles, user_roles", "TC-AUT-01"],
        ["REQ-AUT-02", "UC-AUT-001", "POST /api/v1/auth/login & POST /api/v1/auth/refresh-token", "users, auth_sessions", "TC-AUT-02"],
        ["REQ-AUT-03", "UC-AUT-001", "Phi API (JwtAuthenticationFilter)", "roles, user_roles", "TC-AUT-03"],
        ["REQ-AUT-04", "UC-AUT-001", "POST /api/v1/auth/change-password & POST /api/v1/auth/logout", "users, auth_sessions", "TC-AUT-04"],
        ["REQ-AUT-05", "UC-AUT-001", "POST /api/v1/auth/forgot-password & POST /api/v1/auth/reset-password", "password_reset_tokens", "TC-AUT-05"],
        ["REQ-AUT-06", "UC-AUT-001", "POST /api/v1/oauth2/complete-registration", "users, roles", "TC-AUT-06"],
        ["REQ-CAR-01", "UC-CAR-002", "POST /api/v1/cars & POST /api/v1/cars/{carId}/photos", "cars, car_images", "TC-CAR-01"],
        ["REQ-CAR-02", "UC-CAR-002", "PUT /api/v1/cars/{id}", "cars", "TC-CAR-02"],
        ["REQ-CAR-03", "UC-CAR-002", "PATCH /api/v1/cars/{id}/status", "cars", "TC-CAR-03"],
        ["REQ-CAR-04", "UC-CAR-002", "POST /api/v1/cars/{id}/calendar/blocks", "car_calendar_blocks", "TC-CAR-04"],
        ["REQ-CAR-05", "UC-CAR-002", "GET /api/v1/public/cars/search", "cars, car_calendar_blocks", "TC-CAR-05"],
        ["REQ-CAR-06", "UC-CAR-002", "GET /api/v1/public/cars/{carId}", "cars, car_images", "TC-CAR-06"],
        ["REQ-BOK-01", "UC-BOK-003", "POST /api/v1/rentals", "rentals", "TC-BOK-01"],
        ["REQ-BOK-02", "UC-BOK-003", "PUT /api/v1/owner/rentals/{id}/approve", "rentals, notifications", "TC-BOK-02"],
        ["REQ-BOK-03", "UC-BOK-003", "GET /api/v1/owner/rentals & GET /api/v1/rentals/me", "rentals, users", "TC-BOK-03"],
        ["REQ-BOK-04", "UC-BOK-003", "Phi API (Domain RentalStatusPolicy)", "rentals", "TC-BOK-04"],
        ["REQ-BOK-05", "UC-BOK-003", "Phi API (Scheduled RentalExpirationJob)", "rentals", "TC-BOK-05"],
        ["REQ-BOK-06", "UC-BOK-003", "PUT /api/v1/rentals/{id}/cancel", "rentals", "TC-BOK-06"],
        ["REQ-PAY-01", "UC-BOK-003", "POST /api/v1/rentals/{rentalId}/payment", "payments", "TC-PAY-01"],
        ["REQ-PAY-02", "UC-BOK-003", "Phi API (PaymentEscrowService)", "payments", "TC-PAY-02"],
        ["REQ-PAY-03", "UC-BOK-003", "POST /api/v1/payments/{paymentId}/confirm", "payments, rentals", "TC-PAY-03"],
        ["REQ-PAY-04", "UC-BOK-003", "GET /api/v1/payments/rental/{rentalId}", "payments", "TC-PAY-04"],
        ["REQ-PAY-05", "UC-BOK-003", "PUT /api/v1/payments/{paymentId}/status", "payments", "TC-PAY-05"],
        ["REQ-HND-01", "UC-HND-004", "POST /api/v1/owner/rentals/{id}/check-in", "rental_inspections", "TC-HND-01"],
        ["REQ-HND-02", "UC-HND-004", "POST /api/v1/rentals/{rentalId}/inspections/{inspectionId}/confirm", "rental_inspections, notifications", "TC-HND-02"],
        ["REQ-HND-03", "UC-HND-004", "POST /api/v1/owner/rentals/{id}/check-out", "rental_inspections", "TC-HND-03"],
        ["REQ-HND-04", "UC-HND-004", "POST /api/v1/owner/rentals/{id}/check-out", "rental_inspections, rentals", "TC-HND-04"],
        ["REQ-HND-05", "UC-HND-004", "PUT /api/v1/owner/rentals/{id}/complete & POST /api/v1/rentals/{rentalId}/reviews", "rentals, audit_logs", "TC-HND-05"],
        ["REQ-DSP-01", "UC-DSP-005", "POST /api/v1/rentals/{id}/report-no-show", "rental_disputes, notifications", "TC-DSP-01"],
        ["REQ-DSP-02", "UC-DSP-005", "Phi API (DisputeLockPolicy)", "rentals, payments", "TC-DSP-02"],
        ["REQ-DSP-03", "UC-DSP-005", "GET /api/v1/admin/rentals/disputes", "rental_disputes, rentals", "TC-DSP-03"],
        ["REQ-DSP-04", "UC-DSP-005", "POST /api/v1/admin/rentals/disputes/{id}/resolve", "rental_disputes, payments", "TC-DSP-04"],
        ["REQ-DSP-05", "UC-DSP-005", "GET /api/v1/admin/rentals/{id}/dossier & Phi API (Audit Trail Service)", "audit_logs", "TC-DSP-05"],
        ["REQ-WAL-01", "UC-HND-004", "Phi API (RevenueShareService)", "rentals, payments", "TC-WAL-01"],
        ["REQ-WAL-02", "UC-HND-004", "GET /api/v1/owner/earnings", "payments, rentals", "TC-WAL-02"],
        ["REQ-WAL-03", "UC-HND-004", "PUT /api/v1/users/me/owner-profile", "users", "TC-WAL-03"],
        ["REQ-WAL-04", "UC-DSP-005", "POST /api/v1/admin/rentals/{rentalId}/payout", "payments, audit_logs", "TC-WAL-04"],
        ["REQ-AI-01", "— (Trợ lý AI)", "POST /api/v1/chat", "chat_memory", "TC-AI-01"],
        ["REQ-AI-02", "— (Trợ lý AI)", "POST /api/v1/rag/ask", "chat_memory, cars", "TC-AI-02"],
        ["REQ-AI-03", "— (Trợ lý AI)", "GET /api/v1/chat/{sessionId}/history", "chat_memory", "TC-AI-03"],
        ["REQ-AI-04", "— (Trợ lý AI)", "GET /api/v1/admin/chat-history", "chat_memory", "TC-AI-04"],
        ["REQ-ADM-01", "UC-CAR-002", "PATCH /api/v1/admin/cars/{carId}/approve", "cars", "TC-ADM-01"],
        ["REQ-ADM-02", "UC-AUT-001", "PATCH /api/v1/admin/users/{userId}/approve-license", "users", "TC-ADM-02"],
        ["REQ-ADM-03", "UC-AUT-001", "PATCH /api/v1/admin/users/{userId}/status", "users", "TC-ADM-03"],
        ["REQ-ADM-04", "UC-DSP-005", "GET /api/v1/admin/stats", "rentals, payments", "TC-ADM-04"],
        ["REQ-ADM-05", "UC-DSP-005", "GET /api/v1/admin/rentals/{id}/dossier & Phi API (Audit Log Service)", "audit_logs", "TC-ADM-05"],
        ["REQ-TST-01", "— (Kiểm thử tự động)", "Phi API (Maven Surefire - JUnit 5 & Mockito)", "users, cars, rentals, payments", "TC-TST-01"],
        ["REQ-TST-02", "— (Kiểm thử tự động)", "Phi API (RentalConcurrencyTest - Pessimistic Lock)", "rentals, payments", "TC-TST-02"],
        ["REQ-TST-03", "— (Kiểm thử tự động)", "Phi API (ArchitectureRulesTest - 7 Luật ArchUnit)", "Toàn bộ kiến trúc Hexagonal", "TC-TST-03"],
        ["REQ-TST-04", "— (Kiểm thử tự động)", "Phi API (Postman Collection Automation Suite)", "REST Controllers", "TC-TST-04"],
        ["REQ-OPS-01", "— (DevOps & Vận hành)", "Phi API (Dockerfile Multi-stage Eclipse Temurin)", "Môi trường chạy Container", "TC-OPS-01"],
        ["REQ-OPS-02", "— (DevOps & Vận hành)", "Phi API (Render Web Service & PostgreSQL Managed)", "Hạ tầng Đám mây Cloud", "TC-OPS-02"],
        ["REQ-OPS-03", "— (DevOps & Vận hành)", "GET /api/v1/health", "System Health", "TC-OPS-03"],
        ["REQ-OPS-04", "— (DevOps & Vận hành)", "Phi API (Application Configuration Environment)", "application.yml", "TC-OPS-04"]
    ]
    
    b.add_tbl(rtm_headers, rtm_data, rtm_col_widths, is_rtm=True)
    
    print(f"Total RTM rows added: {len(rtm_data)}")
    
    print(f"Saving new document to {OUTPUT_DOCX}...")
    doc.save(OUTPUT_DOCX)
    print("SUCCESS: Document generated and saved successfully!")

if __name__ == '__main__':
    build_chapters()
