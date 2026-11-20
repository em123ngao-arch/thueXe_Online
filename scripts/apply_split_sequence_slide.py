import sys
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

def update_slide():
    pptx_path = 'docs/Slide_Bao_Ve_Do_An_DriveShare_K4_V4_17Slides.pptx.bak_slide10'
    prs = Presentation(pptx_path)
    slide = prs.slides[8] # index 8 là Slide 9 (2.5 Two-Tier Locking)

    # 1. Tìm shape Logo trường, Title, và Top bar để giữ lại
    shapes_to_delete = []
    logo_shape = None
    title_shape = None
    bar_shape = None

    for shape in slide.shapes:
        if shape.name == 'Hình ảnh 7' or 'Hình ảnh' in shape.name:
            logo_shape = shape
        elif shape.name == 'TextBox 2':
            title_shape = shape
        elif shape.name == 'Rectangle 1':
            bar_shape = shape
        else:
            shapes_to_delete.append(shape)

    print(f"Deleting {len(shapes_to_delete)} old shapes...")
    for shape in shapes_to_delete:
        sp = shape._element
        sp.getparent().remove(sp)

    # 2. Cập nhật Title và Subtitle
    if title_shape and title_shape.has_text_frame:
        tf = title_shape.text_frame
        tf.word_wrap = True
        p0 = tf.paragraphs[0]
        p0.text = '>>>  2.5  Giải Pháp Kỹ Thuật: Cơ Chế Khóa 2 Tầng (Two-Tier Locking)'
        p0.font.name = 'Segoe UI'
        p0.font.size = Pt(21)
        p0.font.bold = True
        p0.font.color.rgb = RGBColor(15, 23, 42)

        if len(tf.paragraphs) > 1:
            p1 = tf.paragraphs[1]
        else:
            p1 = tf.add_paragraph()
        p1.text = '> Tách 2 giai đoạn tuần tự: Soft Lock 45 phút (Bên Trái) & Ký Quỹ Hard Lock (Bên Phải):'
        p1.font.name = 'Segoe UI'
        p1.font.size = Pt(13)
        p1.font.italic = True
        p1.font.color.rgb = RGBColor(100, 116, 139)

    # 3. Kích thước và Tọa độ cho 2 Cột Trái - Phải
    top_pos = Inches(1.42)
    card_height = Inches(5.35)
    card_width = Inches(5.82)
    left_col1 = Inches(0.65)
    left_col2 = Inches(6.86)

    # Khung nền Card 1 (Bên Trái - Soft Lock)
    card1 = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_col1, top_pos, card_width, card_height)
    card1.fill.solid()
    card1.fill.fore_color.rgb = RGBColor(255, 255, 255)
    card1.line.color.rgb = RGBColor(217, 119, 6) # Amber 600
    card1.line.width = Pt(1.5)

    # Khung nền Card 2 (Bên Phải - Hard Lock)
    card2 = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left_col2, top_pos, card_width, card_height)
    card2.fill.solid()
    card2.fill.fore_color.rgb = RGBColor(255, 255, 255)
    card2.line.color.rgb = RGBColor(22, 163, 74) # Green 600
    card2.line.width = Pt(1.5)

    # Chèn ảnh Part 1 vào Card 1
    # Ảnh Part 1: (3274, 4178) -> tỷ lệ 1 : 1.276
    img1_path = os.path.abspath('docs/diagrams/04_seq_part1_soft_lock.png')
    img1_left = left_col1 + Inches(0.12)
    img1_top = top_pos + Inches(0.10)
    img1_width = card_width - Inches(0.24)
    img1_height = Inches(4.75)
    pic1 = slide.shapes.add_picture(img1_path, img1_left, img1_top, width=img1_width, height=img1_height)

    # Chèn ảnh Part 2 vào Card 2
    # Ảnh Part 2: (3274, 3562) -> tỷ lệ 1 : 1.088
    img2_path = os.path.abspath('docs/diagrams/04_seq_part2_hard_lock.png')
    img2_left = left_col2 + Inches(0.12)
    img2_top = top_pos + Inches(0.10)
    img2_width = card_width - Inches(0.24)
    img2_height = Inches(4.75)
    pic2 = slide.shapes.add_picture(img2_path, img2_left, img2_top, width=img2_width, height=img2_height)

    # Chú thích chân ảnh Cột 1
    caption1 = slide.shapes.add_textbox(left_col1 + Inches(0.15), top_pos + Inches(4.90), card_width - Inches(0.30), Inches(0.40))
    tf_c1 = caption1.text_frame
    tf_c1.word_wrap = True
    p_c1 = tf_c1.paragraphs[0]
    p_c1.text = '🟡 NỬA TRÁI (TẦNG 1): ĐẶT XE & KHÓA MỀM 45P (SOFT LOCK & ON_HOLD)'
    p_c1.font.name = 'Segoe UI'
    p_c1.font.size = Pt(10.5)
    p_c1.font.bold = True
    p_c1.font.color.rgb = RGBColor(180, 83, 9)
    p_c1.alignment = PP_ALIGN.CENTER

    # Chú thích chân ảnh Cột 2
    caption2 = slide.shapes.add_textbox(left_col2 + Inches(0.15), top_pos + Inches(4.90), card_width - Inches(0.30), Inches(0.40))
    tf_c2 = caption2.text_frame
    tf_c2.word_wrap = True
    p_c2 = tf_c2.paragraphs[0]
    p_c2.text = '🟢 NỬA PHẢI (TẦNG 2): KÝ QUỸ CỌC 30% VIETQR & KHÓA CỨNG (HARD LOCK)'
    p_c2.font.name = 'Segoe UI'
    p_c2.font.size = Pt(10.5)
    p_c2.font.bold = True
    p_c2.font.color.rgb = RGBColor(21, 128, 61)
    p_c2.alignment = PP_ALIGN.CENTER

    # Thêm mũi tên chuyển tiếp lớn ở giữa 2 cột
    arrow_mid = slide.shapes.add_textbox(Inches(6.42), Inches(3.70), Inches(0.48), Inches(0.50))
    tf_am = arrow_mid.text_frame
    p_am = tf_am.paragraphs[0]
    p_am.text = '➔'
    p_am.font.name = 'Segoe UI Symbol'
    p_am.font.size = Pt(26)
    p_am.font.bold = True
    p_am.font.color.rgb = RGBColor(37, 99, 235)
    p_am.alignment = PP_ALIGN.CENTER

    # Chú thích toàn slide ở đáy
    bottom_note = slide.shapes.add_textbox(Inches(0.65), Inches(6.85), Inches(12.03), Inches(0.35))
    tf_bn = bottom_note.text_frame
    p_bn = tf_bn.paragraphs[0]
    p_bn.text = 'Hình 2.5 Sơ đồ tuần tự quy trình đặt xe và khóa 2 tầng (Soft Lock 45m & Hard Lock Ký Quỹ) — DriveShare'
    p_bn.font.name = 'Segoe UI'
    p_bn.font.size = Pt(10)
    p_bn.font.italic = True
    p_bn.font.color.rgb = RGBColor(100, 116, 139)
    p_bn.alignment = PP_ALIGN.CENTER

    # Đưa logo trường lên layer trên cùng
    if logo_shape:
        slide.shapes._spTree.remove(logo_shape._element)
        slide.shapes._spTree.append(logo_shape._element)

    out_file = 'docs/Slide_Bao_Ve_Do_An_DriveShare_K4_V4_17Slides_Updated.pptx'
    prs.save(out_file)
    print(f"Saved successfully to {out_file}!")

if __name__ == '__main__':
    update_slide()
