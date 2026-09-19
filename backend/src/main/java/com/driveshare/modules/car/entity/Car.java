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
    // Khiêm dùng @ManyToOne(FetchType.LAZY) cho Admin queries.
    // -----------------------------------------------------------------
    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", insertable = false, updatable = false)
    private User owner;

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

    @Enumerated(EnumType.STRING)
    @Column(name = "transmission", length = 20)
    private ETransmission transmission;

    @Enumerated(EnumType.STRING)
    @Column(name = "fuel_type", length = 20)
    private EFuelType fuelType;

    // -----------------------------------------------------------------
    // Giá & Địa điểm
    // -----------------------------------------------------------------
    @Column(name = "price_per_day", nullable = false, precision = 15, scale = 2)
    private BigDecimal pricePerDay;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "province", length = 100)
    private String province;

    @Column(name = "latitude", precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 10, scale = 7)
    private BigDecimal longitude;

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

    @OneToMany(mappedBy = "car", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CarImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "car", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CarDocument> documents = new ArrayList<>();

    // -----------------------------------------------------------------
    // Trạng thái & Soft-delete
    // -----------------------------------------------------------------
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private ECarStatus status = ECarStatus.PENDING_REVIEW;

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
