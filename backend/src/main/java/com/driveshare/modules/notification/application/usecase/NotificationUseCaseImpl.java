package com.driveshare.modules.notification.application.usecase;

import com.driveshare.modules.notification.application.port.in.NotificationUseCase;
import com.driveshare.modules.notification.application.port.out.NotificationPersistencePort;
import com.driveshare.modules.notification.domain.model.NotificationRecord;
import com.driveshare.modules.notification.domain.policy.NotificationPolicy;
import com.driveshare.modules.notification.dto.NotificationDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationUseCaseImpl implements NotificationUseCase {

    private final NotificationPersistencePort persistencePort;

    @Override
    public List<NotificationDto> getMyNotifications(Long userId) {
        if (userId == null) {
            return Collections.emptyList();
        }
        return persistencePort.findByUserId(userId).stream()
                .map(r -> new NotificationDto(
                        r.getNotificationId(),
                        r.getNotificationId(),
                        r.getUserId(),
                        r.getTitle(),
                        r.getContent(),
                        r.getType(),
                        r.getReferenceId(),
                        r.getIsRead(),
                        r.getCreatedAt()))
                .collect(Collectors.toList());
    }

    @Override
    public void markAsRead(Long notificationId, Long userId) {
        if (notificationId == null || userId == null) return;
        persistencePort.findById(notificationId).ifPresent(record -> {
            if (NotificationPolicy.canMarkAsRead(record.getUserId(), userId)) {
                record.setIsRead(true);
                persistencePort.save(record);
            }
        });
    }

    @Override
    public void sendNotification(Long userId, String title, String content, String type, Long referenceId) {
        if (userId == null || !NotificationPolicy.isValidNotification(title, content, type)) return;
        NotificationRecord record = NotificationRecord.builder()
                .userId(userId)
                .title(title)
                .content(content)
                .type(type)
                .referenceId(referenceId)
                .isRead(false)
                .createdAt(Instant.now())
                .build();
        persistencePort.save(record);
    }
}
