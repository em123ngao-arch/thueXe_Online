package com.driveshare.modules.notification.domain.model;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRecord {
    private Long notificationId;
    private Long userId;
    private String title;
    private String content;
    private String type;
    private Long referenceId;
    @Builder.Default
    private Boolean isRead = false;
    @Builder.Default
    private Instant createdAt = Instant.now();
}
