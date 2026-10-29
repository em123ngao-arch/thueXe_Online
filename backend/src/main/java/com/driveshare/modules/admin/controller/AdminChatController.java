package com.driveshare.modules.admin.controller;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.modules.ai.dto.ChatMessageDto;
import com.driveshare.modules.ai.dto.response.ChatSessionSummaryDto;
import com.driveshare.modules.ai.service.AiChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/chat-history")
@RequiredArgsConstructor
@Tag(name = "Admin Chat History", description = "Quản trị viên giám sát và lọc lịch sử hội thoại AI của Khách thuê, Chủ xe và Khách vãng lai")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminChatController {

    private final AiChatService aiChatService;

    @GetMapping
    @Operation(summary = "Lấy toàn bộ lịch sử các phiên chat có bộ lọc theo vai trò (ROLE_RENTER, ROLE_OWNER, GUEST, ALL) và tìm kiếm")
    public ResponseEntity<ApiResponse<List<ChatSessionSummaryDto>>> getChatHistory(
            @RequestParam(value = "role", required = false, defaultValue = "ALL") String role,
            @RequestParam(value = "search", required = false) String search
    ) {
        List<ChatSessionSummaryDto> list = aiChatService.getAllSessionsForAdmin(role, search);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách lịch sử chat thành công", list));
    }

    @GetMapping("/{sessionId}")
    @Operation(summary = "Xem chi tiết toàn bộ nội dung hội thoại của một phiên chat cụ thể")
    public ResponseEntity<ApiResponse<List<ChatMessageDto>>> getSessionTranscript(
            @PathVariable("sessionId") String sessionId
    ) {
        List<ChatMessageDto> messages = aiChatService.getSessionTranscriptForAdmin(sessionId);
        return ResponseEntity.ok(ApiResponse.success("Nội dung hội thoại chi tiết", messages));
    }
}
