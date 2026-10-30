package com.driveshare.modules.payment.domain.model;

import com.driveshare.common.enums.EPaymentMethod;
import com.driveshare.common.enums.EPaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentRecord(
        Long paymentId,
        Long rentalId,
        BigDecimal amount,
        String paymentType,
        EPaymentMethod paymentMethod,
        EPaymentStatus status,
        String transactionCode,
        String qrCodeUrl,
        Instant paidAt
) {
}

