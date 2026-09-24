package com.driveshare.modules.admin.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApproveCarRequest {

    /**
     * Trạng thái duyệt mong muốn: "approved", "active", hoặc "rejected"
     */
    @JsonProperty("status")
    private String status;

    @JsonProperty("rejection_reason")
    private String rejectionReason;
}
