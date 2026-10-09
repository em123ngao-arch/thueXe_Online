package com.driveshare.modules.notification.dto;

import com.driveshare.modules.notification.entity.Notification;

import java.time.Instant;

public record NotificationDto(
        Long id,
        Long notificationId,
        Long userId,
        String title,
        String content,
        String type,
        Long referenceId,
        Boolean isRead,
        Instant createdAt
) {
    public static NotificationDto from(Notification n) {
        return new NotificationDto(
                n.getNotificationId(),
                n.getNotificationId(),
                n.getUserId(),
                n.getTitle(),
                n.getContent(),
                n.getType(),
                n.getReferenceId(),
                n.getIsRead(),
                n.getCreatedAt()
        );
    }
}
