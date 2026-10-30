package com.driveshare.modules.auth.domain.model;

import com.driveshare.modules.auth.domain.policy.AuthSecurityPolicy;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Domain model representing an email change token.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailChangeTokenRecord {
    private Long id;
    private Long userId;
    private String newEmail;
    private String tokenHash;
    private Instant expiresAt;
    private Instant usedAt;

    public boolean isUsable() {
        return AuthSecurityPolicy.isTokenUsable(expiresAt, usedAt);
    }
}

