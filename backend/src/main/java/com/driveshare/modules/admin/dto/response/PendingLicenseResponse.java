package com.driveshare.modules.admin.dto.response;

import com.driveshare.common.enums.EVerificationStatus;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingLicenseResponse {
    private Long userId;
    private String fullName;
    private String email;
    private String phone;
    private String licenseNumber;
    private String licenseFullName;
    private String licenseFrontUrl;
    private String licenseBackUrl;
    private EVerificationStatus licenseVerificationStatus;
    private Instant submittedAt;
}
