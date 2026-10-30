# CHỈ THỊ CHO AI AGENT: SỬA KẾ HOẠCH HEXAGONAL VÀ CHẠY PILOT

> Đối tượng đọc: AI Agent trong Antigravity IDE.
> Repo: `Spring_ThucTap_k4` (DriveShare). Đọc `AGENTS.md` ở gốc repo trước khi làm bất cứ việc gì. Mọi quy tắc trong `AGENTS.md` (nhánh, PR, Squash and Merge, cấm push thẳng `develop`/`main`) vẫn có hiệu lực và **ưu tiên hơn** tài liệu này nếu có mâu thuẫn về quy trình git.

Tài liệu này có 3 phần, làm **tuần tự**, không nhảy cóc:

- **PHẦN A**: Kiểm tra điều kiện tiên quyết (chỉ đọc, chưa sửa code).
- **PHẦN B**: Sửa file `KE_HOACH_HEXAGONAL_DRIVESHARE.md` theo các yêu cầu bên dưới.
- **PHẦN C**: Chạy pilot Giai đoạn 0 (`common`) và module `ai`. **Dừng lại sau pilot để con người review.** Không tự ý làm module tiếp theo.

---

## PHẦN A. KIỂM TRA ĐIỀU KIỆN TIÊN QUYẾT (CHỈ ĐỌC)

Thực hiện và **báo cáo kết quả thật từ repo**, không suy đoán từ tài liệu.

### A1. Số lượng test thật
```powershell
cd backend
.\mvnw.cmd test
```
Ghi lại: `Tests run`, `Failures`, `Errors`, `Skipped`. Tài liệu hiện đang ghi lệch (`AGENTS.md` ghi 188 ở mục 5 và 150 ở mục 6.3; báo cáo cũ ghi 103). Dùng **con số thật vừa đo** làm baseline. Nếu có test fail trước khi refactor, **dừng lại và báo**, không refactor trên baseline đỏ.

### A2. Danh sách module thật
Liệt kê thư mục thực tế trong `backend/src/main/java/com/driveshare/modules/`. Đối chiếu với `AGENTS.md` mục 2 và với kế hoạch (kế hoạch nhắc `rag`, `notification`, `RentalDispute`, `RentalInspection` mà `AGENTS.md` không liệt kê). Nêu rõ module nào có thật, module nào chỉ có trong tài liệu.

### A3. Luồng đặt xe đã nối thật với backend chưa
Một báo cáo kiểm toán cũ nói frontend đặt xe bằng `localStorage` thay vì gọi API. Kiểm tra thực tế:
```powershell
Select-String -Path frontend\js\booking.js, frontend\js\owner.js -Pattern "localStorage|StorageService"
Select-String -Path frontend\js\*.js -Pattern "/rentals|/owner/rentals"
```
Báo cáo: `booking.js` có gọi `POST /api/v1/rentals` không? `owner.js` có gọi `GET /api/v1/owner/rentals` và các endpoint approve/reject không? Backend có endpoint approve/reject không?

> Nếu luồng đặt xe vẫn giả lập bằng `localStorage`: **ghi rõ vào báo cáo và kiến nghị làm hàn luồng trước**. Phần pilot ở PHẦN C vẫn có thể chạy (module `ai` độc lập), nhưng **không được mở rộng sang `rental`/`payment`** cho đến khi con người xác nhận.

### A4. Cấu hình JPA và Flyway
Đọc `application*.yml`. Ghi lại giá trị `spring.jpa.hibernate.ddl-auto`, cấu hình Flyway, và naming strategy. Mục đích: xác nhận việc đổi tên entity có làm lệch schema không.

### A5. Mức độ phụ thuộc chéo hiện tại
Tìm các nơi module này import repository/entity/service của module khác (ví dụ `ai` gọi vào `car`, `rental` gọi vào `car`/`payment`). Liệt kê để dùng cho thiết kế port ở PHẦN B.

**Đầu ra PHẦN A:** một mục "Kết quả kiểm tra thực tế" gồm A1–A5, đặt ở đầu file kế hoạch đã sửa.

---

## PHẦN B. SỬA FILE `KE_HOACH_HEXAGONAL_DRIVESHARE.md`

