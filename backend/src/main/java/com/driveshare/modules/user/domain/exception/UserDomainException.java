package com.driveshare.modules.user.domain.exception;

/**
 * Domain exception for User module.
 */
public class UserDomainException extends RuntimeException {
    public UserDomainException(String message) {
        super(message);
    }

    public UserDomainException(String message, Throwable cause) {
        super(message, cause);
    }
}
