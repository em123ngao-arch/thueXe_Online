package com.driveshare.modules.user.domain.model;

import com.driveshare.common.enums.EVerificationStatus;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OwnerProfileRecord {
    private Long userId;
    private String idCardFrontUrl;
    private String idCardBackUrl;
    private String bankAccountNumber;
    private String bankName;
    private EVerificationStatus verificationStatus;
    private Long verifiedBy;
    private Instant verifiedAt;
}