Sửa tại chỗ, giữ lại phần đã đúng (Git tag, nhánh cô lập, thứ tự dễ → khó, bảng "không đổi hạ tầng"). Áp dụng đủ các yêu cầu sau.

### B1. Đổi cấu trúc mỗi module thành 3 tầng
```text
modules/<tên-module>/
├── domain/                      ← Java thuần 100%, KHÔNG Spring, KHÔNG JPA
│   ├── model/
│   ├── vo/
│   ├── policy/
│   └── exception/
├── application/                 ← Điều phối nghiệp vụ, được dùng Spring
│   ├── port/
│   │   ├── in/                  (Use case interfaces)
│   │   └── out/                 (Outbound ports)
│   ├── usecase/                 (*UseCaseImpl: @Service, @Transactional)
│   └── command/ , result/       (Command/Result objects)
└── adapter/
    ├── in/web/                  (Controller, Request/Response DTO)
    └── out/
        ├── persistence/         (JpaEntity, JpaRepository, Adapter, Mapper)
        └── ai/ , storage/ ...   (client bên ngoài)
```
Sửa mọi bảng ánh xạ trong kế hoạch cho khớp. **Đặc biệt** bảng Giai đoạn 1: `AiChatServiceImpl` → `application/usecase/AskAdvisorUseCaseImpl.java`, **không** để trong `domain/`.

### B2. Sửa chiều phụ thuộc
- Domain **không** được tham chiếu `Command`/`Result` hay bất cứ thứ gì của `application/`. Mẫu `Rental.create(command)` phải đổi thành tham số thuần (giá trị hoặc Value Object), việc ghép Command → tham số nằm ở UseCaseImpl.
- Domain throw `*DomainException`; `GlobalExceptionHandler` (hoặc adapter web) chịu trách nhiệm đổi sang `AppException`/`ApiResponse.error`. Ghi rõ cơ chế này vào kế hoạch.

### B3. Sửa chiều port giữa module (ví dụ `car` ↔ `rental`)
- Kiểm tra lịch xe là dịch vụ `car` **cung cấp ra ngoài** ⇒ ở module `car` là **Inbound Port**: `car/application/port/in/CheckCarAvailabilityUseCase`.
- `rental` định nghĩa `rental/application/port/out/CarAvailabilityPort`.
- Adapter `rental/adapter/out/car/CarAvailabilityAdapter` implements `CarAvailabilityPort` và **gọi Inbound Port của `car`**, tuyệt đối không gọi `CarRepository`/`CarJpaRepository`.
- Áp dụng cùng nguyên tắc cho mọi cặp module khác (ví dụ `ai` cần dữ liệu xe: `ai/port/out/CarDataQueryPort` → adapter gọi inbound port của `car`).
- Thống nhất tên toàn kế hoạch: **một khái niệm, một tên** (ví dụ chỉ dùng `CheckInUseCase`, không dùng song song `CheckInRentalUseCase`).

### B4. Quy tắc JPA bắt buộc (viết thành mục riêng, có code mẫu)
**(a) Giữ nguyên tên bảng và tên entity trong JPQL.**
```java
@Entity(name = "Rental")            // giữ để JPQL cũ "from Rental r" không gãy
@Table(name = "rentals")            // giữ đúng tên bảng Flyway V1–V9
public class RentalJpaEntity extends BaseJpaEntity { ... }
```
Không thêm migration Flyway chỉ vì đổi tên class. Sau khi đổi, ứng dụng phải khởi động được với schema Flyway hiện có.

**(b) Adapter `save()` phải cập nhật entity đang quản lý, không tạo entity mới tinh.**
```java
@Override
public Rental save(Rental rental) {
    RentalJpaEntity entity = jpaRepository.findById(rental.id())
            .map(existing -> { mapper.copyToEntity(rental, existing); return existing; })
            .orElseGet(() -> mapper.toNewEntity(rental));
    return mapper.toDomain(jpaRepository.save(entity));
}
```
Mục đích: không mất `@Version`, `createdAt` và các cột do `BaseJpaEntity` quản lý.

