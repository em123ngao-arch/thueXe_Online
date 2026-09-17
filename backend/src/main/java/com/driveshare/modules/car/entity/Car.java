package com.driveshare.modules.car.entity;

import com.driveshare.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Entity ánh xạ bảng {@code cars}.
 * <p>
 * Kế thừa {@link BaseEntity} để có sẵn các trường audit:
 * {@code createdAt}, {@code createdBy}, {@code updatedAt}, {@code updatedBy},
 * {@code deletedAt}, {@code deletedBy}.
 * <p>
 * Soft-delete được thực hiện thông qua {@code deletedAt} có sẵn trong {@link BaseEntity}
 * — {@link BaseEntity#isDeleted()} trả về {@code true} khi {@code deletedAt != null}.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "cars",
        indexes = {
                @Index(name = "idx_cars_owner_id", columnList = "owner_id"),
                @Index(name = "idx_cars_plate_number", columnList = "plate_number"),
                @Index(name = "idx_cars_status", columnList = "status")
        }
)
public class Car extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "car_id")
    private Long carId;

    // -----------------------------------------------------------------
    // Quan hệ Owner — dùng FK thay vì @ManyToOne để tránh N+1 Query
    // khi chỉ cần ownerId mà không cần load toàn bộ User.
    // -----------------------------------------------------------------
    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    // -----------------------------------------------------------------
    // Thông tin nhận diện xe
    // -----------------------------------------------------------------
    @Column(name = "plate_number", length = 20, nullable = false, unique = true)
    private String plateNumber;

    @Column(name = "brand", length = 100, nullable = false)
    private String brand;

    @Column(name = "model", length = 100, nullable = false)
    private String model;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "color", length = 50)
    private String color;

    @Column(name = "seats", nullable = false)
    private Integer seats;

    @Column(name = "transmission", length = 20)
    private String transmission; // AUTOMATIC | MANUAL

    @Column(name = "fuel_type", length = 20)
    private String fuelType; // GASOLINE | DIESEL | ELECTRIC | HYBRID

    // -----------------------------------------------------------------
    // Giá & Địa điểm
    // -----------------------------------------------------------------
    @Column(name = "price_per_day", nullable = false, precision = 15, scale = 2)
    private BigDecimal pricePerDay;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "province", length = 100)
    private String province;

    // -----------------------------------------------------------------
    // Mô tả & Tiện nghi
    // -----------------------------------------------------------------
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "features", columnDefinition = "TEXT")
    private String features; // Lưu dạng JSON hoặc CSV: "GPS,Bluetooth,Camera"

    // -----------------------------------------------------------------
    // Hình ảnh
    // -----------------------------------------------------------------
    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    // -----------------------------------------------------------------
    // Trạng thái & Soft-delete
    // -----------------------------------------------------------------
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private ECarStatus status = ECarStatus.PENDING;

    /**
     * Lý do Admin từ chối duyệt xe (điền khi status = REJECTED).
     */
    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    /**
     * Thời điểm Admin/Staff duyệt xe.
     */
    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "approved_by")
    private Long approvedBy;
}
