package com.driveshare.modules.auth.service;

import com.driveshare.modules.auth.application.port.in.OtpUseCase;
import com.driveshare.modules.auth.dto.OtpSendRequest;
import com.driveshare.modules.auth.dto.OtpSendResponse;
import com.driveshare.modules.auth.dto.OtpVerifyRequest;
import com.driveshare.modules.auth.dto.OtpVerifyResponse;

/**
 * Phân hệ dịch vụ quản lý và xác thực mã OTP độc lập.
 */
public interface OtpService extends OtpUseCase {

    @Override
    OtpSendResponse sendOtp(OtpSendRequest request);

    @Override
    OtpVerifyResponse verifyOtp(OtpVerifyRequest request);

    @Override
    void issueAndSend(String email, String purpose, String subject, String title, String description);

    @Override
    boolean verify(String email, String purpose, String rawOtp);

    @Override
    boolean isInCooldown(String email, String purpose);
}
