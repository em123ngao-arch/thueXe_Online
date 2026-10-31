# CẨM NANG & QUY TRÌNH PHÁT TRIỂN KIẾN TRÚC LỤC GIÁC (HEXAGONAL ARCHITECTURE)
> **Dành cho tất cả thành viên trong nhóm & Hướng dẫn cấu hình AI Coding Assistant**

---

## 1. Bối Cảnh & Tại Sao Phải Tuân Thủ Tuyệt Đối?

Dự án **DriveShare** đã hoàn tất chuyển đổi toàn bộ 11 modules sang **Kiến trúc Lục giác (Hexagonal Architecture / Ports & Adapters)**. 
- Giảng viên hướng dẫn đã có lưu ý quan trọng: *"Refactor full thì dễ bị bể chức năng đó"*.
- **Cách duy nhất để không bị "bể chức năng"** là toàn bộ thành viên và các công cụ AI hỗ trợ (Cursor, Copilot, Antigravity, Claude Code) **phải đồng bộ 100% quy chuẩn kiến trúc** và để **ArchUnit (7 bài test tự động)** bảo vệ ranh giới code.

---

## 2. Cấu Trúc 3 Tầng Chuẩn Trong Mỗi Module

Mỗi module nghiệp vụ trong `backend/src/main/java/com/driveshare/modules/<ten-module>/` được phân chia thành đúng 3 tầng:

```text
modules/<ten-module>/
├── domain/                      <-- TẦNG 1: CORE NGHIỆP VỤ (PURE JAVA 21)
│   ├── *Record.java             <-- Model dữ liệu bất biến (Immutable Record)
│   └── *Policy.java             <-- Thuật toán & quy tắc nghiệp vụ thuần túy
│
├── application/                 <-- TẦNG 2: ỨNG DỤNG & PORTS (USE CASES)
│   ├── port/
│   │   ├── in/                  <-- Inbound Ports: Interface Use Case cho Controller/Module khác gọi
│   │   └── out/                 <-- Outbound Ports: Interface kết nối DB, thanh toán, email...
│   ├── usecase/                 <-- Lớp cài đặt (Implement) của Inbound Ports
│   └── command/, result/        <-- DTO tham số đầu vào và đầu ra của Use Case
│
└── adapter/                     <-- TẦNG 3: HẠ TẦNG (INFRASTRUCTURE ADAPTERS)
    ├── in/web/                  <-- REST Controller (@RestController)
    └── out/persistence/         <-- JPA Entities, Spring Data Repositories, Persistence Adapters
```

---

## 3. Bộ 7 Quy Tắc "Bất Di Bất Dịch" (ArchUnit Tự Động Bắt Lỗi)

Nếu vi phạm 1 trong 7 quy tắc này, lệnh `mvnw test` sẽ **BÁO ĐỎ NGAY LẬP TỨC** và không thể merge code:

| STT | Tầng bị cấm | Điều cấm kỵ | Lý do kỹ thuật |
| :---: | :--- | :--- | :--- |
| **1** | `domain` | **CẤM** import Spring, JPA, Hibernate, Jackson, Validation (`org.springframework.*`, `jakarta.persistence.*`, `jakarta.validation.*`) | Domain phải là Java thuần túy, độc lập 100% khỏi framework. |
| **2** | `domain` | **CẤM** phụ thuộc vào `application` hay `adapter` | Chiều phụ thuộc luôn hướng vào trong tâm Domain. |
| **3** | `application` | **CẤM** import bất kỳ class nào trong `adapter` | Application chỉ định nghĩa Interface (`port.out`), không phụ thuộc hạ tầng cụ thể. |
| **4** | `application` | **CẤM** import JPA, Hibernate, Spring Data (`jakarta.persistence.*`, `org.springframework.data.*`) | Mọi thao tác lưu trữ phải qua Outbound Port. |
| **5** | `adapter.in.web` | **CẤM** Controller gọi trực tiếp Persistence/Repository | Controller **CHỈ ĐƯỢC** inject và gọi Inbound Port (`application.port.in`). |
| **6** | `application` | **CẤM** các Module gọi trực tiếp tầng Application nội bộ của nhau | Đảm bảo tính độc lập và module hóa cao. |
| **7** | Giao tiếp chéo | Khi Module A gọi Module B: **BẮT BUỘC chỉ được gọi qua `application.port.in`** hoặc DTO công khai của B | Không được chọc vào usecase nội bộ hay adapter của module khác. |

