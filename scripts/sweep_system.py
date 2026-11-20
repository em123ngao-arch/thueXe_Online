import urllib.request
import urllib.error
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')
base = 'https://driveshare-backend-frug.onrender.com/api/v1'

def check(url, method='GET', data=None, token=None):
    try:
        req = urllib.request.Request(url, method=method)
        if data:
            req.data = json.dumps(data).encode('utf-8')
            req.add_header('Content-Type', 'application/json')
        if token:
            req.add_header('Authorization', f'Bearer {token}')
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status, json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, body
    except Exception as e:
        return 0, str(e)

print("=== 1. KIEM TRA HEALTH ===")
s, d = check(f'{base}/health')
print("Health:", s, d.get('data', {}).get('status') if isinstance(d, dict) else d)

print("\n=== 2. KIEM TRA PUBLIC CARS ===")
s, d = check(f'{base}/public/cars?page=0&size=5')
if s == 200:
    items = d.get('data', {}).get('items', [])
    total = d.get('data', {}).get('pagination', {}).get('total_items', 0)
    print(f"Lay duoc {len(items)} / {total} xe:")
    for car in items[:3]:
        print(f"  * Car #{car.get('car_id')}: {car.get('brand')} {car.get('model')} - {car.get('price_per_day'):,.0f} VND/ngay (Status: {car.get('status')})")
else:
    print("Error:", s, d)

print("\n=== 3. KIEM TRA AUTH CHO 3 VAI TRO ===")
tokens = {}
for role, email, pwd in [
    ('Renter', 'renter@driveshare.com', 'Renter123@'),
    ('Owner', 'owner@driveshare.com', 'Owner123@'),
    ('Admin', 'admin@driveshare.com', 'Admin123@')
]:
    s, d = check(f'{base}/auth/login', 'POST', {'identifier': email, 'password': pwd})
    if s == 200:
        token = d.get('data', {}).get('access_token')
        tokens[role] = token
        user = d.get('data', {})
        print(f"[OK] {role}: ID={user.get('user_id')}, Username={user.get('username')}, Role={user.get('role')}")
    else:
        print(f"[FAIL] {role}: Status {s}, Error={d}")

print("\n=== 4. KIEM TRA CAC PORTAL DONG VAI TRO ===")
if 'Renter' in tokens:
    s, d = check(f'{base}/rentals/me?page=0&size=5', token=tokens['Renter'])
    rentals = d.get('data', {}).get('items', []) if isinstance(d, dict) and isinstance(d.get('data'), dict) else (d.get('data', []) if isinstance(d, dict) else [])
    print(f"Renter Bookings (/rentals/me): HTTP {s}, Co {len(rentals)} don thue")
    for r in rentals[:3]:
        print(f"  * Booking #{r.get('rental_id')}: Car #{r.get('car_id')} | Status: {r.get('status')} | {r.get('start_date')} -> {r.get('end_date')}")

if 'Owner' in tokens:
    s, d = check(f'{base}/cars/my-cars', token=tokens['Owner'])
    cars = d.get('data', []) if isinstance(d, dict) and isinstance(d.get('data'), list) else []
    print(f"Owner Cars (/cars/my-cars): HTTP {s}, Co {len(cars)} xe cua Owner")
    for c in cars[:3]:
        print(f"  * Car #{c.get('car_id')}: {c.get('brand')} {c.get('model')} | Status: {c.get('status')}")

    s, d = check(f'{base}/owner/rentals', token=tokens['Owner'])
    rentals = d.get('data', []) if isinstance(d, dict) and isinstance(d.get('data'), list) else (d.get('data', {}).get('items', []) if isinstance(d, dict) and isinstance(d.get('data'), dict) else [])
    print(f"Owner Incoming Rentals (/owner/rentals): HTTP {s}, Co {len(rentals)} yeu cau thue xe")

if 'Admin' in tokens:
    s, d = check(f'{base}/admin/rentals/disputes', token=tokens['Admin'])
    disputes = d.get('data', []) if isinstance(d, dict) and isinstance(d.get('data'), list) else (d.get('data', {}).get('items', []) if isinstance(d, dict) and isinstance(d.get('data'), dict) else [])
    print(f"Admin Disputes (/admin/rentals/disputes): HTTP {s}, Co {len(disputes)} tranh chap")

    s, d = check(f'{base}/admin/rentals/overdue', token=tokens['Admin'])
    overdues = d.get('data', []) if isinstance(d, dict) and isinstance(d.get('data'), list) else (d.get('data', {}).get('items', []) if isinstance(d, dict) and isinstance(d.get('data'), dict) else [])
    print(f"Admin Overdue (/admin/rentals/overdue): HTTP {s}, Co {len(overdues)} don qua han")

print("\n=== 5. KIEM TRA AI ASSISTANT CHATBOT ===")
s, d = check(f'{base}/ai/chat', 'POST', {'message': 'Tôi cần tìm xe 7 chỗ giá dưới 1 triệu ở TP.HCM'})
print(f"AI Chatbot Endpoint: HTTP {s}")
if s == 200:
    reply = d.get('data', {}).get('reply', '')
    print(f"AI Response snippet: {reply[:150]}...")
else:
    print(f"AI Chatbot Error: {s}, {d}")
