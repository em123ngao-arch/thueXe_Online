package com.driveshare.modules.notification.service.impl;

import com.driveshare.modules.notification.dto.NotificationDto;
import com.driveshare.modules.notification.entity.Notification;
import com.driveshare.modules.notification.repository.NotificationRepository;
import com.driveshare.modules.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public NotificationDto sendNotification(Long userId, String title, String content, String type, Long referenceId) {
        if (userId == null) {
            log.warn("Bỏ qua gửi thông báo do userId là null");
            return null;
        }

        Notification notification = Notification.builder()
                .userId(userId)
                .title(title != null ? title.trim() : "")
                .content(content != null ? content.trim() : "")
                .type(type != null ? type.trim() : "GENERAL")
                .referenceId(referenceId)
                .isRead(false)
                .createdAt(Instant.now())
                .build();

        Notification saved = notificationRepository.save(notification);
        NotificationDto dto = NotificationDto.from(saved);

        // Phát realtime qua WebSocket STOMP
        broadcastRealtime(userId, dto);

        return dto;
    }

    private void broadcastRealtime(Long userId, NotificationDto dto) {
        try {
            // 1. Gửi qua user queue chuẩn Spring STOMP: /user/{userId}/queue/notifications
            messagingTemplate.convertAndSendToUser(userId.toString(), "/queue/notifications", dto);

            // 2. Gửi qua public user topic để dự phòng kết nối: /topic/notifications/{userId}
            messagingTemplate.convertAndSend("/topic/notifications/" + userId, dto);

            // 3. Cập nhật số lượng chưa đọc realtime
            long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(userId);
            messagingTemplate.convertAndSendToUser(userId.toString(), "/queue/notifications/count", unreadCount);
            messagingTemplate.convertAndSend("/topic/notifications/" + userId + "/count", unreadCount);

            log.info("Phát WebSocket STOMP thông báo realtime tới userId={}: title='{}', type='{}'",
                    userId, dto.title(), dto.type());
        } catch (Exception e) {
            log.error("Lỗi khi phát thông báo WebSocket STOMP cho userId={}: {}", userId, e.getMessage());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationDto> getMyNotifications(Long userId) {
        if (userId == null) {
            return List.of();
        }
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationDto::from)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        if (userId == null) {
            return 0;
        }
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        if (notificationId == null || userId == null) return;
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (userId.equals(n.getUserId())) {
                n.setIsRead(true);
                notificationRepository.save(n);
            }
        });
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        if (userId == null) return;
        notificationRepository.markAllAsReadByUserId(userId);
    }
}

