package com.driveshare.modules.rental.service;

import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.modules.rental.dto.response.RentalSummaryResponse;

import java.util.List;

public interface RentalQueryService {

    /**
     * Khách thuê xem danh sách đơn thuê của chính mình (CRP-44).
     *
     * @return danh sách đơn thuê của user đang đăng nhập
     */
    List<RentalSummaryResponse> getMyRentals();

    /**
     * Khách thuê tự hủy yêu cầu thuê xe khi đang ở trạng thái PENDING (CRP-44).
     *
     * @param rentalId ID của đơn thuê cần hủy
     * @return thông tin đơn thuê sau khi hủy
     */
    RentalSummaryResponse cancelMyRental(Long rentalId);

    /**
     * Chủ xe xem danh sách các yêu cầu thuê gửi đến xe của mình (CRP-46).
     *
     * @param status bộ lọc trạng thái (tuỳ chọn)
     * @return danh sách đơn thuê gửi đến các xe thuộc sở hữu của chủ xe
     */
    List<RentalSummaryResponse> getOwnerIncomingRentals(ERentalStatus status);
}
