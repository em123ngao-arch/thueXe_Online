package com.driveshare.modules.car.application.port.out;

import com.driveshare.modules.car.domain.model.CarLockResult;

import java.util.Optional;

public interface CarPersistencePort {

    Optional<CarLockResult> findCarLockById(Long carId);

    boolean hasActiveBooking(Long carId);
}

