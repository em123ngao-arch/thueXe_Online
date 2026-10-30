package com.driveshare.modules.auth.adapter.in.web;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.modules.auth.application.port.in.OtpUseCase;
import com.driveshare.modules.auth.dto.OtpSendRequest;
import com.driveshare.modules.auth.dto.OtpSendResponse;
import com.driveshare.modules.auth.dto.OtpVerifyRequest;
import com.driveshare.modules.auth.dto.OtpVerifyResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth/otp")
@RequiredArgsConstructor
@Tag(name = "Authentication & OTP", description = "Phân hệ xác thực mã OTP độc lập")
public class OtpController {

    private final OtpUseCase otpUseCase;

    @PostMapping("/send")
    @Operation(summary = "Gửi mã OTP qua email", description = "Sinh mã OTP 6 số, TTL 120s, in console và trả về masked format 123***")
    public ResponseEntity<ApiResponse<OtpSendResponse>> sendOtp(@Valid @RequestBody OtpSendRequest request) {
        OtpSendResponse response = otpUseCase.sendOtp(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/verify")
    @Operation(summary = "Xác thực mã OTP", description = "Xác thực mã OTP 6 số người dùng gửi lên")
    public ResponseEntity<ApiResponse<OtpVerifyResponse>> verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        OtpVerifyResponse response = otpUseCase.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}

