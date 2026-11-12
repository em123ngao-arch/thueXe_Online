# -*- coding: utf-8 -*-
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

sys.stdout.reconfigure(encoding='utf-8')

def compare_format():
    itc = docx.Document('docs/Doc_ITC.docx')
    srs = docx.Document('BAO_CAO_SRS_DRIVESHARE_K4_PRO_V2_2_Ch1_to_Ch12.docx')
    
    print("=== 1. PAGE SETUP & MARGINS ===")
    for i, sec in enumerate(itc.sections):
        print(f"Doc_ITC Sec {i}: Page {sec.page_width.inches:.2f} x {sec.page_height.inches:.2f} in | Margins T={sec.top_margin.inches:.2f}, B={sec.bottom_margin.inches:.2f}, L={sec.left_margin.inches:.2f}, R={sec.right_margin.inches:.2f}")
    for i, sec in enumerate(srs.sections):
        print(f"SRS V2.2 Sec {i}: Page {sec.page_width.inches:.2f} x {sec.page_height.inches:.2f} in | Margins T={sec.top_margin.inches:.2f}, B={sec.bottom_margin.inches:.2f}, L={sec.left_margin.inches:.2f}, R={sec.right_margin.inches:.2f}")

    print("\n=== 2. PARAGRAPH LEVEL ANALYSIS IN CH 6 - 12 ===")
    # Check paragraphs in SRS Ch 6 to 12
    ch6_idx = None
    for idx, p in enumerate(srs.paragraphs):
        if "CHƯƠNG 6:" in p.text:
            ch6_idx = idx
            break
            
    ch13_idx = len(srs.paragraphs)
    for idx, p in enumerate(srs.paragraphs):
        if "CHƯƠNG 13:" in p.text:
            ch13_idx = idx
            break
            
    print(f"SRS Ch 6 to 12 spans from paragraph {ch6_idx} to {ch13_idx} (total {ch13_idx - ch6_idx} paragraphs)")
    
    alignments = {}
    line_spacings = set()
    space_afters = set()
    fonts = set()
    sizes = set()
    
    for p in srs.paragraphs[ch6_idx:ch13_idx]:
        align = str(p.alignment)
        alignments[align] = alignments.get(align, 0) + 1
        if p.paragraph_format.line_spacing:
            line_spacings.add(p.paragraph_format.line_spacing)
        if p.paragraph_format.space_after:
            space_afters.add(p.paragraph_format.space_after.pt)
        for r in p.runs:
            if r.font.name:
                fonts.add(r.font.name)
            if r.font.size:
                sizes.add(r.font.size.pt)
                
    print(f"Alignments count: {alignments}")
    print(f"Line spacings: {line_spacings}")
    print(f"Space afters (pt): {sorted(list(space_afters))}")
    print(f"Fonts used in Ch 6-12: {fonts}")
    print(f"Font sizes used in Ch 6-12 (pt): {sorted(list(sizes))}")
    
    print("\n=== 3. TABLE FORMAT ANALYSIS IN CH 6 - 12 ===")
    # Tables in Ch 6-12 are T20 to T39
    tbl_fonts = set()
    tbl_sizes = set()
    tbl_alignments = set()
    header_shadings = set()
    cell_paddings = []
    
    for t_idx in range(20, len(srs.tables)):
        t = srs.tables[t_idx]
        header_cell = t.rows[0].cells[0]
        # check xml of header cell for shading
        xml = header_cell._tc.xml
        header_shadings.add("1f4e79" in xml.lower())
        for row in t.rows:
            for cell in row.cells:
                for p in cell.paragraphs:
                    tbl_alignments.add(str(p.alignment))
                    for r in p.runs:
                        if r.font.name:
                            tbl_fonts.add(r.font.name)
                        if r.font.size:
                            tbl_sizes.add(r.font.size.pt)
                            
    print(f"Table fonts in Ch 6-12: {tbl_fonts}")
    print(f"Table font sizes in Ch 6-12: {sorted(list(tbl_sizes))}")
    print(f"Table paragraph alignments: {tbl_alignments}")
    print(f"Table header shadings (#1f4e79): {header_shadings}")

    print("\n=== 4. DOC_ITC TABLE FORMAT REFERENCE ===")
    itc_tbl_fonts = set()
    itc_tbl_sizes = set()
    for t in itc.tables:
        for row in t.rows:
            for cell in row.cells:
                for p in cell.paragraphs:
                    for r in p.runs:
                        if r.font.name:
                            itc_tbl_fonts.add(r.font.name)
                        if r.font.size:
                            itc_tbl_sizes.add(r.font.size.pt)
    print(f"Doc_ITC Table fonts: {itc_tbl_fonts}")
    print(f"Doc_ITC Table font sizes: {sorted(list(itc_tbl_sizes))}")

if __name__ == '__main__':
    compare_format()
