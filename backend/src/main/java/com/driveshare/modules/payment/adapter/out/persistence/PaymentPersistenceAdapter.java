package com.driveshare.modules.payment.adapter.out.persistence;

import com.driveshare.common.enums.EPaymentStatus;
import com.driveshare.modules.payment.application.port.out.PaymentPersistencePort;
import com.driveshare.modules.payment.domain.model.PaymentRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class PaymentPersistenceAdapter implements PaymentPersistencePort {

    private final PaymentJpaRepository paymentJpaRepository;

    @Override
    public Optional<PaymentRecord> findByRentalId(Long rentalId) {
        return paymentJpaRepository.findByRentalId(rentalId).map(this::toRecord);
    }

    @Override
    public Optional<PaymentRecord> findByPaymentId(Long paymentId) {
        return paymentJpaRepository.findById(paymentId).map(this::toRecord);
    }

    @Override
    public BigDecimal sumEarningsByRentalIds(List<Long> rentalIds, EPaymentStatus status) {
        return paymentJpaRepository.sumEarningsByRentalIds(rentalIds, status);
    }

    private PaymentRecord toRecord(Payment p) {
        return new PaymentRecord(
                p.getPaymentId(),
                p.getRentalId(),
                p.getAmount(),
                p.getPaymentType(),
                p.getPaymentMethod(),
                p.getStatus(),
                p.getTransactionCode(),
                p.getQrCodeUrl(),
                p.getPaidAt()
        );
    }
}

