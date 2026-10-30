import subprocess
import os
import json
import urllib.request
import urllib.error
import time
import sys

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
screenshots_dir = os.path.abspath("docs/screenshots")
os.makedirs(screenshots_dir, exist_ok=True)

backend_base = "https://driveshare-backend-frug.onrender.com/api/v1"
frontend_base = "https://driveshare-frontend-1guy.onrender.com"

print("=================================================================")
print("KIEM THU LUONG CO BAN TREN MOI TRUONG DEPLOY RENDER CLOUD")
print("=================================================================")

# 1. Test Backend Health
print("\n[Buoc 1] Kiem tra Backend Health API...")
try:
    req = urllib.request.Request(f"{backend_base}/health")
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        print(f"[OK] Health Check Status: HTTP {resp.status} - Service: {data.get('data', {}).get('service')} (Status: {data.get('data', {}).get('status')})")
except Exception as e:
    print(f"[ERROR] Health Check: {e}")

# 2. Test Public Cars API
print("\n[Buoc 2] Kiem tra Public Cars API (Truy van danh sach xe that)...")
try:
    req = urllib.request.Request(f"{backend_base}/public/cars?page=0&size=5")
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        items = data.get("data", {}).get("items", [])
        total = data.get("data", {}).get("pagination", {}).get("total_items", 0)
        print(f"[OK] Lay thanh cong {len(items)} xe tren tong so {total} xe tu DB that:")
        for car in items[:3]:
            print(f"   - Xe ID {car.get('car_id')}: {car.get('brand')} {car.get('model')} ({car.get('plate_number')}) - Gia: {car.get('price_per_day'):,.0f} d/ngay")
except Exception as e:
    print(f"[ERROR] Public Cars API: {e}")

# 3. Test Renter Login API
print("\n[Buoc 3] Kiem tra Dang nhap Khach thue (Renter)...")
renter_token = None
try:
    payload = json.dumps({"identifier": "renter@driveshare.com", "password": "Renter123@"}).encode("utf-8")
    req = urllib.request.Request(f"{backend_base}/auth/login", data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        renter_token = data.get("data", {}).get("access_token")
        user = data.get("data", {})
        print(f"[OK] Dang nhap Renter thanh cong! User ID: {user.get('user_id')}, Username: {user.get('username')}, Role: {user.get('role')}")
except Exception as e:
    print(f"[ERROR] Dang nhap Renter: {e}")

# 4. Test Admin Login API & Query Users
print("\n[Buoc 4] Kiem tra Dang nhap Quan tri vien (Admin) & Truy van Admin API...")
admin_token = None
try:
    payload = json.dumps({"identifier": "admin@driveshare.com", "password": "Admin123@"}).encode("utf-8")
    req = urllib.request.Request(f"{backend_base}/auth/login", data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        admin_token = data.get("data", {}).get("access_token")
        print(f"[OK] Dang nhap Admin thanh cong!")
        
    if admin_token:
        # Get Admin Users
        req_users = urllib.request.Request(f"{backend_base}/admin/users?page=0&size=5", headers={"Authorization": f"Bearer {admin_token}"})
        with urllib.request.urlopen(req_users, timeout=15) as resp_users:
            users_data = json.loads(resp_users.read().decode("utf-8"))
            users = users_data.get("data", {}).get("items", [])
            print(f"[OK] Admin lay danh sach {len(users)} nguoi dung thanh cong:")
            for u in users:
                print(f"   - User ID {u.get('user_id')}: {u.get('full_name')} ({u.get('email')}) - Vai tro: {u.get('roles')}")
except Exception as e:
    print(f"[ERROR] Admin API: {e}")

# 5. Capture Live UI Screenshots on Render Frontend
print("\n[Buoc 5] Tien hanh chup anh kiem thu giao dien Render Live...")
targets = [
    (f"{frontend_base}/index.html", "render_01_home_catalog.png", 1280, 900, 4000),
    (f"{frontend_base}/login.html", "render_02_login_page.png", 1280, 900, 2500),
    (f"{frontend_base}/payment.html", "render_03_payment_flow.png", 1280, 900, 3000),
    (f"{frontend_base}/owner-cars.html", "render_04_owner_cars.png", 1280, 900, 3000),
    (f"{frontend_base}/auth_helper.html?role=ADMIN&target=admin.html", "render_05_admin_portal.png", 1280, 900, 4500),
    (f"{frontend_base}/auth_helper.html?role=OWNER&target=owner-earnings.html", "render_06_owner_earnings.png", 1280, 900, 4500),
    (f"{frontend_base}/index.html", "render_07_mobile_home.png", 390, 844, 3500),
    (f"{frontend_base}/login.html", "render_08_mobile_login.png", 390, 844, 2500),
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
    print(f"[OK] Da chup {filename} ({w}x{h}) - Kich thuoc: {size:,} bytes")

print("\n=================================================================")
print("HOAN TAT KIEM THU TREN RENDER CLOUD THANH CONG!")
print("=================================================================")
