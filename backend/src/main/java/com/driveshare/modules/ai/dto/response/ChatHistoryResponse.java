package com.driveshare.modules.ai.dto.response;

import com.driveshare.modules.ai.dto.ChatMessageDto;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatHistoryResponse {
    private String sessionId;
    private List<ChatMessageDto> messages;

    @JsonProperty("sessionId")
    public String getSessionIdCamel() {
        return sessionId;
    }
}
