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
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminCarDetailResponse {
    private Long carId;
    private String brand;
    private String model;
    private Integer year;
    private String licensePlate;
    private Integer seats;
    private ETransmission transmission;
    private EFuelType fuelType;
    private String color;
    private String description;
    private String pickupAddress;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private BigDecimal basePricePerDay;
    private ECarStatus status;
    private String rejectionReason;
    private Long approvedBy;
    private Instant approvedAt;
    private Instant createdAt;

    // Owner details
    private Long ownerId;
    private String ownerUsername;
    private String ownerName;
    private String ownerEmail;
    private String ownerPhone;
    private String ownerAvatar;

    // Images and documents
    private List<CarImageResponse> images;
    private List<CarDocumentResponse> documents;
}
