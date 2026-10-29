package com.driveshare.modules.auth.controller;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.modules.auth.dto.*;
import com.driveshare.modules.auth.service.AuthService;
import com.driveshare.security.CustomUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        return ApiResponse.success("Đăng nhập thành công", authService.login(request, clientKey(http)));
    }

    @PostMapping("/register/owner")
    public ApiResponse<Map<String, Object>> registerOwner(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.success(authService.registerOwner(request));
    }

    @PostMapping("/register/renter")
    public ApiResponse<Map<String, Object>> registerRenter(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.success(authService.registerRenter(request));
    }

    @PostMapping("/register")
    public ApiResponse<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request) {
        if ("OWNER".equalsIgnoreCase(request.getRole()) || "ROLE_OWNER".equalsIgnoreCase(request.getRole())) {
            return ApiResponse.success(authService.registerOwner(request));
        }
        return ApiResponse.success(authService.registerRenter(request));
    }

    @PostMapping(value = "/register-with-docs", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Map<String, Object>> registerWithDocs(
            @Valid @ModelAttribute RegisterRequest request,
            @RequestParam("cccdFront") org.springframework.web.multipart.MultipartFile cccdFront,
            @RequestParam("cccdBack") org.springframework.web.multipart.MultipartFile cccdBack,
            @RequestParam(value = "gplxFront", required = false) org.springframework.web.multipart.MultipartFile gplxFront
    ) {
        return ApiResponse.success("Đăng ký tài khoản thành công", authService.registerWithDocs(request, cccdFront, cccdBack, gplxFront));
    }

    @PostMapping("/refresh-token")
    public ApiResponse<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return ApiResponse.success("Làm mới access token thành công", authService.refreshToken(request));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletRequest request) {
        authService.logout(bearer(request));
        return ApiResponse.success("Đăng xuất thành công", null);
    }

    @RequestMapping(value = "/change-password", method = {RequestMethod.PUT, RequestMethod.POST})
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request, Authentication authentication) {
        CustomUserDetails user = (CustomUserDetails) authentication.getPrincipal();
        authService.changePassword(user.getUserId(), request);
        return ApiResponse.success("Đổi mật khẩu thành công. Các phiên đăng nhập khác đã bị vô hiệu hóa", null);
    }

    @PostMapping("/change-email/request")
    public ApiResponse<Void> requestChangeEmail(@Valid @RequestBody ChangeEmailRequest request, Authentication authentication) {
        CustomUserDetails user = (CustomUserDetails) authentication.getPrincipal();
        authService.requestChangeEmail(user.getUserId(), request);
        return ApiResponse.success("Link xác nhận đã được gửi đến email mới (hiệu lực 15 phút)", null);
    }

    @GetMapping("/change-email/confirm")
    public ApiResponse<Void> confirmChangeEmail(@RequestParam("token") String token) {
        authService.confirmChangeEmail(token);
        return ApiResponse.success("Đổi địa chỉ email thành công", null);
    }

    @PostMapping("/forgot-password")
    public ApiResponse<ResetResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ApiResponse.success(authService.forgotPassword(request));
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ApiResponse.success("Đặt lại mật khẩu thành công", null);
    }

    @PostMapping("/verify-reset-otp")
    public ApiResponse<ResetTokenResponse> verifyResetOtp(@Valid @RequestBody VerifyOtpRequest request) {
        return ApiResponse.success("Xác thực OTP thành công", authService.verifyResetOtp(request));
    }

    @PostMapping("/verify-email")
    public ApiResponse<Map<String, Object>> verifyEmail(@Valid @RequestBody VerifyOtpRequest request) {
        return ApiResponse.success(authService.verifyRegistrationOtp(request));
    }

    @PostMapping("/resend-otp")
    public ApiResponse<Void> resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        authService.resendRegistrationOtp(request);
        return ApiResponse.success("Nếu tài khoản đang chờ xác thực, mã OTP mới đã được gửi tới email.", null);
    }

    @GetMapping("/me")
    public ApiResponse<Map<String, Object>> me(Authentication authentication) {
        CustomUserDetails user = (CustomUserDetails) authentication.getPrincipal();
        return ApiResponse.success(Map.of("userId", user.getUserId(), "username", user.getUsername(), "email", user.getEmail(), "roles", user.getAuthorities()));
    }

    // RBAC Test Endpoints
    @GetMapping("/renter-test")
    @PreAuthorize("hasRole('RENTER')")
    public ApiResponse<String> renterTest() {
        return ApiResponse.success("Quyền Renter hợp lệ. Bạn có thể truy cập tài nguyên của Khách thuê.", null);
    }

    @GetMapping("/owner-test")
    @PreAuthorize("hasRole('OWNER')")
    public ApiResponse<String> ownerTest() {
        return ApiResponse.success("Quyền Owner hợp lệ. Bạn có thể quản lý xe và xem doanh thu chủ xe.", null);
    }

    @GetMapping("/admin-test")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<String> adminTest() {
        return ApiResponse.success("Quyền Admin hợp lệ. Bạn có toàn quyền quản trị hệ thống.", null);
    }

    // Owner Approval endpoints for Admin
    @GetMapping("/pending-owners")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<Map<String, Object>>> getPendingOwners() {
        return ApiResponse.success(authService.getPendingOwners());
    }

    @PostMapping("/approve-owner/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Map<String, Object>> approveOwner(@PathVariable Long userId, Authentication authentication) {
        CustomUserDetails admin = (CustomUserDetails) authentication.getPrincipal();
        return ApiResponse.success(authService.approveOwner(userId, admin.getUserId()));
    }

    private String bearer(HttpServletRequest request) {
        String h = request.getHeader("Authorization");
        return h != null && h.startsWith("Bearer ") ? h.substring(7) : null;
    }

    private String clientKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return forwarded != null && !forwarded.isBlank() ? forwarded.split(",")[0].trim() : request.getRemoteAddr();
    }
}
