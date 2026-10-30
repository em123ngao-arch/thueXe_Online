package com.driveshare.modules.notification.adapter.out.persistence;

import com.driveshare.modules.notification.application.port.out.NotificationPersistencePort;
import com.driveshare.modules.notification.domain.model.NotificationRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class NotificationPersistenceAdapter implements NotificationPersistencePort {

    private final NotificationJpaRepository repository;

    @Override
    public List<NotificationRecord> findByUserId(Long userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toRecord)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<NotificationRecord> findById(Long id) {
        return repository.findById(id).map(this::toRecord);
    }

    @Override
    public NotificationRecord save(NotificationRecord record) {
        Notification entity;
        if (record.getNotificationId() != null) {
            entity = repository.findById(record.getNotificationId()).orElse(new Notification());
        } else {
            entity = new Notification();
        }
        entity.setUserId(record.getUserId());
        entity.setTitle(record.getTitle());
        entity.setContent(record.getContent());
        entity.setType(record.getType());
        entity.setReferenceId(record.getReferenceId());
        entity.setIsRead(record.getIsRead());
        if (record.getCreatedAt() != null) {
            entity.setCreatedAt(record.getCreatedAt());
        }

        Notification saved = repository.save(entity);
        return toRecord(saved);
    }

    @Override
    public long countUnread(Long userId) {
        return repository.countByUserIdAndIsReadFalse(userId);
    }

    private NotificationRecord toRecord(Notification n) {
        if (n == null) return null;
        return NotificationRecord.builder()
                .notificationId(n.getNotificationId())
                .userId(n.getUserId())
                .title(n.getTitle())
                .content(n.getContent())
                .type(n.getType())
                .referenceId(n.getReferenceId())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
