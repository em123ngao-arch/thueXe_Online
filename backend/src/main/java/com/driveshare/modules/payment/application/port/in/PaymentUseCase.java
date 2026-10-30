package com.driveshare.modules.payment.application.port.in;

import com.driveshare.common.enums.EPaymentStatus;
import com.driveshare.modules.payment.dto.request.CreatePaymentRequest;
import com.driveshare.modules.payment.dto.response.OwnerEarningsResponse;
import com.driveshare.modules.payment.dto.response.PaymentResponse;

public interface PaymentUseCase {

    PaymentResponse createDepositPayment(Long rentalId, CreatePaymentRequest request, Long currentUserId);

    PaymentResponse confirmPayment(Long paymentId, Long currentUserId);

    PaymentResponse failPayment(Long paymentId, Long currentUserId, String note);

    PaymentResponse cancelPayment(Long paymentId, Long currentUserId, String note);

    PaymentResponse updatePaymentStatus(Long paymentId, EPaymentStatus status, String note, Long currentUserId);

    PaymentResponse getPaymentById(Long paymentId, Long currentUserId);

    PaymentResponse getPaymentByRentalId(Long rentalId, Long currentUserId);

    OwnerEarningsResponse getOwnerEarnings(Long ownerId);
}

