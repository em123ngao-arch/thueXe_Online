package com.driveshare.modules.car.application.port.out;

import com.driveshare.modules.car.application.result.CarLockResult;

import java.util.Optional;

public interface CarPersistencePort {

    Optional<CarLockResult> findCarLockById(Long carId);

    boolean hasActiveBooking(Long carId);
}

