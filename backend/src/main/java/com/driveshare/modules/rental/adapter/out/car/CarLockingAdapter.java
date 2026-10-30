package com.driveshare.modules.rental.adapter.out.car;

import com.driveshare.modules.car.application.port.in.LockCarForBookingUseCase;
import com.driveshare.modules.car.application.result.CarLockResult;
import com.driveshare.modules.rental.application.port.out.CarBookingLockResult;
import com.driveshare.modules.rental.application.port.out.CarLockingPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CarLockingAdapter implements CarLockingPort {

    private final LockCarForBookingUseCase lockCarForBookingUseCase;

    @Override
    public CarBookingLockResult lockCarForBooking(Long carId) {
        CarLockResult res = lockCarForBookingUseCase.lockForBooking(carId);
        return new CarBookingLockResult(
                res.carId(),
                res.ownerId(),
                res.status() != null ? res.status().name() : null,
                res.available()
        );
    }
}
