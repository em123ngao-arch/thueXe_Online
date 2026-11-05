"""
Script sinh file trình chiếu PowerPoint (17 Slides tỷ lệ 16:9)
Bảo vệ đồ án tốt nghiệp Khóa K25 - Đề tài DriveShare
- Thiết kế chuẩn mẫu bài thuyết trình ITC:
  + Biểu tượng '>>>' màu cam nổi bật ở tiêu đề
  + Tinh gọn, từ ngữ khiêm tốn chuẩn kỹ thuật, hình ảnh & sơ đồ là trung tâm
  + Slide 1: Đã xóa dòng công nghệ thừa, đã xóa chức danh "Trưởng nhóm / Báo cáo chính" sau tên thành viên
  + Slide 2.1: Sơ đồ bên phải là hình ảnh sơ đồ kiến trúc Hexagonal chuẩn mực
  + Slide 3.1, 3.2, 3.3: Đầy đủ 100% hình ảnh thực tế trích xuất từ file gốc (docs/extracted_media/)
  + Khớp 100% với mã nguồn dự án: Hexagonal Architecture, CarJpaRepository, RentalExpirationScheduler
  + Đã loại bỏ hoàn toàn slide Test và slide kể lể sáo rỗng
  + Speaker Notes đầy đủ 15 phút từng giây
"""

import os
import sys

# Thiết lập UTF-8 cho console Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from PIL import Image
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE

# Bảng màu chuẩn Doanh nghiệp học thuật ITC
PRIMARY = RGBColor(30, 58, 138)        # Xanh Navy đậm (#1E3A8A)
PRIMARY_DARK = RGBColor(15, 23, 42)    # Xanh đen Slate (#0F172A)
PRIMARY_LIGHT = RGBColor(238, 242, 255)# Xanh pastel nhạt (#EEF2FF)
ACCENT_ORANGE = RGBColor(234, 88, 12)  # Cam điểm nhấn ITC (>>>) (#EA580C)
ACCENT_TEAL = RGBColor(13, 148, 136)   # Xanh mòng két (#0D9488)
BG_LIGHT = RGBColor(248, 250, 252)     # Nền xám sáng tinh khôi (#F8FAFC)
WHITE = RGBColor(255, 255, 255)        # Trắng thuần
TEXT_MAIN = RGBColor(15, 23, 42)       # Chữ đậm (#0F172A)
TEXT_MUTED = RGBColor(71, 85, 105)     # Chữ trung tính (#475569)
BORDER_COLOR = RGBColor(226, 232, 240) # Viền xám nhạt (#E2E8F0)
CODE_BG = RGBColor(15, 23, 42)         # Nền code tối (#0F172A)
CODE_YELLOW = RGBColor(250, 204, 21)   # Vàng highlight (#FACC15)
CODE_GREEN = RGBColor(74, 222, 128)    # Xanh lá highlight (#4ADE80)

FONT_HEADING = "Segoe UI"
FONT_BODY = "Segoe UI"


def set_slide_background(slide, color=BG_LIGHT):
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = color


def add_slide_header(slide, section_number, title_text, subtitle_text=None):
    """
    Header chuẩn theo phong cách bài mẫu ITC (img_slide):
    - Dải cam mảnh ở mép trên
    - Biểu tượng >>> màu cam + Số mục + Tiêu đề lớn
    - Phụ đề nhỏ dẫn dắt (nếu có)
    """
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(0.08))
    bar.fill.solid()
    bar.fill.fore_color.rgb = ACCENT_ORANGE
    bar.line.fill.background()

    tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.733), Inches(1.1))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0

    p = tf.paragraphs[0]
    run_icon = p.add_run()
    run_icon.text = ">>>  "
    run_icon.font.name = FONT_HEADING
    run_icon.font.size = Pt(22)
    run_icon.font.bold = True
    run_icon.font.color.rgb = ACCENT_ORANGE

    run_title = p.add_run()
    run_title.text = f"{section_number}  {title_text}"
    run_title.font.name = FONT_HEADING
    run_title.font.size = Pt(23)
    run_title.font.bold = True
    run_title.font.color.rgb = PRIMARY_DARK

    if subtitle_text:
        p_sub = tf.add_paragraph()
        p_sub.text = subtitle_text
        p_sub.font.name = FONT_BODY
        p_sub.font.size = Pt(13)
        p_sub.font.color.rgb = TEXT_MUTED
        p_sub.space_before = Pt(4)


def set_notes(slide, notes_text):
    notes_slide = slide.notes_slide
    text_frame = notes_slide.notes_text_frame
    text_frame.text = notes_text.strip()


def add_centered_diagram_slide(slide, section_no, title, subtitle, img_path, caption):
    """
    Slide hiển thị 1 sơ đồ lớn ở trung tâm
    Chuẩn theo phong cách bài mẫu của ITC: Rất ít chữ, sơ đồ chiếm 80% diện tích.
    """
    set_slide_background(slide)
    add_slide_header(slide, section_no, title, subtitle)

    box_l = Inches(0.8)
    box_t = Inches(1.65)
    box_w = Inches(11.733)
    box_h = Inches(4.95)

    container = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, box_l, box_t, box_w, box_h)
    container.fill.solid()
    container.fill.fore_color.rgb = WHITE
    container.line.color.rgb = BORDER_COLOR
    container.line.width = Pt(1.5)

    if img_path and os.path.exists(img_path):
        try:
            with Image.open(img_path) as img:
                orig_w, orig_h = img.size

            aspect = orig_w / orig_h
            avail_w = box_w - Inches(0.4)
            avail_h = box_h - Inches(0.4)
            container_aspect = avail_w / avail_h

            if aspect > container_aspect:
                dest_w = avail_w
                dest_h = dest_w / aspect
            else:
                dest_h = avail_h
                dest_w = dest_h * aspect

            dest_l = box_l + (box_w - dest_w) / 2
            dest_t = box_t + (box_h - dest_h) / 2

            slide.shapes.add_picture(img_path, dest_l, dest_t, dest_w, dest_h)
        except Exception as e:
            print(f"Lỗi chèn ảnh {img_path}: {e}")

    tb_cap = slide.shapes.add_textbox(box_l, Inches(6.75), box_w, Inches(0.4))
    tf_c = tb_cap.text_frame
    p_c = tf_c.paragraphs[0]
    p_c.alignment = PP_ALIGN.CENTER
    p_c.text = caption
    p_c.font.name = FONT_BODY
    p_c.font.size = Pt(12)
    p_c.font.italic = True
    p_c.font.color.rgb = TEXT_MUTED


