package com.driveshare.modules.auth.adapter.out.persistence;

import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Primary
@Repository
public interface AuthSessionJpaRepository extends JpaRepository<AuthSessionJpaEntity, Long> {
    Optional<AuthSessionJpaEntity> findByJti(String jti);

    @Modifying
    @Query("update AuthSession s set s.revokedAt = CURRENT_INSTANT where s.userId = :userId and s.revokedAt is null")
    int revokeAllByUserId(@Param("userId") Long userId);

    @Query("select s from AuthSession s where s.userId = :userId and s.revokedAt is null and s.expiresAt > CURRENT_INSTANT")
    List<AuthSessionJpaEntity> findActiveByUserId(@Param("userId") Long userId);

    Optional<AuthSessionJpaEntity> findByIdAndUserId(Long id, Long userId);
}
