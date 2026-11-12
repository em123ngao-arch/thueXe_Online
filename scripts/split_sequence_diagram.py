import os
import subprocess
import re
from PIL import Image

def main():
    svg_file = os.path.abspath('docs/diagrams/04_sequence_booking_and_deposit.svg')
    with open(svg_file, 'r', encoding='utf-8') as f:
        svg_content = f.read()

    print(f"SVG loaded, length: {len(svg_content)} chars")

    # Tạo HTML render SVG kích thước gốc
    html_file = os.path.abspath('docs/diagrams/render_temp.html')
    full_png = os.path.abspath('docs/diagrams/full_seq_7327.png')

    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(f'''<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{ background: #ffffff; width: 3274px; height: 7328px; overflow: hidden; }}
    svg {{ display: block; width: 3273px; height: 7327px; }}
  </style>
</head>
<body>
{svg_content}
</body>
</html>''')

    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    if not os.path.exists(chrome_path):
        chrome_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

    print(f"Using browser: {chrome_path}")
    cmd = [
        chrome_path,
        "--headless",
        "--disable-gpu",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        "--window-size=3274,7328",
        f"--screenshot={full_png}",
        f"file:///{html_file.replace(os.sep, '/')}"
    ]

    subprocess.run(cmd, check=True)

    if not os.path.exists(full_png):
        print("ERROR: Failed to render full PNG")
        return

    print(f"Full PNG generated: {os.path.getsize(full_png)} bytes")

    # Bây giờ xử lý crop bằng PIL
    im = Image.open(full_png)
    w, h = im.size
    print(f"Image opened: {w} x {h}")

    # Tìm chính xác vị trí phân cách:
    # Header Actor kết thúc ở đâu?
    # Trong SVG: text '1. KHÁCH THUÊ GỬI YÊU CẦU ĐẶT XE MỚI' có y = 443.34
    # Divider line trước section 1 nằm ở khoảng y = 405 - 415.
    header_crop_y = 412

    # Section 3: '3. KHÁCH THUÊ THANH TOÁN TIỀN CỌC 30% QUA VIETQR' có y = 4211.212
    # Divider line trước section 3 nằm ở khoảng y = 4175 - 4185.
    split_y = 4178

    header_img = im.crop((0, 0, w, header_crop_y))

    # NỬA 1 (BÊN TRÁI): Từ 0 đến split_y
    part1_img = im.crop((0, 0, w, split_y))
    part1_path = os.path.abspath('docs/diagrams/04_seq_part1_soft_lock.png')
    part1_img.save(part1_path, 'PNG', optimize=True)
    print(f"Saved Part 1 (Left): {part1_img.size} -> {part1_path}")

    # NỬA 2 (BÊN PHẢI): Header + từ split_y đến hết
    bottom_crop = im.crop((0, split_y, w, h))
    part2_h = header_crop_y + bottom_crop.height
    part2_img = Image.new('RGB', (w, part2_h), (255, 255, 255))
    part2_img.paste(header_img, (0, 0))
    part2_img.paste(bottom_crop, (0, header_crop_y))

    part2_path = os.path.abspath('docs/diagrams/04_seq_part2_hard_lock.png')
    part2_img.save(part2_path, 'PNG', optimize=True)
    print(f"Saved Part 2 (Right): {part2_img.size} -> {part2_path}")

    # Dọn file tạm
    if os.path.exists(html_file):
        os.remove(html_file)
    if os.path.exists(full_png):
        os.remove(full_png)

    print("ALL DONE SUCCESSFULLY!")

if __name__ == '__main__':
    main()
