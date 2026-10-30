package com.driveshare.modules.ai.domain.exception;

/**
 * Pure Java Domain Exception for AI Advisor business rule violations.
 */
public class AiAdvisorException extends RuntimeException {
    public AiAdvisorException(String message) {
        super(message);
    }

    public AiAdvisorException(String message, Throwable cause) {
        super(message, cause);
    }
}

