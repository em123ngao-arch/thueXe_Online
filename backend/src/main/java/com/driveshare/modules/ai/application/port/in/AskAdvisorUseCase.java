package com.driveshare.modules.ai.application.port.in;

import com.driveshare.modules.ai.dto.request.ChatRequest;
import com.driveshare.modules.ai.dto.response.ChatReplyResponse;

/**
 * Inbound Port for asking the AI Car Advisor.
 */
public interface AskAdvisorUseCase {
    ChatReplyResponse chat(ChatRequest request, Long userId);
}

