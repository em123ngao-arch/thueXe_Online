package com.driveshare.modules.oauth2.domain.exception;

public class OAuth2DomainException extends RuntimeException {

    public OAuth2DomainException(String message) {
        super(message);
    }

    public OAuth2DomainException(String message, Throwable cause) {
        super(message, cause);
    }
}

