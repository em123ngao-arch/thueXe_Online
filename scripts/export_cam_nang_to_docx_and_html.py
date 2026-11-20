import os
import re
import docx
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def create_docx(md_path, docx_path):
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    doc = docx.Document()
    
    # Page setup - Margins
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(0x22, 0x22, 0x22)

    in_code_block = False
    code_lines = []
    in_table = False
    table_lines = []

    def flush_table():
        nonlocal table_lines
        if not table_lines:
            return
        # Parse table lines
        rows_data = []
        for tl in table_lines:
            parts = [p.strip() for p in tl.strip().strip('|').split('|')]
            if all(set(p).issubset({'-', ':', ' '}) for p in parts if p):
                continue # delimiter row
            rows_data.append(parts)
        
        if rows_data:
            num_cols = max(len(r) for r in rows_data)
            # Normalize
            for r in rows_data:
                while len(r) < num_cols:
                    r.append('')
            
            table = doc.add_table(rows=len(rows_data), cols=num_cols)
            table.alignment = WD_TABLE_ALIGNMENT.CENTER
            table.autofit = True
            
            for row_idx, row_data in enumerate(rows_data):
                for col_idx, cell_value in enumerate(row_data):
                    cell = table.cell(row_idx, col_idx)
                    cell.text = cell_value
                    set_cell_margins(cell, 120, 120, 150, 150)
                    p = cell.paragraphs[0]
                    p.paragraph_format.space_before = Pt(2)
                    p.paragraph_format.space_after = Pt(2)
                    
                    if row_idx == 0:
                        set_cell_background(cell, "0B3C5D")
                        for run in p.runs:
                            run.font.bold = True
                            run.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
                            run.font.size = Pt(10)
                    else:
                        if row_idx % 2 == 1:
                            set_cell_background(cell, "F7F9FA")
                        for run in p.runs:
                            run.font.size = Pt(9.5)
            
            p_after = doc.add_paragraph()
            p_after.paragraph_format.space_after = Pt(6)

        table_lines = []

    def flush_code():
        nonlocal code_lines
        if not code_lines:
            return
        code_text = "".join(code_lines)
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.cell(0, 0)
        cell.text = code_text.strip('\n')
        set_cell_background(cell, "F4F5F7")
        set_cell_margins(cell, 140, 140, 200, 200)
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(4)
        for run in p.runs:
            run.font.name = 'Consolas'
            run.font.size = Pt(9.5)
            run.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)
        doc.add_paragraph()
        code_lines = []

    for line in lines:
        stripped = line.strip()

        # Check code block
        if stripped.startswith("```"):
            if in_code_block:
                in_code_block = False
                flush_code()
            else:
                if in_table:
                    in_table = False
                    flush_table()
                in_code_block = True
            continue

        if in_code_block:
            code_lines.append(line)
            continue

        # Check table
        if stripped.startswith("|") and stripped.endswith("|"):
            in_table = True
            table_lines.append(stripped)
            continue
        elif in_table:
            in_table = False
            flush_table()

        # Empty lines
        if not stripped:
            continue

        # Horizontal rule
        if stripped == "---":
            continue

        # Headings
        if stripped.startswith("# "):
            h = doc.add_heading(level=1)
            h.paragraph_format.space_before = Pt(14)
            h.paragraph_format.space_after = Pt(6)
            run = h.add_run(stripped[2:])
            run.font.bold = True
            run.font.size = Pt(18)
            run.font.color.rgb = RGBColor(0x0A, 0x36, 0x63)
        elif stripped.startswith("## "):
            h = doc.add_heading(level=2)
            h.paragraph_format.space_before = Pt(12)
            h.paragraph_format.space_after = Pt(4)
            run = h.add_run(stripped[3:])
            run.font.bold = True
            run.font.size = Pt(14)
            run.font.color.rgb = RGBColor(0x1B, 0x49, 0x65)
        elif stripped.startswith("### "):
            h = doc.add_heading(level=3)
            h.paragraph_format.space_before = Pt(10)
            h.paragraph_format.space_after = Pt(3)
            run = h.add_run(stripped[4:])
            run.font.bold = True
            run.font.size = Pt(12)
            run.font.color.rgb = RGBColor(0x2B, 0x5C, 0x8F)
        elif stripped.startswith("#### "):
            h = doc.add_heading(level=4)
            h.paragraph_format.space_before = Pt(8)
            h.paragraph_format.space_after = Pt(2)
            run = h.add_run(stripped[5:])
            run.font.bold = True
            run.font.size = Pt(11)
            run.font.color.rgb = RGBColor(0x9E, 0x2A, 0x2B)
        elif stripped.startswith("> "):
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.3)
            p.paragraph_format.space_after = Pt(4)
            run = p.add_run(stripped[2:])
            run.font.italic = True
            run.font.color.rgb = RGBColor(0x55, 0x55, 0x55)
        elif stripped.startswith("* ") or stripped.startswith("- "):
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.space_after = Pt(3)
            p.add_run(stripped[2:])
        else:
            p = doc.add_paragraph()
            p.paragraph_format.space_after = Pt(4)
            p.add_run(stripped)

    if in_table:
        flush_table()
    if in_code_block:
        flush_code()

    doc.save(docx_path)
    print(f"DOCX created successfully at: {docx_path}")

