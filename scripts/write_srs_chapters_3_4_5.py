# -*- coding: utf-8 -*-
"""
Script tái tạo và chuẩn hóa 100% format Chương 3, Chương 4, Chương 5 cho:
docs/BAO_CAO_SRS_DRIVESHARE_K4_PRO_V2_1_fixed.docx
Khớp chính xác với Doc_ITC.docx và Chương 1-2:
1. Tiêu đề dùng chuẩn Style Heading 1 / Heading 2 / Heading 3 (Word Outline / Navigation Pane)
2. Bảng style Table1, header 1f4e79, viền bfbfbf, tổng rộng 9026 dxa, không xen kẽ zebra
3. Độ rộng cột chuẩn ITC: [1100, 4226, 2200, 700, 800] cho bảng Ch.5; [2144, 1723, 5159] cho Ch.3; [1700, 1500, 2826, 3000] cho Ch.4; [2626, 1600, 1600, 1600, 1600] cho Matrix 3.2
4. Bullet list thật qua w:numPr (numId=1)
5. Đoạn văn style normal, line spacing 1.5, căn đều (both), không hardcode font cỡ tay
6. Bỏ toàn bộ nhãn chú thích "Bảng x.y"
7. Đồng bộ số liệu: 186 bài test, Service coverage >= 60%, JVM < 512MB, Java 17+, Sprint Release, mã REQ-WAL-xx, 3 tác nhân người dùng + 3 tác nhân kỹ thuật.
"""

import sys
import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

sys.stdout.reconfigure(encoding='utf-8')

