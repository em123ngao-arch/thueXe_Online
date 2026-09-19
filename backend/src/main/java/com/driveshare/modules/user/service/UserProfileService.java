package com.driveshare.modules.user.service;

import com.driveshare.modules.user.dto.request.OwnerProfileUpdateRequest;
import com.driveshare.modules.user.dto.request.RenterProfileUpdateRequest;
import com.driveshare.modules.user.dto.response.OwnerProfileResponse;
import com.driveshare.modules.user.dto.response.RenterProfileResponse;
import com.driveshare.modules.user.dto.response.UserProfileResponse;
import com.driveshare.security.CustomUserDetails;

public interface UserProfileService {

    OwnerProfileResponse updateOwnerProfile(Long targetUserId, OwnerProfileUpdateRequest request, CustomUserDetails currentUser);

    RenterProfileResponse updateRenterProfile(Long targetUserId, RenterProfileUpdateRequest request, CustomUserDetails currentUser);

    OwnerProfileResponse getOwnerProfile(Long targetUserId, CustomUserDetails currentUser);

    RenterProfileResponse getRenterProfile(Long targetUserId, CustomUserDetails currentUser);

    UserProfileResponse getCurrentUserProfile(CustomUserDetails currentUser);
}
