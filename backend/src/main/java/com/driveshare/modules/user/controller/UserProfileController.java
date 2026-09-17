package com.driveshare.modules.user.controller;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.modules.user.dto.request.OwnerProfileUpdateRequest;
import com.driveshare.modules.user.dto.request.RenterProfileUpdateRequest;
import com.driveshare.modules.user.dto.response.OwnerProfileResponse;
import com.driveshare.modules.user.dto.response.RenterProfileResponse;
import com.driveshare.modules.user.dto.response.UserProfileResponse;
import com.driveshare.modules.user.service.UserProfileService;
import com.driveshare.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User Profile", description = "APIs quản lý và cập nhật thông tin cá nhân (Owner & Renter)")
@SecurityRequirement(name = "Bearer Authentication")
public class UserProfileController {

    private final UserProfileService userProfileService;

    private CustomUserDetails resolveCurrentUser(CustomUserDetails principal, org.springframework.security.core.Authentication authentication) {
        if (principal != null) {
            return principal;
        }
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails cud) {
            return cud;
        }
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails cud2) {
            return cud2;
        }
        throw new com.driveshare.common.exception.AppException(com.driveshare.common.exception.ErrorCode.UNAUTHENTICATED);
    }

    @GetMapping("/me")
    @Operation(summary = "Lấy thông tin hồ sơ của tài khoản đang đăng nhập")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getCurrentUser(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            org.springframework.security.core.Authentication authentication) {
        UserProfileResponse response = userProfileService.getCurrentUserProfile(resolveCurrentUser(currentUser, authentication));
        return ResponseEntity.ok(ApiResponse.<UserProfileResponse>builder()
                .success(true)
                .message("Lấy thông tin tài khoản thành công")
                .data(response)
                .build());
    }

    @GetMapping("/me/owner-profile")
    @Operation(summary = "Lấy thông tin hồ sơ chủ xe của tài khoản đang đăng nhập")
    public ResponseEntity<ApiResponse<OwnerProfileResponse>> getOwnerProfile(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            org.springframework.security.core.Authentication authentication) {
        CustomUserDetails user = resolveCurrentUser(currentUser, authentication);
        OwnerProfileResponse response = userProfileService.getOwnerProfile(user.getUserId(), user);
        return ResponseEntity.ok(ApiResponse.<OwnerProfileResponse>builder()
                .success(true)
                .message("Lấy thông tin hồ sơ chủ xe thành công")
                .data(response)
                .build());
    }

    @PutMapping("/me/owner-profile")
    @Operation(summary = "Cập nhật hồ sơ chủ xe của chính mình")
    public ResponseEntity<ApiResponse<OwnerProfileResponse>> updateMyOwnerProfile(
            @Valid @RequestBody OwnerProfileUpdateRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            org.springframework.security.core.Authentication authentication) {
        CustomUserDetails user = resolveCurrentUser(currentUser, authentication);
        OwnerProfileResponse response = userProfileService.updateOwnerProfile(user.getUserId(), request, user);
        return ResponseEntity.ok(ApiResponse.<OwnerProfileResponse>builder()
                .success(true)
                .message("Cập nhật hồ sơ chủ xe thành công")
                .data(response)
                .build());
    }

    @PutMapping("/{userId}/owner-profile")
    @Operation(summary = "Cập nhật hồ sơ chủ xe theo User ID (Từ chối nếu không phải chính chủ)")
    public ResponseEntity<ApiResponse<OwnerProfileResponse>> updateOwnerProfileById(
            @PathVariable Long userId,
            @Valid @RequestBody OwnerProfileUpdateRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            org.springframework.security.core.Authentication authentication) {
        OwnerProfileResponse response = userProfileService.updateOwnerProfile(userId, request, resolveCurrentUser(currentUser, authentication));
        return ResponseEntity.ok(ApiResponse.<OwnerProfileResponse>builder()
                .success(true)
                .message("Cập nhật hồ sơ chủ xe thành công")
                .data(response)
                .build());
    }

    @GetMapping("/me/renter-profile")
    @Operation(summary = "Lấy thông tin hồ sơ khách thuê của tài khoản đang đăng nhập")
    public ResponseEntity<ApiResponse<RenterProfileResponse>> getRenterProfile(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            org.springframework.security.core.Authentication authentication) {
        CustomUserDetails user = resolveCurrentUser(currentUser, authentication);
        RenterProfileResponse response = userProfileService.getRenterProfile(user.getUserId(), user);
        return ResponseEntity.ok(ApiResponse.<RenterProfileResponse>builder()
                .success(true)
                .message("Lấy thông tin hồ sơ khách thuê thành công")
                .data(response)
                .build());
    }

    @PutMapping("/me/renter-profile")
    @Operation(summary = "Cập nhật hồ sơ khách thuê của chính mình")
    public ResponseEntity<ApiResponse<RenterProfileResponse>> updateMyRenterProfile(
            @Valid @RequestBody RenterProfileUpdateRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            org.springframework.security.core.Authentication authentication) {
        CustomUserDetails user = resolveCurrentUser(currentUser, authentication);
        RenterProfileResponse response = userProfileService.updateRenterProfile(user.getUserId(), request, user);
        return ResponseEntity.ok(ApiResponse.<RenterProfileResponse>builder()
                .success(true)
                .message("Cập nhật hồ sơ khách thuê thành công")
                .data(response)
                .build());
    }

    @PutMapping("/{userId}/renter-profile")
    @Operation(summary = "Cập nhật hồ sơ khách thuê theo User ID (Từ chối nếu không phải chính chủ)")
    public ResponseEntity<ApiResponse<RenterProfileResponse>> updateRenterProfileById(
            @PathVariable Long userId,
            @Valid @RequestBody RenterProfileUpdateRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            org.springframework.security.core.Authentication authentication) {
        RenterProfileResponse response = userProfileService.updateRenterProfile(userId, request, resolveCurrentUser(currentUser, authentication));
        return ResponseEntity.ok(ApiResponse.<RenterProfileResponse>builder()
                .success(true)
                .message("Cập nhật hồ sơ khách thuê thành công")
                .data(response)
                .build());
    }
}
