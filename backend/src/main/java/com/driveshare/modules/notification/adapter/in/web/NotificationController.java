package com.driveshare.modules.notification.adapter.in.web;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.modules.notification.application.port.in.NotificationUseCase;
import com.driveshare.modules.notification.dto.NotificationDto;
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

    private final NotificationUseCase notificationUseCase;

    @Operation(summary = "Lấy danh sách thông báo của người dùng hiện tại")
    @GetMapping("/my-notifications")
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getMyNotifications(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }
        List<NotificationDto> list = notificationUseCase.getMyNotifications(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @Operation(summary = "Đánh dấu thông báo đã đọc")
    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails != null) {
            notificationUseCase.markAsRead(id, userDetails.getUserId());
        }
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}

