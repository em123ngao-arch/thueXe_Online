package com.driveshare.modules.car.domain.model;

import com.driveshare.common.enums.ECarStatus;

public record CarLockResult(
        Long carId,
        Long ownerId,
        ECarStatus status,
        boolean available
) {
}

