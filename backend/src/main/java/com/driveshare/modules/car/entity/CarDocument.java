package com.driveshare.modules.car.entity;

import com.driveshare.common.enums.EDocumentType;
import com.driveshare.common.enums.EVerificationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "car_documents")
public class CarDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "document_id")
    private Long documentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "car_id", nullable = false)
    private Car car;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", length = 50, nullable = false)
    private EDocumentType documentType;

    @Column(name = "document_url", length = 500, nullable = false)
    private String documentUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", length = 20)
    @Builder.Default
    private EVerificationStatus verificationStatus = EVerificationStatus.PENDING;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "verified_by")
    private Long verifiedBy;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
