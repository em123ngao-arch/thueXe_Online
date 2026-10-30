package com.driveshare.modules.auth.adapter.out.persistence;

import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Primary
@Repository
public interface EmailChangeTokenJpaRepository extends JpaRepository<EmailChangeTokenJpaEntity, Long> {
    Optional<EmailChangeTokenJpaEntity> findByTokenHash(String tokenHash);
}
