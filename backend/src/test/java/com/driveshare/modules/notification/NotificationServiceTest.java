package com.driveshare.modules.notification;

import com.driveshare.modules.notification.dto.NotificationDto;
import com.driveshare.modules.notification.entity.Notification;
import com.driveshare.modules.notification.repository.NotificationRepository;
import com.driveshare.modules.notification.service.impl.NotificationServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    @Test
    @DisplayName("Gửi thông báo thành công: Lưu DB và phát tin qua STOMP WebSocket")
    void sendNotification_Success_PersistsAndBroadcasts() {
        Long userId = 2L;
        String title = "Yêu cầu thuê xe mới";
        String content = "Khách hàng vừa gửi yêu cầu đặt xe #123";
        String type = "RENTAL_REQUEST";
        Long refId = 123L;

        Notification saved = Notification.builder()
                .notificationId(10L)
                .userId(userId)
                .title(title)
                .content(content)
                .type(type)
                .referenceId(refId)
                .isRead(false)
                .createdAt(Instant.now())
                .build();

        when(notificationRepository.save(any(Notification.class))).thenReturn(saved);
        when(notificationRepository.countByUserIdAndIsReadFalse(userId)).thenReturn(1L);

        NotificationDto dto = notificationService.sendNotification(userId, title, content, type, refId);

        assertThat(dto).isNotNull();
        assertThat(dto.id()).isEqualTo(10L);
        assertThat(dto.userId()).isEqualTo(userId);
        assertThat(dto.title()).isEqualTo(title);
        assertThat(dto.type()).isEqualTo(type);

        // Kiểm tra lưu DB
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        assertThat(captor.getValue().getUserId()).isEqualTo(userId);
        assertThat(captor.getValue().getTitle()).isEqualTo(title);

        // Kiểm tra phát tin WebSocket STOMP
        verify(messagingTemplate).convertAndSendToUser(eq(userId.toString()), eq("/queue/notifications"), any(NotificationDto.class));
        verify(messagingTemplate).convertAndSend(eq("/topic/notifications/" + userId), any(NotificationDto.class));
        verify(messagingTemplate).convertAndSendToUser(eq(userId.toString()), eq("/queue/notifications/count"), eq(1L));
        verify(messagingTemplate).convertAndSend(eq("/topic/notifications/" + userId + "/count"), eq(1L));
    }

    @Test
    @DisplayName("Lấy danh sách thông báo của người dùng")
    void getMyNotifications_ReturnsList() {
        Long userId = 2L;
        Notification n1 = Notification.builder().notificationId(1L).userId(userId).title("T1").content("C1").type("TYPE").isRead(false).createdAt(Instant.now()).build();
        Notification n2 = Notification.builder().notificationId(2L).userId(userId).title("T2").content("C2").type("TYPE").isRead(true).createdAt(Instant.now()).build();

        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)).thenReturn(List.of(n1, n2));

        List<NotificationDto> result = notificationService.getMyNotifications(userId);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).id()).isEqualTo(1L);
        assertThat(result.get(1).id()).isEqualTo(2L);
    }

    @Test
    @DisplayName("Lấy số lượng chưa đọc")
    void getUnreadCount_ReturnsCount() {
        Long userId = 2L;
        when(notificationRepository.countByUserIdAndIsReadFalse(userId)).thenReturn(5L);

        long count = notificationService.getUnreadCount(userId);

        assertThat(count).isEqualTo(5L);
    }

    @Test
    @DisplayName("Đánh dấu một thông báo đã đọc")
    void markAsRead_UpdatesIsRead() {
        Long userId = 2L;
        Long notifId = 10L;
        Notification n = Notification.builder().notificationId(notifId).userId(userId).isRead(false).build();

        when(notificationRepository.findById(notifId)).thenReturn(Optional.of(n));

        notificationService.markAsRead(notifId, userId);

        assertThat(n.getIsRead()).isTrue();
        verify(notificationRepository).save(n);
    }

    @Test
    @DisplayName("Đánh dấu tất cả thông báo đã đọc")
    void markAllAsRead_ExecutesRepositoryMethod() {
        Long userId = 2L;
        notificationService.markAllAsRead(userId);
        verify(notificationRepository).markAllAsReadByUserId(userId);
    }
}