def add_three_mobile_screens_slide(slide, section_no, title, subtitle, screens_data):
    """
    Slide hiển thị 3 ảnh màn hình giao diện đặt nằm ngang cạnh nhau
    screens_data = [ (img_path, caption_title, caption_desc), ... ]
    """
    set_slide_background(slide)
    add_slide_header(slide, section_no, title, subtitle)

    col_w = Inches(3.7)
    box_t = Inches(1.65)
    box_h = Inches(4.75)

    for i, (img_path, cap_title, cap_desc) in enumerate(screens_data):
        c_left = Inches(0.8 + i * (3.7 + 0.316))

        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, c_left, box_t, col_w, box_h)
        card.fill.solid()
        card.fill.fore_color.rgb = WHITE
        card.line.color.rgb = BORDER_COLOR
        card.line.width = Pt(1.5)

        if img_path and os.path.exists(img_path):
            try:
                with Image.open(img_path) as img:
                    orig_w, orig_h = img.size

                aspect = orig_w / orig_h
                avail_w = col_w - Inches(0.24)
                avail_h = box_h - Inches(0.9)
                container_aspect = avail_w / avail_h

                if aspect > container_aspect:
                    dest_w = avail_w
                    dest_h = dest_w / aspect
                else:
                    dest_h = avail_h
                    dest_w = dest_h * aspect

                dest_l = c_left + (col_w - dest_w) / 2
                dest_t = box_t + Inches(0.12) + (avail_h - dest_h) / 2

                slide.shapes.add_picture(img_path, dest_l, dest_t, dest_w, dest_h)
            except Exception as e:
                print(f"Lỗi chèn ảnh {img_path}: {e}")
        else:
            print(f"[!] Cảnh báo: Không tìm thấy ảnh: {img_path}")

        tb_cap = slide.shapes.add_textbox(c_left + Inches(0.1), box_t + box_h - Inches(0.85), col_w - Inches(0.2), Inches(0.75))
        tf = tb_cap.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0

        p1 = tf.paragraphs[0]
        p1.alignment = PP_ALIGN.CENTER
        p1.text = cap_title
        p1.font.name = FONT_HEADING
        p1.font.size = Pt(12.5)
        p1.font.bold = True
        p1.font.color.rgb = PRIMARY_DARK

        p2 = tf.add_paragraph()
        p2.alignment = PP_ALIGN.CENTER
        p2.text = cap_desc
        p2.font.name = FONT_BODY
        p2.font.size = Pt(11)
        p2.font.color.rgb = TEXT_MUTED


def add_three_cards_slide(slide, section_no, title, subtitle, cards_data):
    """Slide 3 Thẻ Card bo góc nằm ngang súc tích"""
    set_slide_background(slide)
    add_slide_header(slide, section_no, title, subtitle)

    for i, (tag_card, ctitle, cbullets) in enumerate(cards_data):
        left_pos = Inches(0.8 + i * 4.0)
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_pos, Inches(1.75), Inches(3.733), Inches(5.1))
        card.fill.solid()
        card.fill.fore_color.rgb = WHITE
        card.line.color.rgb = BORDER_COLOR
        card.line.width = Pt(1.5)

        tf = card.text_frame
        tf.margin_left = tf.margin_right = tf.margin_top = Inches(0.35)
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = tag_card
        p.font.name = FONT_HEADING
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = ACCENT_ORANGE
        p.space_after = Pt(4)

        p = tf.add_paragraph()
        p.text = ctitle
        p.font.name = FONT_HEADING
        p.font.size = Pt(17)
        p.font.bold = True
        p.font.color.rgb = TEXT_MAIN
        p.space_after = Pt(14)

        for b in cbullets:
            p = tf.add_paragraph()
            p.text = "•  " + b
            p.font.name = FONT_BODY
            p.font.size = Pt(13)
            p.font.color.rgb = TEXT_MUTED
            p.space_after = Pt(9)


def add_four_cards_slide(slide, section_no, title, subtitle, cards_data):
    """Slide Lưới 2x2: Chữ to rõ, thoáng đãng"""
    set_slide_background(slide)
    add_slide_header(slide, section_no, title, subtitle)

    coords = [
        (Inches(0.8), Inches(1.75)),
        (Inches(6.8), Inches(1.75)),
        (Inches(0.8), Inches(4.45)),
        (Inches(6.8), Inches(4.45)),
    ]

    for i, (tag_card, ctitle, cdesc) in enumerate(cards_data):
        c_left, c_top = coords[i]
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, c_left, c_top, Inches(5.733), Inches(2.45))
        card.fill.solid()
        card.fill.fore_color.rgb = WHITE
        card.line.color.rgb = BORDER_COLOR
        card.line.width = Pt(1.5)

        tf = card.text_frame
        tf.margin_left = tf.margin_right = tf.margin_top = Inches(0.3)
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = tag_card
        p.font.name = FONT_HEADING
        p.font.size = Pt(11.5)
        p.font.bold = True
        p.font.color.rgb = ACCENT_ORANGE
        p.space_after = Pt(2)

        p = tf.add_paragraph()
        p.text = ctitle
        p.font.name = FONT_HEADING
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = TEXT_MAIN
        p.space_after = Pt(5)

        lines = cdesc.split("\n")
        for idx, line in enumerate(lines):
            p = tf.add_paragraph()
            p.text = line
            p.font.name = FONT_BODY
            p.font.size = Pt(12.5)
            p.font.color.rgb = TEXT_MUTED
            p.space_after = Pt(2)


