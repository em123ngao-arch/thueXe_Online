package com.driveshare.modules.admin.application.port.in;

import com.driveshare.common.dto.PageResponse;
import com.driveshare.modules.admin.dto.request.AdminUserFilterRequest;
import com.driveshare.modules.admin.dto.request.ApproveLicenseRequest;
import com.driveshare.modules.admin.dto.request.ApproveOwnerRequest;
import com.driveshare.modules.admin.dto.request.UpdateUserStatusRequest;
import com.driveshare.modules.admin.dto.response.AdminStatsResponse;
import com.driveshare.modules.admin.dto.response.PendingCccdResponse;
import com.driveshare.modules.admin.dto.response.PendingLicenseResponse;
import com.driveshare.modules.admin.dto.response.UserItemResponse;

import java.util.List;

public interface AdminUserUseCase {

    PageResponse<UserItemResponse> getUsers(AdminUserFilterRequest request);

    UserItemResponse getUserById(Long userId);

    UserItemResponse approveOwner(Long userId, ApproveOwnerRequest request, Long actorId, String actorUsername);

    UserItemResponse approveLicense(Long userId, ApproveLicenseRequest request, Long actorId, String actorUsername);

    UserItemResponse updateUserStatus(Long userId, UpdateUserStatusRequest request, Long actorId, String actorUsername);

    List<PendingCccdResponse> getPendingCccdUsers();

    void verifyCccd(Long userId, String status, String reason, Long actorId, String actorUsername);

    List<PendingLicenseResponse> getPendingLicenses();

    AdminStatsResponse getAdminStats();
}

