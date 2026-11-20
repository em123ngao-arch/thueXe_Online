import urllib.request
import json
import sys

# Ensure UTF-8
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

base_url = 'https://driveshare-backend-frug.onrender.com/api/v1'

# 1. Login Admin
login_data = json.dumps({'identifier': 'admin@driveshare.com', 'password': 'Admin123@'}).encode('utf-8')
req = urllib.request.Request(f'{base_url}/auth/login', data=login_data, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req, timeout=15) as resp:
    token = json.loads(resp.read().decode('utf-8'))['data']['access_token']

with open('docs/render_live_data.txt', 'w', encoding='utf-8') as f:
    f.write('=================================================================\n')
    f.write('DỮ LIỆU THỰC TẾ TRÊN CƠ SỞ DỮ LIỆU CLOUD RENDER (driveshare-db)\n')
    f.write('Host: driveshare-backend-frug.onrender.com\n')
    f.write('Database: driveshare_db (PostgreSQL 16 Singapore)\n')
    f.write('=================================================================\n\n')

    # 2. Users
    req_users = urllib.request.Request(f'{base_url}/admin/users?page=0&size=50', headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(req_users, timeout=15) as resp:
        users = json.loads(resp.read().decode('utf-8'))['data']['items']
        f.write(f'--- BẢNG 1: USERS ({len(users)} NGƯỜI DÙNG ĐÃ TẠO) ---\n')
        for u in users:
            f.write(f"• ID: {u.get('user_id')} | Họ tên: {u.get('full_name')} | Email: {u.get('email')} | SĐT: {u.get('phone')} | Vai trò: {u.get('roles')} | Trạng thái: {u.get('status')} | CCCD: {u.get('id_card_number')}\n")

    # 3. Cars
    req_cars = urllib.request.Request(f'{base_url}/public/cars?page=0&size=50')
    with urllib.request.urlopen(req_cars, timeout=15) as resp:
        cars = json.loads(resp.read().decode('utf-8'))['data']['items']
        f.write(f'\n--- BẢNG 2: CARS ({len(cars)} CHIẾC XE ĐANG CÓ TRÊN SÀN) ---\n')
        for c in cars:
            price = c.get('price_per_day', 0)
            f.write(f"• Xe ID: {c.get('car_id')} | {c.get('brand')} {c.get('model')} ({c.get('year')}) | Biển số: {c.get('plate_number')} | Giá: {price:,.0f} đ/ngày | {c.get('seats')} chỗ | Hộp số: {c.get('transmission')} | Nhiên liệu: {c.get('fuel_type')} | Địa chỉ: {c.get('address')} | Status: {c.get('status')}\n")

    # 4. Rentals
    req_rentals = urllib.request.Request(f'{base_url}/admin/rentals', headers={'Authorization': f'Bearer {token}'})
    try:
        with urllib.request.urlopen(req_rentals, timeout=15) as resp:
            rentals_raw = json.loads(resp.read().decode('utf-8'))
            rentals = rentals_raw.get('data') if isinstance(rentals_raw, dict) else rentals_raw
            if isinstance(rentals, dict):
                rentals = rentals.get('items', [])
            f.write(f'\n--- BẢNG 3: RENTALS ({len(rentals)} ĐƠN THUÊ XE) ---\n')
            for r in rentals:
                t_price = r.get('total_price', 0)
                dep = r.get('deposit_amount', 0)
                f.write(f"• Đơn ID: {r.get('rental_id')} | Xe ID: {r.get('car_id')} | Khách ID: {r.get('renter_id')} | Thời gian: {r.get('start_date')} -> {r.get('end_date')} | Tổng tiền: {t_price:,.0f} đ | Tiền cọc 30%: {dep:,.0f} đ | Trạng thái: {r.get('status')}\n")
    except Exception as e:
        f.write(f'\n--- BẢNG 3: RENTALS ---\nLỗi hoặc chưa có đơn: {e}\n')

print('SUCCESS: Live data extracted to docs/render_live_data.txt')

