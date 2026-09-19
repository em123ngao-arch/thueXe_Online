# 📡 API SPEC — SPRINT 1 FIX & BỔ SUNG

> **Mục đích:** Tài liệu tham chiếu nhanh cho FE dev khi kết nối API mới.
> **Format response chung:** `{ "code": 200, "message": "...", "result": {...} }`

---

## 🔐 AUTH APIs (Vĩ phụ trách)

### PUT /api/v1/auth/change-password
**Headers:** `Authorization: Bearer <token>`

| Field | Type | Required | Mô tả |
|---|---|---|---|
| oldPassword | String | ✅ | Mật khẩu cũ |
| newPassword | String | ✅ | Mật khẩu mới (min 8 ký tự, chữ hoa, số, ký tự đặc biệt) |
| confirmPassword | String | ✅ | Phải khớp newPassword |

**Response thành công:**
```json
{ "code": 200, "message": "Đổi mật khẩu thành công. Các phiên đăng nhập khác đã bị vô hiệu hóa" }
```
**Lỗi thường gặp:**
```json
{ "code": 400, "message": "Mật khẩu cũ không đúng" }
{ "code": 400, "message": "Mật khẩu mới không được trùng mật khẩu cũ" }
```

---

### POST /api/v1/auth/change-email/request
**Headers:** `Authorization: Bearer <token>`

| Field | Type | Required | Mô tả |
|---|---|---|---|
| newEmail | String | ✅ | Email mới (chưa tồn tại trong hệ thống) |

**Response:**
```json
{ "code": 200, "message": "Link xác nhận đã được gửi đến email mới (hiệu lực 15 phút)" }
```

---

## 🖼️ PROFILE & UPLOAD APIs (Duy Quân phụ trách)

### GET /api/v1/users/me
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "code": 200,
  "result": {
    "userId": 1,
    "email": "user@example.com",
    "fullName": "Nguyễn Văn A",
    "phoneNumber": "0901234567",
    "address": "TP.HCM",
    "avatarUrl": "https://res.cloudinary.com/...",
    "role": "RENTER",
    "status": "ACTIVE",
    "verificationStatus": "APPROVED",
    "profile": {
      "licenseNumber": "B2-123456",         // Chỉ có nếu RENTER
      "licenseImageUrl": "https://...",
      "bankName": "Techcombank",             // Chỉ có nếu OWNER
      "bankAccountNumber": "1903xxxxx"
    },
    "lockedFields": ["fullName", "nationalId", "nationalIdImages"]
  }
}
```

---

### PUT /api/v1/users/me
**Headers:** `Authorization: Bearer <token>`, `Content-Type: application/json`

| Field | Type | Editable | Mô tả |
|---|---|---|---|
| phoneNumber | String | ✅ Luôn | Số điện thoại |
| address | String | ✅ Luôn | Địa chỉ |
| fullName | String | ❌ Sau duyệt | Bị khóa sau Admin duyệt |

---

### POST /api/v1/users/me/avatar
**Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`

| Field | Type | Required | Mô tả |
|---|---|---|---|
| file | MultipartFile | ✅ | Ảnh JPG/PNG, max 5MB |

**Response:**
```json
{ "code": 200, "result": { "avatarUrl": "https://res.cloudinary.com/driveshare/..." } }
```
**Lỗi:**
```json
{ "code": 400, "message": "File vượt quá 5MB" }
{ "code": 400, "message": "Định dạng không hợp lệ. Chỉ chấp nhận JPG, PNG" }
```

---

