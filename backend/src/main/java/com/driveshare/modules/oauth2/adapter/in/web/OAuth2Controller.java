package com.driveshare.modules.oauth2.adapter.in.web;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.modules.auth.dto.AuthResponse;
import com.driveshare.modules.oauth2.application.port.in.OAuth2UseCase;
import com.driveshare.modules.oauth2.dto.CompleteRegistrationRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/oauth2")
@RequiredArgsConstructor
@Tag(name = "Google OAuth2", description = "API hoàn tất đăng ký tài khoản Google OAuth2 (BR-03)")
public class OAuth2Controller {

    private final OAuth2UseCase oAuth2UseCase;

    @PostMapping("/complete-registration")
    @Operation(summary = "Hoàn tất đăng ký sau khi chọn vai trò (BR-03-2)")
    public ResponseEntity<ApiResponse<AuthResponse>> completeRegistration(
            @Valid @RequestBody CompleteRegistrationRequest request
    ) {
        AuthResponse response = oAuth2UseCase.completeRegistration(request);
        return ResponseEntity.ok(ApiResponse.success("Đăng ký tài khoản Google thành công", response));
    }
}

