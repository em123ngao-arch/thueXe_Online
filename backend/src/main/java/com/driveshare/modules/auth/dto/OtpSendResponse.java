package com.driveshare.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpSendResponse {
    private String email;
    /** Mã OTP đã làm mờ theo định dạng masked: 123*** */
    private String maskedOtp;
    /** Thời hạn tồn tại tính bằng giây (120s) */
    private long ttlSeconds;
    private String message;
}

