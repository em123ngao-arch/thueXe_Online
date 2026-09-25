package com.driveshare.app.adapter.in.web.dto;

import com.driveshare.core.application.dto.ChatMessage;

import java.util.List;

public record ChatHistoryResponse(
        String sessionId,
        List<ChatMessage> messages
) {
}
