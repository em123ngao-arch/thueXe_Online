package com.driveshare.modules.rental.application.port.out;

public record CarBookingLockResult(
        Long carId,
        Long ownerId,
        String status,
        boolean available
) {
}

