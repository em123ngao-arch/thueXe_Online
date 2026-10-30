package com.driveshare.modules.rental.domain.model;

import com.driveshare.common.enums.EDisputeStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record RentalDisputeRecord(
        Long id,
        Long rentalId,
        Long reporterId,
        String reason,
        String proofUrls,
        EDisputeStatus status,
        BigDecimal refundAmount,
        BigDecimal penaltyAmount,
        String adminNote,
        Long resolvedBy,
        Instant resolvedAt
) {
}

