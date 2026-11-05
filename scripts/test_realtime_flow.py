import urllib.request
import urllib.error
import json
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_URL = "http://localhost:8080/api/v1"

def request(endpoint, method="GET", data=None, token=None):
    url = f"{BASE_URL}/{endpoint.lstrip('/')}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8")
        try:
            return e.code, json.loads(raw)
        except:
            return e.code, {"error": raw}

def test_full_flow():
    print("=== TEST DRIVE SHARE REALTIME & STAY-ON-PAGE WORKFLOW ===")
    
    # 0. Clear DB
    print("[0] Clearing previous rentals...")
    status, res = request("/rentals/clear-all", "DELETE")
    print(f"Clear all status: {status}")

    # 1. Login Renter
    print("\n[1] Login Renter...")
    status, res = request("/auth/login", "POST", {"identifier": "renter@driveshare.com", "password": "Renter123@"})
    assert status == 200, f"Renter login failed: {res}"
    renter_token = res["data"]["access_token"]
    print("Renter logged in successfully.")

    # 2. Login Owner
    print("\n[2] Login Owner...")
    status, res = request("/auth/login", "POST", {"identifier": "owner@driveshare.com", "password": "Owner123@"})
    assert status == 200, f"Owner login failed: {res}"
    owner_token = res["data"]["access_token"]
    print("Owner logged in successfully.")

    # 3. Create Rental by Renter
    print("\n[3] Renter creates rental request for Car 1...")
    rental_payload = {
        "carId": 1,
        "startDate": "2026-11-10",
        "endDate": "2026-11-12",
        "pickupAddress": "123 Le Loi, Q1, TP.HCM",
        "note": "Test Realtime Sync & Stay On Page"
    }
    status, res = request("/rentals", "POST", rental_payload, renter_token)
    assert status == 200 or status == 201, f"Create rental failed: {res}"
    rental = res.get("data", res)
    rental_id = rental.get("rental_id") or rental.get("id") or rental.get("rentalId")
    print(f"Created rental #{rental_id}, status: {rental.get('status')}")

    # 4. Check Owner received notification in DB
    print("\n[4] Checking Owner notifications in DB...")
    status, res = request("/notifications/my-notifications", "GET", None, owner_token)
    assert status == 200, f"Get owner notifs failed: {res}"
    notifs = res.get("data", [])
    print(f"Owner has {len(notifs)} notification(s). Latest: {notifs[0]['title'] if notifs else 'None'}")
    assert any("thuê xe" in n.get("title", "").lower() or n.get("referenceId") == rental_id for n in notifs), "Owner did not receive rental notification"
    print("SUCCESS: Owner DB notification confirmed.")

    # 5. Owner Approves Rental
    print(f"\n[5] Owner approves rental #{rental_id}...")
    status, res = request(f"/owner/rentals/{rental_id}/approve", "PUT", None, owner_token)
    assert status == 200, f"Approve rental failed: {res}"
    print(f"Owner approved rental #{rental_id}. Status: {res.get('data', {}).get('status')}")

    # 6. Check Renter received RENTAL_APPROVED notification in DB
    print("\n[6] Checking Renter notifications in DB...")
    status, res = request("/notifications/my-notifications", "GET", None, renter_token)
    assert status == 200, f"Get renter notifs failed: {res}"
    renter_notifs = res.get("data", [])
    print(f"Renter has {len(renter_notifs)} notification(s). Latest: {renter_notifs[0]['title'] if renter_notifs else 'None'}")
    assert any("duyệt" in n.get("title", "").lower() or n.get("type") == "RENTAL_APPROVED" for n in renter_notifs), "Renter did not receive approval notification"
    print("SUCCESS: Renter DB notification RENTAL_APPROVED confirmed.")

    # 7. Check Renter's rental status
    print("\n[7] Checking Renter's rental status...")
    status, res = request("/rentals/me", "GET", None, renter_token)
    assert status == 200, f"Get my rentals failed: {res}"
    my_rentals = res.get("data", [])
    target = next((r for r in my_rentals if (r.get("rental_id") or r.get("id")) == rental_id), None)
    assert target is not None, "Rental not found in me list"
    assert target.get("status") in ["WAITING_PAYMENT", "APPROVED"], f"Wrong status: {target.get('status')}"
    print(f"SUCCESS: Rental #{rental_id} is in status: {target.get('status')} (Chờ đặt cọc 30%).")

    # 8. Create Deposit Payment
    print(f"\n[8] Renter initiates 30% VietQR payment for rental #{rental_id}...")
    status, res = request(f"/rentals/{rental_id}/payment", "POST", {}, renter_token)
    assert status in [200, 201], f"Create payment failed: {res}"
    payment = res.get("data", res)
    payment_id = payment.get("payment_id") or payment.get("id")
    print(f"SUCCESS: Payment #{payment_id} created with status {payment.get('status')} and amount {payment.get('deposit_amount')}")

    # 9. Confirm Payment (Simulate Bank transfer webhook/button)
    print(f"\n[9] Confirming payment #{payment_id}...")
    status, res = request(f"/payments/{payment_id}/confirm", "POST", {}, renter_token)
    assert status == 200, f"Confirm payment failed: {res}"
    print(f"SUCCESS: Payment #{payment_id} confirmed!")

    # 10. Check Renter's rental is now CONFIRMED
    status, res = request("/rentals/me", "GET", None, renter_token)
    my_rentals = res.get("data", [])
    target = next((r for r in my_rentals if (r.get("rental_id") or r.get("id")) == rental_id), None)
    assert target.get("status") in ["CONFIRMED", "DEPOSIT_PAID"], f"Wrong status after payment: {target.get('status')}"
    print(f"SUCCESS: Rental #{rental_id} status is now: {target.get('status')} (Đã chốt cọc 30%)!")

    print("\n>>> ALL 10 TEST STEPS PASSED PERFECTLY! <<<")

if __name__ == "__main__":
    test_full_flow()
