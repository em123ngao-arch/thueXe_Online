package com.driveshare.modules.rental.entity;

import com.driveshare.common.enums.EInspectionType;
import com.driveshare.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Entity ánh xạ bảng {@code rental_inspections} trong Sprint 3.
 * <p>
 * Lưu trữ biên bản bàn giao xe (CHECK_IN) và nghiệm thu trả xe (CHECK_OUT).
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "rental_inspections",
        indexes = {
                @Index(name = "idx_inspections_rental_id", columnList = "rental_id"),
                @Index(name = "idx_inspections_type", columnList = "rental_id, inspection_type")
        }
)
public class RentalInspection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inspection_id")
    private Long inspectionId;

    @Column(name = "rental_id", nullable = false)
    private Long rentalId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rental_id", insertable = false, updatable = false)
    private Rental rental;

    @Enumerated(EnumType.STRING)
    @Column(name = "inspection_type", length = 20, nullable = false)
    private EInspectionType inspectionType;

    @Column(name = "odo_meter", nullable = false)
    private Integer odoMeter;

    @Column(name = "fuel_level", nullable = false)
    private Integer fuelLevel;

    @Column(name = "images", columnDefinition = "TEXT")
    private String images;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "extra_fee", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal extraFee = BigDecimal.ZERO;

    @Column(name = "extra_fee_reason", length = 255)
    private String extraFeeReason;

    @Column(name = "performed_by", nullable = false)
    private Long performedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by", insertable = false, updatable = false)
    private User performer;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
