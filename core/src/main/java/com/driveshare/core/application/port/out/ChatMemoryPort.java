package com.driveshare.core.application.port.out;

import com.driveshare.core.application.dto.ChatMemoryId;
import com.driveshare.core.application.dto.ChatMessage;

import java.util.List;

public interface ChatMemoryPort {
    List<ChatMessage> getMessages(ChatMemoryId id);
    void updateMessages(ChatMemoryId id, List<ChatMessage> messages);
    void deleteMessages(ChatMemoryId id);
}
