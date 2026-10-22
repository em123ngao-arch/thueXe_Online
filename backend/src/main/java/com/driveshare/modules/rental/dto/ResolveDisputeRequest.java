package com.driveshare.modules.rental.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResolveDisputeRequest {

    @NotBlank(message = "Hành động xử lý (action) không được để trống")
    @JsonProperty("action")
    private String action; // "REFUND_RENTER" hoặc "REJECT"

    @JsonProperty("admin_note")
    private String adminNote;

    @JsonProperty("penalty_amount")
    private BigDecimal penaltyAmount;
}
