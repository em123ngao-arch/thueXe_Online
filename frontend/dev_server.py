#!/usr/bin/env python3
"""
DriveShare Frontend QA Dev Server (Port 3000)
Supports serving static frontend assets + Mocking REST API endpoints for QA testing:
- POST /api/v1/rentals/{id}/report-no-show (Multipart FormData)
- GET /api/v1/rentals/me
- GET /api/v1/admin/users/pending-cccd
- PUT /api/v1/admin/users/{id}/verify-bank
- PUT /api/v1/admin/users/{id}/verify-cccd
- GET /api/v1/health
"""

import http.server
import socketserver
import json
import os
import re
import sys
from urllib.parse import urlparse, parse_qs

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

PORT = 3000
FRONTEND_DIR = os.path.dirname(os.path.abspath(__file__))

# In-memory QA Mock Database
def get_fresh_db():
    return {
        "rentals": [
        {
            "id": 101,
            "status": "CONFIRMED",
            "carId": 1,
            "carName": "Mazda 3 Luxury 2022",
            "carImage": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80",
            "licensePlate": "51G-888.99",
            "startDate": "2026-10-20T08:00:00",
            "endDate": "2026-10-22T20:00:00",
            "depositAmount": 600000,
            "totalAmount": 1800000,
            "remainingAmount": 1200000,
            "ownerName": "Nguyễn Văn Chủ Xe",
            "ownerPhone": "0901234567",
            "deliveryAddress": "123 Nguyễn Huệ, Quận 1, TP.HCM",
            "createdAt": "2026-10-18T10:00:00"
        },
        {
            "id": 102,
            "status": "DEPOSIT_PAID",
            "carId": 2,
            "carName": "Honda Civic RS 2023",
            "carImage": "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&q=80",
            "licensePlate": "51K-999.88",
            "startDate": "2026-10-25T09:00:00",
            "endDate": "2026-10-27T18:00:00",
            "depositAmount": 800000,
            "totalAmount": 2400000,
            "remainingAmount": 1600000,
            "ownerName": "Trần Thị Mai Chủ Xe",
            "ownerPhone": "0987654321",
            "deliveryAddress": "456 Lê Lợi, Quận 1, TP.HCM",
            "createdAt": "2026-10-18T11:00:00"
        },
        {
            "id": 103,
            "status": "IN_PROGRESS",
            "carId": 3,
            "carName": "VinFast VF8 Plus 2024",
            "carImage": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80",
            "licensePlate": "51L-777.66",
            "startDate": "2026-10-24T08:00:00",
            "endDate": "2026-10-28T20:00:00",
            "pricePerDay": 1200000,
            "depositAmount": 1440000,
            "totalAmount": 4800000,
            "remainingAmount": 3360000,
            "ownerName": "Lê Hoàng Long",
            "ownerPhone": "0912888999",
            "deliveryAddress": "88 Hàm Nghi, Quận 1, TP.HCM",
            "createdAt": "2026-10-22T09:00:00"
        },
        {
            "id": 104,
            "status": "OVERDUE",
            "carId": 4,
            "carName": "Toyota Camry 2.5Q 2023",
            "carImage": "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&q=80",
            "licensePlate": "51H-333.22",
            "startDate": "2026-10-20T07:00:00",
            "endDate": "2026-10-24T20:00:00",
            "pricePerDay": 1500000,
            "depositAmount": 1800000,
            "totalAmount": 6000000,
            "remainingAmount": 4200000,
            "overdueHours": 5,
            "penaltyFee": 468750,
            "ownerName": "Phạm Quốc Tuấn",
            "ownerPhone": "0903444555",
            "deliveryAddress": "200 Pasteur, Quận 3, TP.HCM",
            "createdAt": "2026-10-18T14:00:00"
        },
        {
            "id": 105,
            "status": "COMPLETED",
            "carId": 1,
            "carName": "Mazda 3 Luxury 2022",
            "carImage": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80",
            "licensePlate": "51G-888.99",
            "startDate": "2026-10-10T08:00:00",
            "endDate": "2026-10-12T18:00:00",
            "pricePerDay": 900000,
            "depositAmount": 540000,
            "totalAmount": 1800000,
            "remainingAmount": 1260000,
            "ownerName": "Nguyễn Văn Chủ Xe",
            "ownerPhone": "0901234567",
            "deliveryAddress": "123 Nguyễn Huệ, Quận 1, TP.HCM",
            "createdAt": "2026-10-08T10:00:00"
        }
    ],
    "pending_users": [
        {
            "id": 501,
            "fullName": "NGUYỄN VĂN AN",
            "email": "nguyenvanan@gmail.com",
            "phoneNumber": "0912345678",
            "cccdNumber": "079198001234",
            "cccdName": "NGUYỄN VĂN AN",
            "cccdFrontUrl": "assets/images/cars/car-1.jpg",
            "cccdBackUrl": "assets/images/cars/car-2.jpg",
            "cccdStatus": "PENDING",
            "bankName": "Vietcombank (VCB)",
            "bankAccountNumber": "10123456789",
            "bankAccountHolder": "NGUYEN VAN AN",
            "bankVerificationStatus": "PENDING",
            "role": "ROLE_CAR_OWNER",
            "createdAt": "2026-10-15T09:30:00"
        },
        {
            "id": 502,
            "fullName": "TRẦN THỊ MAI",
            "email": "tranmai@gmail.com",
            "phoneNumber": "0987654321",
            "cccdNumber": "079195009876",
            "cccdName": "TRẦN THỊ MAI",
            "cccdFrontUrl": "assets/images/cars/car-3.jpg",
            "cccdBackUrl": "assets/images/cars/car-4.jpg",
            "cccdStatus": "VERIFIED",
            "bankName": "Techcombank (TCB)",
            "bankAccountNumber": "19034567891011",
            "bankAccountHolder": "LE VAN B (KHÔNG TRÙNG)",
            "bankVerificationStatus": "PENDING",
            "role": "ROLE_CAR_OWNER",
            "createdAt": "2026-10-16T14:20:00"
        }
    ],
    "cars": [
        {
            "car_id": 1,
            "carId": 1,
            "id": 1,
            "brand": "VinFast",
            "model": "VF8 Plus",
            "plate_number": "51K-889.99",
            "price_per_day": 1200000,
            "address": "120 Lê Lợi, Quận 1, TP. Hồ Chí Minh",
            "status": "ACTIVE",
            "thumbnail_url": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80",
            "year": 2024,
            "seats": 5,
            "transmission": "AUTOMATIC"
        },
        {
            "car_id": 2,
            "carId": 2,
            "id": 2,
            "brand": "Hyundai",
            "model": "Tucson 2.0 Turbo",
            "plate_number": "51H-333.22",
            "price_per_day": 1100000,
            "address": "200 Pasteur, Quận 3, TP. Hồ Chí Minh",
            "status": "ACTIVE",
            "thumbnail_url": "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=400&q=80",
            "year": 2023,
            "seats": 5,
            "transmission": "AUTOMATIC"
        }
    ]
}
qa_db = get_fresh_db()

