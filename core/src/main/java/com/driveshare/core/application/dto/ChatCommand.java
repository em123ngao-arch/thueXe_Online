package com.driveshare.core.application.dto;

public record ChatCommand(Long userId, String sessionId, String message) {
}
