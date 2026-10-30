package com.driveshare.modules.auth.repository;

import com.driveshare.modules.auth.adapter.out.persistence.PasswordResetTokenJpaRepository;
import org.springframework.stereotype.Repository;

// Backward-compatible repository shim
@Repository
public interface PasswordResetTokenRepository extends PasswordResetTokenJpaRepository {
}
