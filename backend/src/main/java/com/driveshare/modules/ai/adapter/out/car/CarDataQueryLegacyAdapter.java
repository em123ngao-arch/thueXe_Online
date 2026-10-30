package com.driveshare.modules.ai.adapter.out.car;

import com.driveshare.common.enums.ECarStatus;
import com.driveshare.modules.ai.application.port.out.CarDataQueryPort;
import com.driveshare.modules.ai.application.result.CarSummaryResult;
import com.driveshare.modules.car.adapter.out.persistence.Car;
import com.driveshare.modules.car.repository.CarRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

// @TechnicalDebt: calls legacy CarRepository directly until module car is refactored in Phase 3
@Component
public class CarDataQueryLegacyAdapter implements CarDataQueryPort {

    private final CarRepository carRepository;

    @Autowired
    public CarDataQueryLegacyAdapter(CarRepository carRepository) {
        this.carRepository = carRepository;
    }

    @Override
    public List<CarSummaryResult> findActiveCars(int limit) {
        if (carRepository == null) {
            return Collections.emptyList();
        }
        Page<Car> page = carRepository.findByStatusAndDeletedAtIsNull(
                ECarStatus.ACTIVE,
                PageRequest.of(0, Math.max(limit, 1), Sort.by(Sort.Direction.ASC, "pricePerDay"))
        );
        return page.getContent().stream().map(this::toResult).collect(Collectors.toList());
    }

    @Override
    public Optional<CarSummaryResult> findCarById(Long carId) {
        if (carRepository == null || carId == null) {
            return Optional.empty();
        }
        return carRepository.findById(carId).map(this::toResult);
    }

    private CarSummaryResult toResult(Car c) {
        return new CarSummaryResult(
                c.getCarId(),
                c.getBrand(),
                c.getModel(),
                c.getYear(),
                c.getPricePerDay(),
                c.getSeats(),
                c.getTransmission(),
                c.getFuelType(),
                c.getFeatures(),
                c.getRating(),
                c.getRatingCount(),
                c.getThumbnailUrl(),
                c.getAddress(),
                c.getProvince(),
                c.getHasDriverService(),
                c.getDriverFeePerDay()
        );
    }
}
