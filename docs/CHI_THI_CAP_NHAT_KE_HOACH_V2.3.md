# CHỈ THỊ CHO AI AGENT: CẬP NHẬT KẾ HOẠCH HEXAGONAL LÊN V2.3

> Đối tượng đọc: AI Agent trong Antigravity IDE.
> Đầu vào: `KE_HOACH_HEXAGONAL_DRIVESHARE.md` bản V2.2 và `AGENTS.md`.
> Đầu ra: bản **V2.3** của file kế hoạch. **Chỉ sửa tài liệu. KHÔNG sửa code, KHÔNG tạo nhánh, KHÔNG chạy refactor.** Sau khi xong, dừng lại chờ con người duyệt.

Chủ dự án đã quyết định: **cả 11 module đều áp dụng Hexagonal ĐẦY ĐỦ**. Không còn nhóm "Light". Đồng thời cần xử lý 6 điểm kỹ thuật còn tồn đọng ở bản V2.2 (nhóm P và nhóm Q bên dưới).

---

## PHẦN 1. THAY ĐỔI PHẠM VI: 11/11 MODULE ĐẦY ĐỦ

### 1.1 Sửa Mục F
Xóa nhóm "Light Hexagonal". Cả 11 module (`ai`, `rag`, `auth`, `user`, `car`, `payment`, `rental`, `notification`, `oauth2`, `admin`, `health`) đều theo cấu trúc 3 tầng `domain / application / adapter`, có Inbound/Outbound Port, và chịu toàn bộ luật ArchUnit.

### 1.2 Định nghĩa "đầy đủ" cho module mỏng (để tránh code rác)
"Đầy đủ" nghĩa là mọi module đi qua đủ 3 tầng và giao tiếp bằng port. **Không có nghĩa là tạo class giả.** Quy định rõ trong kế hoạch:
- `domain/` chỉ chứa thứ thật sự tồn tại trong module: model/value object/policy/exception có logic hoặc trạng thái thật. Nếu module không có khái niệm domain (ví dụ `health`), thư mục `domain/` có thể rỗng hoặc không tạo, và ghi rõ lý do trong kế hoạch. Cấm tạo POJO chỉ để "cho đủ".
- Mọi module có DB: có `JpaEntity` riêng trong `adapter/out/persistence` + mapper + `RepositoryAdapter`, theo đúng quy tắc D1/D2.
- Mọi controller là `adapter/in/web`, chỉ gọi inbound port.
- Module chỉ gọi ra ngoài (`oauth2` gọi Google, `health` kiểm tra DB) có outbound port tương ứng (ví dụ `GoogleIdentityPort`, `DatabaseHealthPort`).

### 1.3 Module `admin` (khó nhất trong nhóm mỏng)
`admin` đọc và thao tác trên hầu hết module khác. Quy định:
- Mỗi module khác phải cung cấp **inbound port dạng truy vấn/thao tác dành cho admin** (ví dụ `car`: `ApproveCarUseCase`, `ListCarsForAdminUseCase`; `rental`: `ListRentalsForAdminUseCase`, `ResolveDisputeUseCase`; `user`: `VerifyUserDocumentUseCase`...).
- `admin` định nghĩa outbound port tương ứng và adapter gọi các inbound port đó. **Không** inject repository hay entity của module khác.
- Liệt kê đầy đủ các port này trong kế hoạch dựa trên ma trận phụ thuộc thật của `admin` (kiểm kê từ code).

### 1.4 Sắp xếp lại thứ tự giai đoạn (giảm số adapter chuyển tiếp)
`rental` phụ thuộc `user` và `notification` (theo A5), `oauth2` phụ thuộc `auth`/`user`. Làm các module này **trước** `rental` để bớt nợ kỹ thuật. Đề xuất, AI có thể điều chỉnh nếu kiểm kê A5 cho thấy hợp lý hơn và phải giải thích:

| Giai đoạn | Module |
| :--- | :--- |
| 0 | Baseline, `common/`, `ImageStoragePort` |
| 1 (Pilot) | `ai`, `rag` |
| 2 | `auth`, `user`, `notification`, `oauth2` |
| 3 | `car` |
| 4 | `payment` |
| 5 | `rental` |
| 6 | `admin`, `health`, dọn `@TechnicalDebt`, đồng bộ tài liệu |

Giữ nguyên điểm dừng review sau Pilot. Nên có thêm một điểm dừng review sau Giai đoạn 3 (vì `car` là nơi sửa lớn nhất về khóa và quan hệ JPA).

### 1.5 Cập nhật các mục liên quan
- **Mục E (ArchUnit):** luật `slices()` áp dụng cho cả 11 module; cập nhật chú thích rằng không còn module "light" nào được miễn.
- **Mục I (bảo vệ):** bỏ câu "tinh gọn cho các module CRUD". Thay bằng: toàn bộ 11 module tuân thủ Hexagonal; module nào không có logic domain thì không tạo domain giả (nêu lý do kỹ thuật).
- **Mục J (tiến độ):** tính lại thời gian cho phạm vi mới. Ước lượng tham khảo của chủ dự án: **khoảng 16–20 ngày làm việc** (chưa tính thời gian review). AI tự tính theo từng giai đoạn, ghi rõ giả định và đây là ước lượng.
- **Mục K:** thêm bảng đối soát chỉ thị V2.3 này.

---

## PHẦN 2. NHÓM P: SỬA TRƯỚC KHI CHẠY PILOT

