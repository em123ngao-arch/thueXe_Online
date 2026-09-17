package com.driveshare.modules.auth.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@Entity @Table(name = "auth_sessions", indexes = {
        @Index(name = "idx_auth_session_jti", columnList = "jti", unique = true),
        @Index(name = "idx_auth_session_user", columnList = "user_id")
})
public class AuthSession {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "jti", length = 64, nullable = false, unique = true)
    private String jti;
    @Column(name = "user_id", nullable = false)
    private Long userId;
    @Column(name = "token_version", nullable = false)
    private long tokenVersion;
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
    @Column(name = "revoked_at")
    private Instant revokedAt;

    public boolean isActive() {
        return revokedAt == null && expiresAt.isAfter(Instant.now());
    }
}
