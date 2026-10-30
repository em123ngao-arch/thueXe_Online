package com.driveshare.modules.auth.adapter.out.persistence;

import com.driveshare.modules.auth.application.port.out.EmailOtpPort;
import com.driveshare.modules.auth.domain.model.EmailOtpRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class EmailOtpPersistenceAdapter implements EmailOtpPort {

    private final EmailOtpJpaRepository emailOtpJpaRepository;

    @Override
    public Optional<EmailOtpRecord> findTopByEmailAndPurpose(String email, String purpose) {
        return emailOtpJpaRepository.findTopByEmailAndPurposeOrderByIdDesc(email, purpose).map(this::toRecord);
    }

    @Override
    public Optional<EmailOtpRecord> findTopByEmailAndPurposeAndOtpHashAndUsedFalse(String email, String purpose, String hash) {
        return emailOtpJpaRepository.findTopByEmailAndPurposeAndOtpHashAndUsedFalseOrderByIdDesc(email, purpose, hash).map(this::toRecord);
    }

    @Override
    public EmailOtpRecord save(EmailOtpRecord record) {
        EmailOtpJpaEntity entity = toEntity(record);
        EmailOtpJpaEntity saved = emailOtpJpaRepository.save(entity);
        return toRecord(saved);
    }

    @Override
    public void deleteByExpiresAtBefore(Instant now) {
        emailOtpJpaRepository.deleteByExpiresAtBefore(now);
    }

    private EmailOtpRecord toRecord(EmailOtpJpaEntity entity) {
        if (entity == null) return null;
        return EmailOtpRecord.builder()
                .id(entity.getId())
                .email(entity.getEmail())
                .purpose(entity.getPurpose())
                .otpHash(entity.getOtpHash())
                .attempts(entity.getAttempts())
                .expiresAt(entity.getExpiresAt())
                .cooldownUntil(entity.getCooldownUntil())
                .used(entity.isUsed())
                .createdAt(entity.getCreatedAt())
                .build();
    }

    private EmailOtpJpaEntity toEntity(EmailOtpRecord record) {
        if (record == null) return null;
        return EmailOtpJpaEntity.builder()
                .id(record.getId())
                .email(record.getEmail())
                .purpose(record.getPurpose())
                .otpHash(record.getOtpHash())
                .attempts(record.getAttempts())
                .expiresAt(record.getExpiresAt())
                .cooldownUntil(record.getCooldownUntil())
                .used(record.isUsed())
                .createdAt(record.getCreatedAt() != null ? record.getCreatedAt() : Instant.now())
                .build();
    }
}
