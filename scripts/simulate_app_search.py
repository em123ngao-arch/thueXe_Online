import sys, requests, json
sys.stdout.reconfigure(encoding='utf-8')

# Let's simulate EXACTLY what frontend app.js does:
# 1. User clicked "Tìm xe ngay" with:
# location = 'ALL' (or 'Toàn quốc')
# startDate = '2026-11-03'
# endDate = '2026-11-05'
# brand = 'ALL'
# seats = 'ALL'
# transmission = 'ALL'
# fuel = 'ALL'
# priceRange = 'ALL'
# sort = 'RECOMMENDED'

# In app.js:
# const params = { page: 0, size: 50 };
# if (this.currentFilters.city && this.currentFilters.city !== 'ALL') ... (NOT ADDED)
# if (this.currentFilters.brand && this.currentFilters.brand !== 'ALL') ... (NOT ADDED)
# if (this.currentFilters.startDate) params.startDate = '2026-11-03'
# if (this.currentFilters.endDate) params.endDate = '2026-11-05'

backend_url = 'https://driveshare-backend-frug.onrender.com/api/v1/public/cars/search?page=0&size=50&startDate=2026-11-03&endDate=2026-11-05'
print(f"Request URL: {backend_url}")
r = requests.get(backend_url)
print(f"Status: {r.status_code}")
data = r.json()
items = data.get('data', {}).get('items', [])
print(f"Items returned from API: {len(items)}")

# Now simulate client-side filtering:
filtered = list(items)

# 1. Seats filter: seats is 'ALL' -> no filter
# 2. Transmission: 'ALL' -> no filter
# 3. Fuel: 'ALL' -> no filter
# 4. Brand: 'ALL' -> no filter
# 5. City: 'ALL' -> no filter
# 6. Price: 'ALL' -> no filter

print(f"Items after client filtering: {len(filtered)}")
