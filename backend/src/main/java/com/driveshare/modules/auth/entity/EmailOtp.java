package com.driveshare.modules.auth.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "email_otps", indexes = {
        @Index(name = "idx_email_otp_lookup", columnList = "email, purpose")
})
public class EmailOtp {

    public static final String PURPOSE_REGISTER = "REGISTER";
    public static final String PURPOSE_REGISTER_PRE = "REGISTER_PRE";
    public static final String PURPOSE_RESET_PASSWORD = "RESET_PASSWORD";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email", length = 150, nullable = false)
    private String email;

    @Column(name = "purpose", length = 50, nullable = false)
    private String purpose;

    @Column(name = "otp_hash", length = 255, nullable = false)
    private String otpHash;

    @Column(name = "attempts", nullable = false)
    @Builder.Default
    private int attempts = 0;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "cooldown_until")
    private Instant cooldownUntil;

    @Column(name = "used", nullable = false)
    @Builder.Default
    private boolean used = false;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    public boolean isExpired() {
        return expiresAt != null && Instant.now().isAfter(expiresAt);
    }

    public boolean isUsable() {
        return !used && !isExpired();
    }
}

