# -*- coding: utf-8 -*-
import docx
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def detailed_chapter_audit(filepath):
    doc = docx.Document(filepath)
    elements = []
    for child in doc.element.body:
        tag = child.tag.split('}')[-1]
        if tag == 'p':
            p = docx.text.paragraph.Paragraph(child, doc)
            t = p.text.strip()
            if t:
                elements.append(('p', p.style.name, t))
        elif tag == 'tbl':
            tbl = docx.table.Table(child, doc)
            rows = len(tbl.rows)
            cols = len(tbl.columns)
            header = ' | '.join([c.text.strip().replace('\n', ' ') for c in tbl.rows[0].cells[:4]])
            elements.append(('tbl', f'{rows}x{cols}', header))

    current_chapter = 'PHẦN ĐẦU (BÌA & CHANGE LOG)'
    ch_summary = {current_chapter: {'paras': [], 'tables': [], 'h2': [], 'h3': []}}

    for el in elements:
        if el[0] == 'p':
            style, text = el[1], el[2]
            if style == 'Heading 1' or (text.startswith('CHƯƠNG ') and len(text) < 80) or text.startswith('PHỤ LỤC'):
                current_chapter = text
                ch_summary[current_chapter] = {'paras': [], 'tables': [], 'h2': [], 'h3': []}
            else:
                ch_summary[current_chapter]['paras'].append(text)
                if style == 'Heading 2':
                    ch_summary[current_chapter]['h2'].append(text)
                elif style == 'Heading 3':
                    ch_summary[current_chapter]['h3'].append(text)
        elif el[0] == 'tbl':
            ch_summary[current_chapter]['tables'].append((el[1], el[2]))

    print('========================================================================')
    print(f'CHI TIẾT TỪNG CHƯƠNG TRONG: {filepath}')
    print('========================================================================')
    for ch, data in ch_summary.items():
        words = sum(len(p.split()) for p in data['paras'])
        tbl_count = len(data['tables'])
        h2_count = len(data['h2'])
        
        # Assess status
        if words == 0 and tbl_count == 0:
            status = '🔴 RỖNG 100% (CHƯA VIẾT BẤT KỲ NỘI DUNG NÀO)'
        elif words < 50 and tbl_count == 0:
            status = '🟡 CHỈ CÓ KHUNG TIÊU ĐỀ (CHƯA VIẾT NỘI DUNG CHI TIẾT)'
        elif tbl_count > 0 or words > 200:
            status = '🟢 ĐÃ VIẾT ĐẦY ĐỦ / ĐÃ CÓ NỘI DUNG VÀ BẢNG BIỂU'
        else:
            status = '🟠 MỚI VIẾT DANG DỞ'
            
        print(f"\n{ch}")
        print(f"   -> Đánh giá: {status}")
        print(f"   -> Đoạn văn: {len(data['paras'])} | Số từ: ~{words} | Số bảng biểu (Tables): {tbl_count}")
        if h2_count > 0:
            print(f"   -> Các mục con H2 ({h2_count}): {', '.join(data['h2'][:4])}")
        if tbl_count > 0:
            print(f"   -> Bảng biểu ({tbl_count}):")
            for t in data['tables'][:3]:
                print(f"       * [{t[0]}]: {t[1][:70]}")

if __name__ == '__main__':
    detailed_chapter_audit('BAO_CAO_SRS_DRIVESHARE_K4_PRO_V2_1_fixed_final_v3 (1).docx')

