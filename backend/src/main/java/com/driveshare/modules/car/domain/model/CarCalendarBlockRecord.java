package com.driveshare.modules.car.domain.model;

import java.time.LocalDate;

public record CarCalendarBlockRecord(
        Long blockId,
        Long carId,
        LocalDate startDate,
        LocalDate endDate,
        String reason
) {
}

