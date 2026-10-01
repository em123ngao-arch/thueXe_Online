package com.driveshare.modules.ai.service;

import com.driveshare.modules.ai.dto.ChatMessageDto;
import com.driveshare.modules.ai.dto.request.ChatRequest;
import com.driveshare.modules.ai.dto.response.ChatReplyResponse;

import java.util.List;

public interface AiChatService {
    ChatReplyResponse chat(ChatRequest request, Long userId);
    List<ChatMessageDto> getHistory(String sessionId, Long userId);
    void clearHistory(String sessionId, Long userId);
}
