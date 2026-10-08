package com.driveshare.modules.rental.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * DTO nhận dữ liệu nghiệm thu trả xe (Check-out) từ Chủ xe (Sprint 3 - Vĩ).
 */
public record CheckOutRequest(
        @NotNull(message = "Số ODO trả không được để trống")
        @Min(value = 0, message = "Số ODO phải lớn hơn hoặc bằng 0")
        @JsonProperty("odo_meter")
        @JsonAlias("odoMeter")
        Integer odoMeter,

        @NotNull(message = "Mức xăng trả không được để trống")
        @Min(value = 0, message = "Mức xăng tối thiểu là 0%")
        @Max(value = 100, message = "Mức xăng tối đa là 100%")
        @JsonProperty("fuel_level")
        @JsonAlias("fuelLevel")
        Integer fuelLevel,

        @JsonProperty("extra_fee")
        @JsonAlias("extraFee")
        BigDecimal extraFee,        // Phụ phí phát sinh (nếu có: rửa xe, thiếu xăng, quá km)

        @JsonProperty("extra_fee_reason")
        @JsonAlias("extraFeeReason")
        String extraFeeReason,      // Lý do phụ phí

        @JsonProperty("images")
        String images,              // Link ảnh chụp khi trả xe

        @JsonProperty("notes")
        String notes                // Ghi chú khi trả xe
) {}
