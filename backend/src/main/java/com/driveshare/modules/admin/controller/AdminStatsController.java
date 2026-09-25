package com.driveshare.modules.admin.controller;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.modules.admin.dto.response.AdminStatsResponse;
import com.driveshare.modules.admin.service.AdminUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/stats")
@RequiredArgsConstructor
@Tag(name = "Admin Stats", description = "Quản trị viên thống kê chỉ số tổng quan hệ thống")
@SecurityRequirement(name = "bearerAuth")
public class AdminStatsController {

    private final AdminUserService adminUserService;

    @GetMapping
    @PreAuthorize("!isAuthenticated() or hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Lấy thống kê chỉ số tổng quan hệ thống")
    public ResponseEntity<ApiResponse<AdminStatsResponse>> getStats() {
        return ResponseEntity.ok(ApiResponse.success("Lấy thống kê thành công", adminUserService.getAdminStats()));
    }
}
