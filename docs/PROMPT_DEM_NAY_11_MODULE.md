# PROMPT CHO AI AGENT: CHUYỂN CẢ 11 MODULE SANG HEXAGONAL TRONG MỘT ĐÊM

> Đọc `AGENTS.md` và `KE_HOACH_HEXAGONAL_DRIVESHARE.md` (V2.2: cấu trúc 3 tầng, quy tắc port, JPA, khóa bi quan, ArchUnit). Tài liệu này **ghi đè** phần phạm vi và quy trình của V2.2 cho đêm nay.
> Mục tiêu: **chuyển càng nhiều module càng tốt, theo thứ tự ưu tiên, mỗi module là một commit xanh.** Không sửa tài liệu kế hoạch, không sửa frontend. Không làm bước sửa test OTP.
> Nguyên tắc sống còn: **tại mọi thời điểm, commit gần nhất phải biên dịch được, khởi động được và không có test nào đỏ MỚI so với baseline.** Những gì chưa xanh thì hoàn tác, không để lại nửa vời.

---

## 0. QUY TẮC DỪNG VÀ RÚT LUI

1. Làm trên **một nhánh**: `feature/hex-all` tách từ `develop`. **Không push/merge vào `develop`/`main`.** Chỉ đẩy nhánh của mình.
2. **Mỗi module = một commit** (`refactor(<module>): hexagonal`). Chỉ commit khi đạt cổng kiểm tra ở mục 2.
3. Giới hạn thời gian mỗi module: khoảng 20–30 phút cho module mỏng, 45–60 phút cho `car`, `payment`, `rental`, `admin`. Quá hạn mà chưa xanh thì **hoàn tác riêng module đó** (`git restore .` hoặc `git reset --hard <commit xanh gần nhất>` trên nhánh của bạn), ghi vào báo cáo là "bỏ dở", rồi chuyển module kế tiếp.
4. Cấm xóa, `@Disabled` hoặc làm yếu test để cho xanh. Đổi **cách gọi** trong test, giữ nguyên **hành vi được kiểm chứng**.
5. Cấm `push --force`, cấm sửa `develop`/`main`, cấm đổi URL/JSON của API, cấm đổi schema DB.
6. Không chắc điều gì thì đọc code/test hiện có. Vẫn không chắc thì ghi vào báo cáo và đi tiếp, không đoán bừa trên những chỗ nhạy cảm (tên bảng, khóa, giao dịch).

---

## 1. BƯỚC AN TOÀN (~10–15 PHÚT, LÀM NGAY)

```powershell
git checkout develop
git pull origin develop
cd backend; .\mvnw.cmd test
```
- **Ghi lại baseline thật:** số test chạy, số fail, và **tên chính xác từng test đang fail** (đã biết trước có `OtpServiceImplTest` fail do assert `120` so với `300`; **không sửa nó**). Danh sách test fail này là "baseline đỏ đã biết". Từ nay "không đỏ mới" nghĩa là: tập test fail sau mỗi commit **không có thêm test nào ngoài danh sách baseline**.
- Gắn tag điểm quay lại ngay trên `develop` hiện tại:
  ```powershell
  git tag -a v1.0.0-layered-baseline -m "Baseline truoc Hexagonal"
  git push origin v1.0.0-layered-baseline
  ```
  Tag đã tồn tại hoặc không có quyền push: dừng và báo, không dùng `--force`.
- `git checkout -b feature/hex-all`
- Nếu chưa có test nạp ApplicationContext, thêm **một** test `@SpringBootTest` đơn giản (contextLoads) vào nhánh làm cổng kiểm tra khởi động. Commit riêng.

---

## 2. CỔNG KIỂM TRA TỐI THIỂU CHO MỖI MODULE (RẺ, TỰ ĐỘNG, KHÔNG ĐƯỢC BỎ)

Trước mỗi commit module:
1. `.\mvnw.cmd test-compile` biên dịch sạch.
2. `.\mvnw.cmd test`: **không có test fail ngoài danh sách baseline**; số test chạy không giảm; không `@Disabled` mới.
3. Test contextLoads xanh (không lỗi bean cyclic, không thiếu bean).

### Những lỗi âm thầm KHÔNG ĐƯỢC mắc (vì test thường không bắt được)
- Mọi `*JpaEntity` giữ **đúng tên bảng và cột cũ**: `@Entity(name = "<tên entity cũ>")`, `@Table(name = "<tên bảng cũ>")`, `@Column(name = ...)` không đổi, kiểu và quan hệ không đổi. Đối chiếu với entity gốc từng field một. Dự án chạy `ddl-auto: update` và có `seed_data.sql` dùng tên bảng cố định, nên đổi tên bảng sẽ làm hỏng seed và tạo bảng mới mà không báo lỗi.
- Adapter `save()`: load entity đang quản lý rồi cập nhật, không tạo `new` entity thay thế (mất `@Version`, `createdAt`).
- Khóa bi quan chống đặt trùng lịch giữ **nguyên hành vi hiện tại** (khóa dòng `Car`, `@Transactional` ở use case, **cấm `REQUIRES_NEW`**). Sau khi làm `car` và sau khi làm `rental`, bắt buộc chạy `ConcurrencyBookingOverlapTest` (và `ConcurrencyDisputeRefundTest` sau `rental`).
- Không đổi hành vi nghiệp vụ, không đổi code trạng thái/tính tiền.

### ĐÊM NAY BỎ QUA (ghi vào báo cáo là CHƯA KIỂM TRA)
So sánh `pg_dump` schema, so sánh OpenAPI, kiểm tra giao diện thủ công, cập nhật `AGENTS.md`/skills/`ci.yml`. **Tuyệt đối không được khẳng định các mục này "đã đúng".**

