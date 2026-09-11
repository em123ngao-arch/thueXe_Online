# 📖 BẢNG GIẢI THÍCH THUẬT NGỮ — DriveShare

> Để khi ai hỏi thì giải thích được luôn, không cần Google.

---

## 🔵 NHÓM 1: SCRUM & QUẢN LÝ DỰ ÁN

| Thuật ngữ | Là gì? | Ví dụ trong dự án |
|---|---|---|
| **Scrum** | Cách quản lý dự án chia nhỏ công việc thành từng đợt ngắn (sprint), làm xong đợt này mới qua đợt sau | Nhóm mình dùng Scrum, chia 3 Sprint để làm DriveShare |
| **Sprint** | 1 đợt làm việc, thường 2 tuần. Cuối sprint phải có sản phẩm chạy được | Sprint 1 làm đăng ký + đăng xe, Sprint 2 làm đặt xe + thanh toán |
| **Sprint 0** | Sprint đặc biệt để chuẩn bị: setup project, thiết kế DB, phân công. Chưa code tính năng | Mình đang ở Sprint 0 — thiết kế database, viết backlog |
| **Product Backlog** | Danh sách TẤT CẢ việc cần làm của cả dự án, xếp theo thứ tự ưu tiên | File Excel DriveShare_TienDo.xlsx chính là Product Backlog |
| **Epic** | Nhóm tính năng lớn, gom nhiều Story liên quan | EPIC-05: Đặt xe — gom US-06 (Đặt xe) + US-07 (Hủy đổi lịch) |
| **User Story** | 1 tính năng nhìn từ góc độ người dùng: "Là ai, muốn làm gì, để được gì" | US-06: "Là Renter, tôi muốn đặt xe, để thuê xe đi chơi" |
| **Subtask** | Việc nhỏ bên trong 1 Story, giao cho 1 người cụ thể | [BE] API đặt xe, [FE] Form đặt xe, [Test] Kiểm thử đặt xe |
| **Acceptance Criteria** | Tiêu chí để biết Story này đã XONG hay chưa. Như checklist bắt buộc | "Đặt trùng lịch → báo lỗi" — nếu chưa xử lý thì Story chưa Done |
| **Definition of Done (DoD)** | Quy định chung: thế nào là "xong" (code xong, test xong, review xong, merge xong) | DoD của nhóm: code chạy + test pass + đã review + merge vào main |
| **Velocity** | Tốc độ làm việc của nhóm — Sprint này xong bao nhiêu Story | Sprint 1 xong 5 Story = velocity 5 |
| **Burndown Chart** | Biểu đồ thể hiện công việc còn lại giảm dần theo thời gian trong Sprint | Jira tự vẽ burndown, nếu đường không xuống = team đang chậm |

---

## 🟢 NHÓM 2: KIẾN TRÚC & CÔNG NGHỆ

| Thuật ngữ | Là gì? | Ví dụ trong dự án |
|---|---|---|
| **Spring Boot** | Framework Java để xây dựng backend (phần xử lý logic phía server) | Mình dùng Spring Boot làm API cho DriveShare |
| **React** | Thư viện JavaScript để xây giao diện web (frontend — phần người dùng nhìn thấy) | Trang tìm xe, form đặt xe được viết bằng React |
| **REST API** | Cách frontend và backend nói chuyện với nhau qua HTTP. Gửi request → nhận response dạng JSON | FE gọi `POST /api/bookings` → BE tạo đơn → trả JSON kết quả |
| **JSON** | Định dạng dữ liệu mà BE và FE trao đổi, kiểu key-value dễ đọc | `{ "brand": "Toyota", "price": 800000 }` |
| **Frontend (FE)** | Phần giao diện người dùng nhìn thấy và tương tác — chạy trên trình duyệt | Trang đăng nhập, form đặt xe, dashboard admin |
| **Backend (BE)** | Phần xử lý logic, lưu dữ liệu — chạy trên server, người dùng không thấy | Kiểm tra xung đột lịch, tính tiền, gửi email |
| **Database (DB)** | Nơi lưu trữ toàn bộ dữ liệu: user, xe, booking, thanh toán... | MySQL — file `database_schema.sql` là bản thiết kế |
| **MySQL** | Hệ quản trị cơ sở dữ liệu quan hệ, lưu dữ liệu dạng bảng | Dự án dùng MySQL 8.0 |
| **WebSocket** | Kênh giao tiếp 2 chiều real-time giữa server và client. Khác HTTP ở chỗ server có thể chủ động gửi tin | Khi Owner duyệt booking → Renter nhận thông báo ngay lập tức |
| **Scheduler** | Chương trình chạy tự động theo lịch, không cần ai bấm | Mỗi phút kiểm tra: đơn nào quá 24h chưa duyệt → tự hủy |
| **Middleware** | Lớp xử lý trung gian, đứng giữa request và controller, kiểm tra trước khi cho đi tiếp | Spring Security đứng giữa — kiểm tra token trước khi cho gọi API |

