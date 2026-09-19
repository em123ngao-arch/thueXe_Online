package com.driveshare.modules.user.controller;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.modules.user.dto.request.OwnerProfileUpdateRequest;
import com.driveshare.modules.user.dto.request.RenterProfileUpdateRequest;
import com.driveshare.modules.user.dto.request.UpdateMyProfileRequest;
import com.driveshare.modules.user.dto.response.*;
import com.driveshare.modules.user.service.UserProfileService;
import com.driveshare.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
    public ResponseEntity<ApiResponse<CurrentUserProfileResponse>> getCurrentUser(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            org.springframework.security.core.Authentication authentication) {
        CurrentUserProfileResponse response = userProfileService.getMyProfile(resolveCurrentUser(currentUser, authentication));
        return ResponseEntity.ok(ApiResponse.<CurrentUserProfileResponse>builder()
                .code(200)
                .success(true)
                .message("Lấy thông tin tài khoản thành công")
                .data(response)
                .build());
    }

    @PutMapping("/me")
    @Operation(summary = "Cập nhật thông tin tài khoản đang đăng nhập (SĐT, Địa chỉ, Họ tên trước khi duyệt)")
    public ResponseEntity<ApiResponse<CurrentUserProfileResponse>> updateMyProfile(
            @Valid @RequestBody UpdateMyProfileRequest request,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            org.springframework.security.core.Authentication authentication) {
        CurrentUserProfileResponse response = userProfileService.updateMyProfile(request, resolveCurrentUser(currentUser, authentication));
        return ResponseEntity.ok(ApiResponse.<CurrentUserProfileResponse>builder()
                .code(200)
                .success(true)
                .message("Cập nhật thông tin tài khoản thành công")
                .data(response)
                .build());
    }

    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload ảnh đại diện tài khoản (Max 5MB, JPG/PNG)")
    public ResponseEntity<ApiResponse<UploadAvatarResponse>> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            org.springframework.security.core.Authentication authentication) {
        UploadAvatarResponse response = userProfileService.uploadAvatar(file, resolveCurrentUser(currentUser, authentication));
        return ResponseEntity.ok(ApiResponse.<UploadAvatarResponse>builder()
                .code(200)
                .success(true)
                .message("Upload ảnh đại diện thành công")
                .data(response)
                .build());
    }

    @PostMapping(value = "/me/cccd", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload CMND/CCCD 2 mặt (Max 10MB/mặt, JPG/PNG)")
    public ResponseEntity<ApiResponse<UploadCccdResponse>> uploadCccd(
            @RequestParam(value = "frontImage", required = false) MultipartFile frontImage,
            @RequestParam(value = "backImage", required = false) MultipartFile backImage,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            org.springframework.security.core.Authentication authentication) {
        UploadCccdResponse response = userProfileService.uploadCccd(frontImage, backImage, resolveCurrentUser(currentUser, authentication));
        return ResponseEntity.ok(ApiResponse.<UploadCccdResponse>builder()
                .code(200)
                .success(true)
                .message("Upload CCCD thành công. Đang chờ Admin xét duyệt.")
                .data(response)
                .build());
    }

    @PostMapping(value = "/me/gplx", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload Giấy phép lái xe (Chỉ áp dụng RENTER, Max 10MB, JPG/PNG)")
    public ResponseEntity<ApiResponse<UploadGplxResponse>> uploadGplx(
            @RequestParam(value = "licenseImage", required = false) MultipartFile licenseImage,
            @AuthenticationPrincipal CustomUserDetails currentUser,
            org.springframework.security.core.Authentication authentication) {
        UploadGplxResponse response = userProfileService.uploadGplx(licenseImage, resolveCurrentUser(currentUser, authentication));
        return ResponseEntity.ok(ApiResponse.<UploadGplxResponse>builder()
                .code(200)
                .success(true)
                .message("Upload GPLX thành công. Đang chờ Admin xét duyệt.")
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
                .code(200)
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
                .code(200)
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
                .code(200)
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
                .code(200)
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
                .code(200)
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
                .code(200)
                .success(true)
                .message("Cập nhật hồ sơ khách thuê thành công")
                .data(response)
                .build());
    }
}
