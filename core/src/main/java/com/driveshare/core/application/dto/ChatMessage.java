package com.driveshare.core.application.dto;

import com.driveshare.core.domain.vo.ChatRole;

public record ChatMessage(ChatRole role, String text) {

    public static ChatMessage user(String text) {
        return new ChatMessage(ChatRole.USER, text);
    }

    public static ChatMessage assistant(String text) {
        return new ChatMessage(ChatRole.ASSISTANT, text);
    }

    public static ChatMessage system(String text) {
        return new ChatMessage(ChatRole.SYSTEM, text);
    }
}

