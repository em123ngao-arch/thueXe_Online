package com.driveshare.core.application.dto;

import com.driveshare.core.domain.model.Car;
import com.driveshare.core.domain.vo.CarStatus;

import java.math.BigDecimal;
import java.util.List;

public record CarResult(
        Long id,
        Long ownerId,
        String brand,
        String model,
        String licensePlate,
        int seats,
        String transmission,
        String fuelType,
        BigDecimal pricePerDay,
        String currency,
        CarStatus status,
        String address,
        String description,
        List<String> imageUrls
) {
    public static CarResult from(Car car) {
        return new CarResult(
                car.getId(),
                car.getOwnerId(),
                car.getBrand(),
                car.getModel(),
                car.getLicensePlate(),
                car.getSeats(),
                car.getTransmission(),
                car.getFuelType(),
                car.getPricePerDay().amount(),
                car.getPricePerDay().currency(),
                car.getStatus(),
                car.getAddress(),
                car.getDescription(),
                car.getImageUrls()
        );
    }
}
