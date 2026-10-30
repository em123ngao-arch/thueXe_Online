package com.driveshare.modules.auth.adapter.out.persistence;

import com.driveshare.modules.auth.application.port.out.EmailChangeTokenPort;
import com.driveshare.modules.auth.domain.model.EmailChangeTokenRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
public class EmailChangeTokenPersistenceAdapter implements EmailChangeTokenPort {

    private final EmailChangeTokenJpaRepository emailChangeTokenJpaRepository;

    @Override
    public Optional<EmailChangeTokenRecord> findByTokenHash(String tokenHash) {
        return emailChangeTokenJpaRepository.findByTokenHash(tokenHash).map(this::toRecord);
    }

    @Override
    public EmailChangeTokenRecord save(EmailChangeTokenRecord record) {
        EmailChangeTokenJpaEntity entity = toEntity(record);
        EmailChangeTokenJpaEntity saved = emailChangeTokenJpaRepository.save(entity);
        return toRecord(saved);
    }

    private EmailChangeTokenRecord toRecord(EmailChangeTokenJpaEntity entity) {
        if (entity == null) return null;
        return EmailChangeTokenRecord.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .newEmail(entity.getNewEmail())
                .tokenHash(entity.getTokenHash())
                .expiresAt(entity.getExpiresAt())
                .usedAt(entity.getUsedAt())
                .build();
    }

    private EmailChangeTokenJpaEntity toEntity(EmailChangeTokenRecord record) {
        if (record == null) return null;
        return EmailChangeTokenJpaEntity.builder()
                .id(record.getId())
                .userId(record.getUserId())
                .newEmail(record.getNewEmail())
                .tokenHash(record.getTokenHash())
                .expiresAt(record.getExpiresAt())
                .usedAt(record.getUsedAt())
                .build();
    }
}

