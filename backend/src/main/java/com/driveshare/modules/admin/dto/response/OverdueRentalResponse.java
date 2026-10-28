package com.driveshare.modules.admin.dto.response;

import com.driveshare.common.enums.ERentalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * DTO phản hồi danh sách các đơn quá hạn cho Admin (Sprint 4 - Duy Quân).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OverdueRentalResponse {

    private Long rentalId;

    // Thông tin xe
    private Long carId;
    private String carPlate;
    private String carBrand;
    private String carModel;
    private String carName;

    // Thông tin khách thuê
    private Long renterId;
    private String renterName;
    private String renterPhone;
    private String renterEmail;
    private String renterIdCard;

    // Thông tin chủ xe
    private Long ownerId;
    private String ownerName;
    private String ownerPhone;

    // Thời gian & Quá hạn
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer overdueHours;
    private BigDecimal penaltyFee;
    private BigDecimal pricePerDay;
    private BigDecimal totalPrice;
    private BigDecimal depositAmount;
    private ERentalStatus status;
    private Boolean isBlacklistedTriggered;
    private Instant createdAt;
}