**(c) Khóa chống trùng lịch.**
- Truy vấn khóa phải chạy **bên trong transaction của UseCaseImpl** (`@Transactional` đặt ở `application/usecase/`).
- Khóa trên dòng `Car` (hoặc cơ chế khóa tương đương đã có trong code hiện tại), vì khóa trên kết quả truy vấn `Rental` không khóa được gì khi chưa có đơn nào.
- Đặt tên port nói rõ ý định khóa, ví dụ `findOverlappingForUpdate(...)`, `lockCarForBooking(...)`.
- **Trước khi đổi, đọc code khóa hiện tại và giữ nguyên hành vi của nó.** Không tự thay đổi chiến lược khóa trong đợt refactor này.
- Sau mỗi thay đổi liên quan đến rental, chạy `ConcurrencyBookingOverlapTest` (xem PHẦN C cho phạm vi pilot).

### B5. Thêm ArchUnit để ép luật bằng test
Thêm dependency vào `backend/pom.xml` (scope test): `com.tngtech.archunit:archunit-junit5`, chọn phiên bản tương thích JUnit 5 và Java đang dùng. Thêm test `ArchitectureRulesTest` với các luật tối thiểu:
```java
@AnalyzeClasses(packages = "com.driveshare", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureRulesTest {

    @ArchTest
    static final ArchRule domain_khong_phu_thuoc_framework =
        noClasses().that().resideInAPackage("..modules..domain..")
            .should().dependOnClassesThat().resideInAnyPackage(
                "org.springframework..", "jakarta.persistence..", "jakarta.validation..");

    @ArchTest
    static final ArchRule domain_khong_phu_thuoc_application_hay_adapter =
        noClasses().that().resideInAPackage("..modules..domain..")
            .should().dependOnClassesThat().resideInAnyPackage(
                "..modules..application..", "..modules..adapter..");

    @ArchTest
    static final ArchRule application_khong_phu_thuoc_adapter =
        noClasses().that().resideInAPackage("..modules..application..")
            .should().dependOnClassesThat().resideInAPackage("..modules..adapter..");

    @ArchTest
    static final ArchRule controller_khong_goi_persistence =
        noClasses().that().resideInAPackage("..adapter.in.web..")
            .should().dependOnClassesThat().resideInAPackage("..adapter.out.persistence..");
}
```
Lưu ý quan trọng:
- Chỉ **áp dụng** luật cho module đã refactor. Với module chưa refactor, dùng `.allowEmptyShould(true)` hoặc giới hạn package theo danh sách module đã xong, để test không đỏ vì code cũ. Cập nhật danh sách này sau mỗi module.
- Thêm luật cấm adapter của module A phụ thuộc adapter của module B khi đến giai đoạn có nhiều module (có thể dùng `slices()`).

### B6. Bổ sung bước sửa test vào MỖI giai đoạn
Thêm vào mỗi giai đoạn một mục bắt buộc: "Sau khi tách UseCase/Adapter, **cập nhật toàn bộ test của module đó trong `src/test/`** (import, `@Mock`, `@WebMvcTest`, `@DataJpaTest`, tên entity) **trước khi** chạy `.\mvnw.cmd test`."
Đồng thời sửa tiêu chí hoàn thành:
- Bỏ con số cứng "188/188". Thay bằng: **không có test nào bị xóa, bị vô hiệu hóa (`@Disabled`) hay fail so với baseline đo ở A1; số test không giảm.**
- Cấm xóa hoặc làm yếu một test chỉ để cho xanh. Nếu phải đổi test vì đổi cấu trúc, đổi **cách gọi**, giữ nguyên **hành vi được kiểm chứng**.

