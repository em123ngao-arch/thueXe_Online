package com.driveshare.modules.admin.domain.policy;

/**
 * Pure domain policy rules for administrative actions.
 */
public final class AdminPolicy {

    private AdminPolicy() {}

    public static boolean canApproveCar(String currentStatus) {
        if (currentStatus == null) return false;
        String s = currentStatus.trim().toUpperCase();
        return "PENDING_REVIEW".equals(s) || "PENDING".equals(s);
    }

    public static boolean canVerifyUser(String currentStatus) {
        if (currentStatus == null) return false;
        return "PENDING".equalsIgnoreCase(currentStatus.trim());
    }

    public static boolean isValidAction(String action) {
        return action != null && !action.isBlank();
    }
}

