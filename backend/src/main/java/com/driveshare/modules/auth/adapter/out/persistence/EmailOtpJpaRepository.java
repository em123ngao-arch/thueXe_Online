package com.driveshare.modules.auth.adapter.out.persistence;

import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Primary
@Repository
public interface EmailOtpJpaRepository extends JpaRepository<EmailOtpJpaEntity, Long> {
    Optional<EmailOtpJpaEntity> findTopByEmailAndPurposeOrderByIdDesc(String email, String purpose);
    Optional<EmailOtpJpaEntity> findTopByEmailAndPurposeAndOtpHashAndUsedFalseOrderByIdDesc(String email, String purpose, String otpHash);
    void deleteByExpiresAtBefore(Instant now);
}

