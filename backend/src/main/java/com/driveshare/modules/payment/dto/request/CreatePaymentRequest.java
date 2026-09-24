package com.driveshare.modules.payment.dto.request;

import com.driveshare.common.enums.EPaymentMethod;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePaymentRequest {

    @JsonProperty("rental_id")
    private Long rentalId;

    @JsonProperty("payment_method")
    @Builder.Default
    private EPaymentMethod paymentMethod = EPaymentMethod.VIETQR;

    @JsonProperty("payment_type")
    @Builder.Default
    private String paymentType = "DEPOSIT";

    private String note;
}
