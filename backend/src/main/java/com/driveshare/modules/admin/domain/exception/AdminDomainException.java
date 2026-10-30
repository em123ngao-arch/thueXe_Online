package com.driveshare.modules.admin.domain.exception;

/**
 * Domain exception for administrative business rule violations.
 */
public class AdminDomainException extends RuntimeException {

    public AdminDomainException(String message) {
        super(message);
    }

    public AdminDomainException(String message, Throwable cause) {
        super(message, cause);
    }
}

