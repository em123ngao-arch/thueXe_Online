import os
from export_cam_nang_to_docx_and_html import create_docx, create_html

if __name__ == '__main__':
    md_file = "docs/CHUYEN_DE_LEAD_BAO_CSDL_VA_KIEN_TRUC.md"
    base_name = "CHUYEN_DE_LEAD_BAO_CSDL_VA_KIEN_TRUC"

    # 1. Export in docs/
    create_docx(md_file, f"docs/{base_name}.docx")
    create_html(md_file, f"docs/{base_name}.html")

    # 2. Export to Desktop
    desktop_dir = r"C:\Users\ADMIN\OneDrive\Desktop"
    if os.path.exists(desktop_dir):
        create_docx(md_file, os.path.join(desktop_dir, f"{base_name}.docx"))
        create_html(md_file, os.path.join(desktop_dir, f"{base_name}.html"))

    # 3. Export to Downloads
    downloads_dir = r"C:\Users\ADMIN\Downloads"
    if os.path.exists(downloads_dir):
        create_docx(md_file, os.path.join(downloads_dir, f"{base_name}.docx"))
        create_html(md_file, os.path.join(downloads_dir, f"{base_name}.html"))

    print("=== EXPORT COMPLETED FOR LEAD BAO ===")
