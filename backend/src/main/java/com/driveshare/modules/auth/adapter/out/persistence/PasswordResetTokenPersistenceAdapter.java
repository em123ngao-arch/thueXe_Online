package com.driveshare.modules.auth.adapter.out.persistence;

import com.driveshare.modules.auth.application.port.out.PasswordResetTokenPort;
import com.driveshare.modules.auth.domain.model.PasswordResetTokenRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class PasswordResetTokenPersistenceAdapter implements PasswordResetTokenPort {

    private final PasswordResetTokenJpaRepository passwordResetTokenJpaRepository;

    @Override
    public Optional<PasswordResetTokenRecord> findByTokenHash(String tokenHash) {
        return passwordResetTokenJpaRepository.findByTokenHash(tokenHash).map(this::toRecord);
    }

    @Override
    public PasswordResetTokenRecord save(PasswordResetTokenRecord record) {
        PasswordResetTokenJpaEntity entity = toEntity(record);
        PasswordResetTokenJpaEntity saved = passwordResetTokenJpaRepository.save(entity);
        return toRecord(saved);
    }

    private PasswordResetTokenRecord toRecord(PasswordResetTokenJpaEntity entity) {
        if (entity == null) return null;
        return PasswordResetTokenRecord.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .tokenHash(entity.getTokenHash())
                .expiresAt(entity.getExpiresAt())
                .usedAt(entity.getUsedAt())
                .build();
    }

    private PasswordResetTokenJpaEntity toEntity(PasswordResetTokenRecord record) {
        if (record == null) return null;
        return PasswordResetTokenJpaEntity.builder()
                .id(record.getId())
                .userId(record.getUserId())
                .tokenHash(record.getTokenHash())
                .expiresAt(record.getExpiresAt())
                .usedAt(record.getUsedAt())
                .build();
    }
}
