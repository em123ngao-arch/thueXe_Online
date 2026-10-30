package com.driveshare.modules.car.adapter.out.persistence;

import com.driveshare.modules.car.application.port.out.CarPersistencePort;
import com.driveshare.modules.car.application.result.CarLockResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class CarPersistenceAdapter implements CarPersistencePort {

    private final CarJpaRepository carJpaRepository;

    @Override
    public Optional<CarLockResult> findCarLockById(Long carId) {
        return carJpaRepository.findCarForUpdate(carId)
                .map(car -> new CarLockResult(
                        car.getCarId(),
                        car.getOwnerId(),
                        car.getStatus(),
                        car.getStatus() == com.driveshare.common.enums.ECarStatus.ACTIVE
                ));
    }

    @Override
    public boolean hasActiveBooking(Long carId) {
        return carJpaRepository.hasActiveBooking(carId);
    }
}

