import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def create_slide_2_1b():
    pptx_path = 'docs/Slide_Bao_Ve_Do_An_DriveShare_K4_V4_17Slides_WithNotes.pptx'
    prs = Presentation(pptx_path)

    blank_layout = prs.slide_layouts[6]
    slide = prs.slides.add_slide(blank_layout)

    # 1. Background
    bg = slide.background
    fill = bg.fill
    fill.solid()
    fill.fore_color.rgb = RGBColor(248, 250, 252)

    # 2. Dải màu trang trí trên cùng
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(0.08))
    bar.fill.solid()
    bar.fill.fore_color.rgb = RGBColor(37, 99, 235)
    bar.line.fill.background()

    # 3. Header Text Box
    header_box = slide.shapes.add_textbox(Inches(0.65), Inches(0.40), Inches(10.5), Inches(0.95))
    tf_h = header_box.text_frame
    tf_h.word_wrap = True
    tf_h.margin_left = tf_h.margin_top = 0

    p0 = tf_h.paragraphs[0]
    p0.text = ">>>  2.1b  Mô Hình Vận Hành Nghiệp Vụ Thực Tế (Business Flow)"
    p0.font.name = "Segoe UI"
    p0.font.size = Pt(21)
    p0.font.bold = True
    p0.font.color.rgb = RGBColor(15, 23, 42)

    p1 = tf_h.add_paragraph()
    p1.text = "> Dòng chảy 4 giai đoạn khép kín giải quyết trọn vẹn bài toán thuê xe tự lái ngoài đời thực:"
    p1.font.name = "Segoe UI"
    p1.font.size = Pt(13)
    p1.font.italic = True
    p1.font.color.rgb = RGBColor(100, 116, 139)

    # 4. Thêm Logo trường ở góc trên bên phải
    logo_path = 'docs/diagrams/feature_icons/logo_truong.png'
    # Tìm logo từ slide khác nếu có
    ref_slide = prs.slides[0]
    for s in ref_slide.shapes:
        if 'Hình ảnh' in s.name or 'Logo' in s.name:
            try:
                with open('docs/diagrams/temp_logo.png', 'wb') as f:
                    f.write(s.image.blob)
                logo_path = 'docs/diagrams/temp_logo.png'
                break
            except:
                pass

    if os.path.exists(logo_path):
        slide.shapes.add_picture(logo_path, Inches(12.30), Inches(0), Inches(1.0), Inches(1.0))

    # 5. Màu sắc bảng phối chuẩn
    PRIMARY = RGBColor(15, 23, 42)      # Slate 900
    SECONDARY = RGBColor(37, 99, 235)   # Blue 600
    AMBER_DARK = RGBColor(180, 83, 9)   # Amber 700
    AMBER_BORDER = RGBColor(245, 158, 11)
    GREEN_DARK = RGBColor(21, 128, 61)  # Green 700
    GREEN_BORDER = RGBColor(34, 197, 94)
    SLATE_BORDER = RGBColor(203, 213, 225)
    SLATE_BG = RGBColor(248, 250, 252)
    TEXT_DARK = RGBColor(30, 41, 59)
    WHITE = RGBColor(255, 255, 255)

    # 6. Bố trí 4 Card nghiệp vụ nằm ngang
    card_top = Inches(1.48)
    card_height = Inches(4.20)
    card_width = Inches(2.72)
    gap = Inches(0.35)
    start_left = Inches(0.65)

    steps = [
        {
            "step": "GIAI ĐOẠN 1",
            "title": "TÌM XE & ĐẶT CHỖ",
            "tag": "TRẢI NGHIỆM KHÁCH THUÊ",
            "header_bg": PRIMARY,
            "border_color": SLATE_BORDER,
            "tag_color": RGBColor(226, 232, 240),
            "bullets": [
                "• Khách tìm xe theo tỉnh thành, ngày thuê, khoảng giá và số chỗ.",
                "• Trợ lý AI gợi ý mẫu xe phù hợp với nhu cầu và tính trước chi phí.",
                "• Hệ thống tự động kiểm tra giấy phép lái xe (GPLX) và CCCD.",
                "• Gửi yêu cầu đặt xe trực tuyến tới chủ xe chỉ trong 30 giây."
            ]
        },
        {
            "step": "GIAI ĐOẠN 2",
            "title": "XÉT DUYỆT & KÝ QUỸ",
            "tag": "BẢO VỆ DÒNG TIỀN 2 CHIỀU",
            "header_bg": AMBER_DARK,
            "border_color": AMBER_BORDER,
            "tag_color": RGBColor(254, 240, 138),
            "bullets": [
                "• Chủ xe xem xét hồ sơ người thuê và bấm Duyệt đơn.",
                "• Khách được giữ chỗ độc quyền trong 45 phút để chuyển tiền cọc.",
                "• Quét mã VietQR chuyển đúng 30% tiền cọc hợp đồng.",
                "• Sàn tạm giữ tiền cọc ở Quỹ Ký Quỹ (Escrow): Chủ xe an tâm giữ xe, khách không sợ bị lừa tiền."
            ]
        },
        {
            "step": "GIAI ĐOẠN 3",
            "title": "BÀN GIAO MINH BẠCH",
            "tag": "BIÊN BẢN XE ĐIỆN TỬ",
            "header_bg": SECONDARY,
            "border_color": SECONDARY,
            "tag_color": RGBColor(191, 219, 254),
            "bullets": [
                "• Hai bên gặp mặt trực tiếp để tiến hành giao nhận xe tại chỗ.",
                "• Lập Biên bản Check-in điện tử: Chụp ảnh 4 góc xe, ghi nhận số km (ODO) và vạch xăng.",
                "• Hai bên bấm ký xác nhận đồng thuận trên điện thoại di động.",
                "• Khách nhận chìa khóa và an tâm bắt đầu chuyến đi."
            ]
        },
        {
            "step": "GIAI ĐOẠN 4",
            "title": "TRẢ XE & TẤT TOÁN",
            "tag": "HOÀN CỌC & GIẢI NGÂN",
            "header_bg": GREEN_DARK,
            "border_color": GREEN_BORDER,
            "tag_color": RGBColor(187, 247, 208),
            "bullets": [
                "• Khách hoàn trả xe đúng hẹn tại điểm hẹn ban đầu.",
                "• Check-out đối soát hiện trạng xe và mức tiêu hao xăng so với lúc nhận.",
                "• Hai bên ký xác nhận nghiệm thu xe hoàn tất chuyến đi.",
                "• Sàn tự động giải ngân 90% doanh thu vào ví chủ xe và đối trừ cọc cho khách."
            ]
        }
    ]

    for idx, s in enumerate(steps):
        left = start_left + idx * (card_width + gap)

        # Card container
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, card_top, card_width, card_height)
        card.fill.solid()
        card.fill.fore_color.rgb = WHITE
        card.line.color.rgb = s['border_color']
        card.line.width = Pt(1.5)

        # Header box
        h_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left + Inches(0.08), card_top + Inches(0.08), card_width - Inches(0.16), Inches(0.92))
        h_box.fill.solid()
        h_box.fill.fore_color.rgb = s['header_bg']
        h_box.line.fill.background()

        tf_c = h_box.text_frame
        tf_c.word_wrap = True
        tf_c.margin_left = tf_c.margin_right = tf_c.margin_top = Inches(0.05)

        p_st = tf_c.paragraphs[0]
        p_st.text = s['step'] + ": " + s['title']
        p_st.font.name = "Segoe UI"
        p_st.font.size = Pt(10)
        p_st.font.bold = True
        p_st.font.color.rgb = WHITE
        p_st.alignment = PP_ALIGN.CENTER

        p_tg = tf_c.add_paragraph()
        p_tg.text = "[" + s['tag'] + "]"
        p_tg.font.name = "Segoe UI"
        p_tg.font.size = Pt(8.5)
        p_tg.font.bold = True
        p_tg.font.color.rgb = s['tag_color']
        p_tg.alignment = PP_ALIGN.CENTER

        # Body box
        b_box = slide.shapes.add_textbox(left + Inches(0.08), card_top + Inches(1.05), card_width - Inches(0.16), card_height - Inches(1.10))
        tf_b = b_box.text_frame
        tf_b.word_wrap = True
        tf_b.margin_left = tf_b.margin_right = tf_b.margin_top = Inches(0.04)

        for b_idx, bullet in enumerate(s['bullets']):
            p = tf_b.paragraphs[0] if b_idx == 0 else tf_b.add_paragraph()
            p.text = bullet
            p.font.name = "Segoe UI"
            p.font.size = Pt(9.0)
            p.font.color.rgb = TEXT_DARK
            p.space_after = Pt(6)

        # Mũi tên giữa các card
        if idx < 3:
            arr_left = left + card_width + Inches(0.03)
            arr_box = slide.shapes.add_textbox(arr_left, card_top + Inches(1.85), gap - Inches(0.06), Inches(0.5))
            tf_a = arr_box.text_frame
            p_a = tf_a.paragraphs[0]
            p_a.text = "➔"
            p_a.font.name = "Segoe UI Symbol"
            p_a.font.size = Pt(20)
            p_a.font.bold = True
            p_a.font.color.rgb = SECONDARY
            p_a.alignment = PP_ALIGN.CENTER

    # 7. Banner dưới: Giá trị mang lại cho 3 bên
    banner_top = Inches(5.80)
    banner_height = Inches(1.25)
    banner_left = Inches(0.65)
    banner_width = Inches(12.03)

    banner = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, banner_left, banner_top, banner_width, banner_height)
    banner.fill.solid()
    banner.fill.fore_color.rgb = SLATE_BG
    banner.line.color.rgb = SECONDARY
    banner.line.width = Pt(1.5)

    tf_bn = banner.text_frame
    tf_bn.word_wrap = True
    tf_bn.margin_left = tf_bn.margin_right = tf_bn.margin_top = Inches(0.10)

    p_bn_t = tf_bn.paragraphs[0]
    p_bn_t.text = "⭐ GIÁ TRỊ VẬN HÀNH THỰC TẾ MANG LẠI CHO 3 BÊN THAM GIA NỀN TẢNG"
    p_bn_t.font.name = "Segoe UI"
    p_bn_t.font.size = Pt(10)
    p_bn_t.font.bold = True
    p_bn_t.font.color.rgb = PRIMARY
    p_bn_t.alignment = PP_ALIGN.CENTER

    p_bn_desc = tf_bn.add_paragraph()
    p_bn_desc.text = (
        "• 🧑 Khách thuê: Tìm xe nhanh chóng, cọc an toàn 30% qua sàn, không bị giữ giấy tờ gốc CCCD.\n"
        "• 🚗 Chủ xe: Khai thác xe nhàn rỗi, không sợ khách bùng kèo, nhận 90% doanh thu minh bạch sau chuyến đi.\n"
        "• 🏢 Sàn DriveShare: Đóng vai trò trọng tài số uy tín, bảo đảm an toàn tài chính và chuẩn hóa quy trình pháp lý."
    )
    p_bn_desc.font.name = "Segoe UI"
    p_bn_desc.font.size = Pt(8.8)
    p_bn_desc.font.color.rgb = TEXT_DARK
    p_bn_desc.alignment = PP_ALIGN.LEFT

    # 8. Speaker Notes
    try:
        notes_slide = slide.notes_slide
        tf_n = notes_slide.notes_text_frame
        if tf_n is not None:
            tf_n.text = (
                "LỜI THOẠI THUYẾT TRÌNH (02:30 - 03:00):\n"
                "Về mặt nghiệp vụ thực tế, quy trình thuê xe trên DriveShare vận hành khép kín qua 4 giai đoạn minh bạch:\n"
                "1. Khách tìm xe theo nhu cầu, được AI tư vấn và gửi yêu cầu thuê trực tuyến.\n"
                "2. Chủ xe duyệt đơn, khách được giữ chỗ độc quyền 45 phút để ký quỹ cọc 30% vào tài khoản trung gian của Sàn để bảo vệ dòng tiền hai bên.\n"
                "3. Hai bên gặp mặt bàn giao xe, cùng lập Biên bản điện tử ghi nhận ảnh 4 góc xe, số ODO và vạch xăng để ngăn ngừa tranh chấp.\n"
                "4. Khi trả xe đúng hẹn, sàn tự động giải ngân 90% doanh thu cho chủ xe và hoàn cọc cho khách hàng an toàn tuyệt đối ạ."
            )
    except Exception as e:
        print(f"Notes note set: {e}")

    # 9. Di chuyển slide vừa tạo vào vị trí index 5 (ngay sau slide 2.1 cũ)
    slide_id_list = prs.slides._sldIdLst
    slide_elem = slide_id_list[-1]
    slide_id_list.insert(5, slide_elem)

    prs.save(pptx_path)
    print("SUCCESS! Created Slide 2.1b (Business Flow) at index 5!")

if __name__ == '__main__':
    create_slide_2_1b()
