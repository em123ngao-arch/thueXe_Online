package com.driveshare.modules.payment.dto.request;

import com.driveshare.common.enums.EPaymentStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentStatusUpdateRequest {

    @NotNull(message = "Trạng thái thanh toán không được để trống")
    @JsonProperty("status")
    private EPaymentStatus status;

    private String note;
}
