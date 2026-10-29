package com.driveshare.modules.ai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatSessionSummaryDto {
    private Long id;
    private String sessionId;
    private Long userId;
    private String userRole;
    private String userEmail;
    private String userFullName;
    private Integer messageCount;
    private String firstMessage;
    private String lastMessage;
    private Instant updatedAt;
    private String updatedAtFormatted;
}
