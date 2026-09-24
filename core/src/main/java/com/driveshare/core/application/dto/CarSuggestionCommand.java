package com.driveshare.core.application.dto;

public record CarSuggestionCommand(
        String query,
        String location,
        Integer budget,
        Integer seats
) {
}
