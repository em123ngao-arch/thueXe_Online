package com.driveshare.modules.rental.service;

import com.driveshare.modules.rental.dto.RentalDisputeRequest;
import com.driveshare.modules.rental.dto.response.RentalDisputeResponse;

import java.util.List;

public interface RentalDisputeService {

    /**
     * Khách thuê báo cáo chủ xe không giao xe / trễ hẹn / sự cố nhận xe.
     * Upload bằng chứng lên Cloudinary và chuyển đơn sang DISPUTED.
     *
     * @param rentalId ID của đơn thuê
     * @param renterId ID của khách thuê gửi báo cáo
     * @param request  Thông tin lý do và danh sách tệp bằng chứng (ảnh + video)
     * @return Thông tin khiếu nại đã khởi tạo
     */
    RentalDisputeResponse reportNoShow(Long rentalId, Long renterId, RentalDisputeRequest request);

    /**
     * Lấy danh sách khiếu nại của một đơn thuê.
     */
    List<RentalDisputeResponse> getDisputesByRental(Long rentalId, Long userId);
}
