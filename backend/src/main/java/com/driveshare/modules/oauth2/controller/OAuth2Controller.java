package com.driveshare.modules.oauth2.controller;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.modules.auth.dto.AuthResponse;
import com.driveshare.modules.oauth2.dto.CompleteRegistrationRequest;
import com.driveshare.modules.oauth2.service.OAuth2Service;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/oauth2")
@RequiredArgsConstructor
@Tag(name = "Google OAuth2", description = "API hoàn tất đăng ký tài khoản Google OAuth2 (BR-03)")
public class OAuth2Controller {

    private final OAuth2Service oAuth2Service;

    @PostMapping("/complete-registration")
    @Operation(summary = "Hoàn tất đăng ký sau khi chọn vai trò (BR-03-2)")
    public ResponseEntity<ApiResponse<AuthResponse>> completeRegistration(
            @Valid @RequestBody CompleteRegistrationRequest request
    ) {
        AuthResponse response = oAuth2Service.completeRegistration(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng ký tài khoản Google thành công", response));
    }
}
