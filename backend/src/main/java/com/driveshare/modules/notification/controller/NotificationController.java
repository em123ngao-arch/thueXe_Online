package com.driveshare.modules.notification.controller;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.modules.notification.dto.NotificationDto;
import com.driveshare.modules.notification.repository.NotificationRepository;
import com.driveshare.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Notification", description = "Quản lý thông báo in-app realtime")
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @Operation(summary = "Lấy danh sách thông báo của người dùng hiện tại")
    @GetMapping("/my-notifications")
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getMyNotifications(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }
        List<NotificationDto> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(userDetails.getUserId())
                .stream()
                .map(NotificationDto::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @Operation(summary = "Đánh dấu thông báo đã đọc")
    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        notificationRepository.findById(id).ifPresent(n -> {
            if (userDetails != null && n.getUserId().equals(userDetails.getUserId())) {
                n.setIsRead(true);
                notificationRepository.save(n);
            }
        });
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