### B7. Phạm vi pragmatic (thay cho "đồng nhất 10 module")
- Làm **Hexagonal đầy đủ** (domain + JpaEntity + Mapper) cho module giàu nghiệp vụ: `ai`, `auth`, `car`, `payment`, `rental`.
- Module mỏng/tổng hợp/CRUD (`health`, `admin`, `user`, `oauth2` và tương tự): **áp dụng nhẹ** (tách `adapter/in/web` và `application/usecase`, **không bắt buộc** tách domain model riêng và JpaEntity riêng). Ghi rõ lý do kỹ thuật trong kế hoạch.
- Thứ tự: `common` → `ai` → (dừng pilot) → `auth` → `car` → `payment` → `rental`. Giai đoạn sau chỉ mở khi con người duyệt giai đoạn trước.
- Nếu A3 phát hiện luồng đặt xe giả lập bằng `localStorage`: thêm vào kế hoạch một **Giai đoạn "Hàn luồng"** đứng trước `rental`/`payment`, và sửa mục "frontend: không đổi" thành "frontend: đổi tại `booking.js`, `owner.js`".

### B8. Sửa quy trình git (tuân thủ `AGENTS.md` mục 6)
- Đảo thứ tự Phần 0: **chạy test baseline trước, xanh rồi mới gắn tag** `v1.0.0-layered-baseline`.
- Bỏ lệnh `git merge --squash` + commit thẳng vào `develop`. Thay bằng: **mỗi giai đoạn/module một nhánh `feature/hex-<số>-<tên>`, một PR vào `develop`, Squash and Merge, Tech Lead duyệt.** Nhánh dài `refactor/hexagonal-architecture` không còn cần thiết.
- Trước mỗi PR: `git fetch origin && git merge origin/develop`, giải quyết xung đột, chạy lại toàn bộ test.
- Mỗi PR chỉ chứa một module (và test của nó). Tách commit rõ: di chuyển/đổi tên file trước, đổi logic sau, để review dễ.

### B9. Cập nhật tài liệu hướng dẫn AI
Thêm vào kế hoạch một giai đoạn cuối "Đồng bộ tài liệu", gồm:
- Sửa sơ đồ cấu trúc ở `AGENTS.md` mục 2, mục 4 (quy chuẩn lập trình), và số lượng test ở mục 5, 6.3 cho thống nhất với số đo thật.
- Cập nhật `.agents/skills/` liên quan (đặc biệt `springboot-patterns`) để mô tả cấu trúc Hexagonal mới, tránh agent sau viết code theo cấu trúc cũ.
- Cập nhật `.github/workflows/ci.yml` nếu có hard-code số test.

### B10. Sửa phần nội dung bảo vệ cuối file
Bỏ câu "thay PostgreSQL bằng MongoDB không sửa một dòng logic nào" (không đúng vì `@Transactional` và khóa bi quan gắn với CSDL quan hệ). Thay bằng ví dụ đúng: đổi Gemini sang nhà cung cấp LLM khác qua `LlmClientPort`, đổi Cloudinary sang S3/Local qua `ImageStoragePort`.

### B11. Làm gọn ước tính thời gian
Bỏ cam kết "~2 ngày". Thay bằng ước tính theo giai đoạn **kèm thời gian sửa test và xử lý xung đột**, và ghi rõ đây là ước lượng.

**Đầu ra PHẦN B:** file `KE_HOACH_HEXAGONAL_DRIVESHARE.md` bản mới, kèm một mục "Nhật ký thay đổi so với bản cũ" liệt kê từng mục B1–B11 đã áp dụng ở đâu. **Dừng và báo con người xem bản kế hoạch trước khi sang PHẦN C.**

---

## PHẦN C. PILOT: GIAI ĐOẠN 0 (`common`) VÀ MODULE `ai`

**Chỉ bắt đầu khi con người đã duyệt bản kế hoạch ở PHẦN B.**

### C0. Chuẩn bị
```powershell
git checkout develop
git pull origin develop
cd backend; .\mvnw.cmd test        # xanh mới đi tiếp
cd ..
git tag -a v1.0.0-layered-baseline -m "Baseline truoc khi chuyen Hexagonal"
git push origin v1.0.0-layered-baseline
git checkout -b feature/hex-00-common-ai
```
Nếu tag đã tồn tại hoặc bạn không có quyền push tag, **dừng và báo**, không dùng `--force`.

### C1. Giai đoạn 0: `common/` (commit riêng)
- Chỉ làm những thay đổi đã được kế hoạch duyệt (ví dụ `BaseEntity` → `BaseJpaEntity`, chuyển `CloudinaryService` thành adapter lưu trữ).
- Giữ nguyên `@MappedSuperclass` và tên cột, không đổi schema.
- Cập nhật mọi import và test bị ảnh hưởng. Chạy `.\mvnw.cmd test` xanh. **Commit riêng** (`refactor(common): ...`).

