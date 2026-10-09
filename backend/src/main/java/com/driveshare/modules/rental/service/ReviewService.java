package com.driveshare.modules.rental.service;

import com.driveshare.common.dto.PageResponse;
import com.driveshare.modules.rental.dto.CreateReviewRequest;
import com.driveshare.modules.rental.dto.response.ReviewResponse;
import org.springframework.data.domain.Pageable;

/**
 * Service quản lý đánh giá chuyến đi và cập nhật điểm rating xe (Sprint 3 - Issue #26).
 */
public interface ReviewService {

    /**
     * Khách thuê gửi đánh giá sau khi chuyến đi hoàn tất (COMPLETED).
     * Tự động tính toán lại điểm rating trung bình của xe và số lượt đánh giá.
     *
     * @param rentalId mã đơn thuê xe
     * @param renterId mã khách thuê thực hiện
     * @param request  thông tin đánh giá (số sao, nhận xét)
     * @return chi tiết đánh giá đã tạo
     */
    ReviewResponse createReview(Long rentalId, Long renterId, CreateReviewRequest request);

    /**
     * Xem danh sách đánh giá công khai của 1 xe, hỗ trợ phân trang và sắp xếp theo ngày mới nhất.
     *
     * @param carId    mã xe
     * @param pageable thông tin phân trang
     * @return trang danh sách đánh giá
     */
    PageResponse<ReviewResponse> getCarReviews(Long carId, Pageable pageable);

    /**
     * Lấy thông tin đánh giá đã gửi của 1 đơn thuê cụ thể.
     *
     * @param rentalId mã đơn thuê
     * @return chi tiết đánh giá (hoặc null nếu chưa đánh giá)
     */
    ReviewResponse getReviewByRentalId(Long rentalId);
}
