package com.driveshare.core.application.port.out;

import com.driveshare.core.domain.model.Car;

import java.util.List;
import java.util.Optional;

public interface CarRepositoryPort {
    Optional<Car> findById(Long id);
    List<Car> findAllAvailable();
    Car save(Car car);
}
