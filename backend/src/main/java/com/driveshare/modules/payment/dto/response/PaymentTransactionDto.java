package com.driveshare.modules.payment.dto.response;

import com.driveshare.common.enums.EPaymentMethod;
import com.driveshare.common.enums.EPaymentStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PaymentTransactionDto {

    @JsonProperty("payment_id")
    private Long paymentId;

    @JsonProperty("rental_id")
    private Long rentalId;

    @JsonProperty("car_id")
    private Long carId;

    @JsonProperty("car_brand")
    private String carBrand;

    @JsonProperty("car_model")
    private String carModel;

    @JsonProperty("plate_number")
    private String plateNumber;

    @JsonProperty("renter_id")
    private Long renterId;

    @JsonProperty("renter_name")
    private String renterName;

    @JsonProperty("renter_phone")
    private String renterPhone;

    @JsonProperty("renter_email")
    private String renterEmail;

    private BigDecimal amount;

    @JsonProperty("payment_type")
    private String paymentType;

    @JsonProperty("payment_method")
    private EPaymentMethod paymentMethod;

    private EPaymentStatus status;

    @JsonProperty("transaction_code")
    private String transactionCode;

    @JsonProperty("paid_at")
    private Instant paidAt;

    @JsonProperty("created_at")
    private Instant createdAt;

    @JsonProperty("start_date")
    private LocalDate startDate;

    @JsonProperty("end_date")
    private LocalDate endDate;
}