def create_html(md_path, html_path):
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Escape HTML special chars inside code blocks first
    def code_repl(m):
        code = m.group(2)
        code = code.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        return f'<pre><code class="{m.group(1)}">{code}</code></pre>'

    content = re.sub(r'```(\w*)\n(.*?)```', code_repl, content, flags=re.DOTALL)

    # Basic markdown parsing
    html_lines = []
    lines = content.split('\n')
    in_table = False
    table_rows = []

    def flush_html_table():
        nonlocal table_rows
        if not table_rows:
            return ""
        out = "<div class='table-container'><table>\n"
        for idx, r in enumerate(table_rows):
            parts = [p.strip() for p in r.strip().strip('|').split('|')]
            if all(set(p).issubset({'-', ':', ' '}) for p in parts if p):
                continue
            out += "  <tr>\n"
            for c in parts:
                tag = "th" if idx == 0 else "td"
                out += f"    <{tag}>{c}</{tag}>\n"
            out += "  </tr>\n"
        out += "</table></div>\n"
        table_rows = []
        return out

    for line in lines:
        s = line.strip()
        if s.startswith("|") and s.endswith("|"):
            in_table = True
            table_rows.append(s)
            continue
        elif in_table:
            in_table = False
            html_lines.append(flush_html_table())

        if s.startswith("# "):
            html_lines.append(f"<h1>{s[2:]}</h1>")
        elif s.startswith("## "):
            html_lines.append(f"<h2>{s[3:]}</h2>")
        elif s.startswith("### "):
            html_lines.append(f"<h3>{s[4:]}</h3>")
        elif s.startswith("#### "):
            html_lines.append(f"<h4>{s[5:]}</h4>")
        elif s.startswith("> "):
            html_lines.append(f"<blockquote>{s[2:]}</blockquote>")
        elif s.startswith("---"):
            html_lines.append("<hr/>")
        elif s.startswith("* ") or s.startswith("- "):
            html_lines.append(f"<li>{s[2:]}</li>")
        elif s:
            # Inline formatting
            s = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', s)
            s = re.sub(r'`(.*?)`', r'<code>\1</code>', s)
            s = re.sub(r'\[(.*?)\]\((.*?)\)', r'<a href="\2" target="_blank">\1</a>', s)
            html_lines.append(f"<p>{s}</p>")

    if in_table:
        html_lines.append(flush_html_table())

    body_html = "\n".join(html_lines)

    full_html = f"""<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cẩm Nang Toàn Diện Bảo Vệ Đồ Án Tốt Nghiệp DriveShare K4</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background-color: #f8fafc;
            margin: 0;
            padding: 30px 15px;
        }}
        .container {{
            max-width: 960px;
            margin: 0 auto;
            background: #ffffff;
            padding: 40px 50px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.06);
            border: 1px solid #e2e8f0;
        }}
        h1 {{
            color: #0369a1;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 12px;
            font-size: 26px;
        }}
        h2 {{
            color: #0f172a;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 8px;
            margin-top: 32px;
            font-size: 20px;
        }}
        h3 {{ color: #0284c7; margin-top: 24px; font-size: 17px; }}
        h4 {{ color: #b91c1c; margin-top: 18px; font-size: 15px; }}
        blockquote {{
            border-left: 4px solid #0284c7;
            background: #f0f9ff;
            margin: 15px 0;
            padding: 12px 18px;
            border-radius: 0 8px 8px 0;
            color: #334155;
        }}
        pre {{
            background: #0f172a;
            color: #f8fafc;
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
            font-size: 13.5px;
            font-family: Consolas, Monaco, "Courier New", monospace;
        }}
        code {{
            background: #f1f5f9;
            color: #0f766e;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 13.5px;
            font-family: Consolas, Monaco, monospace;
        }}
        pre code {{
            background: none;
            color: inherit;
            padding: 0;
        }}
        .table-container {{
            overflow-x: auto;
            margin: 20px 0;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }}
        th, td {{
            border: 1px solid #cbd5e1;
            padding: 10px 14px;
            text-align: left;
        }}
        th {{
            background-color: #0284c7;
            color: #ffffff;
            font-weight: 600;
        }}
        tr:nth-child(even) {{
            background-color: #f8fafc;
        }}
        a {{
            color: #0284c7;
            text-decoration: none;
            font-weight: 500;
        }}
        a:hover {{
            text-decoration: underline;
        }}
        li {{
            margin-bottom: 6px;
        }}
        hr {{
            border: 0;
            height: 1px;
            background: #e2e8f0;
            margin: 30px 0;
        }}
        .print-btn {{
            position: fixed;
            bottom: 25px;
            right: 25px;
            background: #0284c7;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 30px;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
            cursor: pointer;
            transition: all 0.2s;
        }}
        .print-btn:hover {{
            background: #0369a1;
            transform: translateY(-2px);
        }}
        @media print {{
            .print-btn {{ display: none; }}
            body {{ background: white; padding: 0; }}
            .container {{ box-shadow: none; border: none; padding: 0; max-width: 100%; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        {body_html}
    </div>
    <button class="print-btn" onclick="window.print()">🖨️ In / Lưu file PDF</button>
</body>
</html>"""

    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(full_html)
    print(f"HTML created successfully at: {html_path}")

