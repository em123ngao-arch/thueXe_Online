package com.driveshare.modules.notification.domain.exception;

/**
 * Domain exception for notification module.
 */
public class NotificationDomainException extends RuntimeException {
    public NotificationDomainException(String message) {
        super(message);
    }

    public NotificationDomainException(String message, Throwable cause) {
        super(message, cause);
    }
}

