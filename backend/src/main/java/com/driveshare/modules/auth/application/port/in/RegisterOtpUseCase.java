package com.driveshare.modules.auth.application.port.in;

public interface RegisterOtpUseCase {
    void sendOtp(String rawEmail);
    String verifyOtp(String rawEmail, String otp);
    boolean redeem(String ticket, String rawEmail);
}