---

## 🟡 NHÓM 3: DATABASE (CƠ SỞ DỮ LIỆU)

| Thuật ngữ | Là gì? | Ví dụ trong dự án |
|---|---|---|
| **Table (Bảng)** | Nơi lưu 1 loại dữ liệu, giống 1 sheet Excel | Bảng `users` lưu thông tin người dùng, bảng `cars` lưu thông tin xe |
| **Column (Cột)** | 1 trường thông tin trong bảng | Cột `email`, `full_name`, `phone` trong bảng `users` |
| **Row (Dòng)** | 1 bản ghi cụ thể | 1 dòng trong bảng `users` = 1 người dùng cụ thể |
| **Primary Key (PK)** | Cột định danh duy nhất cho mỗi dòng, không trùng nhau | `users.id` = 1, 2, 3... mỗi user 1 id riêng |
| **Foreign Key (FK)** | Cột tham chiếu tới PK của bảng khác → tạo quan hệ giữa 2 bảng | `bookings.renter_id` trỏ tới `users.id` → biết ai đặt xe |
| **UNIQUE** | Ràng buộc không cho trùng giá trị | `cars.license_plate` UNIQUE → 2 xe không thể cùng biển số |
| **INDEX** | "Mục lục" giúp tìm dữ liệu nhanh hơn, giống mục lục sách | Index trên `cars.status` → tìm xe ACTIVE nhanh hơn rất nhiều |
| **CHECK** | Ràng buộc giá trị phải thỏa điều kiện | `CHECK (rating BETWEEN 1 AND 5)` → không cho chấm 0 sao hoặc 6 sao |
| **CASCADE** | Khi xóa cha → tự động xóa con theo | Xóa xe → tự xóa tất cả ảnh xe (`ON DELETE CASCADE`) |
| **RESTRICT** | Không cho xóa cha nếu còn con | Không xóa được user nếu user đó còn booking |
| **SET NULL** | Khi xóa cha → cột FK ở con chuyển thành NULL | Xóa staff → `cars.approved_by` thành NULL (không mất data xe) |
| **Soft Delete** | Không xóa thật, chỉ đánh dấu `is_deleted = true` | Xóa xe nhưng dữ liệu vẫn còn trong DB để tra cứu lịch sử |
| **Snapshot** | Chụp lại giá trị tại 1 thời điểm, không bị ảnh hưởng khi thay đổi sau | `price_per_day_snapshot` — lưu giá lúc đặt, chủ xe đổi giá sau cũng không ảnh hưởng |
| **ERD (Entity Relationship Diagram)** | Sơ đồ vẽ quan hệ giữa các bảng | Bảng `users` → 1-N → bảng `cars` (1 user có nhiều xe) |
| **1-1, 1-N, N-N** | Quan hệ giữa các bảng: 1 với 1, 1 với nhiều, nhiều với nhiều | User ↔ RenterProfile = 1-1. User ↔ Cars = 1-N. Cars ↔ Amenities = N-N |
| **ENGINE=InnoDB** | Loại engine MySQL hỗ trợ FK, transaction — mặc định và phổ biến nhất | Tất cả bảng dùng InnoDB |
| **utf8mb4** | Bảng mã hỗ trợ tiếng Việt, emoji, ký tự đặc biệt | Để lưu được "Nguyễn Văn Ạ" và emoji 🚗 |
| **DECIMAL(12,2)** | Kiểu số thập phân, 12 chữ số tổng, 2 chữ số sau dấu phẩy | Giá tiền: 1,500,000.00đ — không dùng FLOAT vì FLOAT bị sai số |
| **TIMESTAMP** | Kiểu dữ liệu lưu ngày giờ, tự cập nhật khi sửa bản ghi | `updated_at` tự thay đổi mỗi khi sửa thông tin xe |

