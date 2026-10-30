package com.driveshare.modules.rental.application.port.in;

import com.driveshare.common.dto.PageResponse;
import com.driveshare.modules.rental.dto.CreateReviewRequest;
import com.driveshare.modules.rental.dto.response.ReviewResponse;

public interface ReviewUseCase {

    ReviewResponse createReview(Long rentalId, Long renterId, CreateReviewRequest request);

    PageResponse<ReviewResponse> getCarReviews(Long carId, int page, int size);

    ReviewResponse getReviewByRentalId(Long rentalId);
}

