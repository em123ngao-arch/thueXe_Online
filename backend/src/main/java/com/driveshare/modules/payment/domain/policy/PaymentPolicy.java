package com.driveshare.modules.payment.domain.policy;

import com.driveshare.common.enums.EPaymentStatus;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class PaymentPolicy {

    private static final BigDecimal DEPOSIT_RATE = new BigDecimal("0.30");

    private PaymentPolicy() {
    }

    public static BigDecimal calculateDeposit(BigDecimal totalPrice) {
        if (totalPrice == null) {
            return BigDecimal.ZERO;
        }
        return totalPrice.multiply(DEPOSIT_RATE).setScale(2, RoundingMode.HALF_UP);
    }

    public static boolean isStatusTransitionAllowed(EPaymentStatus current, EPaymentStatus target) {
        if (current == target) {
            return true;
        }
        if (current == EPaymentStatus.PENDING) {
            return target == EPaymentStatus.SUCCESS
                    || target == EPaymentStatus.FAILED
                    || target == EPaymentStatus.CANCELLED;
        }
        return false;
    }
}

