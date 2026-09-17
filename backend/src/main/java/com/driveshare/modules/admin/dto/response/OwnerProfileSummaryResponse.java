package com.driveshare.modules.admin.dto.response;

import com.driveshare.common.enums.EVerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OwnerProfileSummaryResponse {
    private String bankAccountNumber;
    private String bankName;
    private EVerificationStatus verificationStatus;
    private String rejectionReason;
}
