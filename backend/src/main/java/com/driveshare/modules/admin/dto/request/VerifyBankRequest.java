package com.driveshare.modules.admin.dto.request;

import com.driveshare.common.enums.BankVerificationStatus;
import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload cho Admin duyệt hoặc từ chối tài khoản ngân hàng của Chủ xe (Sprint 3 - Duy Quân).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifyBankRequest {

    @NotNull(message = "Trạng thái phê duyệt ngân hàng không được để trống")
    private BankVerificationStatus status;

    @JsonAlias({"rejectionReason", "rejection_reason"})
    private String reason;

    private String rejectionReason;

    public String getEffectiveReason() {
        if (reason != null && !reason.trim().isEmpty()) {
            return reason.trim();
        }
        if (rejectionReason != null && !rejectionReason.trim().isEmpty()) {
            return rejectionReason.trim();
        }
        return null;
    }
}
