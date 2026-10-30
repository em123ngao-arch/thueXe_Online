package com.driveshare.modules.auth.repository;

import com.driveshare.modules.auth.adapter.out.persistence.AuthSessionJpaRepository;
import org.springframework.stereotype.Repository;

// Backward-compatible repository shim
@Repository
public interface AuthSessionRepository extends AuthSessionJpaRepository {
}
