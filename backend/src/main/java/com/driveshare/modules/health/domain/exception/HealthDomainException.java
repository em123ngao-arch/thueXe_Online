package com.driveshare.modules.health.domain.exception;

/**
 * Domain exception for health checking.
 */
public class HealthDomainException extends RuntimeException {

    public HealthDomainException(String message) {
        super(message);
    }

    public HealthDomainException(String message, Throwable cause) {
        super(message, cause);
    }
}

