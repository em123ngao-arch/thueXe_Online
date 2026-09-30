package com.driveshare.modules.car.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CarCalendarOverviewResponse {
    private Long carId;
    private String brand;
    private String model;
    private String plateNumber;
    private List<CarCalendarItemResponse> items;
    private List<LocalDate> unavailableDates;
}