---

## 🔴 NHÓM 4: API & GIAO TIẾP

| Thuật ngữ | Là gì? | Ví dụ trong dự án |
|---|---|---|
| **API (Application Programming Interface)** | "Cửa sổ" để FE gọi vào BE lấy/gửi dữ liệu | `GET /api/cars/search` → FE gọi để lấy danh sách xe |
| **Endpoint** | 1 đường dẫn API cụ thể | `/api/bookings/{id}/confirm` là 1 endpoint |
| **GET** | Lấy dữ liệu (đọc, không thay đổi gì) | `GET /api/cars/5` → lấy thông tin xe có id = 5 |
| **POST** | Tạo dữ liệu mới | `POST /api/bookings` → tạo đơn đặt xe mới |
| **PUT** | Cập nhật dữ liệu đã có | `PUT /api/bookings/1/confirm` → xác nhận đơn số 1 |
| **DELETE** | Xóa dữ liệu | `DELETE /api/favorites/3` → bỏ yêu thích xe |
| **Request** | Dữ liệu FE gửi lên BE | `{ "carId": 5, "startDate": "2026-09-15" }` |
| **Response** | Dữ liệu BE trả về FE | `{ "status": "SUCCESS", "bookingCode": "DS20260915001" }` |
| **HTTP Status Code** | Mã số cho biết kết quả: 200 = OK, 400 = lỗi client, 401 = chưa đăng nhập, 404 = không tìm thấy, 500 = lỗi server | Đặt xe trùng lịch → trả 409 Conflict |
| **Pagination** | Chia kết quả thành nhiều trang thay vì trả hết 1 lần | Tìm xe ra 500 kết quả → trả mỗi trang 20 xe |
| **Filter** | Lọc dữ liệu theo điều kiện | Lọc xe: giá 500k-1tr, 4 chỗ, số tự động |
| **Swagger** | Công cụ tự tạo tài liệu API, có giao diện để test thử | Mở `/swagger-ui` → thấy tất cả API, bấm "Try it out" để test |
| **Webhook** | API ngược: bên thứ 3 gọi vào hệ thống mình khi có sự kiện | VNPay thanh toán xong → gọi webhook vào BE để xác nhận |
| **DTO (Data Transfer Object)** | Object trung gian chuyển dữ liệu giữa các tầng, chỉ chứa field cần thiết | `BookingResponseDTO` chỉ trả những field FE cần, không trả password_hash |
| **Validation** | Kiểm tra dữ liệu đầu vào có hợp lệ không | Email phải có @, giá phải > 0, biển số không được trống |

---

## 🟣 NHÓM 5: BẢO MẬT & PHÂN QUYỀN

