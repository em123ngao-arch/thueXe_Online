package com.driveshare.modules.auth.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
@Entity @Table(name = "password_reset_tokens", indexes = {
        @Index(name = "idx_password_reset_token_hash", columnList = "token_hash", unique = true),
        @Index(name = "idx_password_reset_user", columnList = "user_id")
})
public class PasswordResetToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "user_id", nullable = false)
    private Long userId;
    @Column(name = "token_hash", length = 64, nullable = false, unique = true)
    private String tokenHash;
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
    @Column(name = "used_at")
    private Instant usedAt;
    public boolean isUsable() { return usedAt == null && expiresAt.isAfter(Instant.now()); }
}
