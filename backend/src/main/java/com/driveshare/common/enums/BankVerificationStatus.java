package com.driveshare.common.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

/**
 * Trạng thái phê duyệt tài khoản ngân hàng của Chủ xe (Sprint 3 - Duy Quân).
 */
public enum BankVerificationStatus {
    UNVERIFIED,
    VERIFIED,
    REJECTED;

    @JsonCreator
    public static BankVerificationStatus fromString(String value) {
        if (value == null) {
            return UNVERIFIED;
        }
        for (BankVerificationStatus status : BankVerificationStatus.values()) {
            if (status.name().equalsIgnoreCase(value.trim())) {
                return status;
            }
        }
        throw new IllegalArgumentException("Trạng thái xác thực ngân hàng không hợp lệ: " + value);
    }
}