### C2. Module `ai` (và `rag` nếu có thật theo A2)
Làm theo các bước, **mỗi bước build + test xanh mới sang bước sau**:
1. Tạo cấu trúc `domain / application / adapter` theo B1.
2. Tách domain (`ChatSession`, `ChatMessage`, policy fallback regex) thành Java thuần.
3. Tạo inbound port (`AskAdvisorUseCase`, `GetHistoryUseCase`) và outbound port (`LlmClientPort`, `ChatMemoryPort`, `CarDataQueryPort`). `CarDataQueryPort` gọi sang module `car` qua adapter theo B3, **không** gọi `CarRepository` trực tiếp.
4. Tạo `*UseCaseImpl` trong `application/usecase/` (có `@Service`, `@Transactional`).
5. Tạo adapter: `GeminiLlmAdapter`, adapter persistence cho `chat_memory` (giữ `@Table(name = "chat_memory")` theo B4a), `ChatController` mỏng gọi use case, trả `ApiResponse<T>`.
6. **Sửa toàn bộ test của `ai`/`rag`** theo B6.
7. Thêm `ArchitectureRulesTest` (B5), giới hạn phạm vi cho `ai`/`rag`, và xác nhận nó **đỏ khi cố tình vi phạm** (thử tạm một import Spring vào `domain`, thấy test đỏ, rồi bỏ đi).
8. Giữ nguyên: endpoint `/api/v1/chat`, system prompt `prompts/car-advisor-system.txt`, hành vi lưu lịch sử vào `chat_memory`, JSON trả về của API.

### C3. Tiêu chí hoàn thành pilot (tất cả phải đúng)
- [ ] `.\mvnw.cmd test` xanh; số test **không giảm** so với baseline A1; không có `@Disabled` mới.
- [ ] `ArchitectureRulesTest` xanh và đã được chứng minh bắt được vi phạm.
- [ ] Ứng dụng khởi động được với Flyway/DB hiện có, **không thêm migration mới**.
- [ ] Gọi thử `POST /api/v1/chat` (có JWT hợp lệ) trả đúng định dạng `ApiResponse`, lịch sử vẫn lưu vào `chat_memory`.
- [ ] Không còn import từ `org.springframework`/`jakarta.persistence` trong bất kỳ `domain/` nào của module đã làm.
- [ ] Không có file nào ngoài phạm vi (`common`, `ai`, `rag`, test tương ứng, `pom.xml`) bị sửa.

### C4. Báo cáo và dừng
Tạo báo cáo ngắn gồm: danh sách file đã di chuyển/tạo/xóa; kết quả test trước/sau (số liệu thật); điểm nào lệch khỏi kế hoạch và lý do; rủi ro hoặc câu hỏi cần con người quyết. Sau đó **mở PR vào `develop`** theo template trong `AGENTS.md` và **dừng**. Không bắt đầu `auth`, `car`, `payment`, `rental` khi chưa được chỉ thị.

---

## QUY TẮC CHUNG (VI PHẠM = DỪNG VÀ BÁO)

1. Không đổi hành vi nghiệp vụ, không đổi URL/JSON của API, không đổi schema DB, không sửa frontend trong pilot (trừ khi PHẦN A/B đã chốt khác).
2. Không xóa hoặc làm yếu test để cho xanh.
3. Không `push --force`, không push thẳng `develop`/`main`.
4. Không làm quá phạm vi giai đoạn hiện tại. Gặp việc "tiện tay" ngoài phạm vi: ghi vào báo cáo, đừng làm.
5. Khi không chắc (tên bảng, cơ chế khóa, hành vi hiện tại): **đọc code và test hiện có để xác nhận**, nếu vẫn không chắc thì hỏi con người thay vì đoán.
6. Mỗi tuyên bố trong báo cáo ("test xanh", "không đổi schema") phải kèm bằng chứng là kết quả lệnh thật vừa chạy.
