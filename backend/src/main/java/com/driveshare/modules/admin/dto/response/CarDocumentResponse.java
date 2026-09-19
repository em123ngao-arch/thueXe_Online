package com.driveshare.modules.admin.dto.response;

import com.driveshare.common.enums.EDocumentType;
import com.driveshare.common.enums.EVerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CarDocumentResponse {
    private Long documentId;
    private EDocumentType documentType;
    private String documentUrl;
    private EVerificationStatus verificationStatus;
    private String rejectionReason;
    private Long verifiedBy;
    private Instant verifiedAt;
    private Instant createdAt;
}
