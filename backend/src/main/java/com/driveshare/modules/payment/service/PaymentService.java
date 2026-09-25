package com.driveshare.modules.payment.service;

import com.driveshare.common.enums.EPaymentStatus;
import com.driveshare.modules.payment.dto.request.CreatePaymentRequest;
import com.driveshare.modules.payment.dto.response.OwnerEarningsResponse;
import com.driveshare.modules.payment.dto.response.PaymentResponse;

public interface PaymentService {

    /**
     * CRP-51: Khởi tạo giao dịch thanh toán đặt cọc 30% cho đơn thuê đã được duyệt (APPROVED).
     */
    PaymentResponse createDepositPayment(Long rentalId, CreatePaymentRequest request, Long currentUserId);

    /**
     * CRP-52 & CRP-53: Xác nhận thanh toán thành công, chuyển trạng thái thanh toán sang SUCCESS
     * và chuyển trạng thái đơn thuê sang CONFIRMED.
     */
    PaymentResponse confirmPayment(Long paymentId, Long currentUserId);

    /**
     * CRP-52: Đánh dấu thanh toán thất bại (FAILED).
     */
    PaymentResponse failPayment(Long paymentId, Long currentUserId, String note);

    /**
     * CRP-52: Hủy giao dịch thanh toán (CANCELLED).
     */
    PaymentResponse cancelPayment(Long paymentId, Long currentUserId, String note);

    /**
     * Cập nhật trạng thái thanh toán linh hoạt.
     */
    PaymentResponse updatePaymentStatus(Long paymentId, EPaymentStatus status, String note, Long currentUserId);

    /**
     * Xem thông tin giao dịch thanh toán theo ID.
     */
    PaymentResponse getPaymentById(Long paymentId, Long currentUserId);

    /**
     * Xem thông tin thanh toán theo mã đơn thuê (rental_id).
     */
    PaymentResponse getPaymentByRentalId(Long rentalId, Long currentUserId);

    /**
     * CRP-54: Chủ xe xem thống kê tổng doanh thu và lịch sử dòng tiền.
     */
    OwnerEarningsResponse getOwnerEarnings(Long ownerId);
}
