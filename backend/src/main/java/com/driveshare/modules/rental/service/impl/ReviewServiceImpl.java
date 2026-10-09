package com.driveshare.modules.rental.service.impl;

import com.driveshare.common.dto.PageResponse;
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
import com.driveshare.modules.rental.service.ReviewService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Triển khai nghiệp vụ đánh giá chuyến đi và tính toán rating xe (Sprint 3 - Issue #26).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final RentalRepository rentalRepository;
    private final CarRepository carRepository;

    @Override
    public ReviewResponse createReview(Long rentalId, Long renterId, CreateReviewRequest request) {
        log.info("Khách thuê renterId={} gửi đánh giá cho đơn rentalId={}, rating={}", renterId, rentalId, request.rating());

        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new AppException(ErrorCode.RENTAL_NOT_FOUND));

        // 1. Chỉ chính khách thuê của đơn này mới được review
        if (!rental.getRenterId().equals(renterId)) {
            log.warn("User {} không có quyền đánh giá đơn rentalId={} của user {}", renterId, rentalId, rental.getRenterId());
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // 2. Chuyến đi phải ở trạng thái COMPLETED
        if (rental.getStatus() != ERentalStatus.COMPLETED) {
            log.warn("Đơn rentalId={} ở trạng thái {} không thể đánh giá (yêu cầu COMPLETED)", rentalId, rental.getStatus());
            throw new AppException(ErrorCode.RENTAL_NOT_COMPLETED_FOR_REVIEW);
        }

        // 3. Chặn đánh giá trùng lặp (Mỗi đơn thuê chỉ đánh giá duy nhất 1 lần)
        if (reviewRepository.existsByRentalId(rentalId)) {
            log.warn("Đơn rentalId={} đã được đánh giá trước đó", rentalId);
            throw new AppException(ErrorCode.REVIEW_ALREADY_EXISTS);
        }

        // 4. Lưu Review vào cơ sở dữ liệu
        Review review = Review.builder()
                .rentalId(rentalId)
                .carId(rental.getCarId())
                .renterId(renterId)
                .rating(request.rating())
                .comment(request.comment() != null ? request.comment().trim() : null)
                .build();

        Review savedReview = reviewRepository.save(review);

        // 5. TỰ ĐỘNG CẬP NHẬT RATING CHO XE:
        Double avgRating = reviewRepository.calculateAverageRatingByCarId(rental.getCarId());
        long totalReviews = reviewRepository.countByCarId(rental.getCarId());

        Car car = carRepository.findById(rental.getCarId())
                .orElseThrow(() -> new AppException(ErrorCode.CAR_NOT_FOUND));

        BigDecimal calculatedRating = BigDecimal.valueOf(avgRating != null ? avgRating : 5.0)
                .setScale(2, RoundingMode.HALF_UP);
        car.setRating(calculatedRating);
        car.setRatingCount((int) totalReviews);
        carRepository.save(car);

        log.info("Cập nhật rating thành công cho carId={}: rating={}, ratingCount={}",
                rental.getCarId(), calculatedRating, totalReviews);

        return ReviewResponse.from(savedReview, rental.getRenter());
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> getCarReviews(Long carId, Pageable pageable) {
        if (!carRepository.existsById(carId)) {
            throw new AppException(ErrorCode.CAR_NOT_FOUND);
        }

        Page<Review> reviewPage = reviewRepository.findByCarIdOrderByCreatedAtDesc(carId, pageable);
        Page<ReviewResponse> responsePage = reviewPage.map(ReviewResponse::from);
        return PageResponse.from(responsePage);
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewResponse getReviewByRentalId(Long rentalId) {
        return reviewRepository.findByRentalId(rentalId)
                .map(ReviewResponse::from)
                .orElse(null);
    }
}
