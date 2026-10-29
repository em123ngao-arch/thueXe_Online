package com.driveshare.modules.notification.service;

import com.driveshare.modules.notification.dto.NotificationDto;

import java.util.List;

/**
 * Service quản lý thông báo in-app và phát thông báo qua WebSocket STOMP (Task 57).
 */
public interface NotificationService {

    /**
     * Tạo thông báo mới trong cơ sở dữ liệu và phát tin thời gian thực qua WebSocket.
     *
     * @param userId ID người nhận thông báo
     * @param title Tiêu đề thông báo
     * @param content Nội dung chi tiết
     * @param type Phân loại thông báo (RENTAL_REQUEST, RENTAL_APPROVED, INSPECTION_CHECK_IN, ...)
     * @param referenceId ID thực thể liên quan (mã đơn thuê, xe, khiếu nại, ...)
     * @return DTO của thông báo vừa tạo
     */
    NotificationDto sendNotification(Long userId, String title, String content, String type, Long referenceId);

    /**
     * Lấy toàn bộ danh sách thông báo của người dùng theo thứ tự mới nhất trước.
     */
    List<NotificationDto> getMyNotifications(Long userId);

    /**
     * Đếm số lượng thông báo chưa đọc của người dùng.
     */
    long getUnreadCount(Long userId);

    /**
     * Đánh dấu một thông báo cụ thể là đã đọc.
     */
    void markAsRead(Long notificationId, Long userId);

    /**
     * Đánh dấu toàn bộ thông báo của người dùng là đã đọc.
     */
    void markAllAsRead(Long userId);
}

