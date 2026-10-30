package com.driveshare.modules.payment.application.port.out;

import com.driveshare.common.enums.EPaymentStatus;
import com.driveshare.modules.payment.domain.model.PaymentRecord;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface PaymentPersistencePort {

    Optional<PaymentRecord> findByRentalId(Long rentalId);

    Optional<PaymentRecord> findByPaymentId(Long paymentId);

    BigDecimal sumEarningsByRentalIds(List<Long> rentalIds, EPaymentStatus status);
}

