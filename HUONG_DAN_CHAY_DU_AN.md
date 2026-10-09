# 🚗 HƯỚNG DẪN KHỞI CHẠY DỰ ÁN DRIVESHARE

Tài liệu hướng dẫn chi tiết từng bước khởi chạy toàn bộ hệ sinh thái dự án **DriveShare** bao gồm: **Cơ sở dữ liệu (PostgreSQL)**, **Giao diện quản trị CSDL Web (Adminer)**, **Backend API (Spring Boot 3)** và **Giao diện người dùng (Frontend Web)**.

---

## 📋 Mục Lục
1. [Yêu Cầu Môi Trường (Prerequisites)](#1-yêu-cầu-môi-trường-prerequisites)
2. [Bước 1: Khởi Động Cơ Sở Dữ Liệu PostgreSQL & Adminer (Docker)](#bước-1-khởi-động-cơ-sở-dữ-liệu-postgresql--adminer-docker)
3. [Bước 2: Hướng Dẫn Sử Dụng Web DB Adminer](#bước-2-hướng-dẫn-sử-dụng-web-db-adminer)
4. [Bước 3: Khởi Chạy Backend (Spring Boot 3)](#bước-3-khởi-chạy-backend-spring-boot-3)
5. [Bước 4: Khởi Chạy Frontend (Giao Diện Web)](#bước-4-khởi-chạy-frontend-giao-diện-web)
6. [Danh Sách Tài Khoản Dùng Thử (Demo Accounts)](#6-danh-sách-tài-khoản-dùng-thử-demo-accounts)
7. [Bảng Tổng Hợp Cổng Mạng (Port Map)](#7-bảng-tổng-hợp-cổng-mạng-port-map)
8. [Cách Tắt & Dừng Dự Án Sạch Sẽ](#8-cách-tắt--dừng-dự-án-sạch-sẽ)

---

## 1. Yêu Cầu Môi Trường (Prerequisites)

Trước khi khởi chạy, máy tính của bạn cần có:
- **Docker Desktop**: Đã cài đặt và đang mở (biểu tượng con cá voi ở khay hệ thống Taskbar).
- **Java JDK**: Phiên bản 17 hoặc 21+ (máy hiện tại đã có Java).
- **Python**: Phiên bản 3.x (dùng để chạy máy chủ tĩnh cho Frontend).

---

## Bước 1: Khởi Động Cơ Sở Dữ Liệu PostgreSQL & Adminer (Docker)

Mở **Terminal / PowerShell** tại thư mục gốc của dự án (`Spring_ThucTap_k4`) và thực thi lệnh:

```powershell
docker-compose up -d
```

> **Giải thích:**
> - Docker sẽ kéo và khởi chạy 2 container chạy ngầm (`-d`):
>   1. **`driveshare-postgres`**: PostgreSQL 16 Alpine lắng nghe tại cổng `5432`.
>   2. **`driveshare-adminer`**: Công cụ xem & quản lý CSDL trực quan trên nền Web tại cổng `8088`.

Kiểm tra trạng thái container đang chạy:
```powershell
docker ps
```

---

## Bước 2: Hướng Dẫn Sử Dụng Web DB Adminer

Adminer là công cụ quản trị CSDL trực quan chạy trực tiếp trên trình duyệt, không cần cài đặt DBeaver hay pgAdmin.

1. **Mở trình duyệt** và truy cập: **[http://localhost:8088](http://localhost:8088)**
2. **Điền thông tin đăng nhập** như sau:

| Trường thông tin | Giá trị cần điền |
| :--- | :--- |
| **Hệ thống (System)** | Chọn **`PostgreSQL`** |
| **Máy chủ (Server)** | Điền **`postgres`** *(hoặc `localhost` nếu truy cập từ máy ngoài)* |
| **Tài khoản (Username)** | Điền **`postgres`** |
| **Mật khẩu (Password)** | Điền **`postgrespassword`** |
| **Cơ sở dữ liệu (Database)** | Điền **`driveshare_db`** |

3. Bấm nút **Đăng nhập (Login)**.

> 💡 **Mẹo xem dữ liệu:**
> - Sau khi Backend chạy lần đầu, các bảng sẽ tự động được tạo và nạp dữ liệu mẫu (`seed data`).
> - Bạn có thể bấm vào các bảng như `users`, `cars`, `rentals`, `payments` ở cột bên trái để xem và sửa dữ liệu trực tiếp.

---

## Bước 3: Khởi Chạy Backend (Spring Boot 3)

Mở một **cửa sổ PowerShell mới** (giữ nguyên cửa sổ Docker) tại thư mục gốc của dự án và chạy:

```powershell
.\run-backend.ps1
```

*(Hoặc nếu muốn chạy thủ công từng lệnh)*:
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

> **Quá trình khởi chạy:**
> - Maven Wrapper sẽ tự động biên dịch và khởi động Spring Boot 3.3.4 trên cổng **`8080`**.
> - Hibernate sẽ tự động kiểm tra CSDL, cập nhật bảng và `DataInitializer` sẽ tự động nạp sẵn danh sách xe, tài khoản và lịch bận mẫu.

**Kiểm tra Backend đã chạy thành công:**
- Mở trình duyệt vào: **[http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health)**
  - Nhận được phản hồi: `{"status": "UP", "message": "DriveShare Backend Service is running smoothly"}`.
- Xem tài liệu API Swagger / OpenAPI: **[http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)**.

---

## Bước 4: Khởi Chạy Frontend (Giao Diện Web)

Mở thêm một **cửa sổ PowerShell thứ 2** tại thư mục gốc dự án và chạy:

```powershell
cd frontend
python -m http.server 3000
```

**Truy cập hệ thống:**
- Mở trình duyệt web bất kỳ (Chrome, Edge, Firefox) và truy cập vào:
  👉 **[http://localhost:3000](http://localhost:3000)**

---

## 6. Danh Sách Tài Khoản Dùng Thử (Demo Accounts)

Hệ thống đã có sẵn 3 tài khoản mẫu ứng với 3 vai trò phân quyền:

| Vai trò | Email đăng nhập | Mật khẩu mặc định | Chức năng chính |
| :--- | :--- | :--- | :--- |
| **Khách thuê xe (Renter)** | `renter@driveshare.com` | `Password123@` | Tìm kiếm xe, lọc theo ngày, đặt xe, thanh toán cọc VietQR, xem chuyến đi của tôi. *(Có nút bấm nhanh "Demo Renter" tại trang Login)* |
| **Chủ xe (Car Owner)** | `owner@driveshare.com` | `Password123@` | Đăng xe mới, duyệt đơn thuê, chặn lịch bảo dưỡng, quản lý doanh thu. *(Có nút bấm nhanh "Demo Owner" tại trang Login)* |
| **Quản trị viên (Admin)** | `admin@driveshare.com` | `Password123@` | Quản trị người dùng, duyệt xe, quản lý toàn bộ giao dịch tại trang `/admin.html`. |

---

## 7. Bảng Tổng Hợp Cổng Mạng (Port Map)

| Thành phần | Cổng (Port) | Địa chỉ URL | Ghi chú |
| :--- | :---: | :--- | :--- |
| **Frontend Web UI** | `3000` | [http://localhost:3000](http://localhost:3000) | Giao diện người dùng chính |
| **Backend REST API** | `8080` | [http://localhost:8080](http://localhost:8080) | Dịch vụ backend Spring Boot 3 |
| **Swagger UI Docs** | `8080` | [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html) | Tài liệu kiểm thử API trực quan |
| **Adminer Web GUI** | `8088` | [http://localhost:8088](http://localhost:8088) | Giao diện quản lý CSDL |
| **PostgreSQL Database** | `5432` | `localhost:5432` | CSDL lưu trữ chính (`driveshare_db`) |

---

## 8. Cách Tắt & Dừng Dự Án Sạch Sẽ

Khi kết thúc phiên làm việc:
1. **Dừng Frontend**: Vào cửa sổ terminal Frontend, nhấn tổ hợp phím `Ctrl + C`.
2. **Dừng Backend**: Vào cửa sổ terminal Backend, nhấn tổ hợp phím `Ctrl + C`.
3. **Tạm dừng CSDL Docker**:
   ```powershell
   docker-compose stop
   ```
   *(Dữ liệu được lưu trữ an toàn trong Docker Volume `postgres_data`, không bị mất).*
4. Khi muốn khởi động lại vào lần sau, chỉ cần chạy lại `docker-compose up -d`, rồi chạy Backend và Frontend như các bước ở trên.
