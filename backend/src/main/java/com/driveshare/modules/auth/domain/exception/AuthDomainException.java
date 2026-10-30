package com.driveshare.modules.auth.domain.exception;

/**
 * Domain exception for auth module.
 */
public class AuthDomainException extends RuntimeException {
    public AuthDomainException(String message) {
        super(message);
    }

    public AuthDomainException(String message, Throwable cause) {
        super(message, cause);
    }
}
