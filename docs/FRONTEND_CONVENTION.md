# 🎨 QUY CHUẨN PHÁT TRIỂN FRONTEND & TÍCH HỢP API

> **Dành cho:** Bạn Chí Tín (Frontend & QA Lead) và các thành viên hỗ trợ giao diện Web.  
> **Mục tiêu:** Đồng bộ giao diện người dùng (UI/UX), chuẩn hóa cách gọi API Backend và quản lý phiên đăng nhập (JWT).

---

## 1. 📂 Cấu Trúc Thư Mục Frontend

Thư mục `frontend/` được tổ chức rõ ràng theo chức năng:

```
frontend/
├── css/
│   ├── variables.css        # Biến màu sắc, khoảng cách, font chữ chung (Design Tokens)
│   ├── base.css             # Reset CSS, typography cơ bản, body, heading
│   ├── components.css       # Các thành phần tái sử dụng (button, input, modal, toast, card)
│   └── pages/               # CSS riêng cho từng màn hình phức tạp
├── js/
│   ├── api/
│   │   ├── apiConfig.js     # Khai báo Base URL, cấu hình Fetch / Axios chung
│   │   └── authHeader.js    # Hàm tự động lấy và gắn Bearer Token
│   ├── services/            # Từng file service tương ứng với API Backend
│   │   ├── authService.js   # login, register, forgotPassword
│   │   ├── userService.js   # getProfile, updateProfile
│   │   ├── carService.js    # getCars, createCar, getCarDetail
│   │   └── adminService.js  # getAllUsers, approveOwner, blockUser
│   ├── utils/
│   │   ├── formatters.js    # formatTiền (VND), formatDate, formatBienSo
│   │   └── toast.js         # Hàm hiển thị thông báo popup đẹp (Success/Error/Warning)
│   └── pages/               # Logic JS cho từng trang HTML
│       ├── login.js
│       ├── register.js
│       ├── profile.js
│       └── admin.js
├── assets/                  # Ảnh logo, icons, banner
└── index.html               # Trang chủ
```

---

## 2. 🔐 Quản Lý Phiên Đăng Nhập (JWT Token Lifecycle)

### 2.1. Lưu trữ Token sau khi Đăng nhập thành công:
Khi gọi API `/api/v1/auth/login` thành công:
```javascript
// js/services/authService.js
function handleLoginSuccess(apiResponse) {
    const { accessToken, user } = apiResponse.data;
    
    // Lưu vào localStorage
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("user_info", JSON.stringify(user));
    
    // Điều hướng theo Role
    if (user.role === "ADMIN") {
        window.location.href = "/admin/dashboard.html";
    } else if (user.role === "OWNER") {
        window.location.href = "/owner/cars.html";
    } else {
        window.location.href = "/index.html";
    }
}
```

### 2.2. Gắn Token vào Header khi gọi API (Auth Header):
```javascript
// js/api/authHeader.js
function getAuthHeaders() {
    const token = localStorage.getItem("access_token");
    return {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
}
```

### 2.3. Tự động xử lý khi Token hết hạn (401 Unauthorized):
Mỗi khi API trả về mã **401 Unauthorized**:
1. Xóa `localStorage.removeItem("access_token")`.
2. Hiển thị thông báo: *"Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại."*
3. Tự động chuyển hướng về trang `login.html`.

---

## 3. 🌐 Quy Chuẩn Gọi API & Đọc Dữ Liệu Backend

Backend đã chuẩn hóa dữ liệu trả về theo mẫu `ApiResponse`:
```json
{
  "success": true,
  "message": "Thông điệp thành công",
  "data": { ... }
}
```
Và lỗi theo `ErrorResponse`:
```json
{
  "success": false,
  "message": "Mật khẩu không chính xác",
  "errorCode": "AUTH_401"
}
```

### Mẫu hàm gọi API chuẩn (Fetch API):
```javascript
// js/services/carService.js
async function fetchCarList(page = 0, size = 10) {
    try {
        const response = await fetch(`http://localhost:8080/api/v1/cars?page=${page}&size=${size}`, {
            method: "GET",
            headers: getAuthHeaders()
        });

        const result = await response.json();

        if (response.ok && result.success) {
            return result.data; // Trả về PageResponse chứa danh sách xe
        } else {
            showToast(result.message || "Không thể tải danh sách xe", "error");
            return null;
        }
    } catch (error) {
        console.error("Lỗi kết nối Server:", error);
        showToast("Không thể kết nối đến máy chủ Backend!", "error");
        return null;
    }
}
```

---

## 4. 🎨 Quy Chuẩn Giao Diện (Design System & Color Palette)

Để giao diện không bị lệch màu, file `css/variables.css` định nghĩa các biến màu chính thức:

```css
/* css/variables.css */
:root {
  /* Màu chủ đạo thương hiệu (Brand Colors) */
  --primary-color: #2563eb;       /* Xanh dương hiện đại */
  --primary-hover: #1d4ed8;
  --secondary-color: #0f172a;     /* Màu tối sang trọng (Dark Slate) */
  
  /* Màu thông thái (Status Colors) */
  --color-success: #10b981;       /* Xanh lá - Thành công / Đã duyệt */
  --color-warning: #f59e0b;       /* Vàng cam - Chờ duyệt / Cảnh báo */
  --color-danger: #ef4444;        /* Đỏ - Lỗi / Bị khóa / Từ chối */
  --color-info: #3b82f6;          /* Xanh lam - Thông tin */

  /* Màu nền & Chữ (Background & Text) */
  --bg-body: #f8fafc;
  --bg-card: #ffffff;
  --text-main: #1e293b;
  --text-muted: #64748b;
  --border-color: #e2e8f0;

  /* Font chữ chuẩn */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --border-radius: 8px;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

---

## 5. 🧪 Phối Hợp Kiểm Thử (QA Gatekeeper - Chí Tín)

Trước khi nghiệm thu một User Story trên Jira để chuyển sang trạng thái **Done**:
1. **Kiểm tra API độc lập (Postman):** Dùng file [DriveShare_Sprint1_Postman_Collection.json](file:///d:/MONHOCITC/K4/Spring_ThucTap_k4/docs/api/DriveShare_Sprint1_Postman_Collection.json) để test toàn bộ các trường hợp Success, Bad Request (400), Unauthorized (401), Forbidden (403).
2. **Kiểm tra Giao diện (UI/UX):**
   - Đăng ký tài khoản thành công có tự chuyển trang không?
   - Nhập sai mật khẩu có hiện thông báo lỗi rõ ràng không?
   - Màn hình hiển thị tốt trên cả màn hình Laptop và Điện thoại (Responsive) không?
3. Nếu phát hiện lỗi (Bug): Tạo một Issue/Bug trên Jira và gán lại cho bạn Backend phụ trách sửa ngay.
