package com.driveshare.modules.user.domain.policy;

import com.driveshare.common.enums.EUserStatus;
import com.driveshare.common.enums.EVerificationStatus;

/**
 * Domain policy rules for User profile operations.
 */
public final class UserProfilePolicy {

    private UserProfilePolicy() {}

    public static boolean canAccessProfile(Long actorId, Long targetUserId, boolean isAdmin) {
        if (isAdmin) return true;
        return actorId != null && actorId.equals(targetUserId);
    }

    public static boolean canUpdateProfile(EUserStatus status) {
        return status == EUserStatus.ACTIVE || status == EUserStatus.PENDING;
    }

    public static boolean isVerificationPending(EVerificationStatus status) {
        return status == EVerificationStatus.PENDING;
    }

    public static boolean isVerificationApproved(EVerificationStatus status) {
        return status == EVerificationStatus.VERIFIED;
    }
}

