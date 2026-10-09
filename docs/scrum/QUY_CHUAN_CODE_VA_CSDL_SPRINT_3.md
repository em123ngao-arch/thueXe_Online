# 📖 QUY CHUẨN CODE & HƯỚNG DẪN KỸ THUẬT SPRINT 3 (DRIVESHARE)
### Dành cho 6 thành viên nhóm DriveShare — Ban hành bởi Tech Lead: Nguyễn Duy Bảo

---

## 🚫 1. BA ĐIỀU CẤM KỴ (ANTI-PATTERNS — TUYỆT ĐỐI KHÔNG VI PHẠM)

1. **⛔ CẤM TỰ Ý TẠO FILE FLYWAY MIGRATION MỚI:**
   - Cơ sở dữ liệu Sprint 3 đã được Lead Bảo chốt 100% tại [`V6__sprint3_full_features.sql`](file:///d:/MONHOCITC/K4/Spring_ThucTap_k4/backend/src/main/resources/db/migration/V6__sprint3_full_features.sql).
   - Tuyệt đối **KHÔNG** tạo thêm file `V7...sql` hoặc sửa file V6 cũ trên nhánh riêng. Nếu thiếu trường gì, phải báo cáo Lead Bảo để xử lý tập trung.

2. **⛔ CẤM SỬA CHÉO PACKAGE CỦA NHAU:**
   - **Lâm Chí Vĩ**: Chỉ làm việc trong `com.driveshare.modules.rental/` (Inspection & Chauffeur).
   - **Duy Quân**: Chỉ làm việc trong `ReviewService` và tính rating xe trong `modules/car/`.
   - **Đỗ Ngọc Phát**: Chỉ làm việc trong `com.driveshare.modules.ai/`.
   - **Chí Tín**: Chỉ làm việc trong `frontend/` (HTML, CSS, JS), không sửa file Java.
   - **Lộc Khiêm**: Chỉ làm việc trong `backend/Dockerfile`, `render.yaml`, CI/CD.

3. **⛔ CẤM TRẢ VỀ DỮ LIỆU TÙY TIỆN HOẶC NUỐT LỖI (EXCEPTION):**
   - Mọi API thành công **BẮT BUỘC** bọc trong `ResponseEntity.ok(ApiResponse.success(data))`.
   - Khi có lỗi nghiệp vụ **BẮT BUỘC** ném `throw new AppException(ErrorCode.XYZ)`. Không được dùng `try-catch` rồi nuốt lỗi hoặc trả về `null`.

---

## 💻 2. VÍ DỤ CODE MẪU CHI TIẾT TỪNG MODULE

### 👤 2.1. Hướng dẫn dành cho LÂM CHÍ VĨ (@technology-web) — Luồng Check-in & Check-out

#### a. DTO Request mẫu (Check-in & Check-out)
```java
// DTO Check-in: Gửi khi bàn giao xe
public record CheckInRequest(
    @NotNull(message = "Số ODO không được để trống")
    @Min(value = 0, message = "Số ODO phải lớn hơn hoặc bằng 0")
    Integer odoMeter,

    @NotNull(message = "Mức xăng không được để trống")
    @Min(0) @Max(100)
    Integer fuelLevel,

    String images, // Link các ảnh bàn giao xe 4 góc cách nhau bởi dấu phẩy
    String notes   // Tình trạng xe, vết trầy xước
) {}

// DTO Check-out: Gửi khi nhận lại xe
public record CheckOutRequest(
    @NotNull(message = "Số ODO trả không được để trống")
    Integer odoMeter,

    @NotNull(message = "Mức xăng trả không được để trống")
    @Min(0) @Max(100)
    Integer fuelLevel,

    BigDecimal extraFee,        // Phụ phí phát sinh (nếu có: rửa xe, thiếu xăng, quá km)
    String extraFeeReason,      // Lý do phụ phí
    String images,              // Link ảnh chụp khi trả xe
    String notes                // Ghi chú khi trả
) {}
```

#### b. Service Logic mẫu cho Vĩ:
```java
@Service
@RequiredArgsConstructor
@Transactional
public class RentalInspectionServiceImpl implements RentalInspectionService {

    private final RentalRepository rentalRepository;
    private final RentalInspectionRepository rentalInspectionRepository;

    @Override
    public RentalInspectionResponse checkIn(Long rentalId, Long ownerId, CheckInRequest request) {
        Rental rental = rentalRepository.findById(rentalId)
            .orElseThrow(() -> new AppException(ErrorCode.RENTAL_NOT_FOUND));

        // Kiểm tra quyền: Chỉ chủ xe mới được check-in
        if (!rental.getCar().getOwnerId().equals(ownerId)) {
            throw new AppException(ErrorCode.CAR_ACCESS_DENIED);
        }

        // Chuyến đi phải ở trạng thái CONFIRMED (đã đặt cọc)
        if (rental.getStatus() != ERentalStatus.CONFIRMED) {
            throw new AppException(ErrorCode.RENTAL_CANNOT_BE_STARTED);
        }

        // Đã check-in chưa?
        if (rentalInspectionRepository.existsByRentalIdAndInspectionType(rentalId, EInspectionType.CHECK_IN)) {
            throw new AppException(ErrorCode.INSPECTION_ALREADY_EXISTS);
        }

        RentalInspection inspection = RentalInspection.builder()
            .rentalId(rentalId)
            .inspectionType(EInspectionType.CHECK_IN)
            .odoMeter(request.odoMeter())
            .fuelLevel(request.fuelLevel())
            .images(request.images())
            .notes(request.notes())
            .performedBy(ownerId)
            .build();

        rentalInspectionRepository.save(inspection);

        // Chuyển trạng thái đơn sang IN_PROGRESS
        rental.setStatus(ERentalStatus.IN_PROGRESS);
        rentalRepository.save(rental);

        return RentalInspectionResponse.from(inspection);
    }
}
```

---

### 👤 2.2. Hướng dẫn dành cho NGUYỄN DUY QUÂN (@nguyenduyquan0609-cyber) — Luồng Reviews & Rating

#### a. DTO Request mẫu:
```java
public record CreateReviewRequest(
    @NotNull(message = "Số sao đánh giá không được để trống")
    @Min(value = 1, message = "Đánh giá tối thiểu 1 sao")
    @Max(value = 5, message = "Đánh giá tối đa 5 sao")
    Integer rating,

    String comment
) {}
```

#### b. Service Logic mẫu cho Quân:
```java
@Service
@RequiredArgsConstructor
@Transactional
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final RentalRepository rentalRepository;
    private final CarRepository carRepository;

    @Override
    public ReviewResponse createReview(Long rentalId, Long renterId, CreateReviewRequest request) {
        Rental rental = rentalRepository.findById(rentalId)
            .orElseThrow(() -> new AppException(ErrorCode.RENTAL_NOT_FOUND));

        // Chỉ khách của đơn này mới được review
        if (!rental.getRenterId().equals(renterId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Đơn phải ở trạng thái COMPLETED
        if (rental.getStatus() != ERentalStatus.COMPLETED) {
            throw new AppException(ErrorCode.RENTAL_NOT_COMPLETED_FOR_REVIEW);
        }

        // Không cho phép review 2 lần
        if (reviewRepository.existsByRentalId(rentalId)) {
            throw new AppException(ErrorCode.REVIEW_ALREADY_EXISTS);
        }

        Review review = Review.builder()
            .rentalId(rentalId)
            .carId(rental.getCarId())
            .renterId(renterId)
            .rating(request.rating())
            .comment(request.comment())
            .build();

        reviewRepository.save(review);

        // TỰ ĐỘNG TÍNH LẠI RATING TRUNG BÌNH CỦA XE
        Double avgRating = reviewRepository.calculateAverageRatingByCarId(rental.getCarId());
        long totalReviews = reviewRepository.countByCarId(rental.getCarId());

        Car car = carRepository.findById(rental.getCarId())
            .orElseThrow(() -> new AppException(ErrorCode.CAR_NOT_FOUND));
        
        car.setRating(BigDecimal.valueOf(avgRating != null ? avgRating : 5.0).setScale(2, RoundingMode.HALF_UP));
        car.setRatingCount((int) totalReviews);
        carRepository.save(car);

        return ReviewResponse.from(review);
    }
}
```

---

### 👤 2.3. Hướng dẫn dành cho ĐỖ NGỌC PHÁT (@dongocphat007-ctrl) — Chatbot RAG & Tools

1. **Truy vấn RAG:**
   - Khi người dùng hỏi: *"Tư vấn xe 5 chỗ tự động tại TP.HCM"* ➔ Inject `CarRepository` gọi tìm các xe có `status = ECarStatus.ACTIVE` và lọc theo `seats`, `transmission`, `province`.
   - Trích xuất thông tin: Tên xe, hãng, giá thuê/ngày, phụ phí tài xế, ảnh đại diện, điểm rating.
2. **Format Response:**
   - Trả về câu trả lời tự nhiên kèm danh sách xe gợi ý dưới dạng mảng JSON `suggested_cars`:
     ```json
     {
       "reply": "Dạ em tìm thấy 2 xe 5 chỗ số tự động rất phù hợp với gia đình anh tại TP.HCM ạ...",
       "suggested_cars": [
         {
           "car_id": 1,
           "name": "VinFast VF8 (2023)",
           "price_per_day": 1200000,
           "has_driver_service": true,
           "rating": 4.8,
           "thumbnail_url": "https://..."
         }
       ]
     }
     ```

---

### 👤 2.4. Hướng dẫn dành cho CHÍ TÍN (@CTnn1001) — Full Frontend

1. **Quy chuẩn gọi API:**
   - Dùng hàm `apiFetch()` hoặc `fetch()` có kèm Header: `Authorization: Bearer <token>`.
   - Luôn kiểm tra `res.data` theo format chuẩn của Backend `ApiResponse<T>`.
2. **Giao diện Modal:**
   - Modal Check-in đặt trong `owner-cars.html` (chỉ hiển thị khi đơn có status `CONFIRMED`).
   - Modal Check-out đặt trong `owner-cars.html` (chỉ hiển thị khi đơn có status `IN_PROGRESS`).
   - Modal Review đặt trong `profile.html` (tab Lịch sử chuyến đi, chỉ hiện nút "Đánh giá" khi đơn có status `COMPLETED`).
   - Widget Chatbot: Khi tin nhắn trả về có `suggested_cars`, tự động render card xe HTML có ảnh và nút "Xem chi tiết xe".

---

### 👤 2.5. Hướng dẫn dành cho LỘC KHIÊM (@khiemtan1712-oss) — DevOps & Cloud

1. **Tối ưu RAM Dockerfile cho Render Free (512MB limit):**
   ```dockerfile
   # Multi-stage build
   FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
   WORKDIR /app
   COPY pom.xml .
   COPY src ./src
   RUN mvn clean package -DskipTests

   FROM eclipse-temurin:17-jre-alpine
   WORKDIR /app
   COPY --from=build /app/target/*.jar app.jar
   ENV JAVA_OPTS="-XX:+UseSerialGC -Xss512k -XX:MaxRAMPercentage=75.0 -Dfile.encoding=UTF-8"
   EXPOSE 8080
   ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
   ```

---

## 🚀 3. QUY TRÌNH KIỂM THỬ TRƯỚC KHI TẠO PULL REQUEST (BẮT BUỘC)

Trước khi gõ lệnh mở Pull Request, **BẮT BUỘC** thực hiện 3 bước:

1. **Biên dịch và chạy bài test cục bộ:**
   ```powershell
   cd backend
   .\mvnw.cmd test
   ```
   *(Phải đạt BUILD SUCCESS và không có bài test nào bị FAIL).*

2. **Chạy script kiểm thử Sprint 3 tự động của Lead Bảo:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/test_sprint3.ps1
   ```

3. **Tạo Pull Request trên GitHub:**
   - Tiêu đề PR chuẩn: `feat(module): mô tả ngắn gọn công việc`
   - Trong phần Description bắt buộc có câu: `Closes #số_issue` (Ví dụ: `Closes #25`).
   - Gán Reviewer: **`@em123ngao-arch` (Lead Bảo)** để duyệt merge.