---

## 4. Quy Trình 5 Bước Khi Viết Chức Năng Mới (Feature) Hoặc Sửa Lỗi (Bug)

Khi bạn (hoặc AI của bạn) viết code, hãy làm theo đúng thứ tự:

1. **Bước 1 - Định nghĩa Domain**: Tạo Model thuần Java (`Record`) hoặc quy tắc tính toán (`Policy`) trong `domain/`.
2. **Bước 2 - Định nghĩa Ports**:
   - Nếu Controller cần gọi: Khai báo interface Use Case trong `application/port/in/`.
   - Nếu cần lưu Database: Khai báo interface Repository trong `application/port/out/`.
3. **Bước 3 - Viết Use Case**: Viết class implement Inbound Port trong `application/usecase/`, inject Outbound Port để tương tác DB.
4. **Bước 4 - Viết Adapter**:
   - Web Adapter: Controller trong `adapter/in/web/` chỉ inject Inbound Port, trả về `ApiResponse<T>`.
   - Persistence Adapter: Class trong `adapter/out/persistence/` implement Outbound Port, inject `JpaRepository`.
5. **Bước 5 - Chạy Test Kiểm Tra**:
   ```powershell
   cd backend
   .\mvnw.cmd test
   ```
   *Bắt buộc toàn bộ test phải pass (239/240 tests, bao gồm 7 bài kiểm thử kiến trúc ArchUnit).*

---

## 5. Hướng Dẫn Cấu Hình Cho Các Công Cụ AI Của Thành Viên

Dự án đã được cấu hình sẵn các file chỉ thị giúp AI của từng thành viên tự động hiểu và không bao giờ sinh code sai:

* **Nếu bạn dùng Cursor IDE**: 
  - Đã có file `.cursorrules` ở thư mục gốc. Bạn chỉ cần prompt bình thường, Cursor sẽ tự động tuân thủ Hexagonal và không bao giờ import JPA vào Domain hay để Controller gọi Repository.
* **Nếu bạn dùng VS Code + GitHub Copilot**:
  - Đã có file `.github/copilot-instructions.md`. GitHub Copilot Chat và Code Completion sẽ tự động áp dụng đúng chuẩn Ports & Adapters.
* **Nếu bạn dùng Antigravity / Claude Code**:
  - Đã có file `AGENTS.md` và `CLAUDE.md`. Agent sẽ tự động kiểm tra ArchUnit và hook `guard-core-imports.py`.

---

## 6. Quy Trình Phối Hợp Git 5 Bước (Chống Ghi Đè & Xung Đột)

1. **Kéo code mới nhất**:
   ```bash
   git checkout develop && git pull origin develop
   ```
2. **Tạo nhánh riêng theo task**:
   ```bash
   git checkout -b feature/DS-<so-task>-<ten-tinh-nang>
   ```
3. **Code & chạy test local**:
   ```powershell
   cd backend; .\mvnw.cmd test
   ```
4. **Đồng bộ với develop trước khi mở PR**:
   ```bash
   git fetch origin && git merge origin/develop
   ```
   *(Nếu có xung đột, giải quyết local và test lại).*
5. **Tạo PR vào `develop`**:
   - Đẩy nhánh lên GitHub, mở PR vào `develop`.
   - Đính kèm ảnh chụp màn hình `.\mvnw.cmd test` đã pass.
