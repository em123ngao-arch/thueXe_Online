package com.driveshare.modules.payment.dto.response;

import com.driveshare.common.enums.EPaymentMethod;
import com.driveshare.common.enums.EPaymentStatus;
import com.driveshare.common.enums.ERentalStatus;
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
public class PaymentResponse {

    @JsonProperty("payment_id")
    private Long paymentId;

    @JsonProperty("rental_id")
    private Long rentalId;

    private BigDecimal amount;

    @JsonProperty("deposit_amount")
    private BigDecimal depositAmount;

    @JsonProperty("payment_type")
    private String paymentType;

    @JsonProperty("payment_method")
    private EPaymentMethod paymentMethod;

    private EPaymentStatus status;

    @JsonProperty("payment_status")
    public EPaymentStatus getPaymentStatus() {
        return status;
    }

    @JsonProperty("transaction_code")
    private String transactionCode;

    @JsonProperty("qr_code_url")
    private String qrCodeUrl;

    @JsonProperty("rental_status")
    private ERentalStatus rentalStatus;

    @JsonProperty("paid_at")
    private Instant paidAt;

    @JsonProperty("created_at")
    private Instant createdAt;

    // Chi tiết đơn thuê và xe đi kèm
    @JsonProperty("car_id")
    private Long carId;

    @JsonProperty("car_brand")
    private String carBrand;

    @JsonProperty("car_model")
    private String carModel;

    @JsonProperty("plate_number")
    private String plateNumber;

    @JsonProperty("thumbnail_url")
    private String thumbnailUrl;

    @JsonProperty("total_days")
    private Integer totalDays;

    @JsonProperty("total_price")
    private BigDecimal totalPrice;

    @JsonProperty("start_date")
    private LocalDate startDate;

    @JsonProperty("end_date")
    private LocalDate endDate;

    @JsonProperty("bank_name")
    private String bankName;

    @JsonProperty("bank_account_number")
    private String bankAccountNumber;

    @JsonProperty("bank_account_name")
    private String bankAccountName;
}
