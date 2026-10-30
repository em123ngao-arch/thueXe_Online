package com.driveshare.modules.oauth2.domain.policy;

public final class OAuth2Policy {

    private OAuth2Policy() {
    }

    public static String normalizeRole(String role) {
        if (role == null) {
            return "ROLE_RENTER";
        }
        String upper = role.trim().toUpperCase();
        if ("OWNER".equals(upper) || "ROLE_OWNER".equals(upper)) {
            return "ROLE_OWNER";
        }
        return "ROLE_RENTER";
    }

    public static String generateBaseUsername(String email) {
        if (email != null && email.contains("@")) {
            return email.substring(0, email.indexOf("@"));
        }
        return "google_user";
    }
}

