package com.driveshare.modules.rental.domain.model;

import com.driveshare.common.enums.EInspectionStatus;
import com.driveshare.common.enums.EInspectionType;

import java.math.BigDecimal;
import java.time.Instant;

public record RentalInspectionRecord(
        Long inspectionId,
        Long rentalId,
        EInspectionType inspectionType,
        EInspectionStatus status,
        Integer odoMeter,
        Integer fuelLevel,
        String images,
        String notes,
        BigDecimal extraFee,
        String extraFeeReason,
        Long performedBy,
        Instant createdAt
) {
}

