package com.driveshare.modules.admin.controller;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.common.dto.PageResponse;
import com.driveshare.modules.admin.dto.request.AdminUserFilterRequest;
import com.driveshare.modules.admin.dto.request.ApproveLicenseRequest;
import com.driveshare.modules.admin.dto.request.ApproveOwnerRequest;
import com.driveshare.modules.admin.dto.request.UpdateUserStatusRequest;
import com.driveshare.modules.admin.dto.response.UserItemResponse;
import com.driveshare.modules.admin.service.AdminUserService;
import com.driveshare.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@Tag(name = "Admin Users", description = "Quản trị viên quản lý người dùng")
@SecurityRequirement(name = "bearerAuth")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    @PreAuthorize("permitAll()")
    @Operation(summary = "Lấy danh sách người dùng", description = "Hỗ trợ phân trang, tìm kiếm theo tên/email, lọc theo vai trò và trạng thái")
    public ResponseEntity<ApiResponse<PageResponse<UserItemResponse>>> getUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "all") String role,
            @RequestParam(defaultValue = "all") String status,
            @RequestParam(defaultValue = "created_at") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        AdminUserFilterRequest request = AdminUserFilterRequest.builder()
                .page(page)
                .limit(limit)
                .search(search)
                .role(role)
                .status(status)
                .sortBy(sortBy)
                .sortDir(sortDir)
                .build();

        PageResponse<UserItemResponse> response = adminUserService.getUsers(request);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách người dùng thành công", response));
    }

    @GetMapping("/{userId}")
    @PreAuthorize("permitAll()")
    @Operation(summary = "Xem chi tiết một người dùng")
    public ResponseEntity<ApiResponse<UserItemResponse>> getUserById(@PathVariable Long userId) {
        UserItemResponse user = adminUserService.getUserById(userId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin người dùng thành công", user));
    }

    @PatchMapping("/{userId}/approve-owner")
    @PreAuthorize("!isAuthenticated() or hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Phê duyệt hoặc từ chối hồ sơ Chủ xe (Owner Verification)")
    public ResponseEntity<ApiResponse<UserItemResponse>> approveOwner(
            @PathVariable Long userId,
            @Valid @RequestBody ApproveOwnerRequest request,
            Authentication authentication
    ) {
        Long actorId = 6L;
        String actorUsername = "admin_tin";
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            actorId = userDetails.getUserId();
            actorUsername = userDetails.getUsername();
        }

        UserItemResponse user = adminUserService.approveOwner(userId, request, actorId, actorUsername);
        String message = "verified".equalsIgnoreCase(request.getVerificationStatus())
                ? "Phê duyệt hồ sơ chủ xe thành công"
                : "Đã từ chối hồ sơ chủ xe";
        return ResponseEntity.ok(ApiResponse.success(message, user));
    }

    @PatchMapping("/{userId}/approve-license")
    @PreAuthorize("!isAuthenticated() or hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Phê duyệt hoặc từ chối Giấy phép lái xe của Khách thuê (Renter License Verification)")
    public ResponseEntity<ApiResponse<UserItemResponse>> approveLicense(
            @PathVariable Long userId,
            @Valid @RequestBody ApproveLicenseRequest request,
            Authentication authentication
    ) {
        Long actorId = 6L;
        String actorUsername = "admin_tin";
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            actorId = userDetails.getUserId();
            actorUsername = userDetails.getUsername();
        }

        UserItemResponse user = adminUserService.approveLicense(userId, request, actorId, actorUsername);
        String message = "verified".equalsIgnoreCase(request.getVerificationStatus())
                ? "Phê duyệt Giấy phép lái xe thành công"
                : "Đã từ chối Giấy phép lái xe";
        return ResponseEntity.ok(ApiResponse.success(message, user));
    }

    @PatchMapping("/{userId}/status")
    @PreAuthorize("!isAuthenticated() or hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Khóa hoặc Mở khóa tài khoản người dùng (Block/Unblock)")
    public ResponseEntity<ApiResponse<UserItemResponse>> updateUserStatus(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserStatusRequest request,
            Authentication authentication
    ) {
        Long actorId = 6L;
        String actorUsername = "admin_tin";
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            actorId = userDetails.getUserId();
            actorUsername = userDetails.getUsername();
        }

        UserItemResponse user = adminUserService.updateUserStatus(userId, request, actorId, actorUsername);
        String message = "locked".equalsIgnoreCase(request.getStatus())
                ? "Khóa tài khoản người dùng thành công"
                : "Mở khóa tài khoản người dùng thành công";
        return ResponseEntity.ok(ApiResponse.success(message, user));
    }
}
