package com.driveshare.app.adapter.in.web;

import com.driveshare.app.adapter.in.web.dto.ApiResponse;
import com.driveshare.app.adapter.in.web.dto.ChatHistoryResponse;
import com.driveshare.app.adapter.in.web.dto.ChatReplyResponse;
import com.driveshare.app.adapter.in.web.dto.ChatRequest;
import com.driveshare.core.application.dto.ChatCommand;
import com.driveshare.core.application.port.in.ChatUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/chat")
@Tag(name = "AI Chat Assistant", description = "Trợ lý ảo tư vấn thuê xe thông minh DriveShare")
public class ChatController {

    private final ChatUseCase chatUseCase;

    public ChatController(ChatUseCase chatUseCase) {
        this.chatUseCase = chatUseCase;
    }

    @PostMapping
    @Operation(summary = "Gửi tin nhắn cho trợ lý AI và nhận phản hồi gợi ý xe")
    public ResponseEntity<ApiResponse<ChatReplyResponse>> reply(
            @Valid @RequestBody ChatRequest request,
            Authentication authentication) {

        Long userId = resolveUserId(authentication);
        ChatCommand command = new ChatCommand(userId, request.sessionId(), request.message());
        ChatReplyResponse response = ChatReplyResponse.from(chatUseCase.reply(command));

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{sessionId}/history")
    @Operation(summary = "Lấy lịch sử cuộc trò chuyện theo session")
    public ResponseEntity<ApiResponse<ChatHistoryResponse>> getHistory(
            @PathVariable String sessionId,
            Authentication authentication) {

        Long userId = resolveUserId(authentication);
        ChatHistoryResponse history = new ChatHistoryResponse(
                sessionId,
                chatUseCase.getHistory(userId, sessionId)
        );

        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @DeleteMapping("/{sessionId}")
    @Operation(summary = "Xóa lịch sử cuộc trò chuyện theo session")
    public ResponseEntity<ApiResponse<Void>> clearHistory(
            @PathVariable String sessionId,
            Authentication authentication) {

        Long userId = resolveUserId(authentication);
        chatUseCase.clearHistory(userId, sessionId);

        return ResponseEntity.ok(ApiResponse.success("Đã xóa lịch sử trò chuyện", null));
    }

    private Long resolveUserId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof Long id) {
            return id;
        }
        return 0L; // Guest / Anonymous user
    }
}
