package com.driveshare.modules.auth.controller;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.modules.auth.dto.ResendOtpRequest;
import com.driveshare.modules.auth.dto.VerifyOtpRequest;
import com.driveshare.modules.auth.service.RegisterOtpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** OTP trước khi đăng ký (xác thực email xong mới tạo tài khoản). */
@RestController
@RequestMapping("/api/v1/auth/register/otp")
@RequiredArgsConstructor
public class RegisterOtpController {
    private final RegisterOtpService registerOtpService;

    @PostMapping("/send")
    public ApiResponse<Void> send(@Valid @RequestBody ResendOtpRequest request) {
        registerOtpService.sendOtp(request.getEmail());
        return ApiResponse.success("Mã OTP đã được gửi tới email của bạn.", null);
    }

    @PostMapping("/verify")
    public ApiResponse<Map<String, String>> verify(@Valid @RequestBody VerifyOtpRequest request) {
        String ticket = registerOtpService.verifyOtp(request.getEmail(), request.getOtp());
        return ApiResponse.success("Xác thực email thành công.", Map.of("otpTicket", ticket));
    }
}
