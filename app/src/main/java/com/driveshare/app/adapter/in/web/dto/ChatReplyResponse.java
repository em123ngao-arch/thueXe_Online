package com.driveshare.app.adapter.in.web.dto;

import com.driveshare.core.application.dto.ChatReply;

public record ChatReplyResponse(
        String sessionId,
        String message
) {
    public static ChatReplyResponse from(ChatReply reply) {
        return new ChatReplyResponse(reply.sessionId(), reply.message());
    }
}
