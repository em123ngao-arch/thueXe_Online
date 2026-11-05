import os

# 1. Update storage.js
storage_path = r'C:\Users\ChiTin\Downloads\ThueXe\thueXe_Online\frontend\js\storage.js'
with open(storage_path, 'r', encoding='utf-8') as f:
    st = f.read()

st = st.replace("const cleanedFlag = 'driveshare_mock_cleaned_v3';", "const cleanedFlag = 'driveshare_mock_cleaned_v6';")
if 'clearAllBookings()' not in st:
    st = st.replace("getBookings() {", "clearAllBookings() {\n    try {\n      localStorage.removeItem(STORAGE_KEYS.BOOKINGS);\n      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify([]));\n    } catch (e) {}\n  },\n\n  getBookings() {")

with open(storage_path, 'w', encoding='utf-8') as f:
    f.write(st)
print("Updated storage.js")

# 2. Update owner.js
owner_path = r'C:\Users\ChiTin\Downloads\ThueXe\thueXe_Online\frontend\js\owner.js'
with open(owner_path, 'r', encoding='utf-8') as f:
    ow = f.read()

target_ow = '''    let ownerBookings = [];
    if (typeof RentalAPI !== 'undefined' && RentalAPI.getOwnerRentals && typeof AuthService !== 'undefined' && AuthService.isAuthenticated()) {
      try {
        const res = await RentalAPI.getOwnerRentals();
        if (res && (res.code === 200 || res.success) && Array.isArray(res.data)) {
          ownerBookings = res.data;
        }
      } catch (err) {
        console.warn('RentalAPI.getOwnerRentals fallback to local data:', err);
      }
    }

    if (ownerBookings.length === 0 && typeof StorageService !== 'undefined') {'''

repl_ow = '''    let ownerBookings = [];
    let serverSuccess = false;
    if (typeof RentalAPI !== 'undefined' && RentalAPI.getOwnerRentals && typeof AuthService !== 'undefined' && AuthService.isAuthenticated()) {
      try {
        const res = await RentalAPI.getOwnerRentals();
        if (res && (res.code === 200 || res.success) && Array.isArray(res.data)) {
          ownerBookings = res.data;
          serverSuccess = true;
        }
      } catch (err) {
        console.warn('RentalAPI.getOwnerRentals fallback to local data:', err);
      }
    }

    if (!serverSuccess && ownerBookings.length === 0 && typeof StorageService !== 'undefined') {'''

if target_ow in ow:
    ow = ow.replace(target_ow, repl_ow)
    with open(owner_path, 'w', encoding='utf-8') as f:
        f.write(ow)
    print("Updated owner.js")
else:
    print("Warning: target_ow not found in owner.js")

# 3. Update app.js
app_path = r'C:\Users\ChiTin\Downloads\ThueXe\thueXe_Online\frontend\js\app.js'
with open(app_path, 'r', encoding='utf-8') as f:
    ap = f.read()

target_ap = '''    let bookings = [];
    if (typeof RentalAPI !== 'undefined' && RentalAPI.getMyRentals && typeof AuthService !== 'undefined' && AuthService.isAuthenticated()) {
      try {
        const res = await RentalAPI.getMyRentals();
        if (res && (res.code === 200 || res.success) && Array.isArray(res.data)) {
          bookings = res.data;
        } else {
          bookings = StorageService.getBookings();
        }
      } catch (e) {
        console.warn('Lỗi khi tải đơn thuê từ server, sử dụng local storage:', e);
        bookings = StorageService.getBookings();
      }
    } else {
      bookings = StorageService.getBookings();
    }'''

repl_ap = '''    let bookings = [];
    let serverLoaded = false;
    if (typeof RentalAPI !== 'undefined' && RentalAPI.getMyRentals && typeof AuthService !== 'undefined' && AuthService.isAuthenticated()) {
      try {
        const res = await RentalAPI.getMyRentals();
        if (res && (res.code === 200 || res.success) && Array.isArray(res.data)) {
          bookings = res.data;
          serverLoaded = true;
        }
      } catch (e) {
        console.warn('Lỗi khi tải đơn thuê từ server, sử dụng local storage:', e);
      }
    }
    if (!serverLoaded && typeof StorageService !== 'undefined') {
      bookings = StorageService.getBookings();
    }'''

if target_ap in ap:
    ap = ap.replace(target_ap, repl_ap)
    with open(app_path, 'w', encoding='utf-8') as f:
        f.write(ap)
    print("Updated app.js")
else:
    print("Warning: target_ap not found in app.js")

# 4. Update api.js
api_path = r'C:\Users\ChiTin\Downloads\ThueXe\thueXe_Online\frontend\js\api.js'
with open(api_path, 'r', encoding='utf-8') as f:
    api = f.read()

if 'clearAllRentals()' not in api:
    api = api.replace("const RentalAPI = {", "const RentalAPI = {\n  clearAllRentals() {\n    return apiCall('/rentals/clear-all', 'DELETE');\n  },")
    with open(api_path, 'w', encoding='utf-8') as f:
        f.write(api)
    print("Updated api.js")

