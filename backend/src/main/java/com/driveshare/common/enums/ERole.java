package com.driveshare.common.enums;

public enum ERole {
    ROLE_RENTER,
    ROLE_OWNER,
    ROLE_STAFF,
    ROLE_ADMIN;

    public static ERole fromString(String roleName) {
        if (roleName == null) return null;
        String normalized = roleName.trim().toUpperCase();
        if (!normalized.startsWith("ROLE_")) {
            normalized = "ROLE_" + normalized;
        }
        return ERole.valueOf(normalized);
    }
}