def set_cell_borders(cell, color="bfbfbf", sz="4"):
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:top w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:left w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:bottom w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:right w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>
        </w:tcBorders>
    ''')
    tcPr.append(borders)

def set_cell_margins(cell, top=60, bottom=60, left=100, right=100):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_background(cell, fill_hex):
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}" w:val="clear"/>')
    cell._tc.get_or_add_tcPr().append(shd)

def set_cell_v_align(cell, val="center"):
    vAlign = parse_xml(f'<w:vAlign {nsdecls("w")} w:val="{val}"/>')
    cell._tc.get_or_add_tcPr().append(vAlign)

def set_cell_width(cell, width_dxa):
    tcPr = cell._tc.get_or_add_tcPr()
    tcW = parse_xml(f'<w:tcW {nsdecls("w")} w:w="{width_dxa}" w:type="dxa"/>')
    tcPr.append(tcW)

def create_table_itc(doc, headers, data_rows, widths):
    # Total width check
    total_w = sum(widths)
    
    tbl = doc.add_table(rows=len(data_rows) + 1, cols=len(headers))
    tblPr = tbl._tbl.tblPr
    
    # Style Table1 & width 9026
    tblStyle = parse_xml(f'<w:tblStyle {nsdecls("w")} w:val="Table1"/>')
    tblPr.append(tblStyle)
    tblW = parse_xml(f'<w:tblW {nsdecls("w")} w:w="{total_w}" w:type="dxa"/>')
    tblPr.append(tblW)
    tblLayout = parse_xml(f'<w:tblLayout {nsdecls("w")} w:type="fixed"/>')
    tblPr.append(tblLayout)
    
    # Grid
    tblGrid = OxmlElement('w:tblGrid')
    for w in widths:
        col = OxmlElement('w:gridCol')
        col.set(qn('w:w'), str(w))
        tblGrid.append(col)
    tbl._tbl.insert(tbl._tbl.index(tblPr) + 1, tblGrid)
    
    # Header Row
    for col_idx, h_text in enumerate(headers):
        cell = tbl.rows[0].cells[col_idx]
        set_cell_width(cell, widths[col_idx])
        set_cell_borders(cell, "bfbfbf", "4")
        set_cell_background(cell, "1f4e79")
        set_cell_margins(cell, 60, 60, 100, 100)
        set_cell_v_align(cell, "center")
        
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        r = p.add_run(h_text)
        r.font.name = 'Arial'
        r.font.bold = True
        r.font.size = Pt(10)
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        
    # Data Rows
    for row_idx, row_data in enumerate(data_rows):
        for col_idx, val in enumerate(row_data):
            cell = tbl.rows[row_idx + 1].cells[col_idx]
            set_cell_width(cell, widths[col_idx])
            set_cell_borders(cell, "bfbfbf", "4")
            # NO zebra striping: clean white background
            set_cell_margins(cell, 60, 60, 100, 100)
            set_cell_v_align(cell, "center")
            
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            
            align = WD_ALIGN_PARAGRAPH.LEFT
            if len(headers) == 5:
                if col_idx in [0, 3, 4]:
                    align = WD_ALIGN_PARAGRAPH.CENTER
            elif len(headers) == 4:
                if col_idx in [0, 1]:
                    align = WD_ALIGN_PARAGRAPH.CENTER
            elif len(headers) == 3:
                if col_idx == 1:
                    align = WD_ALIGN_PARAGRAPH.CENTER
            p.alignment = align
            
            r = p.add_run(val)
            r.font.name = 'Arial'
            r.font.size = Pt(10)
            if col_idx == 0:
                r.font.bold = True
                
    return tbl

def add_heading_itc(doc, text, level):
    style_name = f'Heading {level}'
    p = doc.add_paragraph(text, style=style_name)
    p.paragraph_format.line_spacing = 1.5
    if level == 1:
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(6)
    elif level == 2:
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(4)
    elif level == 3:
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(3)
    return p

def add_paragraph_itc(doc, text):
    p = doc.add_paragraph(style='normal')
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run(text)
    r.font.name = 'Arial'
    r.font.size = Pt(11)
    return p

def add_bullet_itc(doc, text, bold_prefix=""):
    p = doc.add_paragraph(style='normal')
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    
    # Native Word list numbering XML
    pPr = p._p.get_or_add_pPr()
    numPr = parse_xml(f'''
        <w:numPr {nsdecls("w")}>
            <w:ilvl w:val="0"/>
            <w:numId w:val="1"/>
        </w:numPr>
    ''')
    pPr.append(numPr)
    
    spacing = parse_xml(f'<w:spacing {nsdecls("w")} w:after="40" w:before="40" w:line="360" w:lineRule="auto"/>')
    pPr.append(spacing)
    
    ind = parse_xml(f'<w:ind {nsdecls("w")} w:left="560" w:right="0" w:hanging="280"/>')
    pPr.append(ind)
    
    jc = parse_xml(f'<w:jc {nsdecls("w")} w:val="both"/>')
    pPr.append(jc)
    
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = 'Arial'
        r_pre.font.size = Pt(11)
        r_pre.font.bold = True
        
    r_txt = p.add_run(text)
    r_txt.font.name = 'Arial'
    r_txt.font.size = Pt(11)
    return p

def build_all_elements(doc):
    elements = []
    
    # =========================================================================
    # CHƯƠNG 3: TÁC NHÂN HỆ THỐNG (ACTORS)
    # =========================================================================
    elements.append(add_heading_itc(doc, "CHƯƠNG 3: TÁC NHÂN HỆ THỐNG (ACTORS)", 1))
    elements.append(add_paragraph_itc(doc, "Trong mô hình nền tảng chia sẻ và cho thuê xe tự lái trực tuyến P2P (Peer-to-Peer Car Rental) của DriveShare, hệ thống đóng vai trò sàn giao dịch điện tử trung gian kết nối người có xe nhàn rỗi (Chủ xe) và người có nhu cầu thuê xe (Khách thuê), đồng thời tích hợp cơ chế bảo vệ tài chính thông qua bảo lãnh ký quỹ cọc 30% VietQR Napas 247 và tư vấn lộ trình thông minh bằng Trợ lý ảo AI Assistant. Hệ thống DriveShare xác định 3 nhóm tác nhân người dùng chính (Khách thuê, Chủ xe, Quản trị viên) cùng 3 tác nhân kỹ thuật và dịch vụ tích hợp (Tiến trình hệ thống tự động, Cổng thanh toán VietQR Napas 247, Dịch vụ AI & Cloud)."))

    elements.append(add_heading_itc(doc, "3.1. Danh mục tác nhân hệ thống", 2))
    elements.append(add_paragraph_itc(doc, "Danh mục các tác nhân, mã định danh vai trò trong hệ thống Spring Security và mô tả trách nhiệm nghiệp vụ cốt lõi được tổng hợp chi tiết:"))
    
    # Actors Table: widths = [2144, 1723, 5159] -> Sum = 9026
    actors_headers = ["Tác nhân (Actor)", "Mã quyền (Role Code)", "Mô tả vai trò nghiệp vụ chính"]
    actors_widths = [2144, 1723, 5159]
    actors_data = [
        [
            "Khách thuê xe (Renter / Customer)",
            "ROLE_CUSTOMER",
            "Tìm kiếm, lọc danh sách xe theo địa điểm, mức giá, số chỗ, hộp số; trò chuyện tương tác với Trợ lý ảo AI; hoàn thiện hồ sơ định danh cá nhân eKYC (tải ảnh 2 mặt CCCD và GPLX hạng B2 lên Cloudinary); gửi yêu cầu đặt xe; thực hiện thanh toán ký quỹ cọc 30% bằng cách quét mã VietQR Napas 247 động; tham gia quy trình bàn giao xe kỹ thuật số 2 chiều (Check-in/Check-out đối soát ODO, vạch xăng, ảnh chụp 4 góc xe); tất toán 70% giá trị hợp đồng còn lại; gửi khiếu nại bùng xe hoặc sự cố phát sinh; đánh giá nhận xét chất lượng dịch vụ sau chuyến đi."
        ],
        [
            "Chủ xe (Car Owner)",
            "ROLE_CAR_OWNER",
            "Đăng ký thông tin phương tiện và tải lên hồ sơ pháp lý (Cavet xe, Giấy đăng kiểm, Bảo hiểm TNDS bắt buộc); chủ động gạt cần chuyển trạng thái sẵn sàng đón khách (ACTIVE / INACTIVE); cấu hình bảng giá thuê theo ngày, phụ phí vượt km, phụ phí quá giờ; thiết lập lịch bận thủ công (Car Calendar Blocks) khi có nhu cầu sử dụng riêng hoặc bảo dưỡng; thẩm định hồ sơ khách thuê và phê duyệt/từ chối yêu cầu đặt xe; lập biên bản bàn giao xe kỹ thuật số trước và sau chuyến đi; nhận 90% doanh thu hợp đồng chuyển vào Ví chủ xe sau khi sàn khấu trừ 10% phí dịch vụ; tạo lệnh rút tiền về tài khoản ngân hàng chính chủ."
        ],
        [
            "Quản trị viên (Admin)",
            "ROLE_ADMIN",
            "Quản trị toàn diện nền tảng; kiểm duyệt thông tin và tính hợp lệ của giấy tờ xe mới đăng ký trước khi cấp phép hiển thị trên sàn; thẩm định hồ sơ định danh cá nhân eKYC của người dùng; đóng vai trò Trọng tài giải quyết tranh chấp (Dispute Resolution): kích hoạt cơ chế khóa bi quan @Lock(PESSIMISTIC_WRITE), thẩm định chứng cứ bùng xe từ hai phía, phán quyết hủy hợp đồng, hoàn trả 100% tiền cọc cho khách thuê qua ngân hàng và áp chế tài phạt chủ xe vi phạm 500.000 VNĐ; quản lý danh mục và tài khoản người dùng (khóa/mở tài khoản); giám sát các chỉ số kinh doanh GMV, tỷ lệ lấp đầy xe và doanh thu hoa hồng 10%."
        ],
        [
            "Tiến trình hệ thống tự động (System Scheduler)",
            "SYSTEM",
            "Thực thi các tác vụ nền định kỳ (Cron Jobs): (1) Quét định kỳ mỗi 5 phút để hủy các đơn đặt xe đã quá hạn 45 phút kể từ khi chủ xe duyệt mà khách chưa thanh toán cọc (Soft Lock Release), giải phóng lịch xe về trạng thái sẵn sàng; (2) Tự động kích hoạt trạng thái chuyến đi (IN_PROGRESS) khi đến mốc thời gian bắt đầu hợp đồng đã bàn giao; (3) Tự động gửi thông báo WebSocket/Email nhắc nhở các mốc bàn giao và trả xe trước 2 giờ; (4) Tự động dọn dẹp và vô hiệu hóa các mã xác thực OTP quá hạn 5 phút."
        ],
        [
            "Cổng thanh toán & Ngân hàng (VietQR / Napas 247 Gateway)",
            "EXTERNAL_PAYMENT",
            "Hệ sinh thái tài chính liên ngân hàng: tiếp nhận yêu cầu sinh mã VietQR động chuẩn EMVCo chứa đúng số tiền cọc 30% và mã đơn duy nhất định dạng DSPAY...; tự động đối soát biến động số dư và gửi Webhook xác nhận giao dịch thành công để hệ thống chuyển trạng thái đơn thuê sang DEPOSITED và thiết lập khóa lịch cứng (Hard Lock)."
        ],
        [
            "Dịch vụ Trí tuệ nhân tạo & Đám mây (AI & Cloud Services)",
            "EXTERNAL_AI_CLOUD",
            "Mô hình ngôn ngữ lớn Google Gemini 2.5 Flash & Text Embedding 004 xử lý tác vụ RAG (Retrieval-Augmented Generation) tư vấn lộ trình và tìm kiếm xe theo ngữ nghĩa tự nhiên; Nền tảng Langfuse giám sát LLM Tracing và đo lường độ trễ phản hồi; Hệ thống CDN Cloudinary lưu trữ và phân phối tối ưu hóa hình ảnh xe, giấy tờ cá nhân eKYC và ảnh hiện trạng xe 4 góc lúc bàn giao."
        ]
    ]
    elements.append(create_table_itc(doc, actors_headers, actors_data, actors_widths))

    elements.append(add_heading_itc(doc, "3.2. Ma trận phân quyền tác nhân (Actor Privilege Matrix)", 2))
    elements.append(add_paragraph_itc(doc, "Ma trận phân quyền thực thi (C: Create, R: Read, U: Update, D: Delete, Execute) của từng tác nhân trên các tài nguyên và phân hệ chức năng trọng yếu của hệ thống DriveShare:"))

    # Matrix Table: widths = [2626, 1600, 1600, 1600, 1600] -> Sum = 9026
    matrix_headers = ["Tài nguyên / Phân hệ chức năng", "Khách thuê (Renter)", "Chủ xe (Owner)", "Quản trị viên (Admin)", "Hệ thống (System)"]
    matrix_widths = [2626, 1600, 1600, 1600, 1600]
    matrix_data = [
        ["Xác thực tài khoản (JWT, Google OAuth2)", "C, R (Hồ sơ cá nhân)", "C, R (Hồ sơ cá nhân)", "R, U (Khóa/Mở tài khoản)", "C, D (Token / Session)"],
        ["Định danh cá nhân eKYC (CCCD, GPLX)", "C, R, U (Tải ảnh giấy tờ)", "C, R, U (Tải ảnh giấy tờ)", "R, U (Thẩm định / Duyệt)", "U (Đồng bộ Cloudinary CDN)"],
        ["Quản lý phương tiện & Trạng thái xe", "R (Xem xe công khai)", "C, R, U, D (Xe của mình)", "R, U (Duyệt xe / Khóa xe)", "R (Index vector tìm kiếm AI)"],
        ["Lịch bận xe (Car Calendar Blocks)", "R (Xem lịch trống)", "C, R, D (Chặn lịch xe mình)", "R, D (Can thiệp giải phóng)", "C, D (Tự động khóa/mở lịch)"],
        ["Tìm kiếm xe & Tư vấn Trợ lý ảo AI", "C, R (Chat & nhận gợi ý xe)", "R (Xem tư vấn)", "R (Xem telemetry Langfuse)", "Execute (RAG & LLM Prompt)"],
        ["Đặt xe & Vòng đời hợp đồng (Booking)", "C, R, U (Gửi đơn, yêu cầu hủy)", "R, U (Duyệt/Từ chối đơn)", "R, U, D (Toàn quyền can thiệp)", "U (Hủy đơn quá hạn 45 phút)"],
        ["Ký quỹ cọc 30% qua VietQR Napas 247", "C (Tạo mã QR), R (Biên lai)", "R (Xem trạng thái cọc)", "R, U (Đối soát, ra lệnh hoàn)", "Execute (Nhận diện Webhook)"],
        ["Biên bản bàn giao kỹ thuật 2 chiều", "R, U (Xác nhận ODO/xăng)", "C, R, U (Tạo & ký biên bản)", "R (Thẩm tra hồ sơ khiếu nại)", "U (Lưu trữ ảnh hiện trạng 4 góc)"],
        ["Xử lý khiếu nại bùng xe (Dispute)", "C, R (Nộp đơn bùng xe)", "R, U (Nộp chứng cứ phản hồi)", "R, U (Trọng tài phán quyết)", "Execute (@Lock bi quan, hoàn cọc)"],
        ["Ví doanh thu & Quyết toán (Payout)", "No Access", "R (Xem số dư), C (Lệnh rút)", "R, U (Duyệt & thực thi lệnh rút)", "Execute (Tự động trích 90/10)"]
    ]
    elements.append(create_table_itc(doc, matrix_headers, matrix_data, matrix_widths))

    # =========================================================================
    # CHƯƠNG 4: PRODUCT BACKLOG VÀ LỘ TRÌNH SPRINT (BACKLOG & SPRINT ROADMAP)
    # =========================================================================
    elements.append(add_heading_itc(doc, "CHƯƠNG 4: PRODUCT BACKLOG VÀ LỘ TRÌNH SPRINT (BACKLOG & SPRINT ROADMAP)", 1))
    
    elements.append(add_heading_itc(doc, "4.1. Nguyên tắc ánh xạ", 2))
    elements.append(add_paragraph_itc(doc, "Mỗi yêu cầu chức năng ở Chương 5 được gắn một mã Sprint (Sprint 0, Sprint 1, Sprint 2, Sprint 3, Sprint 4, Sprint Release) tương ứng với 6 giai đoạn phát triển theo Khung chương trình thực tập Java Web Fullstack (26 buổi học). Nhóm đánh giá mức độ ưu tiên theo thang chuẩn MoSCoW (Must-have, Should-have, Could-have, Won't-have):"))
    elements.append(add_bullet_itc(doc, "Các tính năng cốt lõi bắt buộc phải hoàn thành và kiểm thử không lỗi để đảm bảo luồng giao dịch sống còn của sàn: Đăng ký eKYC, Quản lý xe, Đặt xe kiểm tra xung đột, Ký quỹ cọc 30% VietQR Napas 247, Biên bản bàn giao ODO 2 chiều, Phân xử bùng xe và Ví doanh thu.", "Must-have (M): "))
    elements.append(add_bullet_itc(doc, "Các tính năng quan trọng gia tăng tính tiện ích và an toàn: Đăng nhập Google OAuth2 một chạm, Đổi mật khẩu vô hiệu hóa phiên cũ qua token_version, Chặn lịch bận xe cá nhân, và Trợ lý ảo AI Assistant tư vấn xe theo RAG.", "Should-have (S): "))
    elements.append(add_bullet_itc(doc, "Các tính năng bổ trợ trải nghiệm người dùng: Đánh giá sao kèm nhận xét chi tiết sau chuyến đi, Giám sát chất lượng hội thoại qua Langfuse Tracing, và Bộ lọc tìm kiếm xe nâng cao theo tiện ích phụ trợ.", "Could-have (C): "))
    elements.append(add_bullet_itc(doc, "Các tính năng tạm thời loại trừ khỏi phạm vi 6 tuần thực tập và đề xuất phát triển trong giai đoạn thương mại hóa: Tích hợp thiết bị định vị GPS phần cứng trên xe, Cổng thanh toán quốc tế thẻ Visa/Mastercard và Hợp đồng bảo hiểm thân vỏ tự động.", "Won't-have (W): "))
    elements.append(add_paragraph_itc(doc, "Nguyên tắc chuyển giao: Nhóm không bắt buộc phải hoàn thành 100% backlog của một Sprint mới được sang Sprint kế tiếp, nhưng toàn bộ các hạng mục gắn nhãn 'Must have' của Sprint trước là điều kiện đầu vào (input) bắt buộc cho Sprint sau."))

    elements.append(add_heading_itc(doc, "4.2. Bảng Sprint Roadmap (chi tiết theo buổi học)", 2))
    elements.append(add_paragraph_itc(doc, "Kế hoạch thực hiện 6 Sprint tương ứng với 26 buổi học, phân định rõ các sự kiện Scrum và sản phẩm bàn giao (Deliverables) bắt buộc cuối mỗi giai đoạn:"))

    # Roadmap Table: widths = [1700, 1500, 2826, 3000] -> Sum = 9026
    sprint_headers = ["Sprint", "Buổi (theo khung CT)", "Sự kiện Scrum cần tổ chức", "Output bắt buộc cuối Sprint"]
    sprint_widths = [1700, 1500, 2826, 3000]
    sprint_data = [
        [
            "Sprint 0 – Discovery & Architecture Design",
            "Buổi 1 – 5 (Tuần 1)",
            "Sprint Planning 0 (Buổi 1), Backlog Refinement (Buổi 2-3), Architecture & Design Review (Buổi 4-5)",
            "Tài liệu đặc tả yêu cầu phần mềm SRS v2.1; Product Backlog đầy đủ User Story và Acceptance Criteria trên Jira; Mô hình CSDL ERD 14 bảng chuẩn 3NF; Khung dự án Spring Boot 3 theo kiến trúc phân tầng mở rộng Hexagonal Architecture (Ports & Adapters) kết hợp Vanilla JS Frontend; Script Flyway DDL khởi tạo PostgreSQL và nạp Seed Data; Quy chuẩn Git Workflow, CODEOWNERS và tiêu chuẩn DoD/DoR."
        ],
        [
            "Sprint 1 – Core Foundation, Auth & Car Management",
            "Buổi 6 – 11 (Tuần 2-3)",
            "Sprint Planning 1 (Buổi 6), Daily Scrum (Buổi 7-10), Sprint Review 1 & Retrospective 1 (Buổi 11)",
            "Kiến trúc xác thực JWT Stateless với token_version thu hồi token cũ; Phân quyền RBAC 3 vai trò; Tải tài liệu eKYC (CCCD 2 mặt + GPLX) lên Cloudinary CDN; Module quản lý phương tiện (CRUD xe, upload cavet, đăng kiểm, bảo hiểm); Bộ lọc tìm kiếm xe cơ bản theo tỉnh thành; Unit Test tầng Service đạt độ phủ >= 60%; Đặc tả API Contract Chương 10 được thống nhất."
        ],
        [
            "Sprint 2 – Booking Engine, Soft Lock & VietQR Escrow",
            "Buổi 12 – 16 (Tuần 3-4)",
            "Sprint Planning 2 (Buổi 12), Daily Scrum (Buổi 13-15), Mid-term Sprint Review 2 (Buổi 16)",
            "Động cơ kiểm tra xung đột lịch thuê xe thời gian thực; Cơ chế khóa giữ chỗ tạm thời Soft Lock 45 phút chống Double-Booking; Vòng đời giao dịch đặt xe (Khách gửi yêu cầu -> Chủ xe thẩm định phê duyệt); Tích hợp cổng VietQR Napas 247 sinh mã QR động cọc 30%; Webhook xác thực đối soát tự động kích hoạt Hard Lock; Cron Job tự động giải phóng Soft Lock quá hạn; Giao diện đặt xe phẳng Responsive."
        ],
        [
            "Sprint 3 – Digital Handover, Dispute & AI Assistant",
            "Buổi 17 – 20 (Tuần 4-5)",
            "Sprint Planning 3 (Buổi 17), Daily Scrum (Buổi 18-19), Sprint Review 3 & Retrospective 3 (Buổi 20)",
            "Quy trình lập và đồng thuận biên bản bàn giao xe kỹ thuật số 2 chiều (Check-in/Check-out đối soát ODO, vạch xăng, ảnh hiện trạng 4 góc); Module Trọng tài Admin xử lý khiếu nại bùng xe với khóa bi quan @Lock(PESSIMISTIC_WRITE) hoàn cọc 100% và phạt chủ xe 500k; Hệ thống Ví chủ xe (tách doanh thu 90/10) và lệnh rút tiền; Trợ lý ảo AI Assistant RAG Google Gemini Flash tư vấn xe thông minh; Tích hợp Langfuse Tracing."
        ],
        [
            "Sprint 4 – Verification, Concurrency & Hardening",
            "Buổi 21 – 23 (Tuần 5-6)",
            "Sprint Planning 4 (Buổi 21), Daily Scrum (Buổi 22), Testing War Room & Sprint Review 4 (Buổi 23)",
            "Bộ 186 bài kiểm thử tự động pass 100%; Kiểm thử kiến trúc tự động với 7 luật ArchUnit xanh lá; Kịch bản kiểm thử tương tranh tải cao Apache JMeter mô phỏng nhiều luồng đặt xe đồng thời không xảy ra Race Condition; Ma trận truy vết yêu cầu (RTM) hoàn chỉnh 100%; Khắc phục triệt để các cảnh báo bảo mật OWASP Top 10 và hoàn thiện tài liệu kiểm thử."
        ],
        [
            "Sprint Release – Cloud Deployment & Demo Day",
            "Buổi 24 – 26 (Tuần 6)",
            "Release Planning (Buổi 24), Dry-run Demo tổng duyệt (Buổi 25), Hội đồng nghiệm thu Demo Day (Buổi 26)",
            "Dockerfile multi-stage đóng gói backend JVM < 512MB trên Java 17+ và frontend; Triển khai hệ thống Production trực tiếp lên Render Cloud (Singapore) kết nối PostgreSQL Cloud; Bộ Slide thuyết trình PowerPoint 23 trang bảo vệ đồ án; Kịch bản thuyết trình và phân vai 4 thành viên 15 phút; Báo cáo thực tập tốt nghiệp SRS hoàn chỉnh 15 chương nộp Hội đồng."
        ]
    ]
    elements.append(create_table_itc(doc, sprint_headers, sprint_data, sprint_widths))

    elements.append(add_heading_itc(doc, "4.3. Định nghĩa Sẵn sàng & Hoàn tất (Definition of Ready / Done)", 2))
    elements.append(add_heading_itc(doc, "Definition of Ready (DoR) — một User Story được phép đưa vào Sprint khi:", 3))
    elements.append(add_bullet_itc(doc, "Có mô tả theo cú pháp 'Là [vai trò], tôi muốn [hành động] để [giá trị/lợi ích]'."))
    elements.append(add_bullet_itc(doc, "Có Tiêu chí chấp nhận (Acceptance Criteria) viết theo cấu trúc Given-When-Then, đã được Mentor/Product Owner xác nhận."))
    elements.append(add_bullet_itc(doc, "Đã xác định rõ ràng các Endpoint API liên quan tại Chương 10, các bảng CSDL chịu tác động tại Chương 11 và các mã lỗi ErrorCode bọc trong ApiResponse<T>."))
    elements.append(add_bullet_itc(doc, "Đã ước lượng được công sức (Story Point theo dãy Fibonacci) và không phụ thuộc hạng mục chưa hoàn thành ở Sprint trước."))

    elements.append(add_heading_itc(doc, "Definition of Done (DoD) — một hạng mục được xem là hoàn tất khi:", 3))
    elements.append(add_bullet_itc(doc, "Mã nguồn tuân thủ kiến trúc phân tầng mở rộng Hexagonal Architecture, vượt qua bài kiểm tra 7 luật kiến trúc ArchUnit (ArchitectureRulesTest)."))
    elements.append(add_bullet_itc(doc, "Mã nguồn được merge vào nhánh develop qua Pull Request có ít nhất 1 review từ Tech Lead, không còn lỗi biên dịch/cảnh báo nghiêm trọng."))
    elements.append(add_bullet_itc(doc, "API liên quan có Unit Test (tầng Service đạt độ phủ tối thiểu 60%) và đã kiểm thử thủ công bằng Postman, trả đúng mã HTTP theo đặc tả Chương 10."))
    elements.append(add_bullet_itc(doc, "Giao diện (nếu có) hiển thị đúng trên tối thiểu 2 kích thước màn hình (Desktop 1920x1080, Mobile 375px/430px) và xử lý được trạng thái lỗi/rỗng dữ liệu kèm thông báo Toast."))
    elements.append(add_bullet_itc(doc, "Tài liệu (API doc/Jira ticket) được cập nhật trạng thái Done kèm minh chứng (ảnh chụp, link demo, commit hash)."))

    # =========================================================================
    # CHƯƠNG 5: YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS)
    # =========================================================================
    elements.append(add_heading_itc(doc, "CHƯƠNG 5: YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS)", 1))
    elements.append(add_paragraph_itc(doc, "Mỗi yêu cầu được trình bày theo định dạng: Mã YC | User Story | Tiêu chí chấp nhận chính | Độ ưu tiên (MoSCoW: M=Must, S=Should, C=Could) | Sprint áp dụng. Toàn bộ mã yêu cầu được truy vết tại Ma trận Chương 12."))

    # Bảng Ch.5: widths = [1100, 4226, 2200, 700, 800] -> Sum = 9026 (Chuẩn 100% Doc_ITC!)
    req_headers = ["Mã YC", "User Story (Là...tôi muốn...để...)", "Tiêu chí chấp nhận chính", "Ưu tiên", "Sprint"]
    req_widths = [1100, 4226, 2200, 700, 800]

    # --- 5.1 EPIC-AUTH ---
    elements.append(add_heading_itc(doc, "5.1. EPIC-AUTH — Xác thực & Quản lý tài khoản", 2))
    auth_data = [
        [
            "REQ-AUT-01",
            "Là người dùng mới, tôi muốn đăng ký tài khoản và tải lên ảnh CCCD 2 mặt cùng GPLX để đăng ký trở thành Khách thuê hoặc Chủ xe.",
            "Email không trùng; mật khẩu băm BCrypt; upload ảnh CCCD 2 mặt và GPLX lên Cloudinary trả URL an toàn; lưu trạng thái PENDING chờ duyệt; trả mã 201 Created.",
            "M",
            "Sprint 1"
        ],
        [
            "REQ-AUT-02",
            "Là người dùng đã đăng ký, tôi muốn đăng nhập bằng Email/Username và Mật khẩu để nhận JWT truy cập các API được phân quyền.",
            "Sai thông tin 5 lần liên tiếp chặn IP tạm thời 15 phút chống brute-force; đúng thông tin trả 200 kèm Access Token (24h) và Refresh Token (7 ngày).",
            "M",
            "Sprint 1"
        ],
        [
            "REQ-AUT-03",
            "Là hệ thống, tôi cần cơ chế phân quyền RBAC đa vai trò để mỗi API chỉ được gọi bởi đúng vai trò.",
            "Spring Security với JwtAuthenticationFilter; @PreAuthorize chặn đúng theo vai trò ROLE_CUSTOMER, ROLE_CAR_OWNER, ROLE_ADMIN; sai quyền trả 403 Forbidden.",
            "M",
            "Sprint 1"
        ],
        [
            "REQ-AUT-04",
            "Là người dùng đang đăng nhập, tôi muốn đổi mật khẩu và thu hồi toàn bộ phiên đăng nhập cũ trên các thiết bị khác.",
            "Yêu cầu xác nhận mật khẩu cũ đúng trước khi đổi; đổi thành công tăng token_version của User thêm 1 đơn vị, vô hiệu hóa tức thì toàn bộ JWT cũ; trả về mã 200 OK.",
            "S",
            "Sprint 1"
        ],
        [
            "REQ-AUT-05",
            "Là người dùng bị quên mật khẩu, tôi muốn nhận mã OTP gửi về Email để thiết lập mật khẩu mới an toàn.",
            "Sinh mã OTP 6 chữ số ngẫu nhiên có hiệu lực 10 phút lưu vào bảng email_otps; gửi qua Gmail SMTP; nhập đúng OTP sinh Reset Token dùng 1 lần để đổi mật khẩu.",
            "S",
            "Sprint 2"
        ],
        [
            "REQ-AUT-06",
            "Là người dùng có tài khoản Google, tôi muốn đăng nhập một chạm qua Google OAuth2 mà không cần tạo mật khẩu riêng.",
            "Xác thực IdToken với Google OAuth2 API; tự động trích xuất email, họ tên, avatar; nếu chưa có thì tạo tài khoản với provider=GOOGLE và vai trò ROLE_CUSTOMER; trả JWT.",
            "S",
            "Sprint 2"
        ]
    ]
    elements.append(create_table_itc(doc, req_headers, auth_data, req_widths))

    # --- 5.2 EPIC-CAR ---
    elements.append(add_heading_itc(doc, "5.2. EPIC-CAR — Quản lý Phương tiện & Lịch bận", 2))
    car_data = [
        [
            "REQ-CAR-01",
            "Là Chủ xe, tôi muốn đăng ký niêm yết xe ô tô mới kèm hình ảnh ngoại thất và giấy tờ pháp lý để đưa xe lên sàn.",
            "Nhập hãng, mẫu, năm sản xuất, biển số, hộp số, nhiên liệu, số chỗ; tải tối thiểu 1 ảnh xe và giấy tờ (Cavet, Đăng kiểm, Bảo hiểm) lên Cloudinary; trạng thái PENDING_REVIEW.",
            "M",
            "Sprint 1"
        ],
        [
            "REQ-CAR-02",
            "Là Chủ xe, tôi muốn cấu hình bảng giá thuê theo ngày, phụ phí vượt quãng đường và hạn mức cọc cho xe của mình.",
            "Giá thuê VNĐ/ngày (>= 300.000đ); giới hạn quãng đường ngày (mặc định 300km/ngày); đơn giá vượt km (3.000-5.000đ/km); phụ phí quá giờ (100.000đ/h); cập nhật tức thì.",
            "M",
            "Sprint 1"
        ],
        [
            "REQ-CAR-03",
            "Là Chủ xe, tôi muốn sử dụng cần gạt bật/tắt (Toggle Switch) để chuyển trạng thái xe giữa ACTIVE và INACTIVE đón khách.",
            "Chỉ xe đã được Admin duyệt (status=APPROVED) mới được phép gạt sang ACTIVE; khi INACTIVE hệ thống tự động ẩn xe khỏi danh sách tìm kiếm; lưu log vào audit_logs.",
            "M",
            "Sprint 1"
        ],
        [
            "REQ-CAR-04",
            "Là Chủ xe, tôi muốn chủ động chặn lịch bận (Car Calendar Blocks) khi cần sử dụng xe cho việc riêng hoặc bảo dưỡng.",
            "Chọn khoảng ngày trên lịch Flatpickr; kiểm tra không trùng đơn đã cọc (DEPOSITED/IN_PROGRESS); lưu vào car_calendar_blocks; hiện badge [Bận] với khách thuê.",
            "S",
            "Sprint 2"
        ],
        [
            "REQ-CAR-05",
            "Là Khách thuê, tôi muốn tìm kiếm và lọc danh sách xe theo tỉnh thành, khoảng giá, số chỗ ngồi và loại nhiên liệu.",
            "JPA Specification kết hợp động nhiều tiêu chí: tỉnh thành, giá min/max, số chỗ (4, 5, 7), hộp số (tự động, sàn), nhiên liệu (xăng, dầu, điện); phân trang Pageable.",
            "M",
            "Sprint 1"
        ],
        [
            "REQ-CAR-06",
            "Là Khách thuê, tôi muốn xem trang chi tiết phương tiện với đầy đủ thông số kỹ thuật, lịch trống và đánh giá uy tín.",
            "Hiển thị slide ảnh xe, thông số kỹ thuật, địa chỉ giao nhận, chính sách phụ phí, thông tin chủ xe đã eKYC, điểm đánh giá trung bình và lịch ngày trống/bận trực quan.",
            "M",
            "Sprint 1"
        ]
    ]
    elements.append(create_table_itc(doc, req_headers, car_data, req_widths))

    # --- 5.3 EPIC-BOOKING ---
    elements.append(add_heading_itc(doc, "5.3. EPIC-BOOKING — Đặt xe & Vòng đời hợp đồng thuê", 2))
    booking_data = [
        [
            "REQ-BOK-01",
            "Là Khách thuê, tôi muốn chọn khoảng thời gian thuê để hệ thống kiểm tra xung đột lịch xe theo thời gian thực.",
            "Chọn ngày nhận (>= ngày hiện tại) và ngày trả; kiểm tra trùng lặp với: đơn đã cọc, lịch bận car_calendar_blocks, đơn đang Soft Lock; nếu trùng báo lỗi ngày bận.",
            "M",
            "Sprint 2"
        ],
        [
            "REQ-BOK-02",
            "Là hệ thống, tôi cần áp dụng cơ chế khóa giữ chỗ tạm thời (Soft Lock 45 phút) để bảo vệ giao dịch không bị tranh chấp.",
            "Khi Chủ xe nhấn Duyệt đơn (chuyển sang APPROVED), hệ thống kích hoạt Soft Lock 45 phút trên lịch xe; chặn các khách khác đặt trùng ngày; quá 45 phút tự động giải phóng.",
            "M",
            "Sprint 2"
        ],
        [
            "REQ-BOK-03",
            "Là Chủ xe, tôi muốn thẩm định thông tin khách thuê (Host Screening) trước khi quyết định đồng ý cho thuê xe.",
            "Nhận thông báo khi có đơn mới (PENDING); xem hồ sơ khách thuê gồm họ tên, SĐT, điểm uy tín, ảnh GPLX đã eKYC; Chủ xe có quyền 'Chấp thuận' (APPROVED) hoặc 'Từ chối' (REJECTED).",
            "M",
            "Sprint 2"
        ],
        [
            "REQ-BOK-04",
            "Là hệ thống, tôi cần vận hành Máy trạng thái hợp đồng thuê xe nghiêm ngặt (Rental State Machine) để chặn chuyển trạng thái phi logic.",
            "Chỉ cho phép các cạnh hợp lệ: PENDING->APPROVED->DEPOSITED->IN_PROGRESS->COMPLETED; nhánh hủy: PENDING/APPROVED/DEPOSITED->CANCELLED/REJECTED/EXPIRED; sai trả 400 Bad Request.",
            "M",
            "Sprint 2"
        ],
        [
            "REQ-BOK-05",
            "Là hệ thống, tôi cần tiến trình Cron Job chạy ngầm định kỳ 5 phút để tự động hủy đơn thuê quá hạn 45 phút chưa thanh toán cọc.",
            "Scheduler quét đơn APPROVED có approved_at quá 45 phút chưa cọc; tự động chuyển sang EXPIRED; giải phóng Soft Lock và mở lại ngày trống cho khách khác đặt xe.",
            "M",
            "Sprint 2"
        ],
        [
            "REQ-BOK-06",
            "Là Khách thuê hoặc Chủ xe, tôi muốn có chính sách hủy chuyến minh bạch trước giờ khởi hành kèm quy định hoàn cọc.",
            "Khách hủy trước 24h: hoàn 100% cọc; khách hủy trong 24h: tiền cọc bồi thường cho Chủ xe; Chủ xe hủy sau khi nhận cọc: khách được hoàn 100% cọc và xử phạt Chủ xe.",
            "S",
            "Sprint 2"
        ]
    ]
    elements.append(create_table_itc(doc, req_headers, booking_data, req_widths))

    # --- 5.4 EPIC-PAYMENT ---
    elements.append(add_heading_itc(doc, "5.4. EPIC-PAYMENT — Cổng thanh toán VietQR & Ký quỹ Escrow (30%)", 2))
    payment_data = [
        [
            "REQ-PAY-01",
            "Là Khách thuê, tôi muốn hệ thống tự động sinh mã VietQR động chuẩn Napas 247 để quét chuyển khoản cọc 30% giữ chỗ.",
            "Tính đúng 30% tổng giá trị chuyến đi (deposit_amount); tạo mã giao dịch duy nhất DSPAY{rental_id}_{timestamp}; sinh mã VietQR Napas 247 động theo chuẩn EMVCo hiển thị trên modal.",
            "M",
            "Sprint 2"
        ],
        [
            "REQ-PAY-02",
            "Là hệ thống, tôi cần cơ chế ký quỹ trung gian (Escrow Lock) để bảo vệ quyền lợi tài chính của cả khách thuê và chủ xe.",
            "Sàn đóng vai trò bên thứ ba tạm giữ 30% cọc; khi cọc thành công, đơn thuê chuyển sang DEPOSITED và kích hoạt khóa lịch cứng (Hard Lock); bảo lãnh tiền cọc tới khi hoàn tất.",
            "M",
            "Sprint 2"
        ],
        [
            "REQ-PAY-03",
            "Là hệ thống, tôi cần tiếp nhận và xử lý Webhook đối soát tự động từ ngân hàng để cập nhật trạng thái đơn thuê tức thì.",
            "Endpoint tiếp nhận callback thanh toán Napas/Ngân hàng; đối soát transaction_code và số tiền; nếu khớp chuyển Payment sang SUCCESS và Rental sang DEPOSITED trong 1 Transaction.",
            "M",
            "Sprint 2"
        ],
        [
            "REQ-PAY-04",
            "Là Khách thuê và Chủ xe, tôi muốn xem lại lịch sử giao dịch thanh toán và biên lai điện tử minh bạch trên ứng dụng.",
            "Trang Quản lý chuyến đi lưu vết chi tiết: mã giao dịch, tiền cọc đã chuyển, phương thức VietQR, thời gian thanh toán, số tiền còn lại 70% cần trả trực tiếp kèm biên lai điện tử.",
            "S",
            "Sprint 2"
        ],
        [
            "REQ-PAY-05",
            "Là Tester và Người đánh giá, tôi cần nút giả lập thanh toán cọc thành công (Mock Payment) để kiểm thử và quay demo mượt mà.",
            "Trong môi trường dev và Demo Day, giao diện modal thanh toán cung cấp nút 'Xác nhận chuyển khoản thành công (Demo)' gọi API mock để lập tức chuyển giao dịch sang SUCCESS.",
            "M",
            "Sprint 2"
        ]
    ]
    elements.append(create_table_itc(doc, req_headers, payment_data, req_widths))

    # --- 5.5 EPIC-HANDOVER ---
    elements.append(add_heading_itc(doc, "5.5. EPIC-HANDOVER — Biên bản bàn giao kỹ thuật 2 chiều (Check-in / Check-out)", 2))
    handover_data = [
        [
            "REQ-HND-01",
            "Là Chủ xe và Khách thuê, tôi muốn lập biên bản giao xe (Check-in Handover) ghi nhận hiện trạng xe trước khi khởi hành.",
            "Ghi nhận chỉ số ODO xuất phát (km), mức nhiên liệu (vạch xăng/% pin), hiện trạng trầy xước; tải tối thiểu 4 ảnh chụp 4 góc xe lên Cloudinary; lưu rental_inspections type=CHECK_IN.",
            "M",
            "Sprint 3"
        ],
        [
            "REQ-HND-02",
            "Là Khách thuê và Chủ xe, chúng tôi cần cùng bấm nút xác nhận đồng thuận biên bản giao xe 2 chiều trước khi xe lăn bánh.",
            "Biên bản chỉ có hiệu lực khi cả confirmed_by_owner=true và confirmed_by_renter=true; khi cả 2 đã xác nhận, hệ thống chuyển đơn sang IN_PROGRESS và gửi email sao kê.",
            "M",
            "Sprint 3"
        ],
        [
            "REQ-HND-03",
            "Là Chủ xe và Khách thuê, tôi muốn lập biên bản trả xe (Check-out Handover) khi chuyến đi kết thúc để đối soát vi phạm.",
            "Ghi nhận ODO lúc trả, mức nhiên liệu còn lại, tải ảnh 4 góc xe; tự động so sánh với Check-in: tính km thực chạy so với hạn mức (tính phụ phí km), hao hụt xăng; lưu type=CHECK_OUT.",
            "M",
            "Sprint 3"
        ],
        [
            "REQ-HND-04",
            "Là Chủ xe, tôi muốn hệ thống tự động tổng hợp bảng kê chi phí tất toán 70% còn lại cộng với phụ phí phát sinh khi nhận trả xe.",
            "Tự động tính: 70% giá trị hợp đồng gốc + Phụ phí vượt km + Phụ phí xăng + Phụ phí quá giờ (nếu có); hiển thị bảng kê minh bạch để Khách thuê thanh toán nốt trực tiếp cho Chủ xe.",
            "M",
            "Sprint 3"
        ],
        [
            "REQ-HND-05",
            "Là Chủ xe, tôi muốn bấm nút 'Hoàn tất chuyến đi' sau khi đã nhận đủ tiền để đóng hợp đồng và giải phóng lịch xe sẵn sàng.",
            "Chủ xe bấm 'Hoàn tất chuyến đi': đơn thuê chuyển sang COMPLETED; giải phóng hoàn toàn lịch xe; kích hoạt trích chuyển 90% doanh thu vào Ví chủ xe và mở tính năng đánh giá.",
            "M",
            "Sprint 3"
        ]
    ]
    elements.append(create_table_itc(doc, req_headers, handover_data, req_widths))

    # --- 5.6 EPIC-DISPUTE ---
    elements.append(add_heading_itc(doc, "5.6. EPIC-DISPUTE — Trọng tài xử lý khiếu nại bùng xe & Hoàn cọc 100%", 2))
    dispute_data = [
        [
            "REQ-DSP-01",
            "Là Khách thuê, tôi muốn gửi báo cáo sự cố khẩn cấp khi Chủ xe bùng hẹn không giao xe (Host No-Show) để đòi quyền lợi.",
            "Bấm 'Báo cáo sự cố' trên đơn đã cọc (DEPOSITED); chọn lý do 'Chủ xe bùng hẹn không giao xe' hoặc 'Xe không đúng mô tả'; nhập mô tả kèm ảnh bằng chứng; lưu vào rental_disputes.",
            "M",
            "Sprint 3"
        ],
        [
            "REQ-DSP-02",
            "Là hệ thống, tôi cần áp dụng cơ chế khóa bi quan @Lock(PESSIMISTIC_WRITE) khi xử lý khiếu nại để ngăn chặn xung đột dòng tiền.",
            "Trong suốt thời gian phân xử khiếu nại, hợp đồng thuê và các khoản tiền liên quan được khóa bi quan mức CSDL: ngăn thao túng hoàn tất giả mạo, ngăn giao dịch rút tiền đồng thời.",
            "M",
            "Sprint 3"
        ],
        [
            "REQ-DSP-03",
            "Là Quản trị viên (Trọng tài), tôi muốn thẩm tra bằng chứng và đưa ra phán quyết hoàn 100% tiền cọc cho khách bị bùng xe.",
            "Admin kiểm tra hồ sơ tranh chấp trên Admin Portal; khi xác định Chủ xe có lỗi bùng hẹn, Admin bấm 'Phán quyết hoàn cọc': đơn chuyển sang CANCELLED, lệnh hoàn 100% cọc tự động kích hoạt.",
            "M",
            "Sprint 3"
        ],
        [
            "REQ-DSP-04",
            "Là hệ thống, tôi cần áp dụng chế tài xử phạt Chủ xe bùng hẹn 500.000 VNĐ và khóa phương tiện vi phạm để bảo vệ uy tín sàn.",
            "Khi Admin duyệt khiếu nại bùng xe: hệ thống tự động trừ khoản phạt 500.000 VNĐ vào Ví chủ xe (số dư ví có thể âm); tự động chuyển trạng thái xe sang INACTIVE; gửi email cảnh báo.",
            "M",
            "Sprint 3"
        ],
        [
            "REQ-DSP-05",
            "Là hệ thống, tôi cần lưu vết toàn bộ tiến trình phân xử khiếu nại (Audit Trail) để phục vụ thanh tra và đối soát pháp lý.",
            "Toàn bộ hành động: người nộp đơn, thời gian nộp, bằng chứng, Admin phán quyết, số tiền hoàn trả, số tiền phạt đều được ghi nhận bất biến trong audit_logs và rental_disputes RESOLVED.",
            "S",
            "Sprint 3"
        ]
    ]
    elements.append(create_table_itc(doc, req_headers, dispute_data, req_widths))

    # --- 5.7 EPIC-WALLET ---
    elements.append(add_heading_itc(doc, "5.7. EPIC-WALLET — Quản lý Ví doanh thu chủ xe & Quyết toán (90/10)", 2))
    wallet_data = [
        [
            "REQ-WAL-01",
            "Là hệ thống, tôi cần tự động phân chia doanh thu theo tỷ lệ 90% cho Chủ xe và 10% phí hoa hồng sàn khi chuyến đi hoàn tất.",
            "Khi đơn thuê chuyển sang COMPLETED: hệ thống tính toán 90% tổng tiền thuê xe tự động cộng vào số dư khả dụng Ví chủ xe; 10% còn lại hạch toán vào doanh thu sàn trong 1 Transaction.",
            "M",
            "Sprint 3"
        ],
        [
            "REQ-WAL-02",
            "Là Chủ xe, tôi muốn xem bảng kê chi tiết số dư ví, thu nhập tích lũy và lịch sử biến động số dư theo từng hợp đồng thuê.",
            "Giao diện Ví chủ xe (owner-earnings.html) hiển thị: Số dư khả dụng, Tổng doanh thu lũy kế, Lượt thuê hoàn thành; Bảng kê chi tiết từng giao dịch cộng tiền và lịch sử trừ phạt.",
            "M",
            "Sprint 3"
        ],
        [
            "REQ-WAL-03",
            "Là Chủ xe, tôi muốn tạo lệnh yêu cầu rút tiền từ Ví về tài khoản ngân hàng chính chủ đã đăng ký eKYC.",
            "Nhập số tiền muốn rút (tối thiểu 200.000đ, không vượt quá số dư khả dụng); chọn tài khoản ngân hàng liên kết; tạo bản ghi yêu cầu rút tiền ở trạng thái PENDING chờ Admin giải ngân.",
            "M",
            "Sprint 3"
        ],
        [
            "REQ-WAL-04",
            "Là Quản trị viên, tôi muốn phê duyệt và xác nhận đã chuyển khoản ngân hàng lệnh rút tiền của chủ xe.",
            "Admin kiểm tra danh sách yêu cầu rút tiền; đối soát số dư hợp lệ; sau khi chuyển khoản ngân hàng, bấm 'Xác nhận đã giải ngân': trạng thái TRANSFERRED, trừ dứt điểm số dư ví.",
            "S",
            "Sprint 3"
        ]
    ]
    elements.append(create_table_itc(doc, req_headers, wallet_data, req_widths))

    # --- 5.8 EPIC-AI ---
    elements.append(add_heading_itc(doc, "5.8. EPIC-AI — Trợ lý ảo AI Assistant tư vấn hành trình thông minh", 2))
    ai_data = [
        [
            "REQ-AI-01",
            "Là Khách thuê, tôi muốn trò chuyện với Trợ lý AI bằng ngôn ngữ tự nhiên thông qua widget chat nổi để nhận tư vấn xe.",
            "Widget chat AI hiển thị cố định góc phải; tiếp nhận câu hỏi tiếng Việt tự nhiên (ví dụ: 'Cần thuê xe 7 chỗ đi Đà Lạt leo đèo khỏe'); phản hồi lịch sự, súc tích dưới 3 giây; markdown.",
            "S",
            "Sprint 3"
        ],
        [
            "REQ-AI-02",
            "Là hệ thống, tôi cần áp dụng kiến trúc RAG (Retrieval-Augmented Generation) để AI chỉ gợi ý xe thực tế có thật trong CSDL.",
            "Text Embedding 004 chuyển thông tin xe thành vector; truy vấn CSDL tìm xe phù hợp nhất; kết hợp thông tin xe thật vào Prompt gửi Google Gemini 2.5 Flash; chỉ gợi ý xe đang ACTIVE.",
            "S",
            "Sprint 3"
        ],
        [
            "REQ-AI-03",
            "Là Khách thuê, tôi muốn Trợ lý AI ghi nhớ ngữ cảnh hội thoại đa lượt để tiếp tục cuộc trò chuyện mà không phải lặp lại thông tin.",
            "Lưu vết lịch sử vào bảng chat_memory theo user_id/session_id; gửi kèm 5 lượt hỏi đáp gần nhất vào ngữ cảnh LLM; cho phép hỏi tiếp các câu nối tiếp; hỗ trợ nút xóa lịch sử chat.",
            "S",
            "Sprint 3"
        ],
        [
            "REQ-AI-04",
            "Là Quản trị viên, tôi muốn giám sát chất lượng hội thoại và độ trễ của Trợ lý AI thông qua nền tảng Langfuse Tracing.",
            "Tích hợp SDK Langfuse ghi nhận toàn bộ traces: prompt input, response output, token tiêu thụ, độ trễ phản hồi (latency), tỷ lệ thành công của model; phát hiện sớm hallucination.",
            "C",
            "Sprint 3"
        ]
    ]
    elements.append(create_table_itc(doc, req_headers, ai_data, req_widths))

    # --- 5.9 EPIC-ADMIN ---
    elements.append(add_heading_itc(doc, "5.9. EPIC-ADMIN — Quản trị hệ thống & Giám sát dòng tiền", 2))
    admin_data = [
        [
            "REQ-ADM-01",
            "Là Quản trị viên, tôi muốn thẩm định và phê duyệt phương tiện mới đăng ký kèm kiểm tra giấy tờ pháp lý trước khi xe lên sàn.",
            "Danh sách xe chờ duyệt hiển thị thông số, ảnh xe, ảnh Cavet, Đăng kiểm, Bảo hiểm; Admin kiểm tra tính pháp lý và bấm 'Phê duyệt' (APPROVED) hoặc 'Từ chối' (kèm lý do gửi Chủ xe).",
            "M",
            "Sprint 1"
        ],
        [
            "REQ-ADM-02",
            "Là Quản trị viên, tôi muốn thẩm định hồ sơ định danh cá nhân eKYC của người dùng để đảm bảo tính an toàn cho cộng đồng.",
            "Admin kiểm tra ảnh chụp 2 mặt CCCD và GPLX của Khách thuê/Chủ xe; đối soát họ tên, số CCCD, hạn GPLX; bấm 'Duyệt định danh' (VERIFIED) hoặc 'Yêu cầu tải lại' kèm hướng dẫn.",
            "M",
            "Sprint 1"
        ],
        [
            "REQ-ADM-03",
            "Là Quản trị viên, tôi muốn khóa hoặc mở khóa tài khoản người dùng có hành vi gian lận hoặc vi phạm chính sách.",
            "Admin cập nhật trạng thái User: ACTIVE, LOCKED (tạm thời), BLOCKED (chặn vĩnh viễn do bùng xe nhiều lần); khi bị khóa, hệ thống tự động thu hồi token và từ chối truy cập API.",
            "M",
            "Sprint 1"
        ],
        [
            "REQ-ADM-04",
            "Là Quản trị viên, tôi muốn xem Bảng điều khiển phân tích số liệu thời gian thực (Analytics Dashboard) về tình hình kinh doanh toàn sàn.",
            "Hiển thị KPI then chốt: Tổng giá trị giao dịch GMV, Doanh thu hoa hồng sàn 10%, Số lượng xe đang hoạt động, Tỷ lệ lấp đầy xe (Occupancy Rate), Số chuyến hoàn tất, Số ca khiếu nại.",
            "S",
            "Sprint 3"
        ],
        [
            "REQ-ADM-05",
            "Là Quản trị viên, tôi muốn tra cứu nhật ký kiểm toán hệ thống (System Audit Logs) để giám sát các hành vi nhạy cảm.",
            "Bảng audit_logs ghi nhận: thời gian, IP thực hiện, tài khoản tác động, hành động (LOGIN, REGISTER, APPROVE_CAR, RESOLVE_DISPUTE...), dữ liệu cũ và mới; hỗ trợ tìm kiếm theo thời gian.",
            "S",
            "Sprint 1"
        ]
    ]
    elements.append(create_table_itc(doc, req_headers, admin_data, req_widths))

    # --- 5.10 EPIC-TEST ---
    elements.append(add_heading_itc(doc, "5.10. EPIC-TEST — Chất lượng phần mềm & Kiểm thử tự động", 2))
    test_data = [
        [
            "REQ-TST-01",
            "Là Đội ngũ phát triển, tôi muốn xây dựng bộ kiểm thử đơn vị (Unit Tests) tầng Service với JUnit 5 & Mockito đạt độ phủ >= 60%.",
            "Viết đầy đủ các bài test kiểm thử logic nghiệp vụ cho toàn bộ các module: Auth, Car, Booking, Payment, Handover, Dispute, Wallet...; cô lập DB bằng Mockito; pass 186/186 bài test tiêu chuẩn.",
            "M",
            "Sprint 4"
        ],
        [
            "REQ-TST-02",
            "Là Tester, tôi muốn chạy kịch bản kiểm thử tương tranh (Concurrency Testing) với JMeter để chứng minh không bị Double-Booking.",
            "Kịch bản Apache JMeter mô phỏng nhiều luồng khách thuê đồng thời gửi yêu cầu đặt cùng 1 xe tại 1 thời điểm; chứng minh chỉ duy nhất 1 luồng thành công cọc và chuyển sang Hard Lock.",
            "M",
            "Sprint 4"
        ],
        [
            "REQ-TST-03",
            "Là Kiến trúc sư phần mềm, tôi muốn sử dụng ArchUnit để tự động kiểm tra và bảo vệ bộ 7 quy tắc kiến trúc Hexagonal Architecture.",
            "Lớp ArchitectureRulesTest tự động quét package: Domain không phụ thuộc Framework, Domain độc lập cao nhất, Application không phụ thuộc Adapter, giao tiếp liên module qua Inbound Port.",
            "M",
            "Sprint 4"
        ],
        [
            "REQ-TST-04",
            "Là Tester, tôi muốn xây dựng bộ kiểm thử tích hợp đầu cuối (Integration Tests / E2E) kiểm tra trọn vẹn luồng đặt xe và cọc tiền.",
            "Kịch bản tự động kiểm tra liên hoàn: Khách đăng nhập -> Chọn xe -> Gửi đơn đặt -> Chủ xe duyệt -> Sinh mã VietQR cọc 30% -> Webhook đối soát cọc thành công -> Bàn giao -> Trả xe -> Chia tiền Ví.",
            "S",
            "Sprint 4"
        ]
    ]
    elements.append(create_table_itc(doc, req_headers, test_data, req_widths))

    # --- 5.11 EPIC-OPS ---
    elements.append(add_heading_itc(doc, "5.11. EPIC-OPS — DevOps & Triển khai đám mây", 2))
    ops_data = [
        [
            "REQ-OPS-01",
            "Là Kỹ sư DevOps, tôi muốn đóng gói ứng dụng Backend bằng Multi-stage Dockerfile để tối ưu dung lượng và bộ nhớ JVM < 512MB trên Java 17+.",
            "Dockerfile chia 2 giai đoạn: Giai đoạn 1 (Builder) dùng Maven Wrapper biên dịch JAR; Giai đoạn 2 (Runner) dùng Eclipse Temurin JRE 17/21 Alpine siêu nhẹ; tối ưu JVM RAM < 512MB cho Cloud Free Tier.",
            "M",
            "Sprint Release"
        ],
        [
            "REQ-OPS-02",
            "Là Kỹ sư DevOps, tôi muốn thiết lập triển khai tự động (Continuous Deployment) lên nền tảng Render Cloud Web Service.",
            "Kết nối repository GitHub nhánh develop với Render; tự động build và deploy khi có commit mới; kết nối Backend với CSDL PostgreSQL Render tại Singapore; cấu hình Frontend Static Site HTTPS.",
            "M",
            "Sprint Release"
        ],
        [
            "REQ-OPS-03",
            "Là hệ thống, tôi cần endpoint kiểm tra sức khỏe (/api/v1/health) để nền tảng Cloud giám sát uptime và tự phục hồi khi có sự cố.",
            "Cung cấp REST endpoint trả về trạng thái UP của service và kết nối DB; tích hợp Spring Boot Actuator health check; cấu hình Render liveness probe tự động restart container nếu service treo.",
            "S",
            "Sprint Release"
        ],
        [
            "REQ-OPS-04",
            "Là Kỹ sư DevOps, tôi muốn quản trị cấu hình và biến môi trường (Environment Variables) bảo mật tách biệt giữa Local và Cloud.",
            "Không lưu mật khẩu/secret trong source code; sử dụng application-prod.yml đọc cấu hình từ biến môi trường: DB_HOST, DB_NAME, DB_USERNAME, DB_PASSWORD, JWT_SECRET, CLOUDINARY_*, GOOGLE_*.",
            "M",
            "Sprint Release"
        ]
    ]
    elements.append(create_table_itc(doc, req_headers, ops_data, req_widths))

    print("Successfully built all data elements with 100% strict Doc_ITC format.")
    return elements

def main():
    target_docx = "docs/BAO_CAO_SRS_DRIVESHARE_K4_PRO_V2_1_fixed.docx"
    print(f"Loading document: {target_docx}")
    doc = Document(target_docx)
    
    # 1. Locate paragraphs for Chapter 3 and Chapter 6
    p_ch3 = None
    p_ch6 = None
    
    for i, p in enumerate(doc.paragraphs):
        t = p.text.strip()
        if t.startswith("CHƯƠNG 3: TÁC NHÂN HỆ THỐNG"):
            p_ch3 = p
        elif t.startswith("CHƯƠNG 6: ĐẶC TẢ USE CASE CHI TIẾT"):
            p_ch6 = p
            break
            
    if not p_ch3 or not p_ch6:
        print("ERROR: Could not locate Chapter 3 or Chapter 6 markers!")
        return
        
    parent = p_ch6._p.getparent()
    idx_ch3 = parent.index(p_ch3._p)
    idx_ch6 = parent.index(p_ch6._p)
    print(f"Current elements in body between Ch.3 and Ch.6: start index {idx_ch3}, stop index {idx_ch6} (Count: {idx_ch6 - idx_ch3})")
    
    # Collect all existing elements between p_ch3 and p_ch6 to remove them
    elements_to_remove = []
    recording = False
    for elem in parent:
        if elem == p_ch3._p:
            recording = True
        if recording:
            if elem == p_ch6._p:
                break
            elements_to_remove.append(elem)
            
    print(f"Elements to be replaced: {len(elements_to_remove)}")
    
    # 2. Build the rich new elements
    print("Generating rich content with 100% strict Doc_ITC formatting...")
    new_elements = build_all_elements(doc)
    
    # Move new elements before p_ch6._p
    print("Positioning new elements directly before Chapter 6...")
    for elem in new_elements:
        if isinstance(elem, docx.text.paragraph.Paragraph):
            p_ch6._p.addprevious(elem._p)
        elif isinstance(elem, docx.table.Table):
            p_ch6._p.addprevious(elem._tbl)
            
    # Remove old elements
    print("Removing old elements...")
    for elem in elements_to_remove:
        parent.remove(elem)
        
    # Save document
    print(f"Saving updated document: {target_docx}")
    doc.save(target_docx)
    print("=== HOÀN TẤT CẬP NHẬT CHUẨN XÁC 100% FORMAT DOC_ITC! ===")

if __name__ == "__main__":
    main()
