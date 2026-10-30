import subprocess
import os
import time

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
screenshots_dir = os.path.abspath("docs/screenshots")
os.makedirs(screenshots_dir, exist_ok=True)

targets = [
    # Public & Auth Views
    ("http://localhost:3000/index.html", "hex_01_homepage_live.png", 1280, 900, 3500),
    ("http://localhost:3000/login.html", "hex_02_login_live.png", 1280, 900, 2000),
    ("http://localhost:3000/payment.html", "hex_03_payment_live.png", 1280, 900, 2500),
    
    # Authenticated Portals (via auth_helper)
    ("http://localhost:3000/auth_helper.html?role=OWNER&target=owner-cars.html", "hex_04_owner_cars_live.png", 1280, 900, 4500),
    ("http://localhost:3000/auth_helper.html?role=OWNER&target=owner-earnings.html", "hex_05_owner_earnings_live.png", 1280, 900, 4500),
    ("http://localhost:3000/auth_helper.html?role=ADMIN&target=admin.html", "hex_06_admin_portal_live.png", 1280, 900, 4500),
    ("http://localhost:3000/auth_helper.html?role=RENTER&target=profile.html", "hex_07_renter_profile_live.png", 1280, 900, 4500),
    
    # Mobile Responsive Views
    ("http://localhost:3000/index.html", "hex_08_mobile_home.png", 390, 844, 3000),
    ("http://localhost:3000/login.html", "hex_09_mobile_login.png", 390, 844, 2000),
    ("http://localhost:3000/auth_helper.html?role=ADMIN&target=admin.html", "hex_10_mobile_admin.png", 420, 844, 4500),
    ("http://localhost:3000/auth_helper.html?role=OWNER&target=owner-cars.html", "hex_11_mobile_owner.png", 390, 844, 4500),
]

for url, filename, w, h, budget in targets:
    out_path = os.path.join(screenshots_dir, filename)
    cmd = [
        edge_path,
        "--headless",
        "--disable-gpu",
        "--hide-scrollbars",
        f"--window-size={w},{h}",
        f"--virtual-time-budget={budget}",
        f"--screenshot={out_path}",
        url
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    size = os.path.getsize(out_path) if os.path.exists(out_path) else 0
    print(f"Captured {filename} ({w}x{h}): {size} bytes (code {res.returncode})")
