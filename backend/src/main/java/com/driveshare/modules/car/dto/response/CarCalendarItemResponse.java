package com.driveshare.modules.car.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CarCalendarItemResponse {
    /**
     * "RENTAL" (đơn thuê xe của khách) hoặc "OWNER_BLOCK" (chủ xe tự chặn ngày bận)
     */
    private String type;

    private Long referenceId;
    private LocalDate startDate;
    private LocalDate endDate;
    private String title;
    private String status;
    private String note;
}
