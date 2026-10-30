package com.driveshare.modules.auth.adapter.out.persistence;

import com.driveshare.modules.auth.application.port.out.AuthSessionPort;
import com.driveshare.modules.auth.domain.model.AuthSessionRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class AuthSessionPersistenceAdapter implements AuthSessionPort {

    private final AuthSessionJpaRepository authSessionJpaRepository;

    @Override
    public Optional<AuthSessionRecord> findByJti(String jti) {
        return authSessionJpaRepository.findByJti(jti).map(this::toRecord);
    }

    @Override
    public AuthSessionRecord save(AuthSessionRecord record) {
        AuthSessionJpaEntity entity = toEntity(record);
        AuthSessionJpaEntity saved = authSessionJpaRepository.save(entity);
        return toRecord(saved);
    }

    @Override
    public int revokeAllByUserId(Long userId) {
        return authSessionJpaRepository.revokeAllByUserId(userId);
    }

    @Override
    public List<AuthSessionRecord> findActiveByUserId(Long userId) {
        return authSessionJpaRepository.findActiveByUserId(userId).stream()
                .map(this::toRecord)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<AuthSessionRecord> findByIdAndUserId(Long sessionId, Long userId) {
        return authSessionJpaRepository.findByIdAndUserId(sessionId, userId).map(this::toRecord);
    }

    private AuthSessionRecord toRecord(AuthSessionJpaEntity entity) {
        if (entity == null) return null;
        return AuthSessionRecord.builder()
                .id(entity.getId())
                .jti(entity.getJti())
                .userId(entity.getUserId())
                .tokenVersion(entity.getTokenVersion())
                .expiresAt(entity.getExpiresAt())
                .revokedAt(entity.getRevokedAt())
                .build();
    }

    private AuthSessionJpaEntity toEntity(AuthSessionRecord record) {
        if (record == null) return null;
        return AuthSessionJpaEntity.builder()
                .id(record.getId())
                .jti(record.getJti())
                .userId(record.getUserId())
                .tokenVersion(record.getTokenVersion())
                .expiresAt(record.getExpiresAt())
                .revokedAt(record.getRevokedAt())
                .build();
    }
}

