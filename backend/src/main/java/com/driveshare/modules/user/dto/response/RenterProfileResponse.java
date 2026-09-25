package com.driveshare.modules.user.dto.response;

import com.driveshare.common.enums.EVerificationStatus;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RenterProfileResponse {

    private Long userId;
    private String username;
    private String email;
    private String phone;
    private String fullName;
    private String avatarUrl;
    private String idCardNumber;
    private String licenseNumber;
    private String licenseFullName;
    private LocalDate licenseDob;
    private LocalDate licenseIssueDate;
    private LocalDate licenseExpiryDate;
    private String licenseFrontUrl;
    private String licenseBackUrl;
    private EVerificationStatus licenseVerificationStatus;
    private Instant updatedAt;
    private Long updatedBy;
}
