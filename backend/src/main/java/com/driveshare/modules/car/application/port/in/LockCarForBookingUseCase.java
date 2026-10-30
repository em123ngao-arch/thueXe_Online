package com.driveshare.modules.car.application.port.in;

import com.driveshare.modules.car.domain.model.CarLockResult;

public interface LockCarForBookingUseCase {

    CarLockResult lockForBooking(Long carId);
}

