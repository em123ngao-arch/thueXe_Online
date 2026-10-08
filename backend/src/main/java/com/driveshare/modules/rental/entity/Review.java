package com.driveshare.modules.rental.entity;

import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Entity ánh xạ bảng {@code reviews} trong Sprint 3.
 * <p>
 * Lưu trữ đánh giá 1-5 sao và nhận xét của khách sau khi hoàn tất chuyến đi.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "reviews",
        indexes = {
                @Index(name = "idx_reviews_car_id", columnList = "car_id"),
                @Index(name = "idx_reviews_renter_id", columnList = "renter_id")
        }
)
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    private Long reviewId;

    @Column(name = "rental_id", nullable = false, unique = true)
    private Long rentalId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rental_id", insertable = false, updatable = false)
    private Rental rental;

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

    @Column(name = "rating", nullable = false)
    private Integer rating;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
