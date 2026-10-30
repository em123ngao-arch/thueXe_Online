package com.driveshare.modules.auth.application.port.in;

import com.driveshare.modules.auth.dto.OtpSendRequest;
import com.driveshare.modules.auth.dto.OtpSendResponse;
import com.driveshare.modules.auth.dto.OtpVerifyRequest;
import com.driveshare.modules.auth.dto.OtpVerifyResponse;

public interface OtpUseCase {
    OtpSendResponse sendOtp(OtpSendRequest request);
    OtpVerifyResponse verifyOtp(OtpVerifyRequest request);
    void issueAndSend(String email, String purpose, String subject, String title, String description);
    boolean verify(String email, String purpose, String rawOtp);
    boolean isInCooldown(String email, String purpose);
}
