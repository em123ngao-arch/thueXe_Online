package com.driveshare.modules.notification.application.port.out;

import com.driveshare.modules.notification.domain.model.NotificationRecord;

import java.util.List;
import java.util.Optional;

public interface NotificationPersistencePort {
    List<NotificationRecord> findByUserId(Long userId);
    Optional<NotificationRecord> findById(Long id);
    NotificationRecord save(NotificationRecord record);
    long countUnread(Long userId);
}
