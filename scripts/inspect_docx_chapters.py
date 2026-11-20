# -*- coding: utf-8 -*-
import docx
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')


def analyze_doc(filepath, label):
    print(f"\n=======================================================")
    print(f"PHÂN TÍCH FILE: {label} ({filepath})")
    print(f"=======================================================")
    doc = docx.Document(filepath)
    print(f"Tổng số Paragraphs: {len(doc.paragraphs)}")
    print(f"Tổng số Tables: {len(doc.tables)}")

    # Map content between Heading 1
    chapters = []
    current_chapter = {"title": "TRƯỚC CHƯƠNG 1 (BÌA, MỤC LỤC, CHANGE LOG)", "paragraphs": [], "tables": 0, "subheadings": []}

    # Note: python-docx doesn't store tables inside paragraphs, they are in body elements.
    # But we can inspect paragraphs and their styles
    for p in doc.paragraphs:
        t = p.text.strip()
        if not t:
            continue
        if p.style.name == 'Heading 1' or (t.startswith('CHƯƠNG ') and len(t) < 80) or t.startswith('PHỤ LỤC'):
            chapters.append(current_chapter)
            current_chapter = {"title": t, "paragraphs": [], "tables": 0, "subheadings": []}
        else:
            current_chapter["paragraphs"].append(t)
            if p.style.name.startswith('Heading'):
                current_chapter["subheadings"].append((p.style.name, t))
    chapters.append(current_chapter)

    for i, ch in enumerate(chapters):
        word_count = sum(len(text.split()) for text in ch["paragraphs"])
        print(f"\n[{i}] {ch['title']}")
        print(f"    - Số đoạn văn: {len(ch['paragraphs'])} | Số từ: {word_count}")
        print(f"    - Số tiêu đề phụ (H2, H3): {len(ch['subheadings'])}")
        for sh in ch['subheadings']:
            print(f"        * ({sh[0]}): {sh[1]}")
        # print sample text if very short
        if word_count < 100 and len(ch['paragraphs']) > 0:
            print(f"        [NỘI DUNG NGẮN]: {' '.join(ch['paragraphs'])[:200]}")
        elif len(ch['paragraphs']) == 0:
            print(f"        [CẢNH BÁO: CHƯƠNG RỖNG - KHÔNG CÓ NỘI DUNG PARAGRAPH!]")

if __name__ == '__main__':
    analyze_doc('docs/Doc_ITC.docx', 'DOC_ITC.docx (Chuẩn mẫu ITC)')
    analyze_doc('BAO_CAO_SRS_DRIVESHARE_K4_PRO_V2_1_fixed_final_v3 (1).docx', 'BÁO CÁO HIỆN TẠI')
