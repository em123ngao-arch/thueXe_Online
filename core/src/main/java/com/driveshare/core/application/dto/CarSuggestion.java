package com.driveshare.core.application.dto;

public record CarSuggestion(
        String carName,
        String seats,
        String pricePerDay,
        String transmission,
        String fuelType,
        String reason
) {
}
