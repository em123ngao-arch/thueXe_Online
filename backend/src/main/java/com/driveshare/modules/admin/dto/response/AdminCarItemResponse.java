package com.driveshare.modules.admin.dto.response;

import com.driveshare.common.enums.ECarStatus;
import com.driveshare.common.enums.EFuelType;
import com.driveshare.common.enums.ETransmission;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminCarItemResponse {
    private Long carId;
    private String brand;
    private String model;
    private Integer year;
    private String licensePlate;
    private Integer seats;
    private ETransmission transmission;
    private EFuelType fuelType;
    private String color;
    private BigDecimal basePricePerDay;
    private String pickupAddress;
    private String thumbnailUrl;
    private ECarStatus status;
    private String rejectionReason;
    private Long ownerId;
    private String ownerName;
    private String ownerPhone;
    private String ownerAvatar;
    private Instant createdAt;
}
