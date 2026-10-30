package com.driveshare.modules.auth.application.port.in;

import com.driveshare.modules.auth.dto.*;

import java.util.List;
import java.util.Map;

public interface LoginUseCase {
    AuthResponse login(LoginRequest request, String clientKey);
    AuthResponse refreshToken(RefreshTokenRequest request);
    void logout(String accessToken);
    void changePassword(Long userId, ChangePasswordRequest request);
    void requestChangeEmail(Long userId, ChangeEmailRequest request);
    void confirmChangeEmail(String rawToken);
    ResetResponse forgotPassword(ForgotPasswordRequest request);
    ResetTokenResponse verifyResetOtp(VerifyOtpRequest request);
    void resetPassword(ResetPasswordRequest request);
    Map<String, Object> verifyRegistrationOtp(VerifyOtpRequest request);
    void resendRegistrationOtp(ResendOtpRequest request);
    List<Map<String, Object>> getPendingOwners();
    Map<String, Object> approveOwner(Long userId, Long adminUserId);
    void validatePassword(String password);
}
