package com.driveshare.modules.notification.repository;

import com.driveshare.modules.notification.adapter.out.persistence.NotificationJpaRepository;
import org.springframework.stereotype.Repository;

// Backward-compatible repository shim
@Repository
public interface NotificationRepository extends NotificationJpaRepository {
}
