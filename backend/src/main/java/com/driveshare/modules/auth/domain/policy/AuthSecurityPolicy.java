package com.driveshare.modules.auth.domain.policy;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Domain policy rules for Authentication & Security.
 */
public final class AuthSecurityPolicy {

    public static final int MAX_FAILED_ATTEMPTS = 5;
    public static final long LOCK_MINUTES = 15;
    public static final long RESET_TOKEN_SECONDS = 10 * 60; // 600s
    public static final long EMAIL_CHANGE_MINUTES = 15;
    public static final long OTP_TTL_SECONDS = 300;
    public static final int OTP_MAX_FAILED_ATTEMPTS = 3;
    public static final long OTP_COOLDOWN_SECONDS = 30;
    public static final long REGISTER_TICKET_TTL_SECONDS = 15 * 60; // 900s

    private AuthSecurityPolicy() {}

    public static String sha256(String input) {
        if (input == null) return null;
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    public static boolean isSessionActive(java.time.Instant expiresAt, java.time.Instant revokedAt) {
        return revokedAt == null && expiresAt != null && expiresAt.isAfter(java.time.Instant.now());
    }

    public static boolean isTokenUsable(java.time.Instant expiresAt, java.time.Instant usedAt) {
        return usedAt == null && expiresAt != null && expiresAt.isAfter(java.time.Instant.now());
    }

    public static boolean isOtpUsable(boolean used, java.time.Instant expiresAt) {
        return !used && expiresAt != null && java.time.Instant.now().isBefore(expiresAt);
    }
}
