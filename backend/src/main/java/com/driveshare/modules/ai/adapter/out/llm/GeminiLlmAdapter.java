package com.driveshare.modules.ai.adapter.out.llm;

import com.driveshare.modules.ai.application.port.out.LlmClientPort;
import com.driveshare.modules.ai.dto.ChatMessageDto;
import com.driveshare.modules.ai.service.GeminiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class GeminiLlmAdapter implements LlmClientPort {

    private final GeminiService geminiService;

    @Autowired
    public GeminiLlmAdapter(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @Override
    public boolean isEnabled() {
        return geminiService != null && geminiService.isEnabled();
    }

    @Override
    public Optional<String> generateContent(String systemInstruction, List<ChatMessageDto> history, String userMessage) {
        if (geminiService == null) {
            return Optional.empty();
        }
        return geminiService.generateContent(systemInstruction, history, userMessage);
    }

    @Override
    public Optional<String> generateContent(String systemInstruction, List<ChatMessageDto> history, String userMessage, String sessionId, String userId) {
        if (geminiService == null) {
            return Optional.empty();
        }
        return geminiService.generateContent(systemInstruction, history, userMessage, sessionId, userId);
    }
}
