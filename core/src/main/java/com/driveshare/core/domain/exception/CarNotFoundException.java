package com.driveshare.core.domain.exception;

public class CarNotFoundException extends DomainException {
    public CarNotFoundException(Long carId) {
        super("Car not found with ID: " + carId);
    }
}
