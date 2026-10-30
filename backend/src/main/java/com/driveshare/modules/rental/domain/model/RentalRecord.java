package com.driveshare.modules.rental.domain.model;

import com.driveshare.common.enums.ERentalStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record RentalRecord(
        Long rentalId,
        Long carId,
        Long renterId,
        LocalDate startDate,
        LocalDate endDate,
        Integer totalDays,
        BigDecimal pricePerDay,
        BigDecimal totalPrice,
        BigDecimal depositAmount,
        ERentalStatus status,
        Instant paymentExpiresAt,
        String rejectReason,
        String note,
        Boolean withDriver,
        BigDecimal driverFee,
        Integer overdueHours,
        BigDecimal penaltyFee,
        Instant actualReturnTime,
        Boolean isBlacklistedTriggered
) {
}