| Thuật ngữ | Là gì? | Ví dụ trong dự án |
|---|---|---|
| **JWT (JSON Web Token)** | "Thẻ ra vào" — chuỗi mã hóa chứa thông tin user, gửi kèm mỗi request để BE biết ai đang gọi | Đăng nhập xong → nhận JWT → mỗi lần gọi API gửi kèm token trong header |
| **Access Token** | Token chính, dùng để gọi API, thời hạn ngắn (15 phút - 1 giờ) | Hết hạn → phải dùng Refresh Token để lấy cái mới |
| **Refresh Token** | Token phụ, dùng để xin Access Token mới khi cái cũ hết hạn, thời hạn dài (7 ngày) | Không cần đăng nhập lại mỗi 15 phút |
| **Spring Security** | Module bảo mật của Spring Boot, xử lý đăng nhập + phân quyền | Tự chặn API nếu không có token hoặc không đủ quyền |
| **RBAC (Role-Based Access Control)** | Phân quyền theo vai trò: mỗi role được làm những gì | ROLE_RENTER chỉ đặt xe, ROLE_OWNER quản lý xe, ROLE_ADMIN quản lý hết |
| **password_hash** | Mật khẩu đã được mã hóa 1 chiều, không ai đọc ngược lại được | User nhập "123456" → lưu DB thành "a$2b$10$xJ8k..." — không lưu mật khẩu gốc |
| **Bcrypt** | Thuật toán mã hóa mật khẩu phổ biến nhất, mỗi lần mã hóa ra kết quả khác nhau | Dùng BCryptPasswordEncoder trong Spring Security |
| **Authorization** | Kiểm tra quyền: đã đăng nhập rồi, nhưng có QUYỀN làm việc này không? | Staff mới được duyệt xe, Renter gọi API duyệt xe → 403 Forbidden |
| **Authentication** | Xác thực: xác minh "bạn là ai?" | Gửi email + password → BE kiểm tra đúng → xác thực thành công |

---

## 🟠 NHÓM 6: NGHIỆP VỤ DỰ ÁN

| Thuật ngữ | Là gì? | Ví dụ trong dự án |
|---|---|---|
| **State Machine** | Mô hình quản lý trạng thái: từ trạng thái A chỉ được chuyển sang B hoặc C, không nhảy lung tung | Booking: PENDING → CONFIRMED → DEPOSIT_PAID → ... (không nhảy thẳng PENDING → COMPLETED) |
| **Deposit (Đặt cọc)** | Tiền đặt trước để giữ chỗ, thường 30% tổng tiền | Thuê 3 ngày × 800k = 2.4tr → cọc 30% = 720k |
| **GPLX** | Giấy phép lái xe — bắt buộc Renter upload và được Staff duyệt trước khi đặt xe | Renter upload ảnh trước + sau GPLX → Staff kiểm tra → APPROVED |
| **Handover (Bàn giao)** | Quá trình giao/trả xe giữa Owner và Renter, lập biên bản ghi nhận tình trạng | Giao xe: ghi km = 50,000, xăng 80%. Trả xe: km = 50,300, xăng 40% |
| **Extra Fee (Phụ phí)** | Khoản phí phát sinh thêm ngoài tiền thuê | Chạy vượt km → phí 3,000đ/km. Trả trễ → phí 100,000đ/giờ |
| **Refund (Hoàn tiền)** | Trả lại tiền cọc khi hủy đơn, theo chính sách | Hủy trước 48h → hoàn 100%. Hủy sát ngày → hoàn 0% |
| **Auto-expire** | Hệ thống tự hủy đơn khi hết thời gian chờ | Owner 24h không duyệt → đơn tự chuyển EXPIRED |
| **Conflict Check (Kiểm tra xung đột)** | Kiểm tra xe có bị trùng lịch thuê không | Xe A đã có người thuê 15-17/9 → người khác đặt 16-18/9 → BÁO LỖI |
| **Soft Delete** | Đánh dấu "đã xóa" thay vì xóa thật, giữ lại data lịch sử | Owner xóa xe → `is_deleted = true`, xe không hiện nữa nhưng lịch sử booking vẫn còn |
| **Audit Log** | Nhật ký ghi lại hành động quan trọng để truy vết | Admin ban user → ghi log: ai ban, ban ai, lúc nào, lý do gì |

---

## 🔷 NHÓM 7: GIT & LÀM VIỆC NHÓM

