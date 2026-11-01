import urllib.request
import urllib.error
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

BACKEND_URL = "https://driveshare-backend-frug.onrender.com/api/v1"

def get_json(endpoint, token=None):
    url = f"{BACKEND_URL}{endpoint}"
    headers = {}
    if token:
        headers['Authorization'] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            return res.status, json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            return e.code, json.loads(body)
        except:
            return e.code, {"raw": body}
    except Exception as e:
        return 500, {"error": str(e)}

status, cars = get_json("/public/cars?page=0&size=10")
print(f"Cars count: {len(cars.get('data', {}).get('items', []))}")
for c in cars.get('data', {}).get('items', [])[:5]:
    print(f"Car #{c.get('car_id')}: {c.get('brand')} {c.get('model')} - Status: {c.get('status')} - Price: {c.get('price_per_day')}")
