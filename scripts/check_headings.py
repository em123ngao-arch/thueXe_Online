# -*- coding: utf-8 -*-
import sys
import docx

sys.stdout.reconfigure(encoding='utf-8')

def check_headings():
    itc = docx.Document('docs/Doc_ITC.docx')
    srs = docx.Document('BAO_CAO_SRS_DRIVESHARE_K4_PRO_V2_2_Ch1_to_Ch12.docx')
    
    print("=== DOC_ITC HEADINGS & PARAGRAPHS ===")
    for p in itc.paragraphs[:45]:
        if any(p.text.strip().startswith(x) for x in ['CHƯƠNG', '1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '10.', '11.', '12.', 'BẢNG', 'Bảng', 'PHỤ LỤC']):
            sizes = [r.font.size.pt if r.font.size else 'Inherit' for r in p.runs]
            colors = [str(r.font.color.rgb) if r.font.color else 'Inherit' for r in p.runs]
            bolds = [r.font.bold for r in p.runs]
            print(f"[{p.style.name}] size={sizes[:2]} color={colors[:2]} bold={bolds[:2]} | {p.text.strip()[:60]}")
            
    print("\n=== SRS V2.2 HEADINGS (CH 1-5 vs CH 6-12) ===")
    for p in srs.paragraphs:
        if any(p.text.strip().startswith(x) for x in ['CHƯƠNG', 'UC-', '6.', '7.', '8.', '9.', '10.', '11.', '12.']):
            sizes = [r.font.size.pt if r.font.size else 'Inherit' for r in p.runs]
            colors = [str(r.font.color.rgb) if r.font.color else 'Inherit' for r in p.runs]
            bolds = [r.font.bold for r in p.runs]
            print(f"[{p.style.name}] size={sizes[:2]} color={colors[:2]} bold={bolds[:2]} | {p.text.strip()[:60]}")

if __name__ == '__main__':
    check_headings()
