package com.driveshare.modules.car.application.result;

import com.driveshare.common.enums.ECarStatus;

public record CarLockResult(
        Long carId,
        Long ownerId,
        ECarStatus status,
        boolean available
) {
}

