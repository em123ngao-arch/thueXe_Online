package com.driveshare.modules.rental.service;

import com.driveshare.common.dto.PageResponse;
import com.driveshare.modules.rental.application.port.in.ReviewUseCase;
import com.driveshare.modules.rental.dto.response.ReviewResponse;
import org.springframework.data.domain.Pageable;

public interface ReviewService extends ReviewUseCase {

    PageResponse<ReviewResponse> getCarReviews(Long carId, Pageable pageable);
}
