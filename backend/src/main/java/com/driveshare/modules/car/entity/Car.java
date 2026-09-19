package com.driveshare.modules.car.entity;

import com.driveshare.common.entity.BaseEntity;
import com.driveshare.common.enums.ECarStatus;
import com.driveshare.common.enums.EFuelType;
import com.driveshare.common.enums.ETransmission;
import com.driveshare.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "cars")
public class Car extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "car_id")
    private Long carId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "brand", length = 50, nullable = false)
    private String brand;

    @Column(name = "model", length = 100, nullable = false)
    private String model;

    @Column(name = "year")
    private Integer year;

    @Column(name = "license_plate", length = 20, unique = true, nullable = false)
    private String licensePlate;

    @Column(name = "seats")
    private Integer seats;

    @Enumerated(EnumType.STRING)
    @Column(name = "transmission", length = 20)
    private ETransmission transmission;

    @Enumerated(EnumType.STRING)
    @Column(name = "fuel_type", length = 20)
    private EFuelType fuelType;

    @Column(name = "color", length = 30)
    private String color;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "pickup_address", length = 255)
    private String pickupAddress;

    @Column(name = "latitude", precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(name = "base_price_per_day", precision = 12, scale = 2, nullable = false)
    private BigDecimal basePricePerDay;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30)
    @Builder.Default
    private ECarStatus status = ECarStatus.PENDING_REVIEW;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @OneToMany(mappedBy = "car", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CarImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "car", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CarDocument> documents = new ArrayList<>();
}
