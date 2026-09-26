package com.driveshare.modules.ai.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {

    @NotBlank(message = "Session ID không được để trống")
    @JsonAlias({"sessionId", "session_id"})
    private String sessionId;

    @NotBlank(message = "Nội dung tin nhắn không được để trống")
    @JsonAlias({"message", "prompt", "query"})
    private String message;
}
