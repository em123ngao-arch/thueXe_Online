package com.driveshare.modules.admin.service;

import com.driveshare.common.dto.PageResponse;
import com.driveshare.modules.admin.dto.request.AdminUserFilterRequest;
import com.driveshare.modules.admin.dto.request.ApproveOwnerRequest;
import com.driveshare.modules.admin.dto.request.UpdateUserStatusRequest;
import com.driveshare.modules.admin.dto.response.UserItemResponse;

public interface AdminUserService {

    PageResponse<UserItemResponse> getUsers(AdminUserFilterRequest request);

    UserItemResponse getUserById(Long userId);

    UserItemResponse approveOwner(Long userId, ApproveOwnerRequest request, Long actorId, String actorUsername);

    UserItemResponse approveLicense(Long userId, com.driveshare.modules.admin.dto.request.ApproveLicenseRequest request, Long actorId, String actorUsername);

    UserItemResponse updateUserStatus(Long userId, UpdateUserStatusRequest request, Long actorId, String actorUsername);
}
