package com.driveshare.modules.auth.domain.model;

import com.driveshare.modules.auth.domain.policy.AuthSecurityPolicy;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Domain model representing an email OTP.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailOtpRecord {
    public static final String PURPOSE_REGISTER = "REGISTER";
    public static final String PURPOSE_REGISTER_PRE = "REGISTER_PRE";
    public static final String PURPOSE_RESET_PASSWORD = "RESET_PASSWORD";

    private Long id;
    private String email;
    private String purpose;
    private String otpHash;
    @Builder.Default
    private int attempts = 0;
    private Instant expiresAt;
    private Instant cooldownUntil;
    @Builder.Default
    private boolean used = false;
    @Builder.Default
    private Instant createdAt = Instant.now();

    public boolean isExpired() {
        return expiresAt != null && Instant.now().isAfter(expiresAt);
    }

    public boolean isUsable() {
        return AuthSecurityPolicy.isOtpUsable(used, expiresAt);
    }
}

