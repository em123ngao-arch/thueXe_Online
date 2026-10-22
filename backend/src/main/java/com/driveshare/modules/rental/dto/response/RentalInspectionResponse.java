package com.driveshare.modules.rental.dto.response;

import com.driveshare.common.enums.EInspectionType;
import com.driveshare.modules.rental.entity.RentalInspection;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * DTO phản hồi dữ liệu biên bản bàn giao hoặc nghiệm thu trả xe (Sprint 3 - Vĩ).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RentalInspectionResponse {

    @JsonProperty("inspection_id")
    private Long inspectionId;

    @JsonProperty("rental_id")
    private Long rentalId;

    @JsonProperty("inspection_type")
    private EInspectionType inspectionType;

    @JsonProperty("odo_meter")
    private Integer odoMeter;

    @JsonProperty("fuel_level")
    private Integer fuelLevel;

    @JsonProperty("images")
    private String images;

    @JsonProperty("notes")
    private String notes;

    @JsonProperty("extra_fee")
    private BigDecimal extraFee;

    @JsonProperty("extra_fee_reason")
    private String extraFeeReason;

    @JsonProperty("performed_by")
    private Long performedBy;

    @JsonProperty("created_at")
    private Instant createdAt;

    public static RentalInspectionResponse from(RentalInspection inspection) {
        if (inspection == null) {
            return null;
        }
        return RentalInspectionResponse.builder()
                .inspectionId(inspection.getInspectionId())
                .rentalId(inspection.getRentalId())
                .inspectionType(inspection.getInspectionType())
                .odoMeter(inspection.getOdoMeter())
                .fuelLevel(inspection.getFuelLevel())
                .images(inspection.getImages())
                .notes(inspection.getNotes())
                .extraFee(inspection.getExtraFee() != null ? inspection.getExtraFee() : BigDecimal.ZERO)
                .extraFeeReason(inspection.getExtraFeeReason())
                .performedBy(inspection.getPerformedBy())
                .createdAt(inspection.getCreatedAt())
                .build();
    }
}
