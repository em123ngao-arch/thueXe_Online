package com.driveshare.modules.auth.repository;

import com.driveshare.modules.auth.adapter.out.persistence.EmailChangeTokenJpaRepository;
import org.springframework.stereotype.Repository;

// Backward-compatible repository shim
@Repository
public interface EmailChangeTokenRepository extends EmailChangeTokenJpaRepository {
}