if __name__ == '__main__':
    md_file = "docs/CAM_NANG_TONG_HOP_BAO_VE_DO_AN_DRIVESHARE_K4.md"
    
    # 1. Export in docs/
    create_docx(md_file, "docs/CAM_NANG_TONG_HOP_BAO_VE_DO_AN_DRIVESHARE_K4.docx")
    create_html(md_file, "docs/CAM_NANG_TONG_HOP_BAO_VE_DO_AN_DRIVESHARE_K4.html")

    # 2. Export to Desktop
    desktop_dir = r"C:\Users\ADMIN\OneDrive\Desktop"
    if os.path.exists(desktop_dir):
        create_docx(md_file, os.path.join(desktop_dir, "CAM_NANG_TONG_HOP_BAO_VE_DO_AN_DRIVESHARE_K4.docx"))
        create_html(md_file, os.path.join(desktop_dir, "CAM_NANG_TONG_HOP_BAO_VE_DO_AN_DRIVESHARE_K4.html"))

    # 3. Export to Downloads
    downloads_dir = r"C:\Users\ADMIN\Downloads"
    if os.path.exists(downloads_dir):
        create_docx(md_file, os.path.join(downloads_dir, "CAM_NANG_TONG_HOP_BAO_VE_DO_AN_DRIVESHARE_K4.docx"))
        create_html(md_file, os.path.join(downloads_dir, "CAM_NANG_TONG_HOP_BAO_VE_DO_AN_DRIVESHARE_K4.html"))