### P1. Cách tạo baseline schema
Sửa Mục D1 và Bước Tiên Quyết:
- Baseline DDL phải tạo bằng **code cũ (tag `v1.0.0-layered-baseline`) chạy trên DB RỖNG**, không dump từ DB dev đang dùng lâu ngày (DB cũ có thể còn bảng/cột mồ côi gây diff giả).
- Thêm `--no-owner --no-privileges` vào lệnh `pg_dump` để giảm nhiễu.
- Đối chiếu tên container và tên DB (`driveshare-postgres`, `driveshare_db`) với `docker-compose.yml` thực tế và sửa nếu khác.
- Hai lần so sánh vẫn giữ: (a) code mới trên DB rỗng so với baseline; (b) code mới khởi động trên DB đã có dữ liệu, dump trước/sau khởi động phải giống nhau.

### P2. Chỗ lưu file baseline
Các file `openapi_baseline.json` và `schema_baseline.sql` được tạo sau khi gắn tag nên không thể commit trực tiếp vào `develop`. Quy định một trong hai: (1) đưa qua PR riêng `chore/baseline-snapshots`, hoặc (2) lưu ngoài repo/thư mục được `.gitignore`. Ghi rõ bước khởi động ứng dụng ở tag trước khi chụp OpenAPI.

### P3. Luật ArchUnit 2 và 3 bỏ sót `common`
Thêm `..common.adapter..` và `..common.persistence..` vào danh sách package bị cấm đối với `domain` (luật 2) và `application` (luật 3), để `application` không import được `CloudinaryStorageAdapter` hay `BaseJpaEntity`.

---

## PHẦN 3. NHÓM Q: SỬA TRƯỚC GIAI ĐOẠN 3 (`car`)

### Q1. Sửa đích gọi của `CarDataQueryPort`
Ở C2 và Giai đoạn 3, kế hoạch ghi `CarDataQueryLegacyAdapter` sẽ chuyển sang gọi `CheckCarAvailabilityUseCase`. Sai: port đó chỉ trả lời "xe có trống lịch không", không cung cấp dữ liệu xe cho `ai`. Thêm một inbound port riêng của `car` (ví dụ `QueryCarSummariesUseCase`) trả về result ở `car.application.result`, và sửa mọi chỗ nhắc đến.

### Q2. Kiểm kê quan hệ JPA và JOIN chéo module (BẮT BUỘC trước khi làm `car`)
A5 mới liệt kê repository được inject. Thêm mục kiểm kê mới, dựa trên code thật:
- Mọi `@ManyToOne`, `@OneToMany`, `@OneToOne`, `@JoinColumn` trỏ sang entity của module khác.
- Mọi câu JPQL/native query có JOIN hoặc FETCH sang entity module khác.

Với mỗi trường hợp, kế hoạch phải chọn và ghi rõ một hướng:
1. **Tham chiếu bằng ID** (đổi ở tầng Java, giữ nguyên tên cột trong DB), và viết lại truy vấn tương ứng, hoặc
2. **Ngoại lệ có chủ đích** ở tầng persistence (adapter được phép biết JpaEntity của module kia), ghi rõ trong luật ArchUnit để không bị đỏ oan.

Không được để việc di chuyển `Car` sang `CarJpaEntity` làm gãy entity/truy vấn của module khác mà kế hoạch không đề cập.

### Q3. Chiều chuyển tiếp ngược (module cũ gọi module đã refactor)
C2 chỉ mô tả "module đã refactor gọi module cũ". Bổ sung chiều ngược lại: khi `car` hoàn thành ở Giai đoạn 3, `rental`, `payment` và `admin` (nếu chưa refactor) vẫn đang inject `CarRepository` cũ. Quy định rõ một trong hai cách: giữ nguyên `CarRepository`/entity cũ cho tới khi mọi bên dùng được chuyển, hoặc sửa các bên dùng cũ trong cùng PR của `car` để đi qua adapter mới. Áp dụng tương tự cho mọi module khác trong thứ tự giai đoạn mới.

### Q4. Tổng quát hóa luật cách ly module (luật 7)
Luật 7 hiện chỉ phủ cặp `rental → car`. Thay bằng một `ArchCondition` tổng quát: lớp thuộc module X chỉ được phụ thuộc lớp thuộc module Y khác ở các package `application.port.in`, `application.command`, `application.result`. Miễn trừ có kiểm soát cho: các lớp tên `*LegacyAdapter`, và các module chưa được refactor ở thời điểm đó. Danh sách module đã refactor và danh sách miễn trừ phải được cập nhật sau mỗi giai đoạn. Cổng cuối dự án: danh sách miễn trừ rỗng.

---

## PHẦN 4. QUY TẮC KHI CẬP NHẬT

1. Giữ nguyên những phần đã đúng của V2.2 (git flow, quy tắc JPA `@Table`/`@Entity(name)`, mẫu `save()`, khóa `REQUIRED`, `LockedCarResult`, `ImageStoragePort`...). Chỉ sửa những gì chỉ thị này yêu cầu.
2. Không thêm cam kết mà chưa kiểm chứng từ code. Chỗ nào chưa chắc (tên container, số dòng, tên file test), ghi rõ "cần xác minh" thay vì khẳng định.
3. Thay mọi con số cứng về số lượng test trong `ci.yml`/`AGENTS.md` bằng cách diễn đạt không phụ thuộc con số (ví dụ "toàn bộ test phải pass"), hoặc ghi rõ là số tại thời điểm đo.
4. Cuối file giữ **Nhật ký thay đổi V2.3**: bảng liệt kê từng mục 1.1–1.5, P1–P3, Q1–Q4 và vị trí đã áp dụng trong tài liệu.
5. **Dừng lại sau khi cập nhật xong tài liệu.** Báo cáo ngắn: đã sửa những mục nào, mục nào chưa chắc cần con người quyết, và danh sách module/quan hệ JPA đã kiểm kê ở Q2.
