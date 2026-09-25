package com.driveshare.core.domain.exception;

public class CarNotAvailableException extends DomainException {
    public CarNotAvailableException(Long carId) {
        super("Car is currently not available for rent with ID: " + carId);
    }
}
