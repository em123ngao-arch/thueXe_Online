package com.driveshare.modules.ai.application.port.in;

import com.driveshare.modules.ai.dto.ChatMessageDto;
import com.driveshare.modules.ai.dto.response.ChatSessionSummaryDto;

import java.util.List;

/**
 * Inbound Port for administrative and user chat session management.
 */
public interface ManageChatSessionUseCase {
    List<ChatSessionSummaryDto> listSessions(Long userId, int limit);
    List<ChatMessageDto> getSessionTranscriptForAdmin(String sessionId);
    List<ChatSessionSummaryDto> listAdminSessions(String roleFilter, int limit);
    void reloadSystemPrompt();
}

