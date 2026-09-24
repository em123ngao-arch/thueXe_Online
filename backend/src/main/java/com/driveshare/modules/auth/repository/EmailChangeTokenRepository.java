package com.driveshare.modules.auth.repository;

import com.driveshare.modules.auth.entity.EmailChangeToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmailChangeTokenRepository extends JpaRepository<EmailChangeToken, Long> {
    Optional<EmailChangeToken> findByTokenHash(String tokenHash);
}
