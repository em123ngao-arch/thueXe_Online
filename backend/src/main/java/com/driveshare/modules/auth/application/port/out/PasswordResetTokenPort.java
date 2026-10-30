package com.driveshare.modules.auth.application.port.out;

import com.driveshare.modules.auth.domain.model.PasswordResetTokenRecord;

import java.util.Optional;

public interface PasswordResetTokenPort {
    Optional<PasswordResetTokenRecord> findByTokenHash(String tokenHash);
    PasswordResetTokenRecord save(PasswordResetTokenRecord token);
}

