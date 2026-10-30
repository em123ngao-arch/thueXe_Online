package com.driveshare.modules.car.application.usecase;

import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.car.application.port.in.LockCarForBookingUseCase;
import com.driveshare.modules.car.application.port.out.CarPersistencePort;
import com.driveshare.modules.car.domain.model.CarLockResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LockCarForBookingUseCaseImpl implements LockCarForBookingUseCase {

    private final CarPersistencePort carPersistencePort;

    @Override
    @Transactional // Default Propagation.REQUIRED - CẤM REQUIRES_NEW để lock cùng transaction với booking
    public CarLockResult lockForBooking(Long carId) {
        return carPersistencePort.findCarLockById(carId)
                .orElseThrow(() -> new AppException(ErrorCode.CAR_NOT_FOUND, "Không tìm thấy xe với ID: " + carId));
    }
}

