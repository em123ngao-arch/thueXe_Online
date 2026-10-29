package com.driveshare.modules.auth.repository;

import com.driveshare.modules.auth.entity.EmailOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

@Repository
public interface EmailOtpRepository extends JpaRepository<EmailOtp, Long> {
    Optional<EmailOtp> findTopByEmailAndPurposeOrderByIdDesc(String email, String purpose);
    Optional<EmailOtp> findTopByEmailAndPurposeAndOtpHashAndUsedFalseOrderByIdDesc(String email, String purpose, String otpHash);
    void deleteByExpiresAtBefore(Instant now);
}

