package com.driveshare.modules.rental.controller;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.common.dto.PageResponse;
import com.driveshare.modules.rental.dto.CreateReviewRequest;
import com.driveshare.modules.rental.dto.response.ReviewResponse;
import com.driveshare.modules.rental.service.ReviewService;
import com.driveshare.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Controller xử lý đánh giá chuyến đi và xem đánh giá xe (Sprint 3 - Issue #26).
 */
@RestController
@RequiredArgsConstructor
@Tag(name = "Reviews & Ratings", description = "API đánh giá sau chuyến đi và xem đánh giá xe (Sprint 3 - Issue #26)")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping("/api/v1/rentals/{rentalId}/reviews")
    @PreAuthorize("hasRole('RENTER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
            summary = "Gửi đánh giá sau chuyến đi (Issue #26)",
            description = "Khách thuê gửi đánh giá 1-5 sao và nhận xét cho chuyến đi đã hoàn tất (COMPLETED). Hệ thống tự động cập nhật điểm rating cho xe."
    )
    public ResponseEntity<ApiResponse<ReviewResponse>> createReview(
            @PathVariable("rentalId") Long rentalId,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @Valid @RequestBody CreateReviewRequest request
    ) {
        ReviewResponse data = reviewService.createReview(rentalId, currentUser.getUserId(), request);
        return ResponseEntity.ok(
                ApiResponse.<ReviewResponse>builder()
                        .code(200)
                        .success(true)
                        .message("Gửi đánh giá chuyến đi thành công")
                        .data(data)
                        .build()
        );
    }

    @GetMapping("/api/v1/rentals/{rentalId}/reviews")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(
            summary = "Xem đánh giá của đơn thuê",
            description = "Xem thông tin đánh giá đã gửi của một đơn thuê xe cụ thể"
    )
    public ResponseEntity<ApiResponse<ReviewResponse>> getRentalReview(
            @PathVariable("rentalId") Long rentalId
    ) {
        ReviewResponse data = reviewService.getReviewByRentalId(rentalId);
        return ResponseEntity.ok(
                ApiResponse.<ReviewResponse>builder()
                        .code(200)
                        .success(true)
                        .message(data != null ? "Lấy đánh giá thành công" : "Chuyến đi chưa có đánh giá")
                        .data(data)
                        .build()
        );
    }

    @GetMapping("/api/v1/public/cars/{carId}/reviews")
    @Operation(
            summary = "Xem danh sách đánh giá của xe (Công khai)",
            description = "API công khai xem danh sách nhận xét, số sao của xe, hỗ trợ phân trang và sắp xếp theo ngày mới nhất"
    )
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getCarReviews(
            @PathVariable("carId") Long carId,
            @Parameter(description = "Số trang (bắt đầu từ 0)") @RequestParam(name = "page", defaultValue = "0") int page,
            @Parameter(description = "Số lượng bản ghi mỗi trang") @RequestParam(name = "size", defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(Sort.Direction.DESC, "createdAt"));
        PageResponse<ReviewResponse> data = reviewService.getCarReviews(carId, pageable);
        return ResponseEntity.ok(
                ApiResponse.<PageResponse<ReviewResponse>>builder()
                        .code(200)
                        .success(true)
                        .message("Lấy danh sách đánh giá xe thành công")
                        .data(data)
                        .build()
        );
    }
}
