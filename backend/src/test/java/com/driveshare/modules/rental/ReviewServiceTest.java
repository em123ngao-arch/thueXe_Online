package com.driveshare.modules.rental;

import com.driveshare.common.dto.PageResponse;
import com.driveshare.common.enums.ECarStatus;
import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.rental.dto.CreateReviewRequest;
import com.driveshare.modules.rental.dto.response.ReviewResponse;
import com.driveshare.modules.rental.entity.Rental;
import com.driveshare.modules.rental.entity.Review;
import com.driveshare.modules.rental.repository.RentalRepository;
import com.driveshare.modules.rental.repository.ReviewRepository;
import com.driveshare.modules.rental.service.impl.ReviewServiceImpl;
import com.driveshare.modules.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private RentalRepository rentalRepository;

    @Mock
    private CarRepository carRepository;

    @InjectMocks
    private ReviewServiceImpl reviewService;

    private User sampleRenter;
    private Car sampleCar;
    private Rental sampleRental;

    @BeforeEach
    void setUp() {
        sampleRenter = User.builder()
                .userId(10L)
                .username("renter_quan")
                .fullName("Nguyễn Duy Quân")
                .avatarUrl("https://example.com/avatar.jpg")
                .build();

        sampleCar = Car.builder()
                .carId(1L)
                .ownerId(2L)
                .brand("VinFast")
                .model("VF8")
                .plateNumber("51K-99999")
                .pricePerDay(BigDecimal.valueOf(1200000))
                .status(ECarStatus.ACTIVE)
                .rating(BigDecimal.valueOf(5.00))
                .ratingCount(0)
                .build();

        sampleRental = Rental.builder()
                .rentalId(100L)
                .carId(1L)
                .car(sampleCar)
                .renterId(10L)
                .renter(sampleRenter)
                .startDate(LocalDate.now().minusDays(3))
                .endDate(LocalDate.now().minusDays(1))
                .totalPrice(BigDecimal.valueOf(2400000))
                .status(ERentalStatus.COMPLETED)
                .build();
    }

    @Test
    @DisplayName("Tạo đánh giá thành công: Chuyến đi COMPLETED, tự động tính lại rating xe")
    void createReview_Success() {
        CreateReviewRequest request = new CreateReviewRequest(5, "Xe chạy cực êm, pin khỏe!");

        when(rentalRepository.findById(100L)).thenReturn(Optional.of(sampleRental));
        when(reviewRepository.existsByRentalId(100L)).thenReturn(false);

        Review savedReview = Review.builder()
                .reviewId(1L)
                .rentalId(100L)
                .carId(1L)
                .renterId(10L)
                .renter(sampleRenter)
                .rating(5)
                .comment("Xe chạy cực êm, pin khỏe!")
                .createdAt(Instant.now())
                .build();

        when(reviewRepository.save(any(Review.class))).thenReturn(savedReview);
        when(reviewRepository.calculateAverageRatingByCarId(1L)).thenReturn(4.85);
        when(reviewRepository.countByCarId(1L)).thenReturn(3L);
        when(carRepository.findById(1L)).thenReturn(Optional.of(sampleCar));
        when(carRepository.save(any(Car.class))).thenReturn(sampleCar);

        ReviewResponse response = reviewService.createReview(100L, 10L, request);

        assertNotNull(response);
        assertEquals(1L, response.reviewId());
        assertEquals(5, response.rating());
        assertEquals("Xe chạy cực êm, pin khỏe!", response.comment());
        assertEquals("Nguyễn Duy Quân", response.renterName());

        // Kiểm tra xe đã được cập nhật điểm trung bình và số lượt đánh giá
        assertEquals(BigDecimal.valueOf(4.85), sampleCar.getRating());
        assertEquals(3, sampleCar.getRatingCount());

        verify(reviewRepository).save(any(Review.class));
        verify(carRepository).save(sampleCar);
    }

    @Test
    @DisplayName("Tạo đánh giá thất bại: Không tìm thấy đơn thuê xe")
    void createReview_RentalNotFound() {
        CreateReviewRequest request = new CreateReviewRequest(5, "Tốt");
        when(rentalRepository.findById(999L)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () ->
                reviewService.createReview(999L, 10L, request)
        );

        assertEquals(ErrorCode.RENTAL_NOT_FOUND, ex.getErrorCode());
        verify(reviewRepository, never()).save(any());
    }

    @Test
    @DisplayName("Tạo đánh giá thất bại: Người gọi không phải khách thuê của đơn")
    void createReview_Unauthorized() {
        CreateReviewRequest request = new CreateReviewRequest(5, "Tốt");
        when(rentalRepository.findById(100L)).thenReturn(Optional.of(sampleRental));

        AppException ex = assertThrows(AppException.class, () ->
                reviewService.createReview(100L, 999L, request) // user khác
        );

        assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        verify(reviewRepository, never()).save(any());
    }

    @Test
    @DisplayName("Tạo đánh giá thất bại: Đơn chưa hoàn tất (trạng thái khác COMPLETED)")
    void createReview_RentalNotCompleted() {
        sampleRental.setStatus(ERentalStatus.IN_PROGRESS);
        CreateReviewRequest request = new CreateReviewRequest(4, "Đang đi xe");
        when(rentalRepository.findById(100L)).thenReturn(Optional.of(sampleRental));

        AppException ex = assertThrows(AppException.class, () ->
                reviewService.createReview(100L, 10L, request)
        );

        assertEquals(ErrorCode.RENTAL_NOT_COMPLETED_FOR_REVIEW, ex.getErrorCode());
        verify(reviewRepository, never()).save(any());
    }

    @Test
    @DisplayName("Tạo đánh giá thất bại: Đơn đã được đánh giá trước đó (chặn duplicate)")
    void createReview_AlreadyReviewed() {
        CreateReviewRequest request = new CreateReviewRequest(5, "Đánh giá lần 2");
        when(rentalRepository.findById(100L)).thenReturn(Optional.of(sampleRental));
        when(reviewRepository.existsByRentalId(100L)).thenReturn(true);

        AppException ex = assertThrows(AppException.class, () ->
                reviewService.createReview(100L, 10L, request)
        );

        assertEquals(ErrorCode.REVIEW_ALREADY_EXISTS, ex.getErrorCode());
        verify(reviewRepository, never()).save(any());
    }

    @Test
    @DisplayName("Xem đánh giá công khai của xe: Trả về trang kết quả phân trang")
    void getCarReviews_Success() {
        when(carRepository.existsById(1L)).thenReturn(true);

        Review review1 = Review.builder()
                .reviewId(1L)
                .carId(1L)
                .renterId(10L)
                .renter(sampleRenter)
                .rating(5)
                .comment("Tuyệt vời")
                .createdAt(Instant.now())
                .build();

        Pageable pageable = PageRequest.of(0, 10);
        Page<Review> reviewPage = new PageImpl<>(List.of(review1), pageable, 1);
        when(reviewRepository.findByCarIdOrderByCreatedAtDesc(1L, pageable)).thenReturn(reviewPage);

        PageResponse<ReviewResponse> response = reviewService.getCarReviews(1L, pageable);

        assertNotNull(response);
        assertEquals(1, response.getItems().size());
        assertEquals("Nguyễn Duy Quân", response.getItems().get(0).renterName());
        assertEquals(5, response.getItems().get(0).rating());
    }

    @Test
    @DisplayName("Xem đánh giá công khai của xe thất bại: Xe không tồn tại")
    void getCarReviews_CarNotFound() {
        when(carRepository.existsById(999L)).thenReturn(false);

        AppException ex = assertThrows(AppException.class, () ->
                reviewService.getCarReviews(999L, PageRequest.of(0, 10))
        );

        assertEquals(ErrorCode.CAR_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("Lấy đánh giá của đơn thuê: Đã có đánh giá")
    void getReviewByRentalId_Found() {
        Review review = Review.builder()
                .reviewId(1L)
                .rentalId(100L)
                .carId(1L)
                .renterId(10L)
                .renter(sampleRenter)
                .rating(5)
                .comment("Hài lòng")
                .createdAt(Instant.now())
                .build();

        when(reviewRepository.findByRentalId(100L)).thenReturn(Optional.of(review));

        ReviewResponse response = reviewService.getReviewByRentalId(100L);

        assertNotNull(response);
        assertEquals(1L, response.reviewId());
        assertEquals(5, response.rating());
    }

    @Test
    @DisplayName("Lấy đánh giá của đơn thuê: Chưa có đánh giá trả về null")
    void getReviewByRentalId_NotFound() {
        when(reviewRepository.findByRentalId(100L)).thenReturn(Optional.empty());

        ReviewResponse response = reviewService.getReviewByRentalId(100L);

        assertNull(response);
    }
}
