package com.driveshare.modules.auth.application.port.out;

import com.driveshare.modules.auth.domain.model.AuthSessionRecord;

import java.util.List;
import java.util.Optional;

public interface AuthSessionPort {
    Optional<AuthSessionRecord> findByJti(String jti);
    AuthSessionRecord save(AuthSessionRecord session);
    int revokeAllByUserId(Long userId);
    List<AuthSessionRecord> findActiveByUserId(Long userId);
    Optional<AuthSessionRecord> findByIdAndUserId(Long sessionId, Long userId);
}
