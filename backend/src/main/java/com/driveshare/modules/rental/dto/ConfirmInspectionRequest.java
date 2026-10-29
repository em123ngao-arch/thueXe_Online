package com.driveshare.modules.rental.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

/**
 * DTO yêu cầu xác nhận hoặc khiếu nại biên bản giao nhận xe của khách thuê (Sprint Final - Lâm Chí Vĩ).
 */
public record ConfirmInspectionRequest(
        @NotNull(message = "Trạng thái xác nhận (agreed) không được để trống")
        @JsonProperty("agreed")
        Boolean agreed,

        @JsonProperty("dispute_reason")
        @JsonAlias({"disputeReason", "dispute_reason", "reason"})
        String disputeReason,

        @JsonProperty("proof_urls")
        @JsonAlias({"proofUrls", "proof_urls"})
        String proofUrls
) {}

