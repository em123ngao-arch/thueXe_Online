package com.driveshare.modules.rental.domain.model;

import java.time.Instant;

public record ReviewRecord(
        Long reviewId,
        Long rentalId,
        Long carId,
        Long renterId,
        Integer rating,
        String comment,
        Instant createdAt
) {
}

