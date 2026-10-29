package com.driveshare.modules.notification.controller;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.modules.notification.dto.NotificationDto;
import com.driveshare.modules.notification.service.NotificationService;
import com.driveshare.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "Notification", description = "Quản lý thông báo in-app realtime qua WebSocket STOMP (Task 57)")
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    private CustomUserDetails resolveUser(CustomUserDetails principal, Authentication authentication) {
        if (principal != null) return principal;
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails cud) return cud;
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails cud2) return cud2;
        return null;
    }

    @Operation(summary = "Lấy danh sách thông báo của người dùng hiện tại")
    @GetMapping("/my-notifications")
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getMyNotifications(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            Authentication authentication
    ) {
        CustomUserDetails user = resolveUser(userDetails, authentication);
        if (user == null) {
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }
        return ResponseEntity.ok(ApiResponse.success(notificationService.getMyNotifications(user.getUserId())));
    }

    @Operation(summary = "Lấy số lượng thông báo chưa đọc của người dùng hiện tại")
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            Authentication authentication
    ) {
        CustomUserDetails user = resolveUser(userDetails, authentication);
        if (user == null) {
            return ResponseEntity.ok(ApiResponse.success(0L));
        }
        return ResponseEntity.ok(ApiResponse.success(notificationService.getUnreadCount(user.getUserId())));
    }

    @Operation(summary = "Đánh dấu thông báo đã đọc")
    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            Authentication authentication
    ) {
        CustomUserDetails user = resolveUser(userDetails, authentication);
        if (user != null) {
            notificationService.markAsRead(id, user.getUserId());
        }
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @Operation(summary = "Đánh dấu tất cả thông báo của người dùng hiện tại là đã đọc")
    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            Authentication authentication
    ) {
        CustomUserDetails user = resolveUser(userDetails, authentication);
        if (user != null) {
            notificationService.markAllAsRead(user.getUserId());
        }
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @Operation(summary = "Endpoint kiểm thử phát thông báo realtime (Demo / QA)")
    @PostMapping("/test-send")
    public ResponseEntity<ApiResponse<NotificationDto>> testSend(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            Authentication authentication
    ) {
        CustomUserDetails user = resolveUser(userDetails, authentication);
        Long targetUserId = body.get("userId") != null ? Long.valueOf(body.get("userId").toString())
                : (user != null ? user.getUserId() : null);
        String title = body.getOrDefault("title", "Thông báo thử nghiệm").toString();
        String content = body.getOrDefault("content", "Đây là tin nhắn realtime kiểm thử từ STOMP WebSocket!").toString();
        String type = body.getOrDefault("type", "GENERAL").toString();
        Long referenceId = body.get("referenceId") != null ? Long.valueOf(body.get("referenceId").toString()) : null;

        NotificationDto dto = notificationService.sendNotification(targetUserId, title, content, type, referenceId);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }
}
