package com.driveshare.modules.notification.application.port.in;

import com.driveshare.modules.notification.dto.NotificationDto;

import java.util.List;

public interface NotificationUseCase {
    List<NotificationDto> getMyNotifications(Long userId);
    void markAsRead(Long notificationId, Long userId);
    void sendNotification(Long userId, String title, String content, String type, Long referenceId);
}

