package com.driveshare.modules.ai.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    @JsonProperty("sessionId")
    public String getSessionIdCamel() {
        return sessionId;
    }

    @JsonProperty("userId")
    public Long getUserIdCamel() {
        return userId;
    }

    @JsonProperty("userRole")
    public String getUserRoleCamel() {
        return userRole;
    }

    @JsonProperty("userEmail")
    public String getUserEmailCamel() {
        return userEmail;
    }

    @JsonProperty("userFullName")
    public String getUserFullNameCamel() {
        return userFullName;
    }

    @JsonProperty("messageCount")
    public Integer getMessageCountCamel() {
        return messageCount;
    }

    @JsonProperty("firstMessage")
    public String getFirstMessageCamel() {
        return firstMessage;
    }

    @JsonProperty("lastMessage")
    public String getLastMessageCamel() {
        return lastMessage;
    }

    @JsonProperty("updatedAt")
    public Instant getUpdatedAtCamel() {
        return updatedAt;
    }

    @JsonProperty("updatedAtFormatted")
    public String getUpdatedAtFormattedCamel() {
        return updatedAtFormatted;
    }
}
