package com.driveshare.core.application.port.in;

import com.driveshare.core.application.dto.ChatCommand;
import com.driveshare.core.application.dto.ChatMessage;
import com.driveshare.core.application.dto.ChatReply;

import java.util.List;

public interface ChatUseCase {
    ChatReply reply(ChatCommand command);
    List<ChatMessage> getHistory(Long userId, String sessionId);
    void clearHistory(Long userId, String sessionId);
}
