import subprocess
import os

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
screenshots_dir = os.path.abspath("docs/screenshots")

targets = [
    ("frontend/index.html", "mobile_renter_search.png", 390, 844),
    ("frontend/payment.html", "mobile_renter_payment.png", 390, 844),
    ("frontend/profile.html", "mobile_renter_profile.png", 390, 844),
    ("frontend/owner-cars.html", "mobile_owner_cars.png", 390, 844),
    ("frontend/owner-earnings.html", "mobile_owner_earnings.png", 390, 844),
    ("frontend/admin.html", "mobile_admin_dashboard.png", 420, 844),
]

for html_rel, img_name, w, h in targets:
    html_abs = os.path.abspath(html_rel)
    out_img = os.path.join(screenshots_dir, img_name)
    file_url = "file:///" + html_abs.replace("\\", "/")
    cmd = [
        edge_path,
        "--headless",
        "--disable-gpu",
        "--hide-scrollbars",
        f"--window-size={w},{h}",
        f"--screenshot={out_img}",
        file_url
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    size = os.path.getsize(out_img) if os.path.exists(out_img) else 0
    print(f"Captured {img_name}: {size} bytes (code {res.returncode})")

