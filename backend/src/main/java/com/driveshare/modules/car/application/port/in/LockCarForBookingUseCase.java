package com.driveshare.modules.car.application.port.in;

import com.driveshare.modules.car.application.result.CarLockResult;

public interface LockCarForBookingUseCase {

    CarLockResult lockForBooking(Long carId);
}

