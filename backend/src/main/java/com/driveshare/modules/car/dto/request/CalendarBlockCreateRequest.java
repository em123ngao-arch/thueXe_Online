package com.driveshare.modules.car.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarBlockCreateRequest {

    @NotNull(message = "Ngày bắt đầu không được để trống")
    @JsonProperty("startDate")
    @JsonAlias({"start_date"})
    private LocalDate startDate;

    @NotNull(message = "Ngày kết thúc không được để trống")
    @JsonProperty("endDate")
    @JsonAlias({"end_date"})
    private LocalDate endDate;

    @Size(max = 255, message = "Lý do không được vượt quá 255 ký tự")
    private String reason;
}
