package com.driveshare.modules.user.service;

import com.driveshare.modules.user.application.port.in.UserProfileUseCase;
import com.driveshare.modules.user.dto.request.OwnerProfileUpdateRequest;
import com.driveshare.modules.user.dto.request.RenterProfileUpdateRequest;
import com.driveshare.modules.user.dto.request.UpdateMyProfileRequest;
import com.driveshare.modules.user.dto.response.*;
import com.driveshare.security.CustomUserDetails;
import org.springframework.web.multipart.MultipartFile;

public interface UserProfileService extends UserProfileUseCase {

    @Override
    OwnerProfileResponse updateOwnerProfile(Long targetUserId, OwnerProfileUpdateRequest request, CustomUserDetails currentUser);

    @Override
    RenterProfileResponse updateRenterProfile(Long targetUserId, RenterProfileUpdateRequest request, CustomUserDetails currentUser);

    @Override
    OwnerProfileResponse getOwnerProfile(Long targetUserId, CustomUserDetails currentUser);

    @Override
    RenterProfileResponse getRenterProfile(Long targetUserId, CustomUserDetails currentUser);

    @Override
    UserProfileResponse getCurrentUserProfile(CustomUserDetails currentUser);

    // Sprint 1 Fix Methods
    @Override
    CurrentUserProfileResponse getMyProfile(CustomUserDetails currentUser);

    @Override
    CurrentUserProfileResponse updateMyProfile(UpdateMyProfileRequest request, CustomUserDetails currentUser);

    @Override
    UploadAvatarResponse uploadAvatar(MultipartFile file, CustomUserDetails currentUser);

    @Override
    UploadCccdResponse uploadCccd(MultipartFile frontImage, MultipartFile backImage, CustomUserDetails currentUser);

    @Override
    UploadGplxResponse uploadGplx(MultipartFile licenseImage, CustomUserDetails currentUser);
}
