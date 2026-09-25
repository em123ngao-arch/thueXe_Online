package com.driveshare.modules.user.service;

import com.driveshare.modules.user.dto.request.OwnerProfileUpdateRequest;
import com.driveshare.modules.user.dto.request.RenterProfileUpdateRequest;
import com.driveshare.modules.user.dto.request.UpdateMyProfileRequest;
import com.driveshare.modules.user.dto.response.*;
import com.driveshare.security.CustomUserDetails;
import org.springframework.web.multipart.MultipartFile;

public interface UserProfileService {

    OwnerProfileResponse updateOwnerProfile(Long targetUserId, OwnerProfileUpdateRequest request, CustomUserDetails currentUser);

    RenterProfileResponse updateRenterProfile(Long targetUserId, RenterProfileUpdateRequest request, CustomUserDetails currentUser);

    OwnerProfileResponse getOwnerProfile(Long targetUserId, CustomUserDetails currentUser);

    RenterProfileResponse getRenterProfile(Long targetUserId, CustomUserDetails currentUser);

    UserProfileResponse getCurrentUserProfile(CustomUserDetails currentUser);

    // Sprint 1 Fix Methods
    CurrentUserProfileResponse getMyProfile(CustomUserDetails currentUser);

    CurrentUserProfileResponse updateMyProfile(UpdateMyProfileRequest request, CustomUserDetails currentUser);

    UploadAvatarResponse uploadAvatar(MultipartFile file, CustomUserDetails currentUser);

    UploadCccdResponse uploadCccd(MultipartFile frontImage, MultipartFile backImage, CustomUserDetails currentUser);

    UploadGplxResponse uploadGplx(MultipartFile licenseImage, CustomUserDetails currentUser);
}
