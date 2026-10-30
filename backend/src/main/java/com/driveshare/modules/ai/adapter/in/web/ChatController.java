package com.driveshare.modules.ai.adapter.in.web;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.modules.ai.application.port.in.AiAdvisorInboundPort;
import com.driveshare.modules.ai.dto.ChatMessageDto;
import com.driveshare.modules.ai.dto.request.ChatRequest;
import com.driveshare.modules.ai.dto.response.ChatHistoryResponse;
import com.driveshare.modules.ai.dto.response.ChatReplyResponse;
import com.driveshare.modules.ai.dto.response.ChatSessionSummaryDto;
import com.driveshare.modules.ai.service.LangfuseService;
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
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
@Tag(name = "AI Chat Assistant", description = "Trợ lý ảo tư vấn thuê xe thông minh DriveShare")
public class ChatController {

    private final AiAdvisorInboundPort aiChatService;
    private final LangfuseService langfuseService;

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

    @GetMapping("/my-sessions")
    @Operation(summary = "Lấy danh sách các phiên trò chuyện của người dùng hiện tại (Khách thuê hoặc Chủ xe)")
    public ResponseEntity<ApiResponse<List<ChatSessionSummaryDto>>> getMySessions() {
        Long userId = resolveUserId();
        List<ChatSessionSummaryDto> list = aiChatService.getMyChatSessions(userId);
        return ResponseEntity.ok(ApiResponse.success("Danh sách phiên trò chuyện của bạn", list));
    }

    @PostMapping("/reload-prompt")
    @Operation(summary = "Làm mới kịch bản System Prompt từ ổ cứng/file ngay lập tức mà không cần restart server")
    public ResponseEntity<ApiResponse<String>> reloadPrompt() {
        aiChatService.reloadSystemPrompt();
        return ResponseEntity.ok(ApiResponse.success("Đã làm mới System Prompt thành công từ file mã nguồn!", "RELOAD_SUCCESS"));
    }

    @GetMapping("/langfuse-status")
    @Operation(summary = "Kiểm tra trạng thái kết nối Langfuse Observability & Tracing")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getLangfuseStatus() {
        return ResponseEntity.ok(ApiResponse.success(langfuseService.getStatus()));
    }

    @PostMapping("/langfuse-test-trace")
    @Operation(summary = "Gửi một Trace mẫu lên Langfuse để kiểm tra kết nối và quan sát ngay trên Dashboard")
    public ResponseEntity<ApiResponse<String>> testLangfuseTrace(
            @RequestParam(value = "message", defaultValue = "Kiểm thử kết nối Langfuse từ DriveShare") String message
    ) {
        String traceId = "test-" + UUID.randomUUID();
        langfuseService.recordGeneration(
                traceId,
                "test-observability",
                "test-session-demo",
                "test-user",
                "gemini-2.5-flash",
                "Hệ thống DriveShare kiểm thử Langfuse",
                message,
                "Xin chào! Đây là tin nhắn phản hồi mẫu từ DriveShare đã được ghi vết thành công lên Langfuse.",
                320L,
                true,
                null
        );
        return ResponseEntity.ok(ApiResponse.success("Đã gửi Trace mẫu thành công lên Langfuse!", traceId));
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

