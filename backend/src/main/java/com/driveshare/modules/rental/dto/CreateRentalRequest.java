package com.driveshare.modules.rental.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRentalRequest {

    @NotNull(message = "ID xe không được để trống")
    @JsonProperty("car_id")
    @JsonAlias("carId")
    private Long carId;

    @NotNull(message = "Ngày bắt đầu thuê không được để trống")
    @JsonProperty("start_date")
    @JsonAlias("startDate")
    private LocalDate startDate;

    @NotNull(message = "Ngày kết thúc thuê không được để trống")
    @JsonProperty("end_date")
    @JsonAlias("endDate")
    private LocalDate endDate;

    @JsonProperty("note")
    private String note;
}