def build_presentation():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # =========================================================================
    # SLIDE 1: TRANG BÌA (ĐÃ XÓA DÒNG CÔNG NGHỆ, ĐÃ XÓA CHỨC DANH SAU TÊN THÀNH VIÊN)
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1)

    top_bar = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(0.18))
    top_bar.fill.solid()
    top_bar.fill.fore_color.rgb = ACCENT_ORANGE
    top_bar.line.fill.background()

    tb_tag = s1.shapes.add_textbox(Inches(1.0), Inches(0.75), Inches(11.3), Inches(0.4))
    p = tb_tag.text_frame.paragraphs[0]
    p.text = "KHOA CÔNG NGHỆ THÔNG TIN - ITC  |  KHÓA K25"
    p.font.name = FONT_HEADING
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = ACCENT_ORANGE

    tb_main = s1.shapes.add_textbox(Inches(1.0), Inches(1.25), Inches(11.3), Inches(1.9))
    tf = tb_main.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "DRIVESHARE"
    p.font.name = FONT_HEADING
    p.font.size = Pt(48)
    p.font.bold = True
    p.font.color.rgb = PRIMARY_DARK

    p2 = tf.add_paragraph()
    p2.text = "Nền Tảng Cho Thuê Xe Tự Lái P2P Trực Tuyến"
    p2.font.name = FONT_HEADING
    p2.font.size = Pt(22)
    p2.font.bold = True
    p2.font.color.rgb = ACCENT_TEAL
    p2.space_before = Pt(4)

    # Card Giảng viên hướng dẫn
    card_gvhd = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(3.6), Inches(5.3), Inches(3.3))
    card_gvhd.fill.solid()
    card_gvhd.fill.fore_color.rgb = WHITE
    card_gvhd.line.color.rgb = BORDER_COLOR
    card_gvhd.line.width = Pt(1.5)

    tf_gv = card_gvhd.text_frame
    tf_gv.margin_left = tf_gv.margin_right = tf_gv.margin_top = Inches(0.35)
    p = tf_gv.paragraphs[0]
    p.text = "GIẢNG VIÊN HƯỚNG DẪN"
    p.font.name = FONT_HEADING
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = PRIMARY
    p.space_after = Pt(4)

    p = tf_gv.add_paragraph()
    p.text = "Thầy Trương Thanh Bình"
    p.font.name = FONT_HEADING
    p.font.size = Pt(20)
    p.font.bold = True
    p.font.color.rgb = TEXT_MAIN
    p.space_after = Pt(12)

    p = tf_gv.add_paragraph()
    p.text = "Bộ môn: Công nghệ Phần mềm\nTrường Cao đẳng Công nghệ Thông tin TP.HCM (ITC)\nNiên khóa: 2025 - 2027"
    p.font.name = FONT_BODY
    p.font.size = Pt(13)
    p.font.color.rgb = TEXT_MUTED

    # Card Nhóm sinh viên thực hiện (K25 - Chỉ liệt kê họ tên sinh viên, đã xóa chức danh sau tên)
    card_team = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.6), Inches(3.6), Inches(5.7), Inches(3.3))
    card_team.fill.solid()
    card_team.fill.fore_color.rgb = WHITE
    card_team.line.color.rgb = BORDER_COLOR
    card_team.line.width = Pt(1.5)

    tf_team = card_team.text_frame
    tf_team.margin_left = tf_team.margin_right = tf_team.margin_top = Inches(0.35)
    p = tf_team.paragraphs[0]
    p.text = "NHÓM THỰC HIỆN (6 THÀNH VIÊN)"
    p.font.name = FONT_HEADING
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = PRIMARY
    p.space_after = Pt(8)

    members = [
        "Nguyễn Duy Bảo",
        "Nguyễn Chí Tín",
        "Lâm Chí Vĩ",
        "Đỗ Ngọc Phát",
        "Nguyễn Duy Quân",
        "NguyễnTấn Lộc Khiêm"
    ]
    for name in members:
        p = tf_team.add_paragraph()
        p.text = f"•  {name}"
        p.font.name = FONT_BODY
        p.font.size = Pt(13)
        p.font.color.rgb = TEXT_MAIN
        p.space_after = Pt(3)

    set_notes(s1, """LỜI THOẠI THUYẾT TRÌNH (00:00 - 00:30):
Kính thưa quý Thầy Cô trong Hội đồng phản biện và Thầy Trương Thanh Bình kính mến!
Em tên là Nguyễn Duy Bảo, đại diện cho nhóm sinh viên Khóa K25 chuyên ngành Công nghệ Phần mềm.
Hôm nay, nhóm chúng em xin được báo cáo đề tài tốt nghiệp: DriveShare - Nền tảng chia sẻ và cho thuê xe tự lái trực tuyến theo mô hình P2P.
Bài thuyết trình gồm 3 chương trọng tâm với thời lượng 15 phút. Em xin phép được bắt đầu!""")

    # =========================================================================
    # SLIDE 2: CHƯƠNG 1 - BỐI CẢNH & BẤT CẬP THUÊ TRUYỀN THỐNG (3 CARDS)
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    card_data_s2 = [
        ("BẤT CẬP 01", "Rủi Ro Giữ Tài Sản",
         [
             "Bắt buộc giữ CCCD gốc hoặc xe máy kèm cà-vẹt đắt tiền.",
             "Nguy cơ lộ lọt thông tin cá nhân và thiếu căn cứ rõ ràng.",
             "Gây áp lực tâm lý và rào cản tài chính lớn cho khách thuê."
         ]),
        ("BẤT CẬP 02", "Tranh Chấp Hư Hỏng",
         [
             "Không có quy trình nghiệm thu tình trạng xe minh bạch.",
             "Khách thuê dễ bị bắt đền các vết trầy xước có từ trước.",
             "Thiếu biên bản hình ảnh đối soát khi bàn giao chìa khóa."
         ]),
        ("BẤT CẬP 03", "Quản Lý Thủ Công",
         [
             "Chốt đơn qua tin nhắn Zalo, sổ tay nên rất dễ quên lịch.",
             "Nguy cơ nhận cọc của 2 người cùng một ngày (Overbooking).",
             "Chưa có công cụ tự động kiểm soát xe quá hạn hợp đồng."
         ])
    ]
    add_three_cards_slide(s2, "1.1", "Bối Cảnh & Một Vài Bất Cập Của Thuê Xe Truyền Thống",
                          "> Nhu cầu thuê xe tự lái gia tăng nhanh nhưng phương thức truyền thống lộ rõ rủi ro:",
                          card_data_s2)
    set_notes(s2, """LỜI THOẠI THUYẾT TRÌNH (00:30 - 01:15):
Thưa Thầy Cô, nhu cầu thuê xe tự lái tăng rất nhanh, nhưng cách thuê truyền thống lộ rõ 3 bất cập lớn:
1. Rủi ro giam giữ tài sản: Khách phải để lại CCCD gốc hoặc xe máy giá trị cao.
2. Tranh chấp trầy xước: Thiếu biên bản nghiệm thu nên hay xảy ra cãi vã khi trả xe.
3. Quản lý thủ công: Nhận cọc qua Zalo dễ dẫn đến đặt trùng lịch 2 người cùng ngày.
Mô hình P2P của DriveShare ra đời nhằm giải quyết thiết thực các vấn đề này.""")

    # =========================================================================
    # SLIDE 3: CHƯƠNG 1 - BẢNG ĐỐI CHUẨN TIÊU CHÍ (BENCHMARK TABLE - ĐÃ BỎ ĐIỀU 175)
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3)
    add_slide_header(s3, "1.2", "Bảng Đối Chuẩn Tiêu Chí: Mioto vs Zoomcar vs DriveShare",
                     "> So sánh 5 tiêu chí nghiệp vụ cốt lõi giữa các nền tảng cho thuê xe:")

    rows = 6
    cols = 4
    left = Inches(0.8)
    top = Inches(1.75)
    width = Inches(11.733)
    height = Inches(5.1)

    table_shape = s3.shapes.add_table(rows, cols, left, top, width, height)
    table = table_shape.table
    table.columns[0].width = Inches(3.2)
    table.columns[1].width = Inches(2.7)
    table.columns[2].width = Inches(2.7)
    table.columns[3].width = Inches(3.133)

    headers = ["Tiêu Chí Nghiệp Vụ", "Mioto", "Zoomcar", "DriveShare (Đề Tài K25)"]
    for j, h in enumerate(headers):
        cell = table.cell(0, j)
        cell.text = h
        cell.fill.solid()
        cell.fill.fore_color.rgb = PRIMARY
        for p in cell.text_frame.paragraphs:
            p.alignment = PP_ALIGN.CENTER
            p.font.name = FONT_HEADING
            p.font.size = Pt(13.5)
            p.font.bold = True
            p.font.color.rgb = WHITE

    benchmark_rows = [
        ("Chính sách Cọc & Giữ chỗ", "100% tiền thuê chuyển khoản", "Giữ qua Thẻ tín dụng", "Ký quỹ 30% VietQR linh hoạt"),
        ("Trợ lý AI hỗ trợ tìm xe", "Không có", "Không có", "Chatbot AI tư vấn & gợi ý tìm xe"),
        ("Chặn lịch bận xe (Blackout)", "Có hỗ trợ", "Hạn chế tính năng", "Chặn lịch bảo dưỡng chủ động"),
        ("Biên bản bàn giao 2 chiều", "Giấy tờ hoặc 1 bên duyệt", "Nhân viên kiểm tra", "Điện tử 2 chiều: ODO, Xăng, ảnh chụp"),
        ("Kiểm soát quá hạn trả xe", "Tính phí giờ thủ công", "Phạt theo giờ cố định", "Tự động tính phụ phí & Khóa tài khoản")
    ]

    for i, row in enumerate(benchmark_rows):
        for j, val in enumerate(row):
            cell = table.cell(i + 1, j)
            cell.text = val
            cell.fill.solid()
            cell.fill.fore_color.rgb = WHITE if i % 2 == 0 else PRIMARY_LIGHT
            for p in cell.text_frame.paragraphs:
                p.alignment = PP_ALIGN.LEFT if j == 0 else PP_ALIGN.CENTER
                p.font.name = FONT_BODY
                p.font.size = Pt(13)
                p.font.color.rgb = PRIMARY_DARK if j == 3 else TEXT_MAIN
                if j == 3:
                    p.font.bold = True

    set_notes(s3, """LỜI THOẠI THUYẾT TRÌNH (01:15 - 02:15):
Để tạo ưu thế cạnh tranh, nhóm đã lập Bảng đối chuẩn giữa Mioto, Zoomcar với DriveShare qua 5 tiêu chí:
- Về cọc: DriveShare áp dụng Ký quỹ 30% VietQR giúp giảm áp lực tiền mặt.
- Về hỗ trợ: Có Chatbot AI tư vấn chi phí và gợi ý xe nhanh.
- Về bàn giao: Bắt buộc Check-in/Check-out 2 chiều có ảnh đối soát ODO và xăng.
- Về quá hạn: Cronjob tự động tính phụ phí theo giờ vượt quá và tạm khóa tài khoản nếu trễ trên 24 giờ.""")

    # =========================================================================
    # SLIDE 4: CHƯƠNG 1 - 4 MỤC TIÊU CỐT LÕI (ĐÃ BỎ ESCROW & TRIỆT TIÊU 100%)
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    card_data_s4 = [
        ("MỤC TIÊU 01", "Nền Tảng P2P Tiện Lợi",
         "Xây dựng ứng dụng Web Responsive kết nối trực tiếp chủ xe nhàn rỗi và khách thuê với trải nghiệm tối ưu."),
        ("MỤC TIÊU 02", "Bảo Đảm Giao Dịch (Ký Quỹ 30%)",
         "Sàn đóng vai trò trung gian giữ cọc 30% qua VietQR, bảo vệ quyền lợi tài chính cho cả hai bên giao dịch."),
        ("MỤC TIÊU 03", "Ngăn Chặn Trùng Lịch (Overbooking)",
         "Ứng dụng Khóa bi quan CSDL và cơ chế khóa 2 tầng loại bỏ nguy cơ đặt trùng lịch xe."),
        ("MỤC TIÊU 04", "Trợ Lý AI Hỗ Trợ 24/7",
         "Tích hợp mô hình AI Google Gemini và bộ lọc từ khóa dự phòng hỗ trợ khách tìm xe và giải đáp nhanh.")
    ]
    add_four_cards_slide(s4, "1.3", "4 Mục Tiêu Cốt Lõi Của Đề Tài",
                         "> Định hướng nghiên cứu và phát triển giải pháp toàn diện cho nền tảng:",
                         card_data_s4)
    set_notes(s4, """LỜI THOẠI THUYẾT TRÌNH (02:15 - 03:00):
Từ các phân tích trên, DriveShare xác định 4 mục tiêu then chốt:
1. Xây dựng nền tảng P2P an toàn trên cả PC và thiết bị di động.
2. Bảo vệ quyền lợi tài chính cho hai bên nhờ cơ chế ký quỹ cọc 30%.
3. Giải quyết bài toán đặt trùng lịch xe bằng khóa CSDL chuyên sâu.
4. Tích hợp AI nâng cao trải nghiệm đặt xe thông minh.""")

    # =========================================================================
    # SLIDE 5: CHƯƠNG 2 - MÔ HÌNH KIẾN TRÚC HEXAGONAL (PORTS & ADAPTERS)
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    img_arch = "docs/diagrams/hexagonal_architecture_diagram.png"
    add_centered_diagram_slide(
        s5, "2.1", "Mô Hình Kiến Trúc Hệ Thống (Hexagonal Architecture)",
        "> Mô hình Ports & Adapters: Tâm điểm là Hình Lục Giác Domain Core độc lập với Web và Cơ sở dữ liệu:",
        img_arch,
        "Hình 2.1 Sơ đồ kiến trúc Hexagonal Modular (Ports & Adapters) — Phân tách 3 tầng độc lập theo 7 luật ArchUnit"
    )
    set_notes(s5, """LỜI THOẠI THUYẾT TRÌNH (03:00 - 03:45):
Kính thưa Thầy Cô, bước sang Chương 2, đây là Sơ đồ Kiến trúc Hexagonal - Ports & Adapters chuẩn doanh nghiệp của hệ thống:
1. Tâm điểm trung tâm là HÌNH LỤC GIÁC gồm 2 tầng lõi:
   - Trong cùng là Tầng 1: Domain Core bằng 100% Pure Java, chứa các quy tắc nghiệp vụ và Entity, tuyệt đối không phụ thuộc vào bất kỳ framework hay thư viện Spring/JPA nào.
   - Bao bọc xung quanh là Tầng 2: Application Layer định nghĩa các Cổng Inbound Ports cho Web gọi vào và Outbound Ports để gọi ra dịch vụ ngoài.
2. Bên trái là Tầng Driving Adapters: Web REST Controllers tiếp nhận request và bọc phản hồi ApiResponse<T>, kết hợp Spring Security và Filter JWT Stateless kiểm soát token_version.
3. Bên phải là Tầng Driven Adapters: Kết nối với CSDL PostgreSQL 16 qua Spring Data JPA và Khóa bi quan, Cổng thanh toán VietQR giữ cọc 30%, Cloudinary lưu ảnh và Google Gemini 2.5 Flash tư vấn thông minh.
Toàn bộ 11 module được kiểm soát tự động bởi Bộ 7 luật ArchUnit Test mỗi khi biên dịch, đảm bảo không có vi phạm phân tầng hay phụ thuộc vòng.""")

    # =========================================================================
    # SLIDE 6: CHƯƠNG 2 - BIỂU ĐỒ USE CASE HỆ THỐNG
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    img_s6 = "docs/image_diagram/usecase_booking_operation.png"
    add_centered_diagram_slide(
        s6, "2.2", "Thiết Kế Chức Năng Hệ Thống (Biểu Đồ Use Case)",
        "> Biểu đồ Use Case đặt xe & vận hành thể hiện mối liên kết giữa Khách thuê, Chủ xe và Quản trị viên:",
        img_s6,
        "Hình 2.2 Biểu đồ Use Case quy trình đặt xe và vận hành (Booking & Operation) — Hệ thống DriveShare"
    )
    set_notes(s6, """LỜI THOẠI THUYẾT TRÌNH (03:45 - 04:30):
Đây là Sơ đồ Use Case quy trình đặt xe và vận hành cốt lõi:
- Khách thuê tạo yêu cầu, khi được duyệt sẽ thực hiện thanh toán cọc 30% qua VietQR để kích hoạt Giữ cọc & Hard Lock.
- Chủ xe khi duyệt đơn sẽ kích hoạt Khóa tạm lịch xe Soft Lock trong 45 phút.
- Hai bên cùng thực hiện Check-in giao xe có ảnh hiện trạng và Check-out trả xe có tính phụ phí minh bạch.""")

    # =========================================================================
    # SLIDE 7: CHƯƠNG 2 - THIẾT KẾ CƠ SỞ DỮ LIỆU (4 BẢNG CỐT LÕI)
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    img_s7 = "docs/diagrams/core_database_tables.png"
    add_centered_diagram_slide(
        s7, "2.3", "Thiết Kế Cơ Sở Dữ Liệu Phía Server",
        "> Xây dựng cơ sở dữ liệu sử dụng PostgreSQL 16 với 4 bảng dữ liệu hạt nhân:",
        img_s7,
        "Hình 2.3 Cấu trúc các bảng dữ liệu hạt nhân trong hệ thống CSDL DriveShare (users, cars, rentals, payments)"
    )
    set_notes(s7, """LỜI THOẠI THUYẾT TRÌNH (04:30 - 05:20):
Về cơ sở dữ liệu, nhóm xây dựng trên PostgreSQL 16 gồm 15 bảng quan hệ chuẩn hóa:
- Bảng users: Quản lý người dùng, phân quyền RBAC và token_version.
- Bảng cars: Quản lý thông tin xe, biển số UNIQUE và đơn giá thuê.
- Bảng rentals: Bảng hạt nhân lưu trữ toàn bộ tiến trình đơn thuê và thời hạn cọc 45 phút.
- Bảng payments: Lưu trữ mã giao dịch DSPAY, mã VietQR và trạng thái cọc 30%.""")

    # =========================================================================
    # SLIDE 8: CHƯƠNG 2 - VÒNG ĐỜI ĐƠN THUÊ & STATE MACHINE
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    img_s8 = "docs/image_diagram/VietQR Rental Booking Lifecycle-2026-10-28-150558.png"
    add_centered_diagram_slide(
        s8, "2.4", "Vòng Đời Đơn Thuê & Ký Quỹ VietQR (State Machine)",
        "> Chu trình điều khiển trạng thái tự động ngăn ngừa Overbooking và bảo vệ dòng tiền cọc:",
        img_s8,
        "Hình 2.4 Máy trạng thái điều khiển vòng đời đơn thuê và ký quỹ cọc VietQR 30% — DriveShare"
    )
    set_notes(s8, """LỜI THOẠI THUYẾT TRÌNH (05:20 - 06:10):
Toàn bộ quy trình đặt xe được điều khiển bởi Máy trạng thái bám sát 5 trạng thái xương sống:
- Đơn tạo mới PENDING_APPROVAL: Chủ xe có 60 phút để duyệt, quá giờ tự hủy EXPIRED.
- Duyệt đơn kích hoạt WAITING_PAYMENT (Soft Lock 45 phút), các đơn trùng lịch tự sang ON_HOLD.
- Cọc 30% VietQR thành công chuyển sang CONFIRMED (Hard Lock) và tự động từ chối các đơn ON_HOLD.
- Nếu khách hết 45 phút không cọc, đơn chuyển EXPIRED và Cronjob tự động phục hồi đơn ON_HOLD về Chờ duyệt để đón khách tiếp theo!""")

    # =========================================================================
    # SLIDE 9: CHƯƠNG 2 - KHÓA BI QUAN PESSIMISTIC_WRITE (CODE THẬT CarJpaRepository)
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_background(s9)
    add_slide_header(s9, "2.5", "Giải Pháp Kỹ Thuật: Ngăn Chặn Xung Đột Bằng Khóa Bi Quan",
                     "> Cơ chế chống xung đột đồng thời (Race Condition) bằng Khóa bi quan ở tầng CSDL:")

    left_card = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.75), Inches(5.8), Inches(5.1))
    left_card.fill.solid()
    left_card.fill.fore_color.rgb = WHITE
    left_card.line.color.rgb = BORDER_COLOR
    left_card.line.width = Pt(1.5)

    tf_l = left_card.text_frame
    tf_l.margin_left = tf_l.margin_right = tf_l.margin_top = Inches(0.35)
    tf_l.word_wrap = True

    p = tf_l.paragraphs[0]
    p.text = "GIẢI PHÁP CHỐNG XUNG ĐỘT ĐỒNG THỜI"
    p.font.name = FONT_HEADING
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = PRIMARY
    p.space_after = Pt(14)

    bullets_s9 = [
        "Vấn đề Race Condition: Nhiều luồng cùng thao tác duyệt đơn hoặc hoàn cọc gây lỗi trùng lặp.",
        "Giải pháp trong code: Áp dụng @Lock(LockModeType.PESSIMISTIC_WRITE) tại CarJpaRepository.",
        "Cơ chế SQL: Phát sinh lệnh SELECT ... FOR UPDATE khóa độc quyền bản ghi ở tầng CSDL.",
        "Đảm bảo an toàn: Giữ khóa trong suốt transaction; ngăn ngừa tình trạng hai đơn cùng đặt một xe.",
        "Xử lý khiếu nại: Khóa bản ghi tại RentalDisputeJpaRepository chống hoàn tiền trùng lặp."
    ]
    for b in bullets_s9:
        p = tf_l.add_paragraph()
        p.text = "•  " + b
        p.font.name = FONT_BODY
        p.font.size = Pt(13)
        p.font.color.rgb = TEXT_MAIN
        p.space_after = Pt(9)

    code_box = s9.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.85), Inches(1.75), Inches(5.683), Inches(5.1))
    code_box.fill.solid()
    code_box.fill.fore_color.rgb = CODE_BG
    code_box.line.color.rgb = PRIMARY
    code_box.line.width = Pt(2.0)

    tf_c = code_box.text_frame
    tf_c.margin_left = tf_c.margin_right = tf_c.margin_top = Inches(0.35)
    tf_c.word_wrap = True

    p = tf_c.paragraphs[0]
    p.text = "// CarJpaRepository.java (Spring Data JPA)"
    p.font.name = "Consolas"
    p.font.size = Pt(12)
    p.font.color.rgb = TEXT_MUTED
    p.space_after = Pt(4)

    p = tf_c.add_paragraph()
    p.text = "@Lock(LockModeType.PESSIMISTIC_WRITE)"
    p.font.name = "Consolas"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = CODE_YELLOW
    p.space_after = Pt(2)

    p = tf_c.add_paragraph()
    p.text = '@Query("SELECT c FROM Car c WHERE c.carId = :carId AND c.deletedAt IS NULL")'
    p.font.name = "Consolas"
    p.font.size = Pt(11.5)
    p.font.color.rgb = CODE_GREEN
    p.space_after = Pt(2)

    p = tf_c.add_paragraph()
    p.text = "Optional<Car> findCarForUpdate(@Param(\"carId\") Long carId);"
    p.font.name = "Consolas"
    p.font.size = Pt(12)
    p.font.color.rgb = WHITE
    p.space_after = Pt(16)

    p = tf_c.add_paragraph()
    p.text = "-- SQL Generated by Hibernate (PostgreSQL 16):"
    p.font.name = "Consolas"
    p.font.size = Pt(11.5)
    p.font.color.rgb = TEXT_MUTED
    p.space_after = Pt(4)

    p = tf_c.add_paragraph()
    p.text = "SELECT c.car_id, c.plate_number, c.price_per_day\nFROM cars c\nWHERE c.car_id = ? AND c.deleted_at IS NULL\nFOR UPDATE;"
    p.font.name = "Consolas"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = CODE_YELLOW
    p.space_after = Pt(16)

    p = tf_c.add_paragraph()
    p.text = "=> Khóa độc quyền hàng dữ liệu ngay lập tức.\n=> Luồng thứ 2 phải xếp hàng chờ cho đến khi commit.\n=> Ngăn chặn hoàn toàn lỗi đặt trùng xe (Overbooking)!"
    p.font.name = FONT_BODY
    p.font.size = Pt(12)
    p.font.color.rgb = CODE_GREEN

    set_notes(s9, """LỜI THOẠI THUYẾT TRÌNH (06:10 - 07:10):
Đây là giải pháp xử lý Race Condition bằng Khóa bi quan:
Lệnh SELECT FOR UPDATE khóa trực tiếp hàng dữ liệu xe trong PostgreSQL trong suốt transaction duyệt đơn, đảm bảo không thể có 2 đơn cùng được chốt một lúc.
Khi Admin xử lý khiếu nại, bản ghi tranh chấp tại RentalDisputeJpaRepository cũng được khóa để chống hoàn tiền 2 lần.""")

    # =========================================================================
    # SLIDE 10: CHƯƠNG 2 - KHÓA 2 TẦNG (TWO-TIER LOCKING - SEQUENCE)
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    img_s10 = "docs/diagrams/04_sequence_booking_and_deposit.png"
    add_centered_diagram_slide(
        s10, "2.6", "Giải Pháp Kỹ Thuật: Cơ Chế Khóa 2 Tầng (Two-Tier Locking)",
        "> Sơ đồ tuần tự quy trình đặt xe, ký quỹ cọc 30% VietQR và tự động phục hồi đơn chờ:",
        img_s10,
        "Hình 2.6 Sơ đồ tuần tự quy trình đặt xe và khóa 2 tầng (Soft Lock 45m & Hard Lock Ký Quỹ) — DriveShare"
    )
    set_notes(s10, """LỜI THOẠI THUYẾT TRÌNH (07:10 - 08:00):
Tiếp nối là Cơ chế Khóa 2 tầng linh hoạt:
Soft Lock 45 phút cho khách thời gian chuyển khoản cọc 30% mà không sợ mất chỗ.
Khi có cọc, Hard Lock kích hoạt chốt xe vĩnh viễn.
Nếu quá 45 phút khách không cọc, Cronjob tự động giải phóng xe và phục hồi các đơn ON_HOLD về Chờ duyệt để đón khách tiếp theo.""")

    # =========================================================================
    # SLIDE 11: CHƯƠNG 2 - BẢO MẬT JWT & TRỢ LÝ AI DỰ PHÒNG
    # =========================================================================
    s11 = prs.slides.add_slide(blank_layout)
    set_slide_background(s11)
    add_slide_header(s11, "2.7", "Giải Pháp Kỹ Thuật: Bảo Mật JWT & Trợ Lý AI Dự Phòng",
                     "> Cơ chế bảo mật phiên Stateless và phân hệ AI hoạt động linh hoạt cả Online lẫn Offline:")

    left_card = s11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.75), Inches(5.8), Inches(5.1))
    left_card.fill.solid()
    left_card.fill.fore_color.rgb = WHITE
    left_card.line.color.rgb = BORDER_COLOR
    left_card.line.width = Pt(1.5)

    tf_l = left_card.text_frame
    tf_l.margin_left = tf_l.margin_right = tf_l.margin_top = Inches(0.35)
    tf_l.word_wrap = True

    p = tf_l.paragraphs[0]
    p.text = "AN TOÀN BẢO MẬT & TRỢ LÝ AI"
    p.font.name = FONT_HEADING
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = PRIMARY
    p.space_after = Pt(14)

    bullets_s11 = [
        "Stateless JWT: Dùng jjwt 0.12.6, mã hóa mật khẩu BCrypt, phân quyền phương thức RBAC.",
        "Token Versioning: Trường token_version giúp thu hồi token tức thì ngay khi đổi mật khẩu.",
        "Chống Brute-force: Tự động khóa tài khoản locked_until sau 5 lần nhập sai mật khẩu liên tiếp.",
        "Google Gemini AI: Tích hợp mô hình Gemini 2.5 Flash qua Java HttpClient kèm ngữ cảnh CSDL.",
        "Bộ lọc từ khóa dự phòng: Tự động bóc tách ngày, giá, số chỗ bằng Regex khi mất kết nối AI."
    ]
    for b in bullets_s11:
        p = tf_l.add_paragraph()
        p.text = "•  " + b
        p.font.name = FONT_BODY
        p.font.size = Pt(13)
        p.font.color.rgb = TEXT_MAIN
        p.space_after = Pt(9)

    box_r = s11.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.85), Inches(1.75), Inches(5.683), Inches(5.1))
    box_r.fill.solid()
    box_r.fill.fore_color.rgb = WHITE
    box_r.line.color.rgb = BORDER_COLOR
    box_r.line.width = Pt(1.5)

    img_ai = "docs/diagrams/feature_icons/image5.png" if os.path.exists("docs/diagrams/feature_icons/image5.png") else "docs/screenshots/02_live_car_detail_modal.png"
    if os.path.exists(img_ai):
        try:
            with Image.open(img_ai) as img:
                orig_w, orig_h = img.size
            aspect = orig_w / orig_h
            dest_w = Inches(5.3)
            dest_h = dest_w / aspect
            dest_l = Inches(7.04)
            dest_t = Inches(1.75) + (Inches(5.1) - dest_h) / 2
            s11.shapes.add_picture(img_ai, dest_l, dest_t, dest_w, dest_h)
        except Exception as e:
            print(f"Lỗi ảnh AI: {e}")

    set_notes(s11, """LỜI THOẠI THUYẾT TRÌNH (08:00 - 08:30):
Về bảo mật, cơ chế token_version cho phép thu hồi JWT ngay khi đổi mật khẩu, tự khóa tài khoản sau 5 lần đăng nhập sai.
Phân hệ AI hoạt động linh hoạt: Bình thường gọi Gemini 2.5 Flash; khi mất mạng bộ lọc từ khóa Regex tự kích hoạt để tư vấn xe và tính cọc 30% mượt mà.""")

    # =========================================================================
    # SLIDE 12: CHƯƠNG 3 - PHÂN HỆ KHÁCH THUÊ (3 ẢNH GỐC ĐÃ KHÔI PHỤC)
    # =========================================================================
    s12 = prs.slides.add_slide(blank_layout)
    renter_screens = [
        ("docs/diagrams/feature_icons/image6.png",
         "1. Tìm Xe & Bộ Lọc",
         "Lọc theo Tỉnh, ngày thuê, khoảng giá và số chỗ"),
        ("docs/diagrams/feature_icons/image7.png",
         "2. Ký Quỹ Cọc 30% VietQR",
         "Tự sinh mã QR ngân hàng & đếm ngược Soft Lock 45m"),
        ("docs/diagrams/feature_icons/image8.png",
         "3. Khiếu Nại Sự Cố (Dispute)",
         "Gửi ảnh/video bằng chứng tại chỗ để yêu cầu hoàn cọc")
    ]
    add_three_mobile_screens_slide(
        s12, "3.1", "Kết Quả Thực Nghiệm: Phân Hệ Khách Thuê (Renter)",
        "> Giao diện Mobile Responsive trực quan, tối ưu hành trình trải nghiệm người dùng:",
        renter_screens
    )
    set_notes(s12, """LỜI THOẠI THUYẾT TRÌNH (08:30 - 09:30):
Bước sang Chương 3 thực nghiệm, đây là 3 màn hình cốt lõi của Khách thuê trên Mobile:
1. Màn hình tìm xe với bộ lọc đa tiêu chí trực quan.
2. Màn hình thanh toán ký quỹ 30% VietQR tự động sinh mã kèm đồng hồ đếm ngược Soft Lock 45 phút.
3. Màn hình gửi khiếu nại sự cố kèm video bằng chứng để nhận lại tiền cọc nếu chủ xe không giao xe.""")

    # =========================================================================
    # SLIDE 13: CHƯƠNG 3 - PHÂN HỆ CHỦ XE (3 ẢNH GỐC ĐÃ KHÔI PHỤC)
    # =========================================================================
    s13 = prs.slides.add_slide(blank_layout)
    owner_screens = [
        ("docs/diagrams/feature_icons/image9.png",
         "1. Quản Lý Đội Xe",
         "Bật/Tắt trạng thái hoạt động & cập nhật giá thuê"),
        ("docs/diagrams/feature_icons/image10.png",
         "2. Biên Bản Bàn Giao 2 Chiều",
         "Check-in/out ghi nhận ODO, vạch xăng & ảnh xe"),
        ("docs/diagrams/feature_icons/image11.png",
         "3. Ví Doanh Thu Chủ Xe",
         "Thống kê số dư khả dụng, nhận 90% doanh thu cuốc xe")
    ]
    add_three_mobile_screens_slide(
        s13, "3.2", "Kết Quả Thực Nghiệm: Phân Hệ Chủ Xe (Car Owner)",
        "> Bộ công cụ số hóa toàn diện giúp chủ xe quản lý tài sản và theo dõi doanh thu:",
        owner_screens
    )
    set_notes(s13, """LỜI THOẠI THUYẾT TRÌNH (09:30 - 10:30):
Đối với phân hệ Chủ xe, nhóm triển khai 3 chức năng thực nghiệm then chốt:
1. Dashboard quản lý đội xe với nút bật/tắt nhận khách tức thì.
2. Biên bản bàn giao điện tử 2 chiều: Nhập số km ODO, vạch xăng và chụp ảnh làm bằng chứng đối soát.
3. Ví doanh thu minh bạch: Tự động quyết toán 90% tiền thuê cho chủ xe sau khi cuốc xe hoàn tất.""")

    # =========================================================================
    # SLIDE 14: CHƯƠNG 3 - PHÂN HỆ QUẢN TRỊ ADMIN (3 ẢNH GỐC ĐÃ KHÔI PHỤC)
    # =========================================================================
    s14 = prs.slides.add_slide(blank_layout)
    admin_screens = [
        ("docs/diagrams/feature_icons/image12.png",
         "1. Dashboard Tổng Quan Sàn",
         "Theo dõi thời gian thực số xe, thành viên & doanh thu cọc"),
        ("docs/diagrams/feature_icons/image13.png",
         "2. Thẩm Định eKYC Giấy Tờ",
         "Đối soát ảnh chụp CCCD, GPLX và tài khoản ngân hàng"),
        ("docs/diagrams/feature_icons/image14.png",
         "3. Xử Lý Khiếu Nại (Dispute)",
         "Phân xử hoàn cọc, phạt vi phạm & xuất biên bản sự cố")
    ]
    add_three_mobile_screens_slide(
        s14, "3.3", "Kết Quả Thực Nghiệm: Phân Hệ Quản Trị (Admin Portal)",
        "> Trung tâm điều hành kiểm soát rủi ro, thẩm định hồ sơ và giải quyết khiếu nại:",
        admin_screens
    )
    set_notes(s14, """LỜI THOẠI THUYẾT TRÌNH (10:30 - 11:30):
Cổng Quản trị Admin đảm nhiệm 3 vai trò quan trọng:
1. Dashboard giám sát toàn bộ hoạt động và doanh thu ký quỹ sàn.
2. Thẩm định trực quan hồ sơ eKYC CCCD và GPLX của khách thuê trước khi cho phép đặt xe.
3. Trung tâm phân xử Dispute giải ngân hoàn cọc, phạt chủ xe vi phạm và khóa tài khoản vi phạm nếu quá hạn trả xe 24 giờ.""")

    # =========================================================================
    # SLIDE 15: CHƯƠNG 3 - QUY TRÌNH BÀN GIAO XE 2 CHIỀU (SEQUENCE DIAGRAM)
    # =========================================================================
    s15 = prs.slides.add_slide(blank_layout)
    img_s15 = "docs/diagrams/05_sequence_two_way_handover.png"
    add_centered_diagram_slide(
        s15, "3.4", "Quy Trình Nghiệm Thu Xe 2 Chiều & Hợp Đồng Điện Tử",
        "> Sơ đồ tuần tự nghiệp vụ Check-in & Check-out ngăn ngừa tranh chấp hư hỏng:",
        img_s15,
        "Hình 3.4 Sơ đồ tuần tự quy trình bàn giao xe hai chiều (Check-in & Check-out) — DriveShare"
    )
    set_notes(s15, """LỜI THOẠI THUYẾT TRÌNH (11:30 - 12:30):
Điểm đột phá tiếp theo là Quy trình nghiệm thu xe 2 chiều:
Cả lúc giao xe và nhận xe đều bắt buộc nhập ODO, vạch xăng và chụp ảnh hiện trạng.
Dữ liệu lưu vào bảng rental_inspections tạo bằng chứng đối soát minh bạch, loại bỏ hoàn toàn các vụ cãi vã đền bù hư hỏng.""")

    # =========================================================================
    # SLIDE 16: KẾT LUẬN - HẠN CHẾ & HƯỚNG PHÁT TRIỂN
    # =========================================================================
    s16 = prs.slides.add_slide(blank_layout)
    card_data_s16 = [
        ("HẠN CHẾ 01", "Xác Nhận VietQR",
         "Hiện tại: Xác nhận cọc qua nút bấm mô phỏng Webhook trên màn hình.\nHướng tới: Tích hợp Webhook biến động số dư ngân hàng tự động (Casso / SePay)."),
        ("HẠN CHẾ 02", "Thẩm Định eKYC",
         "Hiện tại: Admin duyệt bằng mắt trên ảnh chụp CCCD và bằng lái xe.\nHướng tới: Tích hợp AI OCR quét thông tin giấy tờ và so khớp khuôn mặt sinh trắc."),
        ("HẠN CHẾ 03", "Thông Báo Realtime",
         "Hiện tại: Sử dụng cơ chế REST Polling định kỳ để cập nhật chuông.\nHướng tới: Nâng cấp lên kết nối hai chiều WebSocket STOMP Broker."),
        ("HẠN CHẾ 04", "Bản Đồ Tương Tác",
         "Hiện tại: Quản lý tọa độ trong DB, giao diện lọc theo Tỉnh/Thành.\nHướng tới: Nhúng bản đồ Mapbox/Leaflet tìm xe theo bán kính 5 - 10km.")
    ]
    add_four_cards_slide(s16, "KẾT LUẬN", "Những Hạn Chế Còn Tồn Tại & Hướng Phát Triển",
                         "> Đánh giá trung thực hiện trạng và định hướng nâng cấp hệ thống:",
                         card_data_s16)
    set_notes(s16, """LỜI THOẠI THUYẾT TRÌNH (12:30 - 13:45):
Với tinh thần cầu thị và trung thực khoa học, nhóm xin chủ động báo cáo 4 hạn chế hiện tại:
1. Xác nhận chuyển khoản VietQR đang dùng nút mô phỏng -> Hướng tới Webhook Casso tự động.
2. eKYC đang do Admin duyệt bằng mắt -> Hướng tới AI OCR nhận diện CCCD.
3. Thông báo dùng REST Polling -> Hướng tới WebSocket STOMP.
4. Danh sách xe lọc theo Tỉnh/Thành -> Hướng tới nhúng bản đồ tương tác Mapbox.""")

    # =========================================================================
    # SLIDE 17: LỜI CẢM ƠN & PHIÊN VẤN ĐÁP Q&A
    # =========================================================================
    s17 = prs.slides.add_slide(blank_layout)
    set_slide_background(s17)
    add_slide_header(s17, "Q&A", "Phiên Vấn Đáp & Lắng Nghe Góp Ý Của Hội Đồng",
                     "> Lời tri ân chân thành và phân công thành viên giải đáp phản biện:")

    card_ty = s17.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(1.75), Inches(5.8), Inches(5.1))
    card_ty.fill.solid()
    card_ty.fill.fore_color.rgb = WHITE
    card_ty.line.color.rgb = BORDER_COLOR
    card_ty.line.width = Pt(1.5)

    tf = card_ty.text_frame
    tf.margin_left = tf.margin_right = tf.margin_top = Inches(0.35)
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "LỜI TRI ÂN SÂU SẮC"
    p.font.name = FONT_HEADING
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = PRIMARY
    p.space_after = Pt(14)

    p = tf.add_paragraph()
    p.text = "Nhóm xin trân trọng cảm ơn quý Thầy, Cô trong Hội đồng phản biện đã dành thời gian quý báu theo dõi bài báo cáo của nhóm.\n\nĐặc biệt, nhóm xin gửi lời tri ân sâu sắc nhất đến Thầy Trương Thanh Bình đã luôn đồng hành, định hướng và chỉ bảo tận tình cho nhóm trong suốt quá trình hoàn thiện đề tài này."
    p.font.name = FONT_BODY
    p.font.size = Pt(14)
    p.font.color.rgb = TEXT_MAIN

    card_qa = s17.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.85), Inches(1.75), Inches(5.683), Inches(5.1))
    card_qa.fill.solid()
    card_qa.fill.fore_color.rgb = WHITE
    card_qa.line.color.rgb = BORDER_COLOR
    card_qa.line.width = Pt(1.5)

    tf = card_qa.text_frame
    tf.margin_left = tf.margin_right = tf.margin_top = Inches(0.35)
    tf.word_wrap = True

    p = tf.paragraphs[0]
    p.text = "PHIÊN VẤN ĐÁP & HỎI ĐÁP (Q&A)"
    p.font.name = FONT_HEADING
    p.font.size = Pt(16)
    p.font.bold = True
    p.font.color.rgb = ACCENT_ORANGE
    p.space_after = Pt(14)

    p = tf.add_paragraph()
    p.text = "Nhóm sẵn sàng lắng nghe những góp ý quý báu và giải đáp mọi câu hỏi phản biện từ quý Thầy, Cô!\n\nĐại diện trả lời: Nguyễn Duy Bảo\nCùng sự phối hợp của các thành viên:\n•  Nguyễn Chí Tín: Thanh toán VietQR & Giao diện Web\n•  Lâm Chí Vĩ: Backend Core & Khóa bi quan CSDL\n•  Đỗ Ngọc Phát: Trợ lý AI Gemini & Bảo mật JWT\n•  Nguyễn Duy Quân: Kiểm soát quá hạn & Xử lý khiếu nại\n•  NguyễnTấn Lộc Khiêm: Phân tích nghiệp vụ & Cơ sở dữ liệu"
    p.font.name = FONT_BODY
    p.font.size = Pt(12.5)
    p.font.color.rgb = TEXT_MAIN

    set_notes(s17, """LỜI THOẠI THUYẾT TRÌNH (13:45 - 15:00):
Bài thuyết trình báo cáo đề tài của nhóm chúng em đến đây là kết thúc.
Nhóm xin gửi lời cảm ơn chân thành nhất đến quý Thầy Cô trong Hội đồng và đặc biệt là Thầy Trương Thanh Bình.
Sau đây, nhóm chúng em xin được lắng nghe những ý kiến đóng góp quý báu và sẵn sàng trả lời các câu hỏi phản biện từ quý Thầy Cô. Em xin cảm ơn!""")

    # Lưu vào cả 2 file để người dùng xem trực tiếp file nào cũng có bản mới nhất
    paths_to_save = [
        "docs/Slide_Bao_Ve_Do_An_DriveShare_K4.pptx",
        "docs/Slide_Bao_Ve_Do_An_DriveShare_K4_V4_17Slides.pptx"
    ]
    for output_path in paths_to_save:
        try:
            prs.save(output_path)
            print(f"[OK] Xuất thành công {len(prs.slides)} slides chuẩn ITC K25 vào: {output_path}")
        except Exception as e:
            print(f"[!] Không thể lưu vào {output_path}: {e}")


if __name__ == "__main__":
    build_presentation()
