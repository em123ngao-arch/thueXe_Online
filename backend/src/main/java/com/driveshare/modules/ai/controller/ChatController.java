package com.driveshare.modules.ai.controller;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.modules.ai.dto.ChatMessageDto;
import com.driveshare.modules.ai.dto.request.ChatRequest;
import com.driveshare.modules.ai.dto.response.ChatHistoryResponse;
import com.driveshare.modules.ai.dto.response.ChatReplyResponse;
import com.driveshare.modules.ai.service.AiChatService;
import com.driveshare.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
@Tag(name = "AI Chat Assistant", description = "Trợ lý ảo tư vấn thuê xe thông minh DriveShare")
public class ChatController {

    private final AiChatService aiChatService;

    @PostMapping
    @Operation(summary = "Gửi tin nhắn cho trợ lý AI và nhận phản hồi gợi ý xe")
    public ResponseEntity<ApiResponse<ChatReplyResponse>> reply(
            @Valid @RequestBody ChatRequest request
    ) {
        Long userId = resolveUserId();
        ChatReplyResponse response = aiChatService.chat(request, userId);
        return ResponseEntity.ok(ApiResponse.success("Phản hồi từ trợ lý AI", response));
    }

    @GetMapping("/{sessionId}/history")
    @Operation(summary = "Lấy lịch sử cuộc trò chuyện theo session")
    public ResponseEntity<ApiResponse<ChatHistoryResponse>> getHistory(
            @PathVariable("sessionId") String sessionId
    ) {
        Long userId = resolveUserId();
        List<ChatMessageDto> messages = aiChatService.getHistory(sessionId, userId);
        ChatHistoryResponse history = ChatHistoryResponse.builder()
                .sessionId(sessionId)
                .messages(messages)
                .build();
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @DeleteMapping("/{sessionId}")
    @Operation(summary = "Xóa lịch sử cuộc trò chuyện theo session")
    public ResponseEntity<ApiResponse<Void>> clearHistory(
            @PathVariable("sessionId") String sessionId
    ) {
        Long userId = resolveUserId();
        aiChatService.clearHistory(sessionId, userId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa lịch sử trò chuyện", null));
    }

    private Long resolveUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof CustomUserDetails userDetails) {
                return userDetails.getUserId();
            }
        }
        return 0L; // Khách vãng lai chưa đăng nhập
    }
}
