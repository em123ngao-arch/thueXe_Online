package com.driveshare.modules.ai.application.port.out;

import com.driveshare.modules.ai.dto.ChatMessageDto;

import java.util.List;
import java.util.Optional;

/**
 * Outbound Port for LLM (Large Language Model) integration.
 */
public interface LlmClientPort {
    boolean isEnabled();
    Optional<String> generateContent(String systemInstruction, List<ChatMessageDto> history, String userMessage);
    Optional<String> generateContent(String systemInstruction, List<ChatMessageDto> history, String userMessage, String sessionId, String userId);
}
