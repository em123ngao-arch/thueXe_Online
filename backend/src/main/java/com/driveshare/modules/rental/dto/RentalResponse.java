package com.driveshare.modules.rental.dto;

import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.modules.rental.entity.Rental;
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
public class RentalResponse {

    @JsonProperty("rental_id")
    private Long rentalId;

    @JsonProperty("car_id")
    private Long carId;

    @JsonProperty("renter_id")
    private Long renterId;

    @JsonProperty("start_date")
    private LocalDate startDate;

    @JsonProperty("end_date")
    private LocalDate endDate;

    @JsonProperty("total_days")
    private Integer totalDays;

    @JsonProperty("price_per_day")
    private BigDecimal pricePerDay;

    @JsonProperty("total_price")
    private BigDecimal totalPrice;

    @JsonProperty("deposit_amount")
    private BigDecimal depositAmount;

    @JsonProperty("status")
    private ERentalStatus status;

    @JsonProperty("reject_reason")
    private String rejectReason;

    @JsonProperty("note")
    private String note;

    @JsonProperty("created_at")
    private Instant createdAt;

    public static RentalResponse from(Rental rental) {
        if (rental == null) {
            return null;
        }
        return RentalResponse.builder()
                .rentalId(rental.getRentalId())
                .carId(rental.getCarId())
                .renterId(rental.getRenterId())
                .startDate(rental.getStartDate())
                .endDate(rental.getEndDate())
                .totalDays(rental.getTotalDays())
                .pricePerDay(rental.getPricePerDay())
                .totalPrice(rental.getTotalPrice())
                .depositAmount(rental.getDepositAmount())
                .status(rental.getStatus())
                .rejectReason(rental.getRejectReason())
                .note(rental.getNote())
                .createdAt(rental.getCreatedAt())
                .build();
    }
}
