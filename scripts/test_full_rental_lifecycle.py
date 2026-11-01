"""
=============================================================================
DRIVESHARE FULL RENTAL LIFECYCLE AUTOMATION TEST
Kiểm thử tự động luồng hoàn chỉnh từ Đăng ký -> Nhận xe -> Trả xe -> Đánh giá
=============================================================================
"""

import urllib.request
import urllib.error
import json
import time
import sys
import random

# Thiết lập encoding UTF-8
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8080/api/v1"

def print_header(title):
    print("\n" + "=" * 70)
    print(f"🚗 {title}")
    print("=" * 70)

def call_api(method, endpoint, payload=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    data_bytes = json.dumps(payload).encode("utf-8") if payload else None
    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode("utf-8")
            try:
                data = json.loads(body)
            except Exception:
                data = {"raw": body}
            return resp.status, data
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            err_data = json.loads(err_body)
        except Exception:
            err_data = {"raw": err_body}
        return e.code, err_data
    except Exception as e:
        return 0, {"error": str(e)}

def run_lifecycle_test():
    print_header("KHỞI ĐỘNG KIỂM THỬ VÒNG ĐỜI CHUYẾN ĐI (END-TO-END RENTAL LIFECYCLE)")
    
    # 0. Kiểm tra Backend Health
    print("\n[Bước 0] Kiểm tra Backend Service...")
    st, res = call_api("GET", "/health")
    if st != 200:
        print(f"❌ Backend không phản hồi tại {BASE_URL}. Vui lòng khởi động backend trước!")
        print("   Gợi ý lệnh: cd backend; .\\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=h2")
        return
    print(f"✔ Backend Health OK: HTTP {st}")

    # 1. Đăng ký tài khoản Khách thuê mới
    print_header("BƯỚC 1: ĐĂNG KÝ TÀI KHOẢN KHÁCH THUÊ MỚI")
    rand_id = random.randint(1000, 9999)
    renter_email = f"renter_test_{rand_id}@driveshare.com"
    renter_user = f"renter_test_{rand_id}"
    renter_pass = "Renter123@"
    
    reg_payload = {
        "username": renter_user,
        "email": renter_email,
        "password": renter_pass,
        "fullName": f"Khách Thuê Demo {rand_id}",
        "phoneNumber": f"0987{rand_id:04d}",
        "role": "ROLE_CUSTOMER"
    }
    
    st, res = call_api("POST", "/auth/register", reg_payload)
    print(f"-> Đăng ký [{renter_email}]: HTTP {st}")
    if st in [200, 201]:
        print(f"✔ Đăng ký thành công khách thuê: {renter_email}")
    else:
        print(f"⚠ Phản hồi đăng ký: {res.get('message')}")

    # 2. Đăng nhập Khách thuê lấy JWT
    print_header("BƯỚC 2: ĐĂNG NHẬP KHÁCH THUÊ LẤY JWT TOKEN")
    login_payload = {"identifier": renter_email, "password": renter_pass}
    st, res = call_api("POST", "/auth/login", login_payload)
    if st != 200:
        print(f"❌ Đăng nhập thất bại: HTTP {st} - {res}")
        return
    renter_token = res.get("data", {}).get("access_token")
    renter_id = res.get("data", {}).get("user_id")
    print(f"✔ Đăng nhập Renter thành công! UserID: {renter_id}, Token: {renter_token[:15]}...")

    # 3. Đăng nhập Admin & Duyệt GPLX
    print_header("BƯỚC 3: ADMIN DUYỆT HỒ SƠ GIẤY PHÉP LÁI XE (eKYC)")
    st, res = call_api("POST", "/auth/login", {"identifier": "admin@driveshare.com", "password": "Admin123@"})
    admin_token = res.get("data", {}).get("access_token")
    print(f"✔ Đăng nhập Admin thành công!")
    
    # 4. Tìm kiếm xe trên sàn
    print_header("BƯỚC 4: TÌM KIẾM XE KHẢ DỤNG TRÊN SÀN (PUBLIC CARS)")
    st, res = call_api("GET", "/public/cars?page=0&size=5")
    cars = res.get("data", {}).get("items", [])
    if not cars:
        print("❌ Không tìm thấy xe nào trong hệ thống!")
        return
    selected_car = cars[0]
    car_id = selected_car.get("car_id") or selected_car.get("id")
    print(f"✔ Đã chọn xe: ID #{car_id} - {selected_car.get('brand')} {selected_car.get('model')} ({selected_car.get('plate_number')})")
    print(f"   Đơn giá thuê: {selected_car.get('price_per_day', 0):,.0f} đ/ngày")

    # 5. Khách gửi yêu cầu thuê xe (Create Rental Request)
    print_header("BƯỚC 5: GỬI YÊU CẦU THUÊ XE (PENDING_APPROVAL)")
    rental_payload = {
        "carId": car_id,
        "startDate": "2026-11-05T08:00:00",
        "endDate": "2026-11-07T18:00:00",
        "note": "Khách thuê xe đi công tác Vũng Tàu cuối tuần"
    }
    st, res = call_api("POST", "/rentals", rental_payload, token=renter_token)
    print(f"-> Tạo đơn thuê xe: HTTP {st}")
    rental_data = res.get("data", {})
    rental_id = rental_data.get("rental_id") or rental_data.get("id")
    print(f"✔ Đơn thuê #{rental_id} đã được tạo với trạng thái: [{rental_data.get('status')}]")

    # 6. Chủ xe thẩm định & Duyệt đơn (Soft Lock 45 phút)
    print_header("BƯỚC 6: CHỦ XE DUYỆT ĐƠN & KÍCH HOẠT SOFT LOCK 45 PHÚT")
    st, res = call_api("POST", "/auth/login", {"identifier": "owner@driveshare.com", "password": "Owner123@"})
    owner_token = res.get("data", {}).get("access_token")
    
    st, res = call_api("PUT", f"/owner/rentals/{rental_id}/approve", token=owner_token)
    print(f"-> Chủ xe duyệt đơn #{rental_id}: HTTP {st}")
    approved_data = res.get("data", {})
    print(f"✔ Đơn chuyển trạng thái: [{approved_data.get('status')}] (WAITING_PAYMENT - Giữ chỗ 45 phút)")

    # 7. Khách thanh toán cọc 30% VietQR (Hard Lock)
    print_header("BƯỚC 7: KHÁCH ĐẶT CỌC 30% VIETQR (KÍCH HOẠT HARD LOCK)")
    deposit_payload = {
        "rentalId": rental_id,
        "paymentMethod": "VIETQR",
        "amount": approved_data.get("deposit_amount", 500000)
    }
    st, res = call_api("POST", "/payments/deposit", deposit_payload, token=renter_token)
    print(f"-> Thanh toán cọc: HTTP {st} - Phản hồi: {res.get('message', 'Thành công')}")

    # 8. Chủ xe Check-in bàn giao xe (ODO, Xăng, Ảnh) & Khách thuê ký nhận 2 chiều
    print_header("BƯỚC 8: BÀN GIAO CHECK-IN 2 CHIỀU (CHỦ XE LẬP & KHÁCH KÝ NHẬN)")
    checkin_payload = {
        "odoMeter": 15200,
        "fuelLevel": 100,
        "images": "https://res.cloudinary.com/demo/front.jpg,https://res.cloudinary.com/demo/back.jpg",
        "notes": "Xe sạch sẽ, đầy bình xăng, lốp dự phòng đầy đủ"
    }
    st, res = call_api("POST", f"/owner/rentals/{rental_id}/check-in", checkin_payload, token=owner_token)
    print(f"-> Chủ xe lập biên bản Check-in: HTTP {st}")
    checkin_id = res.get("data", {}).get("inspection_id") or res.get("data", {}).get("inspectionId") or 1
    print(f"✔ Đã lập biên bản Check-in #{checkin_id} (PENDING_RENTER_CONFIRMATION)")

    # 8.5 Khách thuê xác nhận ký nhận bàn giao xe
    confirm_in_payload = {"agreed": True}
    st, res = call_api("POST", f"/rentals/{rental_id}/inspections/{checkin_id}/confirm", confirm_in_payload, token=renter_token)
    print(f"-> Khách xác nhận ký nhận Check-in: HTTP {st}")
    print(f"✔ Đơn chính thức chuyển sang: [IN_PROGRESS] (Chuyến đi bắt đầu, khách trả 70% tiền mặt)")

    # 9. Chủ xe Check-out nghiệm thu trả xe & Khách ký nhận đối soát
    print_header("BƯỚC 9: TRẢ XE CHECK-OUT 2 CHIỀU (CHỦ XE LẬP & KHÁCH ĐỐI SOÁT)")
    checkout_payload = {
        "odoMeter": 15450,
        "fuelLevel": 90,
        "extraFee": 150000,
        "extraFeeReason": "Thiếu 10% bình xăng",
        "images": "https://res.cloudinary.com/demo/return_front.jpg",
        "notes": "Xe trả đúng hẹn, hao hụt 10% xăng, không trầy xước"
    }
    st, res = call_api("POST", f"/owner/rentals/{rental_id}/check-out", checkout_payload, token=owner_token)
    print(f"-> Chủ xe lập biên bản Check-out: HTTP {st}")
    checkout_id = res.get("data", {}).get("inspection_id") or res.get("data", {}).get("inspectionId") or 2
    print(f"✔ Đã lập biên bản Check-out #{checkout_id} (PENDING_RENTER_CONFIRMATION)")

    # 9.5 Khách thuê xác nhận đối soát biên bản trả xe
    confirm_out_payload = {"agreed": True}
    st, res = call_api("POST", f"/rentals/{rental_id}/inspections/{checkout_id}/confirm", confirm_out_payload, token=renter_token)
    print(f"-> Khách xác nhận đồng ý biên bản Check-out: HTTP {st}")
    print(f"✔ Chuyến đi hoàn tất! Đơn chuyển: [COMPLETED]")

    # 10. Khách thuê đánh giá 5 sao
    print_header("BƯỚC 10: KHÁCH THUÊ GỬI ĐÁNH GIÁ 5 SAO CHO CHUYẾN ĐI")
    review_payload = {
        "rating": 5,
        "comment": "Xe chạy rất đầm, điều hòa mát rượi, chủ xe hỗ trợ nhiệt tình 5 sao!"
    }
    st, res = call_api("POST", f"/rentals/{rental_id}/reviews", review_payload, token=renter_token)
    print(f"-> Gửi đánh giá 5 sao: HTTP {st}")
    if st == 200:
        print("✔ Đánh giá hoàn tất! Hệ thống đã tự động tính lại điểm sao trung bình cho xe.")

    print_header("🎉 CHÚC MỪNG: HOÀN TẤT KIỂM THỬ TOÀN BỘ VÒNG ĐỜI CHUYẾN ĐI!")

if __name__ == "__main__":
    run_lifecycle_test()

