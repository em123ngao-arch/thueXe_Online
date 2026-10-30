package com.driveshare.modules.car.domain.exception;

public class CarDomainException extends RuntimeException {

    public CarDomainException(String message) {
        super(message);
    }

    public CarDomainException(String message, Throwable cause) {
        super(message, cause);
    }
}