### POST /api/v1/users/me/cccd
**Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`

| Field | Type | Required | Mô tả |
|---|---|---|---|
| frontImage | MultipartFile | ✅ | Mặt trước CMND/CCCD, max 10MB |
| backImage | MultipartFile | ✅ | Mặt sau CMND/CCCD, max 10MB |

**Response:**
```json
{
  "code": 200,
  "message": "Upload CCCD thành công. Đang chờ Admin xét duyệt.",
  "result": {
    "frontImageUrl": "https://res.cloudinary.com/...",
    "backImageUrl": "https://res.cloudinary.com/...",
    "verificationStatus": "PENDING"
  }
}
```
**Lỗi:**
```json
{ "code": 400, "message": "MISSING_CCCD_SIDE: Phải upload đủ cả mặt trước và mặt sau" }
```

---

### POST /api/v1/users/me/gplx
**Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
**Chỉ áp dụng cho:** RENTER

| Field | Type | Required | Mô tả |
|---|---|---|---|
| licenseImage | MultipartFile | ✅ | Ảnh bằng lái xe, max 10MB |

**Response:**
```json
{
  "code": 200,
  "message": "Upload GPLX thành công. Đang chờ Admin xét duyệt.",
  "result": { "licenseImageUrl": "https://res.cloudinary.com/...", "verificationStatus": "PENDING" }
}
```

---

## 🔑 GOOGLE OAUTH2 APIs (Phát phụ trách)

### GET /oauth2/authorization/google
Không cần body. Browser redirect trực tiếp.

**Luồng:**
```
FE: <a href="/oauth2/authorization/google"> → Google consent → callback
→ BE: OAuth2SuccessHandler sinh JWT
→ Redirect về FE: /oauth2/callback?token=eyJ...&isNewUser=true&needRole=true
```

### POST /api/v1/oauth2/complete-registration
Gọi sau khi Google login lần đầu (isNewUser=true), user chọn role:

| Field | Type | Required | Mô tả |
|---|---|---|---|
| googleToken | String | ✅ | Token tạm từ callback |
| role | String | ✅ | "RENTER" hoặc "OWNER" |

**Response:**
```json
{
  "code": 200,
  "result": {
    "accessToken": "eyJ...",
    "role": "RENTER",
    "status": "ACTIVE"
  }
}
```

---

## 🛡️ ADMIN APIs (Lộc Khiêm phụ trách)

### GET /api/v1/admin/users/pending-cccd
**Headers:** `Authorization: Bearer <ADMIN_token>`

**Response:**
```json
{
  "code": 200,
  "result": [
    {
      "userId": 4,
      "fullName": "Nguyễn Văn B",
      "email": "b@gmail.com",
      "role": "RENTER",
      "cccdFrontUrl": "https://cloudinary...",
      "cccdBackUrl": "https://cloudinary...",
      "submittedAt": "2026-09-19T10:00:00Z"
    }
  ]
}
```

---

### PUT /api/v1/admin/users/{userId}/verify-cccd
**Headers:** `Authorization: Bearer <ADMIN_token>`

| Field | Type | Required | Mô tả |
|---|---|---|---|
| status | String | ✅ | "APPROVED" hoặc "REJECTED" |
| reason | String | ❌ / ✅ | Bắt buộc nếu status = REJECTED |

**Response:**
```json
{ "code": 200, "message": "Đã phê duyệt CCCD thành công" }
```
**Lỗi:**
```json
{ "code": 400, "message": "Lý do từ chối là bắt buộc khi REJECTED" }
```

---

### GET /api/v1/admin/cars/pending
**Headers:** `Authorization: Bearer <ADMIN_token>`

**Response:**
```json
{
  "code": 200,
  "result": [
    {
      "carId": 1,
      "brand": "Toyota",
      "model": "Camry",
      "licensePlate": "51A-12345",
      "pricePerDay": 800000,
      "ownerName": "Nguyễn Văn A",
      "submittedAt": "2026-09-19T09:00:00Z"
    }
  ]
}
```

---

### PUT /api/v1/admin/cars/{carId}/approve
**Headers:** `Authorization: Bearer <ADMIN_token>`

| Field | Type | Required | Mô tả |
|---|---|---|---|
| status | String | ✅ | "APPROVED" hoặc "REJECTED" |
| reason | String | ❌ / ✅ | Bắt buộc nếu REJECTED |

---

## 📌 Format lỗi chuẩn (Chí Tín cần biết để handle FE)

```json
{
  "code": 400,
  "message": "EMAIL_EXISTED",
  "details": "Email đã được sử dụng bởi tài khoản khác"
}
```

| Error Code | HTTP | Ý nghĩa |
|---|---|---|
| EMAIL_EXISTED | 400 | Email đã tồn tại |
| MISSING_CCCD_SIDE | 400 | Thiếu 1 mặt CMND |
| ACCOUNT_BLOCKED | 403 | Tài khoản bị khóa |
| INVALID_TOKEN | 401 | Token hết hạn / không hợp lệ |
| ACCESS_DENIED | 403 | Không đủ quyền |

---

> **Cập nhật:** 19/09/2026 — Người viết: Nguyễn Bảo (sau khi thống nhất với từng module owner)
