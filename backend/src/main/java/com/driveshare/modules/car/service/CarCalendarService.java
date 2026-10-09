package com.driveshare.modules.car.service;

import com.driveshare.modules.car.dto.request.CalendarBlockCreateRequest;
import com.driveshare.modules.car.dto.response.CalendarBlockResponse;
import com.driveshare.modules.car.dto.response.CarCalendarOverviewResponse;

import java.time.LocalDate;

public interface CarCalendarService {

    /**
     * Lấy toàn bộ thông tin lịch của xe: bao gồm các đơn thuê của khách và các khoảng ngày chủ xe chặn bận.
     */
    CarCalendarOverviewResponse getCarCalendar(Long carId, LocalDate fromDate);

    /**
     * Chủ xe tạo khoảng chặn ngày bận (Blackout dates) cho xe.
     */
    CalendarBlockResponse addCalendarBlock(Long carId, CalendarBlockCreateRequest request);

    /**
     * Chủ xe hủy / mở khóa một khoảng ngày bận đã chặn trước đó.
     */
    void deleteCalendarBlock(Long carId, Long blockId);
}
