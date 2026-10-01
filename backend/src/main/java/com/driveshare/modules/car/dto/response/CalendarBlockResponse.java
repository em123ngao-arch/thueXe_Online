package com.driveshare.modules.car.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarBlockResponse {
    private Long blockId;
    private Long carId;
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
    private Instant createdAt;
}
