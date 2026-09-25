package com.driveshare.modules.admin.dto.response;

import com.driveshare.common.enums.ERentalStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminRentalResponse {
    private Long rentalId;
    private Long carId;
    private String carName;
    private String carPlate;
    private Long renterId;
    private String renterName;
    private String renterPhone;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer totalDays;
    private BigDecimal pricePerDay;
    private BigDecimal totalPrice;
    private BigDecimal depositAmount;
    private ERentalStatus status;
    private String rejectReason;
    private String note;
    private Instant createdAt;
}
