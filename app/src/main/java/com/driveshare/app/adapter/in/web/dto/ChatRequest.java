package com.driveshare.app.adapter.in.web.dto;

import jakarta.validation.constraints.NotBlank;

public record ChatRequest(
        @NotBlank(message = "Session ID is required")
        String sessionId,
        @NotBlank(message = "Message must not be blank")
        String message
) {
}