| Thuật ngữ | Là gì? | Ví dụ trong dự án |
|---|---|---|
| **Git** | Công cụ quản lý phiên bản code, theo dõi ai sửa gì, lúc nào | Mỗi thành viên commit code lên Git, không gửi ZIP qua Zalo |
| **Branch (Nhánh)** | Bản sao code để làm tính năng riêng, không ảnh hưởng code chính | `feature/be-dang-ky` = nhánh BE làm đăng ký |
| **Commit** | Lưu 1 phiên bản code với ghi chú thay đổi gì | `git commit -m "Thêm API đăng ký user"` |
| **Merge** | Gộp code từ nhánh phụ vào nhánh chính | Làm xong đăng ký → merge `feature/be-dang-ky` vào `main` |
| **Pull Request (PR)** | Yêu cầu merge code, đội sẽ review trước khi gộp | Phát tạo PR → Vĩ review code → approve → merge |
| **Conflict** | 2 người sửa cùng 1 file cùng 1 chỗ → Git không biết giữ bản nào | Phát và Khiêm cùng sửa UserService.java dòng 50 → conflict |
| **main / master** | Nhánh chính, code ổn định, luôn chạy được | Chỉ merge vào main khi code đã test xong |

---

## 🧪 NHÓM 8: TESTING

| Thuật ngữ | Là gì? | Ví dụ trong dự án |
|---|---|---|
| **Postman** | Công cụ để test API — gửi request và xem response mà không cần FE | Bắn `POST /api/bookings` bằng Postman để test BE trước khi FE làm xong |
| **Unit Test** | Test 1 hàm/method riêng lẻ, xem nó chạy đúng không | Test hàm `calculateExtraFee()` — truyền km vượt → ra đúng tiền |
| **Edge Case** | Trường hợp "biên" — dữ liệu bất thường, hay gây lỗi | Km cuối < km nhận, giá = 0, email không có @, ngày trả trước ngày nhận |
| **Happy Path** | Luồng lý tưởng — mọi thứ đều đúng, không lỗi | Đặt xe → Owner duyệt → cọc → giao → trả → xong |
| **QA (Quality Assurance)** | Đảm bảo chất lượng — kiểm tra toàn bộ trước khi giao | Tín là QA — test hết 15 Story trước khi demo |

---

## 💡 MẸO TRẢ LỜI KHI BỊ HỎI

**Nếu bị hỏi "Tại sao dùng JWT mà không dùng Session?"**
> JWT là stateless — server không cần lưu session, dễ scale. Phù hợp REST API vì mỗi request tự mang thông tin xác thực.

**Nếu bị hỏi "Tại sao lưu snapshot giá?"**
> Vì chủ xe có thể đổi giá bất kỳ lúc nào. Nếu không snapshot, đơn cũ sẽ bị tính giá mới → sai. Snapshot giữ giá đúng tại thời điểm đặt.

**Nếu bị hỏi "Tại sao soft delete mà không xóa thật?"**
> Vì cần giữ lịch sử. Nếu xóa user thật → tất cả booking, review, payment liên quan sẽ mất. Soft delete chỉ ẩn đi nhưng data vẫn còn.

**Nếu bị hỏi "Tại sao tách FE và BE riêng?"**
> Để làm song song — FE và BE code độc lập, chỉ giao tiếp qua API. 1 bên sửa không ảnh hưởng bên kia. Cũng dễ thay đổi FE (web → mobile) mà không đụng BE.

**Nếu bị hỏi "INDEX là gì, sao cần?"**
> Giống mục lục sách. Không có index → tìm 1 xe trong 10,000 xe phải duyệt từng dòng. Có index → nhảy thẳng tới, nhanh gấp trăm lần.

**Nếu bị hỏi "State Machine để làm gì?"**
> Để booking không nhảy trạng thái bừa. Không thể từ PENDING nhảy thẳng COMPLETED — phải qua CONFIRMED → DEPOSIT_PAID → IN_PROGRESS → COMPLETED. Đảm bảo luồng đúng logic.
