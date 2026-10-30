package com.driveshare.modules.car.application.port.in;

import com.driveshare.modules.car.dto.request.CalendarBlockCreateRequest;
import com.driveshare.modules.car.dto.response.CalendarBlockResponse;
import com.driveshare.modules.car.dto.response.CarCalendarOverviewResponse;

import java.time.LocalDate;

public interface CarCalendarUseCase {

    CarCalendarOverviewResponse getCarCalendar(Long carId, LocalDate fromDate);

    CalendarBlockResponse addCalendarBlock(Long carId, CalendarBlockCreateRequest request);

    void deleteCalendarBlock(Long carId, Long blockId);
}

