package com.driveshare.modules.payment.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OwnerEarningsResponse {

    @JsonProperty("owner_id")
    private Long ownerId;

    @JsonProperty("total_earnings")
    @Builder.Default
    private BigDecimal totalEarnings = BigDecimal.ZERO;

    @JsonProperty("pending_earnings")
    @Builder.Default
    private BigDecimal pendingEarnings = BigDecimal.ZERO;

    @JsonProperty("total_transactions")
    @Builder.Default
    private Long totalTransactions = 0L;

    @JsonProperty("completed_rentals")
    @Builder.Default
    private Long completedRentals = 0L;

    @JsonProperty("transactions")
    @Builder.Default
    private List<PaymentTransactionDto> transactions = new ArrayList<>();
}
