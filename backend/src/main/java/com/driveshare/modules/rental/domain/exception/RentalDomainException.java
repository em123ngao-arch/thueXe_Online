package com.driveshare.modules.rental.domain.exception;

public class RentalDomainException extends RuntimeException {

    public RentalDomainException(String message) {
        super(message);
    }

    public RentalDomainException(String message, Throwable cause) {
        super(message, cause);
    }
}

