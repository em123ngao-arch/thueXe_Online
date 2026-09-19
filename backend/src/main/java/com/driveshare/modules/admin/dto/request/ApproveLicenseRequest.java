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
public class ApproveLicenseRequest {

    @NotBlank(message = "Trạng thái xác minh không được để trống (verified hoặc rejected)")
    @JsonProperty("verification_status")
    private String verificationStatus;

    @JsonProperty("rejection_reason")
    private String rejectionReason;
}
