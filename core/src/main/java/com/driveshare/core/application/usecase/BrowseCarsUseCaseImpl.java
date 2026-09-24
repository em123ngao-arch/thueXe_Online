package com.driveshare.core.application.usecase;

import com.driveshare.core.application.dto.CarResult;
import com.driveshare.core.application.port.in.BrowseCarsUseCase;
import com.driveshare.core.application.port.out.CarRepositoryPort;
import com.driveshare.core.domain.exception.CarNotFoundException;

import java.util.List;
import java.util.Objects;

public class BrowseCarsUseCaseImpl implements BrowseCarsUseCase {

    private final CarRepositoryPort carRepositoryPort;

    public BrowseCarsUseCaseImpl(CarRepositoryPort carRepositoryPort) {
        this.carRepositoryPort = Objects.requireNonNull(carRepositoryPort, "carRepositoryPort must not be null");
    }

    @Override
    public List<CarResult> getAvailableCars() {
        return carRepositoryPort.findAllAvailable()
                .stream()
                .map(CarResult::from)
                .toList();
    }

    @Override
    public CarResult getCarById(Long id) {
        return carRepositoryPort.findById(id)
                .map(CarResult::from)
                .orElseThrow(() -> new CarNotFoundException(id));
    }
}
