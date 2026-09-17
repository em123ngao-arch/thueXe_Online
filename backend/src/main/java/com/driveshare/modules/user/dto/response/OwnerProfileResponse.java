package com.driveshare.modules.user.dto.response;

import com.driveshare.common.enums.EVerificationStatus;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OwnerProfileResponse {

    private Long userId;
    private String username;
    private String email;
    private String phone;
    private String fullName;
    private String avatarUrl;
    private String idCardNumber;
    private String bankAccountNumber;
    private String bankName;
    private String idCardFrontUrl;
    private String idCardBackUrl;
    private EVerificationStatus verificationStatus;
    private Instant updatedAt;
    private Long updatedBy;
}
