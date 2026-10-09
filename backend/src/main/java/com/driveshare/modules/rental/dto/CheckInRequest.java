package com.driveshare.modules.rental.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * DTO nhận dữ liệu bàn giao xe (Check-in) từ Chủ xe (Sprint 3 - Vĩ).
 */
public record CheckInRequest(
        @NotNull(message = "Số ODO không được để trống")
        @Min(value = 0, message = "Số ODO phải lớn hơn hoặc bằng 0")
        @JsonProperty("odo_meter")
        @JsonAlias("odoMeter")
        Integer odoMeter,

        @NotNull(message = "Mức xăng không được để trống")
        @Min(value = 0, message = "Mức xăng tối thiểu là 0%")
        @Max(value = 100, message = "Mức xăng tối đa là 100%")
        @JsonProperty("fuel_level")
        @JsonAlias("fuelLevel")
        Integer fuelLevel,

        @JsonProperty("images")
        String images, // Link các ảnh bàn giao xe 4 góc cách nhau bởi dấu phẩy

        @JsonProperty("notes")
        String notes   // Tình trạng xe, vết trầy xước
) {}
