import sys
import re
from pptx import Presentation

sys.stdout.reconfigure(encoding='utf-8')

prs = Presentation('docs/Slide_Bao_Ve_Do_An_DriveShare_K4_Moi_Nhat.pptx')

# Check suspicious unaccented words
unaccented_patterns = [
    r'\bnghiep\b', r'\btrien\b', r'\bnghiem\b', r'\bquan ly\b', r'\bchuc nang\b',
    r'\bhe thong\b', r'\bkhach\b', r'\bchủ xe\b', r'\bduyet\b', r'\bdat xe\b',
    r'\bthanh toan\b', r'\bbao ve\b', r'\bkiểm thử\b'
]

print("=== KIỂM TRA TỪ NGHI VẤN KHÔNG DẤU ===")
found_suspicious = False
for i, slide in enumerate(prs.slides, 1):
    for shape in slide.shapes:
        if shape.has_text_frame:
            for p in shape.text_frame.paragraphs:
                txt = p.text.strip()
                for pat in [r'\bnghiep\b', r'\bhe thong\b', r'\bquan ly\b', r'\bduyet\b']:
                    if re.search(pat, txt, re.IGNORECASE):
                        print(f"Slide {i:02d}: Khớp '{pat}' trong: {txt}")
                        found_suspicious = True

if not found_suspicious:
    print("Không phát hiện từ không dấu thông thường.")

print("\n=== KIỂM TRA PHÔNG CHỮ & BỐ CỤC ===")
for i, slide in enumerate(prs.slides, 1):
    font_sizes = []
    shapes_count = len(slide.shapes)
    has_image = any(s.shape_type == 13 for s in slide.shapes)  # 13 is PICTURE
    for shape in slide.shapes:
        if shape.has_text_frame:
            for p in shape.text_frame.paragraphs:
                if p.font.size:
                    font_sizes.append(p.font.size.pt)
    min_sz = min(font_sizes) if font_sizes else 0
    max_sz = max(font_sizes) if font_sizes else 0
    has_notes = slide.has_notes_slide and bool(slide.notes_slide.notes_text_frame.text.strip())
    print(f"Slide {i:02d}: Shapes={shapes_count:2d} | HasImage={str(has_image):5s} | FontRange=[{min_sz:4.1f}pt - {max_sz:4.1f}pt] | Notes={has_notes}")
