package com.driveshare.modules.auth.repository;

import com.driveshare.modules.auth.entity.AuthSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AuthSessionRepository extends JpaRepository<AuthSession, Long> {
    Optional<AuthSession> findByJti(String jti);
    @Modifying @Query("update AuthSession s set s.revokedAt = CURRENT_TIMESTAMP where s.userId = :userId and s.revokedAt is null")
    int revokeAllByUserId(@Param("userId") Long userId);
}
