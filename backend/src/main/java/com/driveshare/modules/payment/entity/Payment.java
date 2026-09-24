package com.driveshare.modules.payment.entity;

import com.driveshare.common.entity.BaseEntity;
import com.driveshare.common.enums.EPaymentMethod;
import com.driveshare.common.enums.EPaymentStatus;
import com.driveshare.modules.rental.entity.Rental;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "payments",
        indexes = {
                @Index(name = "idx_payments_rental_id", columnList = "rental_id"),
                @Index(name = "idx_payments_status", columnList = "status")
        }
)
public class Payment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "payment_id")
    private Long paymentId;

    @Column(name = "rental_id", nullable = false)
    private Long rentalId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rental_id", insertable = false, updatable = false)
    private Rental rental;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "payment_type", length = 30, nullable = false)
    @Builder.Default
    private String paymentType = "DEPOSIT";

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 30, nullable = false)
    @Builder.Default
    private EPaymentMethod paymentMethod = EPaymentMethod.VIETQR;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    @Builder.Default
    private EPaymentStatus status = EPaymentStatus.PENDING;

    @Column(name = "transaction_code", length = 100, unique = true)
    private String transactionCode;

    @Column(name = "qr_code_url", length = 500)
    private String qrCodeUrl;

    @Column(name = "paid_at")
    private Instant paidAt;
}
