package com.driveshare.modules.rental.dto.response;

import com.driveshare.common.enums.EDisputeStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RentalDisputeResponse {

    @JsonProperty("id")
    private Long id;

    @JsonProperty("rental_id")
    private Long rentalId;

    @JsonProperty("reporter_id")
    private Long reporterId;

    @JsonProperty("reporter_name")
    private String reporterName;

    @JsonProperty("reporter_phone")
    private String reporterPhone;

    @JsonProperty("reason")
    private String reason;

    @JsonProperty("proof_urls")
    private List<String> proofUrls;

    @JsonProperty("status")
    private EDisputeStatus status;

    @JsonProperty("refund_amount")
    private BigDecimal refundAmount;

    @JsonProperty("penalty_amount")
    private BigDecimal penaltyAmount;

    @JsonProperty("admin_note")
    private String adminNote;

    @JsonProperty("resolved_by")
    private Long resolvedBy;

    @JsonProperty("resolver_name")
    private String resolverName;

    @JsonProperty("created_at")
    private Instant createdAt;

    @JsonProperty("resolved_at")
    private Instant resolvedAt;
}
