# 🚀 DriveShare - Backend Service (Spring Boot 3)

Dịch vụ xử lý trung tâm (API Backend) cho nền tảng cho thuê xe tự lái **DriveShare**, xây dựng trên nền tảng **Java 17+** và **Spring Boot 3.3.x**.

---

## 🛠️ Yêu Cầu Môi Trường (Prerequisites)

1. **Java Development Kit (JDK)**: Phiên bản 17 hoặc 21+.
2. **Apache Maven**: Phiên bản 3.8+ (hoặc dùng Maven tích hợp trong IntelliJ IDEA / VS Code).
3. **MySQL Server**: Phiên bản 8.0+.

---

## 🗄️ Khởi Tạo Cơ Sở Dữ Liệu (Database Setup)

Trước khi chạy backend lần đầu, hãy chắc chắn MySQL đã được khởi tạo theo CSDL v2:

1. Mở MySQL Workbench, DBeaver hoặc Terminal MySQL:
   ```bash
   mysql -u root -p
   ```
2. Chạy file SQL thiết kế v2 (nằm trong thư mục `docs/database`):
   ```sql
   source docs/database/DriveShare_Database_Design_v2.sql;
   ```
   *(File script này sẽ tự động tạo database `driveshare_db` và chèn sẵn dữ liệu mẫu `roles`, `users` admin, renter, owner).*

---

## ⚙️ Cấu Hình Môi Trường Dev (`application-dev.yml`)

Mặc định, ứng dụng kết nối tới MySQL tại:
- **URL**: `jdbc:mysql://localhost:3306/driveshare_db`
- **Username**: `root`
- **Password**: `root` (Nếu máy bạn dùng mật khẩu khác, hãy đổi trong file `src/main/resources/application-dev.yml` hoặc truyền qua biến môi trường `DB_PASSWORD`).

---

## 🚀 Khởi Động Ứng Dụng (Run Local)

### Cách 1: Dùng lệnh Maven (Terminal)
Từ thư mục gốc `backend/`:
```bash
# Tải dependencies và biên dịch
mvn clean install -DskipTests

# Chạy server Spring Boot
mvn spring-boot:run
```

### Cách 2: Dùng IntelliJ IDEA
1. Mở thư mục `backend/` trong IntelliJ IDEA.
2. IntelliJ sẽ tự động nhận diện file `pom.xml` và tải các dependencies.
3. Mở file `src/main/java/com/driveshare/DriveShareApplication.java` và bấm nút **Run ▶️**.

---

## 📖 Kiểm Tra Hoạt Động (Verification)

Sau khi server khởi động thành công trên cổng **8080**:

1. **API Health Check (Ping)**:
   - Truy cập trình duyệt: [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health)
   - Phản hồi mong đợi:
     ```json
     {
       "success": true,
       "message": "DriveShare Backend Service is running smoothly",
       "data": {
         "status": "UP",
         "service": "DriveShare Backend",
         "version": "1.0.0"
       }
     }
     ```

2. **Swagger OpenAPI Documentation**:
   - Truy cập: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
   - Tester và Frontend có thể tra cứu toàn bộ danh sách API, schemas và bấm **Authorize** để test token JWT.

---

## 📂 Hướng Dẫn Phân Bổ Code Cho Thành Viên

| Thành viên | Phụ trách Module | Thư mục làm việc chính | Nhánh Git khuyến nghị |
| :--- | :--- | :--- | :--- |
| **Bảo** | Project Lead & Database Architect | `docs/database/`, `common/`, `config/`, CI/CD, Review & Merge PR | `main` / `develop` |
| **Lộc Khiêm** | **Backend Core (Phần khó nhất)**: Vòng đời Booking & State Machine, Concurrency Locking chống trùng lịch, Schedulers tự động, Bàn giao & Trả xe, Phụ phí (US-06, US-07, US-09, US-10) | `src/main/java/com/driveshare/modules/booking/` | `feature/be-booking-core` |
| **Chí Vĩ** | Backend Developer: Auth, JWT, Security RBAC, User Profile, Admin Dashboard (US-01, US-02, US-14) | `src/main/java/com/driveshare/modules/auth/`, `modules/user/` | `feature/be-auth-user` |
| **Phát** | Backend Developer: Quản lý xe, Bộ lọc tìm kiếm động, Tích hợp AI (US-03, US-04, US-05, US-15) | `src/main/java/com/driveshare/modules/car/`, `modules/ai/` | `feature/be-car-search` |
| **Quân** | Backend Developer: Hỗ trợ Thanh toán, Đánh giá, Khiếu nại, WebSocket Thông báo (US-08, US-11, US-12, US-13) | `src/main/java/com/driveshare/modules/payment/`, `notification/`, `review/` | `feature/be-services` |
| **Chí Tín** | Frontend & QA Tester: Dựng Web UI, **Chủ trì phân hệ Thanh toán (Kinh nghiệm Payment)**, Viết Test Cases & QA toàn diện 15 Stories | Thư mục `frontend/` & `docs/api/` (Postman) | `feature/fe-payment`, `test/sprint-0` |

### Quy tắc "Bất di bất dịch":
1. **Không sửa đè lên module của nhau** để tránh merge conflict.
2. Mọi API trả về bắt buộc bọc trong `ApiResponse<T>` hoặc `PageResponse<T>`.
3. Tên trường JSON luôn là `snake_case` (đã được cấu hình tự động).
4. Mọi ngoại lệ nghiệp vụ phải ném bằng `throw new AppException(ErrorCode.XYZ)`.
