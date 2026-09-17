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
public class RenterProfileSummaryResponse {
    private String licenseNumber;
    private EVerificationStatus licenseVerificationStatus;
}
