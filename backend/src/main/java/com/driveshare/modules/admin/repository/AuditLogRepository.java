package com.driveshare.modules.admin.repository;

import com.driveshare.modules.admin.adapter.out.persistence.AuditLogJpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Backward compatibility bridge extending AuditLogJpaRepository.
 */
@Repository
public interface AuditLogRepository extends AuditLogJpaRepository {
}
