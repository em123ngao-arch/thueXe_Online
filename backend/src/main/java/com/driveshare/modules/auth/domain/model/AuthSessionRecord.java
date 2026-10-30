package com.driveshare.modules.auth.domain.model;

import com.driveshare.modules.auth.domain.policy.AuthSecurityPolicy;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Domain model representing an authentication session.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthSessionRecord {
    private Long id;
    private String jti;
    private Long userId;
    private long tokenVersion;
    private Instant expiresAt;
    private Instant revokedAt;

    public boolean isActive() {
        return AuthSecurityPolicy.isSessionActive(expiresAt, revokedAt);
    }
}
