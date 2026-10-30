package com.driveshare.modules.user.repository;

import com.driveshare.modules.user.adapter.out.persistence.RenterProfileJpaRepository;
import org.springframework.stereotype.Repository;

// Backward-compatible repository shim
@Repository
public interface RenterProfileRepository extends RenterProfileJpaRepository {
}
