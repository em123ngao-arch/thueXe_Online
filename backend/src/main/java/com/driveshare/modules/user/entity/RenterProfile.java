package com.driveshare.modules.user.entity;

import com.driveshare.common.entity.BaseEntity;
import com.driveshare.common.enums.EVerificationStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "renter_profiles")
public class RenterProfile extends BaseEntity {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "license_number", length = 30, unique = true)
    private String licenseNumber;

    @Column(name = "license_full_name", length = 150)
    private String licenseFullName;

    @Column(name = "license_dob")
    private LocalDate licenseDob;

    @Column(name = "license_issue_date")
    private LocalDate licenseIssueDate;

    @Column(name = "license_expiry_date")
    private LocalDate licenseExpiryDate;

    @Column(name = "license_front_url", length = 500)
    private String licenseFrontUrl;

    @Column(name = "license_back_url", length = 500)
    private String licenseBackUrl;

    @Column(name = "id_card_front_url", length = 500)
    private String idCardFrontUrl;

    @Column(name = "id_card_back_url", length = 500)
    private String idCardBackUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", length = 20)
    @Builder.Default
    private EVerificationStatus verificationStatus = EVerificationStatus.PENDING;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Enumerated(EnumType.STRING)
    @Column(name = "license_verification_status", length = 20)
    @Builder.Default
    private EVerificationStatus licenseVerificationStatus = EVerificationStatus.PENDING;

    @Column(name = "license_verified_by")
    private Long licenseVerifiedBy;

    @Column(name = "license_verified_at")
    private Instant licenseVerifiedAt;
}
