package com.driveshare.modules.rental.dto.response;

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
    private Long id;
    private Long rentalId;
    private Long reporterId;
    private String reason;
    private List<String> proofUrls;
    private String status;
    private BigDecimal refundAmount;
    private BigDecimal penaltyAmount;
    private String adminNote;
    private Instant createdAt;
    private Instant resolvedAt;
}
