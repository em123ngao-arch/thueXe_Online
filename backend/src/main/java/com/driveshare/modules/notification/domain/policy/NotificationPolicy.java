package com.driveshare.modules.notification.domain.policy;

/**
 * Domain policy rules for notifications.
 */
public final class NotificationPolicy {

    private NotificationPolicy() {}

    public static boolean canMarkAsRead(Long ownerUserId, Long actorUserId) {
        return ownerUserId != null && ownerUserId.equals(actorUserId);
    }

    public static boolean isValidNotification(String title, String content, String type) {
        return title != null && !title.isBlank()
                && content != null && !content.isBlank()
                && type != null && !type.isBlank();
    }
}
