package com.driveshare.modules.auth.application.port.out;

import com.driveshare.modules.auth.domain.model.EmailOtpRecord;

import java.time.Instant;
import java.util.Optional;

public interface EmailOtpPort {
    Optional<EmailOtpRecord> findTopByEmailAndPurpose(String email, String purpose);
    Optional<EmailOtpRecord> findTopByEmailAndPurposeAndOtpHashAndUsedFalse(String email, String purpose, String hash);
    EmailOtpRecord save(EmailOtpRecord record);
    void deleteByExpiresAtBefore(Instant now);
}

