package com.driveshare.modules.rental.adapter.out.persistence;

import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.modules.rental.application.port.out.RentalPersistencePort;
import com.driveshare.modules.rental.domain.model.RentalRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class RentalPersistenceAdapter implements RentalPersistencePort {

    private final RentalJpaRepository rentalJpaRepository;

    @Override
    public Optional<RentalRecord> findById(Long rentalId) {
        return rentalJpaRepository.findById(rentalId).map(this::toRecord);
    }

    @Override
    public long countActivePendingByRenter(Long renterId) {
        return rentalJpaRepository.countByRenterIdAndStatus(renterId, ERentalStatus.PENDING);
    }

    private RentalRecord toRecord(Rental r) {
        return new RentalRecord(
                r.getRentalId(),
                r.getCarId(),
                r.getRenterId(),
                r.getStartDate(),
                r.getEndDate(),
                r.getTotalDays(),
                r.getPricePerDay(),
                r.getTotalPrice(),
                r.getDepositAmount(),
                r.getStatus(),
                r.getPaymentExpiresAt(),
                r.getRejectReason(),
                r.getNote(),
                r.getWithDriver(),
                r.getDriverFee(),
                r.getOverdueHours(),
                r.getPenaltyFee(),
                r.getActualReturnTime(),
                r.getIsBlacklistedTriggered()
        );
    }
}

