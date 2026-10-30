package com.driveshare.modules.ai.application.port.in;

import com.driveshare.modules.ai.dto.response.ChatHistoryResponse;

/**
 * Inbound Port for retrieving and clearing chat history.
 */
public interface GetChatHistoryUseCase {
    ChatHistoryResponse getHistory(String sessionId, Long userId);
    void clearHistory(String sessionId, Long userId);
}

