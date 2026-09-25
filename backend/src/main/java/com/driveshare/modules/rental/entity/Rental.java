package com.driveshare.modules.rental.entity;

import com.driveshare.common.entity.BaseEntity;
import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "rentals",
        indexes = {
                @Index(name = "idx_rentals_car_dates", columnList = "car_id, start_date, end_date, status"),
                @Index(name = "idx_rentals_renter_status", columnList = "renter_id, status")
        }
)
public class Rental extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rental_id")
    private Long rentalId;

    @Column(name = "car_id", nullable = false)
    private Long carId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "car_id", insertable = false, updatable = false)
    private Car car;

    @Column(name = "renter_id", nullable = false)
    private Long renterId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "renter_id", insertable = false, updatable = false)
    private User renter;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "total_days", nullable = false)
    @Builder.Default
    private Integer totalDays = 1;

    @Column(name = "price_per_day", nullable = false, precision = 12, scale = 2)
    private BigDecimal pricePerDay;

    @Column(name = "total_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "deposit_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal depositAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    @Builder.Default
    private ERentalStatus status = ERentalStatus.PENDING;

    @Column(name = "reject_reason", length = 500)
    private String rejectReason;

    @Column(name = "note", length = 500)
    private String note;
}