---

## 3. THỨ TỰ THỰC HIỆN

Làm lần lượt, mỗi dòng một commit xanh:

| # | Module | Ghi chú |
| :-: | :--- | :--- |
| 1 | `ai`, `rag` | Hoàn chỉnh nhất, ArchUnit đầy đủ ở đây |
| 2 | `auth` | |
| 3 | `user` | |
| 4 | `notification` | `rental` phụ thuộc, làm trước `rental` |
| 5 | `oauth2` | Phụ thuộc `auth`/`user` |
| 6 | `car` | Chạy `ConcurrencyBookingOverlapTest` |
| 7 | `payment` | |
| 8 | `rental` | Chạy cả hai test Concurrency |
| 9 | `admin` | Nhiều phụ thuộc nhất |
| 10 | `health` | Không có domain thật, xem 4.3 |

**Trước khi bắt đầu module #1**, dành tối đa 30 phút kiểm kê (chỉ đọc) và đưa vào báo cáo:
- Ma trận phụ thuộc chéo module thật (ai inject gì của ai).
- Mọi `@ManyToOne`/`@OneToMany`/`@OneToOne`/`@JoinColumn` trỏ sang entity của module khác, và các JPQL/native query có JOIN chéo module.

---

## 4. KIỂU LÀM CHO ĐÊM NAY

### 4.1 Cấu trúc mỗi module
`domain/` (model, vo, policy, exception: Java thuần) → `application/` (`port/in`, `port/out`, `usecase/*UseCaseImpl` với `@Service`/`@Transactional`, `command`, `result`) → `adapter/` (`in/web`, `out/persistence`, `out/...`).
- Domain cấm Spring/JPA/jakarta.validation và cấm tham chiếu `application`/`adapter`/`common.adapter`/`common.persistence`.
- Application cấm JPA/Spring Data và cấm tham chiếu `adapter`.
- Controller chỉ gọi inbound port, trả `ApiResponse<T>`, **giữ nguyên URL và JSON**.
- Domain ném `*DomainException`; `GlobalExceptionHandler` ánh xạ sang `ApiResponse.error`.

### 4.2 Giao tiếp giữa module (rút gọn để kịp)
- Module A gọi module B qua **outbound port của A**, adapter của A gọi **inbound port của B** (ví dụ `rental` → `CarAvailabilityPort`/`CarLockingPort` → `car`'s `CheckCarAvailabilityUseCase`/`LockCarForBookingUseCase`). Port trả về `result` của tầng application, không trả entity/domain của module kia.
- Khi module đích **chưa được chuyển**, dùng `*LegacyAdapter` gọi class cũ, đánh dấu `// @TechnicalDebt: ...`, và **nối lại khi module đích xong**. Vì thứ tự ở mục 3 đã đưa các module bị phụ thuộc lên trước, hãy ưu tiên nối thẳng qua port thật khi có thể.
- Vòng phụ thuộc (`car`↔`rental`, `rental`↔`payment`): tách use case truy vấn riêng, đảm bảo đồ thị bean phi chu trình. Test contextLoads xác nhận.
- **Quan hệ JPA chéo module (đêm nay):** được phép ngoại lệ ở tầng persistence (adapter biết `JpaEntity` của module kia) để không phải viết lại truy vấn. Mỗi trường hợp phải liệt kê trong báo cáo và đưa vào danh sách miễn trừ của ArchUnit. Không đổi tên cột/khóa ngoại.

### 4.3 Module mỏng
`health`, `notification`, `oauth2`, `admin`... vẫn đi qua đủ 3 tầng và dùng port, nhưng **không tạo class domain giả**. Ví dụ `health`: `adapter/in/web` + `application/usecase` + outbound port `DatabaseHealthPort` + adapter; `domain/` để trống nếu không có logic thật. `admin`: gọi các module khác qua inbound port của chúng (thêm port dành cho admin ở module kia khi cần), không inject repository của module khác.

### 4.4 ArchUnit
Thêm `archunit-junit5:1.3.0` (scope test) và `ArchitectureRulesTest` ở module #1, với `.allowEmptyShould(true)`: domain không phụ thuộc framework; domain/application không phụ thuộc `common.adapter`/`common.persistence`; application không phụ thuộc adapter, JPA, Spring Data; controller không phụ thuộc persistence; `slices().matching("..modules.(*).application..").should().notDependOnEachOther()`. Cập nhật danh sách miễn trừ (các `*LegacyAdapter`, ngoại lệ JPA chéo module, module chưa chuyển) sau mỗi module.
**Chứng minh luật hoạt động một lần:** chèn tạm một import Spring vào `domain`, thấy test ĐỎ, gỡ ra thấy xanh. Ghi output.

---

## 5. BÁO CÁO CUỐI

1. Bảng theo từng module: **Xong-xanh / Bỏ dở (lý do) / Chưa làm**, kèm hash commit.
2. Output thật của `mvnw test` trước và sau (số test, danh sách fail so với baseline).
3. `git diff --stat develop`.
4. Danh sách `@TechnicalDebt` còn lại và các ngoại lệ JPA chéo module.
5. Danh sách "CHƯA KIỂM TRA" ở mục 2 (schema, OpenAPI, giao diện, tài liệu).
6. Mọi chỗ lệch khỏi chỉ thị.

Mỗi tuyên bố "xanh" phải kèm kết quả lệnh thật. Sau báo cáo, dừng lại.
