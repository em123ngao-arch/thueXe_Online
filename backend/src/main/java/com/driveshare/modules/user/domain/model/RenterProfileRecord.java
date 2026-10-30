package com.driveshare.modules.user.domain.model;

import com.driveshare.common.enums.EVerificationStatus;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RenterProfileRecord {
    private Long userId;
    private String licenseNumber;
    private String licenseFullName;
    private LocalDate licenseDob;
    private LocalDate licenseIssueDate;
    private LocalDate licenseExpiryDate;
    private String licenseFrontUrl;
    private String licenseBackUrl;
    private String idCardFrontUrl;
    private String idCardBackUrl;
    private EVerificationStatus verificationStatus;
    private EVerificationStatus licenseVerificationStatus;
}

