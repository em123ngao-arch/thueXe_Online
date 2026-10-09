package com.driveshare.modules.rental.dto.response;

import com.driveshare.modules.rental.entity.Review;
import com.driveshare.modules.user.entity.User;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

import java.time.Instant;

@Builder
@Schema(description = "Thông tin phản hồi đánh giá chuyến đi")
public record ReviewResponse(
        @JsonProperty("review_id")
        @Schema(description = "Mã định danh đánh giá", example = "1")
        Long reviewId,

        @JsonProperty("rental_id")
        @Schema(description = "Mã chuyến thuê xe", example = "10")
        Long rentalId,

        @JsonProperty("car_id")
        @Schema(description = "Mã xe được đánh giá", example = "1")
        Long carId,

        @JsonProperty("renter_id")
        @Schema(description = "Mã khách thuê", example = "3")
        Long renterId,

        @JsonProperty("renter_name")
        @Schema(description = "Họ tên khách thuê", example = "Khách thuê Trần Văn B")
        String renterName,

        @JsonProperty("renter_avatar")
        @Schema(description = "Ảnh đại diện khách thuê", example = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde")
        String renterAvatar,

        @JsonProperty("rating")
        @Schema(description = "Số sao đánh giá (1-5)", example = "5")
        Integer rating,

        @JsonProperty("comment")
        @Schema(description = "Nội dung nhận xét", example = "Xe chạy rất êm, máy lạnh tốt, chủ xe chu đáo.")
        String comment,

        @JsonProperty("created_at")
        @Schema(description = "Thời gian gửi đánh giá", example = "2026-10-08T14:30:00Z")
        Instant createdAt
) {
    public static ReviewResponse from(Review review) {
        if (review == null) return null;
        String renterName = null;
        String renterAvatar = null;
        User renter = review.getRenter();
        if (renter != null) {
            renterName = renter.getFullName();
            renterAvatar = renter.getAvatarUrl();
        }
        return ReviewResponse.builder()
                .reviewId(review.getReviewId())
                .rentalId(review.getRentalId())
                .carId(review.getCarId())
                .renterId(review.getRenterId())
                .renterName(renterName)
                .renterAvatar(renterAvatar)
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }

    public static ReviewResponse from(Review review, User renter) {
        if (review == null) return null;
        return ReviewResponse.builder()
                .reviewId(review.getReviewId())
                .rentalId(review.getRentalId())
                .carId(review.getCarId())
                .renterId(review.getRenterId())
                .renterName(renter != null ? renter.getFullName() : null)
                .renterAvatar(renter != null ? renter.getAvatarUrl() : null)
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
