# 🛠️ HƯỚNG DẪN LÀM SPRINT 1 FIX — ĐỌC TRƯỚC KHI CODE

> Đọc file này **đầu tiên**. Làm đúng từng bước. Không làm thêm ngoài phạm vi.

---

## 👤 BƯỚC 1: Tìm nhiệm vụ của mình

📄 [`docs/scrum/NHIEM_VU_THANH_VIEN.md`](docs/scrum/NHIEM_VU_THANH_VIEN.md)

| Bạn là... | Vai trò | Tìm mục... | Nhánh của bạn |
|---|---|---|---|
| **Lâm Chí Vĩ** | BE — Auth | `👤 VĨ (VL)` | `fix/auth-be` |
| **Duy Quân** | BE — Profile & Upload | `👤 DUY QUÂN (QD)` | `fix/profile-be` |
| **Phát** | BE — Google OAuth2 + Car | `👤 PHÁT (PT)` | `feature/google-car-be` |
| **Lộc Khiêm** | BE — Admin Extend | `👤 LỘC KHIÊM (KT)` | `fix/admin-be` |
| **Chí Tín** | **FE — TẤT CẢ Sprint 1** | `👤 CHÍ TÍN (CN)` | `fix/FE-sprint1-full` |
| **Nguyễn Bảo** | DB Migration + Review | `👤 NGUYỄN BẢO (NB)` | `fix/DB-migration` |

---

## 📖 BƯỚC 2: Đọc nghiệp vụ & API Spec trước khi code

- 📄 **Nghiệp vụ:** [`docs/requirements/business-rules.md`](docs/requirements/business-rules.md)
- 📄 **API Spec:** [`docs/api/sprint1-fix/API_SPEC_SPRINT1_FIX.md`](docs/api/sprint1-fix/API_SPEC_SPRINT1_FIX.md)

> ⚠️ **Không tự suy đoán.** Chưa rõ nghiệp vụ → hỏi Bảo. Chưa rõ API → hỏi người phụ trách BE module đó.

---

## 💻 BƯỚC 3: Tạo nhánh và bắt đầu code

```bash
git checkout develop
git pull origin develop
git checkout -b fix/auth-be          # thay bằng tên nhánh của bạn
```

---

## ✅ BƯỚC 4: Tự kiểm tra trước khi đẩy lên

```
[ ] Làm ĐÚNG và ĐỦ task trong phần của mình (không sửa code người khác)
[ ] Test TẤT CẢ Acceptance Criteria trong NHIEM_VU_THANH_VIEN.md
[ ] Code build thành công: mvn clean compile (BE) / không lỗi console (FE)
[ ] Không có file bí mật: .env, client-secret, password DB
[ ] Không có thư mục rác: target/, .idea/, node_modules/
[ ] Không còn System.out.println() hay console.log() debug
```

---

## 📤 BƯỚC 5: Commit đúng cách

```bash
git add .
git commit -m "fix(auth): validate email trùng trả lỗi EMAIL_EXISTED BR-01-1"

# Đồng bộ develop trước khi push:
git fetch origin && git merge origin/develop

git push -u origin fix/auth-be       # tên nhánh của bạn
```

**❌ Commit SAI:** `fix bug` / `update` / `xong rồi`

**✅ Commit ĐÚNG:**
```bash
git commit -m "fix(auth): bật route /api/v1/users/** authenticated BR-05-2"
git commit -m "feat(fe): thêm toast system dùng chung cho toàn bộ app BR-01-2"
git commit -m "feat(fe): form upload CMND 2 mặt + validate thiếu mặt BR-02-3"
```

---

## 🔀 BƯỚC 6: Tạo Pull Request

1. GitHub → **New Pull Request** → Base: `develop` ← Compare: nhánh của bạn
2. Tiêu đề: `[fix/feat] Mô tả ngắn gọn`
3. **Reviewer:** Nguyễn Bảo
4. Dán checklist AC đã tick vào mô tả PR

---

## ⏳ THỨ TỰ MERGE (Bảo quyết định — quan trọng)

```
Bước 1 (song song — BE không chờ nhau):
  Vĩ    → fix/auth-be
  Quân  → fix/profile-be
  Phát  → feature/google-car-be
         ↓
Bước 2 (sau Quân merge):
  Khiêm → fix/admin-be
         ↓
Bước 3 (sau TẤT CẢ BE merge xong):
  Chí Tín → fix/FE-sprint1-full   ← Chờ đủ API mới build FE hoàn chỉnh
         ↓
Bước 4:
  Bảo → fix/DB-migration          ← Migration + review cuối
```

> ⚠️ **Chí Tín:** Có thể code FE với mock data trước, nhưng **phải chờ BE merge** mới test thực tế và tạo PR.

> ⛔ Không tự merge vào `develop` — chờ Bảo duyệt PR.

---

## 🚫 KHÔNG ĐƯỢC LÀM

| Không được | Lý do |
|---|---|
| Chí Tín sửa file BE (`.java`) | Ngoài phạm vi |
| BE dev sửa file FE của Chí Tín | Gây conflict |
| Push thẳng vào `develop` / `main` | Vi phạm quy tắc |
| Làm Sprint 2 (đặt xe, thanh toán, thông báo) | Ngoài phạm vi Sprint 1 |
| Commit `application.properties` có secret | Lộ thông tin |

---

## 📞 Cần hỏi ai?

| Vấn đề | Hỏi ai |
|---|---|
| Nghiệp vụ không rõ | **Bảo** (Project Lead) |
| Conflict Git / merge | **Bảo** |
| API Auth (login, register, JWT) | **Vĩ** |
| API Profile / Upload / Cloudinary | **Duy Quân** |
| API Google OAuth2 / Car | **Phát** |
| API Admin / CMND / xe duyệt | **Lộc Khiêm** |
| FE component / CSS / JS | **Chí Tín** |

---

*Cập nhật: 19/09/2026 — Sprint 1 Fix & Bổ sung*