def parse_multipart(data_bytes, boundary):
    parts = data_bytes.split(b"--" + boundary)
    fields = {}
    files = []
    
    for p in parts:
        if not p or p == b"--\r\n" or p == b"--":
            continue
        if b"\r\n\r\n" in p:
            head, body = p.split(b"\r\n\r\n", 1)
            # Remove trailing \r\n
            if body.endswith(b"\r\n"):
                body = body[:-2]
            head_str = head.decode("utf-8", errors="replace")
            disp_match = re.search(r'Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]+)")?', head_str, re.IGNORECASE)
            if disp_match:
                name = disp_match.group(1)
                filename = disp_match.group(2)
                if filename is not None:
                    files.append({
                        "field": name,
                        "filename": filename,
                        "size": len(body),
                        "contentType": "application/octet-stream"
                    })
                else:
                    fields[name] = body.decode("utf-8", errors="replace")
    return fields, files

class QAHttpHandler(http.server.SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_DIR, **kwargs)

    def _set_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_HEAD(self):
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/v1/"):
            self.send_response(200)
            self._set_cors_headers()
            self.end_headers()
            return
        return super().do_HEAD()

    def _send_json(self, status_code, data):
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self._set_cors_headers()
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path.startswith("/api/v1/"):
            print(f"[API GET] {path}")
            if path == "/api/v1/health":
                return self._send_json(200, {"code": 200, "status": "UP", "message": "Dev Server healthy"})
            
            if path == "/api/v1/qa/reset":
                global qa_db
                qa_db = get_fresh_db()
                return self._send_json(200, {"code": 200, "success": True, "message": "Database reset successfully"})
            
            if path in ["/api/v1/rentals/me", "/api/v1/rentals/my", "/api/v1/rentals/my-rentals", "/api/v1/owner/rentals", "/api/v1/rentals/owner", "/api/v1/rentals"]:
                return self._send_json(200, {
                    "code": 200,
                    "success": True,
                    "data": qa_db["rentals"]
                })

            if path in ["/api/v1/cars/my-cars", "/api/v1/owner/cars", "/api/v1/cars"]:
                return self._send_json(200, {
                    "code": 200,
                    "success": True,
                    "data": {
                        "items": qa_db["cars"],
                        "total": len(qa_db["cars"])
                    }
                })

            # Match: GET /api/v1/rentals/{id}/inspections
            insp_match = re.match(r"^/api/v1/rentals/(\d+)/inspections$", path)
            if insp_match:
                rental_id = int(insp_match.group(1))
                return self._send_json(200, {
                    "code": 200,
                    "success": True,
                    "data": [
                        {
                            "inspection_id": 1,
                            "rental_id": rental_id,
                            "inspection_type": "CHECK_IN",
                            "odo_meter": 12450,
                            "fuel_level": 90,
                            "images": "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80,https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=400&q=80,https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=400&q=80,https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=400&q=80",
                            "notes": "Xe sạch sẽ, đầy đủ giấy tờ bảo hiểm và 2 chìa smartkey.",
                            "created_at": "2026-10-24T08:00:00"
                        }
                    ]
                })

            # Match: GET /api/v1/rentals/{id}/reviews
            review_match = re.match(r"^/api/v1/rentals/(\d+)/reviews$", path)
            if review_match:
                rental_id = int(review_match.group(1))
                review = qa_db.get("reviews", {}).get(rental_id)
                return self._send_json(200, {
                    "code": 200,
                    "success": True,
                    "data": review
                })
            
            if path == "/api/v1/admin/rentals/overdue":
                overdue_rentals = [r for r in qa_db["rentals"] if r.get("status") == "OVERDUE"]
                return self._send_json(200, {
                    "code": 200,
                    "success": True,
                    "message": "Lấy danh sách đơn quá hạn thành công",
                    "data": overdue_rentals
                })

            dossier_match = re.match(r"^/api/v1/admin/rentals/(\d+)/dossier$", path)
            if dossier_match:
                rental_id = int(dossier_match.group(1))
                rental = next((r for r in qa_db["rentals"] if r.get("id") == rental_id), None)
                return self._send_json(200, {
                    "code": 200,
                    "success": True,
                    "message": "Xuất hồ sơ pháp lý vi phạm thành công",
                    "data": {
                        "dossierCode": f"HSPL-RENTAL-{rental_id}",
                        "legalNotice": "Hồ sơ vi phạm chiếm dụng phương tiện giao thông đường bộ theo Điều 175 Bộ luật Hình sự (Tội lạm dụng tín nhiệm chiếm đoạt tài sản) được trích xuất từ hệ thống DriveShare phục vụ bàn giao Cơ quan Cảnh sát Điều tra và Công ty Bảo hiểm.",
                        "rentalId": rental_id,
                        "status": "OVERDUE",
                        "overdueHours": rental.get("overdueHours", 26) if rental else 26,
                        "penaltyFee": rental.get("penaltyFee", 1800000) if rental else 1800000,
                        "renter": {
                            "fullName": rental.get("renterName", "Nguyễn Văn Vi Phạm") if rental else "Nguyễn Văn Vi Phạm",
                            "phone": "0987654321",
                            "idCardNumber": "079201009999",
                            "licenseNumber": "B2-998877",
                            "idCardFrontUrl": "https://img.driveshare.vn/cccd_front.jpg",
                            "idCardBackUrl": "https://img.driveshare.vn/cccd_back.jpg",
                            "licenseFrontUrl": "https://img.driveshare.vn/gplx_front.jpg",
                            "licenseBackUrl": "https://img.driveshare.vn/gplx_back.jpg"
                        },
                        "car": {
                            "plateNumber": rental.get("licensePlate", "51G-888.99") if rental else "51G-888.99",
                            "brand": "Mazda",
                            "model": "Mazda 3",
                            "chassisNumber": "VN-CHASSIS-51G88899"
                        },
                        "owner": {
                            "fullName": rental.get("ownerName", "Nguyễn Văn Chủ Xe") if rental else "Nguyễn Văn Chủ Xe",
                            "phone": rental.get("ownerPhone", "0901234567") if rental else "0901234567",
                            "bankName": "Vietcombank",
                            "bankAccountNumber": "0123456789"
                        },
                        "depositPayment": {
                            "amount": 600000,
                            "paymentMethod": "VIETQR",
                            "transactionCode": "VQR-TX-998811",
                            "status": "SUCCESS"
                        },
                        "contract": {
                            "contractCode": f"HDDT-{rental_id}",
                            "criminalLiabilityNotice": "Cảnh báo chế tài hình sự theo Điều 175 Bộ luật Hình sự."
                        }
                    }
                })

            if path == "/api/v1/admin/users/pending-cccd":
                return self._send_json(200, {
                    "code": 200,
                    "success": True,
                    "data": qa_db["pending_users"]
                })
            
            if path in ["/api/v1/users/me", "/api/v1/auth/me"]:
                return self._send_json(200, {
                    "code": 200,
                    "success": True,
                    "data": {
                        "id": 1,
                        "fullName": "QA Test Admin",
                        "email": "admin@driveshare.vn",
                        "role": "ROLE_ADMIN",
                        "roles": ["ROLE_ADMIN", "ROLE_CUSTOMER"]
                    }
                })

            return self._send_json(404, {"code": 404, "message": f"API endpoint not found: {path}"})

        # Static files serving
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        print(f"[API POST] {path}")

        if path.startswith("/api/v1/"):
            content_type = self.headers.get("Content-Type", "")
            content_length_header = self.headers.get("Content-Length")
            if content_length_header is not None:
                content_length = int(content_length_header)
                body_bytes = self.rfile.read(content_length)
            elif self.headers.get("Transfer-Encoding", "").lower() == "chunked":
                body_bytes = bytearray()
                while True:
                    line = self.rfile.readline()
                    if not line:
                        break
                    chunk_hex = line.strip().split(b";")[0]
                    if not chunk_hex:
                        continue
                    try:
                        chunk_size = int(chunk_hex, 16)
                    except ValueError:
                        break
                    if chunk_size == 0:
                        self.rfile.readline()
                        break
                    chunk = self.rfile.read(chunk_size)
                    body_bytes.extend(chunk)
                    self.rfile.readline()
                body_bytes = bytes(body_bytes)
            else:
                body_bytes = b""

            # Match: POST /api/v1/rentals/{id}/report-no-show
            no_show_match = re.match(r"^/api/v1/rentals/(\d+)/report-no-show$", path)
            if no_show_match:
                rental_id = int(no_show_match.group(1))
                reason = "Không có lý do"
                uploaded_files = []

                if "boundary=" in content_type:
                    boundary = content_type.split("boundary=")[1].strip().encode()
                    fields, files = parse_multipart(body_bytes, boundary)
                    reason = fields.get("reason", "")
                    uploaded_files = [f["filename"] for f in files]
                else:
                    try:
                        data = json.loads(body_bytes.decode("utf-8"))
                        reason = data.get("reason", "")
                    except Exception:
                        pass

                print(f"--> [Dispute Submitted] Rental #{rental_id}, Reason: {reason}, Files: {uploaded_files}")

                # Update status in db
                for rental in qa_db["rentals"]:
                    if rental["id"] == rental_id:
                        rental["status"] = "DISPUTED"
                        rental["disputeReason"] = reason
                        rental["disputeFiles"] = uploaded_files
                        rental["disputedAt"] = "2026-10-18T18:30:00"

                return self._send_json(200, {
                    "code": 200,
                    "success": True,
                    "message": f"Báo cáo sự cố nhận xe thành công. Đơn hàng #{rental_id} đã chuyển sang trạng thái tranh chấp (DISPUTED).",
                    "data": {
                        "rentalId": rental_id,
                        "status": "DISPUTED",
                        "disputeReason": reason,
                        "filesCount": len(uploaded_files),
                        "files": uploaded_files
                    }
                })

            # Match: POST /api/v1/rentals/{id}/reviews
            review_post_match = re.match(r"^/api/v1/rentals/(\d+)/reviews$", path)
            if review_post_match:
                rental_id = int(review_post_match.group(1))
                req_data = {}
                try:
                    req_data = json.loads(body_bytes.decode("utf-8"))
                except Exception:
                    pass
                rating = req_data.get("rating", 5)
                comment = req_data.get("comment", "")
                
                # Update rental in db to COMPLETED
                for rental in qa_db["rentals"]:
                    if rental["id"] == rental_id:
                        rental["status"] = "COMPLETED"
                        rental["reviewRating"] = rating
                        rental["reviewComment"] = comment

                if "reviews" not in qa_db:
                    qa_db["reviews"] = {}
                qa_db["reviews"][rental_id] = {
                    "reviewId": 999,
                    "rentalId": rental_id,
                    "rating": rating,
                    "comment": comment,
                    "createdAt": "2026-10-25T15:00:00"
                }

                print(f"--> [Review Created] Rental #{rental_id}: rating={rating}, status -> COMPLETED")
                return self._send_json(200, {
                    "code": 200,
                    "success": True,
                    "message": "Gửi đánh giá chuyến đi thành công. Đơn hàng đã chuyển sang trạng thái ĐÃ HOÀN TẤT.",
                    "data": {
                        "rentalId": rental_id,
                        "rating": rating,
                        "comment": comment,
                        "status": "COMPLETED"
                    }
                })

            if path == "/api/v1/auth/login":
                return self._send_json(200, {
                    "code": 200,
                    "success": True,
                    "data": {
                        "accessToken": "mock-jwt-token-qa-admin",
                        "refreshToken": "mock-refresh-token",
                        "user": {
                            "id": 1,
                            "fullName": "QA Test Admin",
                            "email": "admin@driveshare.vn",
                            "role": "ROLE_ADMIN",
                            "roles": ["ROLE_ADMIN", "ROLE_CUSTOMER"]
                        }
                    }
                })

            return self._send_json(404, {"code": 404, "message": f"Endpoint not found: {path}"})

        return self._send_json(405, {"code": 405, "message": "Method Not Allowed"})

    def do_PUT(self):
        parsed = urlparse(self.path)
        path = parsed.path
        print(f"[API PUT] {path}")

        if path.startswith("/api/v1/"):
            content_length = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(content_length)
            body_json = {}
            if body_bytes:
                try:
                    body_json = json.loads(body_bytes.decode("utf-8"))
                except Exception:
                    pass

            # Match: PUT /api/v1/admin/users/{userId}/verify-bank
            bank_match = re.match(r"^/api/v1/admin/users/(\d+)/verify-bank$", path)
            if bank_match:
                user_id = int(bank_match.group(1))
                status = body_json.get("status", "VERIFIED")
                reason = body_json.get("reason", "")
                print(f"--> [Bank Verified] User #{user_id}: status={status}, reason={reason}")

                # Update in-memory db
                for user in qa_db["pending_users"]:
                    if user["id"] == user_id:
                        user["bankVerificationStatus"] = status

                return self._send_json(200, {
                    "code": 200,
                    "success": True,
                    "message": f"Duyệt tài khoản ngân hàng thành công: {status}",
                    "data": {
                        "userId": user_id,
                        "bankVerificationStatus": status,
                        "rejectionReason": reason
                    }
                })

            # Match: PUT /api/v1/admin/users/{userId}/verify-cccd
            cccd_match = re.match(r"^/api/v1/admin/users/(\d+)/verify-cccd$", path)
            if cccd_match:
                user_id = int(cccd_match.group(1))
                status = body_json.get("status", "VERIFIED")
                reason = body_json.get("reason", "")
                print(f"--> [CCCD Verified] User #{user_id}: status={status}")

                for user in qa_db["pending_users"]:
                    if user["id"] == user_id:
                        user["cccdStatus"] = status

                return self._send_json(200, {
                    "code": 200,
                    "success": True,
                    "message": f"Xác minh CCCD thành công: {status}",
                    "data": {
                        "userId": user_id,
                        "cccdStatus": status,
                        "rejectionReason": reason
                    }
                })

            return self._send_json(404, {"code": 404, "message": f"Endpoint not found: {path}"})

        return self._send_json(405, {"code": 405, "message": "Method Not Allowed"})


class ThreadingServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

def run():
    with ThreadingServer(("", PORT), QAHttpHandler) as httpd:
        print(f"[DriveShare QA Server] Running on http://localhost:{PORT}")
        print(f"[DriveShare QA Server] Serving directory: {FRONTEND_DIR}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[DriveShare QA Server] Stopping...")
            httpd.shutdown()

if __name__ == "__main__":
    run()
