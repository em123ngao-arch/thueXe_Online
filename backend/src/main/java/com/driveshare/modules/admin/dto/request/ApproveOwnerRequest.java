package com.driveshare.modules.admin.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApproveOwnerRequest {

    @NotBlank(message = "Trạng thái phê duyệt không được để trống (verified hoặc rejected)")
    @JsonProperty("verification_status")
    private String verificationStatus;

    @JsonProperty("rejection_reason")
    private String rejectionReason;
}
