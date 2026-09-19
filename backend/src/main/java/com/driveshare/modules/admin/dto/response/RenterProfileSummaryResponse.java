package com.driveshare.modules.admin.dto.response;

import com.driveshare.common.enums.EVerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RenterProfileSummaryResponse {
    private String licenseNumber;
    private String licenseFullName;
    private LocalDate licenseDob;
    private LocalDate licenseIssueDate;
    private LocalDate licenseExpiryDate;
    private String licenseFrontUrl;
    private String licenseBackUrl;
    private EVerificationStatus licenseVerificationStatus;
    private Long licenseVerifiedBy;
    private Instant licenseVerifiedAt;
    private String licenseRejectionReason;
}
