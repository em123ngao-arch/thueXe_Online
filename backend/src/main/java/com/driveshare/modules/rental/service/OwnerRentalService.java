package com.driveshare.modules.rental.service;

import com.driveshare.modules.rental.dto.RejectRentalRequest;
import com.driveshare.modules.rental.dto.response.RentalSummaryResponse;

public interface OwnerRentalService {

    /**
     * CRP-47 & Giai đoạn 2 & 3: Chủ xe duyệt 1 yêu cầu thuê xe.
     * Chuyển đơn sang WAITING_PAYMENT, thiết lập paymentExpiresAt = NOW() + 45 phút (Soft Lock).
     * Tự động chuyển các đơn PENDING/PENDING_APPROVAL trùng khung giờ sang ON_HOLD (CRP-49).
     *
     * @param rentalId ID của đơn thuê cần duyệt
     * @return RentalSummaryResponse thông tin đơn thuê sau khi duyệt
     */
    RentalSummaryResponse approveRental(Long rentalId);

    /**
     * CRP-48: Chủ xe từ chối yêu cầu thuê xe kèm lý do bắt buộc.
     * Chuyển đơn sang REJECTED.
     * Nếu đơn đang ở WAITING_PAYMENT, giải phóng Soft Lock và mở lại các đơn ON_HOLD trùng lịch sang PENDING_APPROVAL.
     *
     * @param rentalId ID của đơn thuê cần từ chối
     * @param request  DTO chứa lý do từ chối
     * @return RentalSummaryResponse thông tin đơn thuê sau khi từ chối
     */
    RentalSummaryResponse rejectRental(Long rentalId, RejectRentalRequest request);

    /**
     * Giai đoạn 4 v2.0.0: Bắt đầu chuyến đi (bàn giao phương tiện cho khách).
     * Yêu cầu đơn thuê đang ở trạng thái CONFIRMED (đã chốt cọc).
     *
     * @param rentalId ID của đơn thuê
     * @return RentalSummaryResponse sau khi chuyển sang IN_PROGRESS
     */
    RentalSummaryResponse startRental(Long rentalId);

    /**
     * Giai đoạn 4 v2.0.0: Hoàn tất chuyến đi (khách đã bàn giao lại xe cho chủ xe).
     * Yêu cầu đơn thuê đang ở trạng thái IN_PROGRESS.
     *
     * @param rentalId ID của đơn thuê
     * @return RentalSummaryResponse sau khi chuyển sang COMPLETED
     */
    RentalSummaryResponse completeRental(Long rentalId);
}

