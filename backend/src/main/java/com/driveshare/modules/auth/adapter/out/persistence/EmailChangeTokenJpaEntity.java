package com.driveshare.modules.auth.adapter.out.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity(name = "EmailChangeToken")
@Table(name = "email_change_tokens", indexes = {
        @Index(name = "idx_email_change_token_hash", columnList = "token_hash", unique = true),
        @Index(name = "idx_email_change_user", columnList = "user_id")
})
public class EmailChangeTokenJpaEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "new_email", nullable = false)
    private String newEmail;

    @Column(name = "token_hash", length = 64, nullable = false, unique = true)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "used_at")
    private Instant usedAt;

    public boolean isUsable() {
        return usedAt == null && expiresAt != null && expiresAt.isAfter(Instant.now());
    }
}

