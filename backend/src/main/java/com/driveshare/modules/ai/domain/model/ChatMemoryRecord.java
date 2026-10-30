package com.driveshare.modules.ai.domain.model;

import java.time.Instant;

/**
 * Pure Java Domain Model for Chat Memory state.
 */
public class ChatMemoryRecord {
    private Long id;
    private Long userId;
    private String sessionId;
    private String messages;
    private String userRole = "GUEST";
    private String userEmail;
    private String userFullName;
    private Integer messageCount = 0;
    private String firstMessage;
    private String lastMessage;
    private Instant updatedAt = Instant.now();

    public ChatMemoryRecord() {}

    public ChatMemoryRecord(Long id, Long userId, String sessionId, String messages,
                            String userRole, String userEmail, String userFullName,
                            Integer messageCount, String firstMessage, String lastMessage,
                            Instant updatedAt) {
        this.id = id;
        this.userId = userId;
        this.sessionId = sessionId;
        this.messages = messages;
        this.userRole = userRole != null ? userRole : "GUEST";
        this.userEmail = userEmail;
        this.userFullName = userFullName;
        this.messageCount = messageCount != null ? messageCount : 0;
        this.firstMessage = firstMessage;
        this.lastMessage = lastMessage;
        this.updatedAt = updatedAt != null ? updatedAt : Instant.now();
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final ChatMemoryRecord record = new ChatMemoryRecord();

        public Builder id(Long id) { record.setId(id); return this; }
        public Builder userId(Long userId) { record.setUserId(userId); return this; }
        public Builder sessionId(String sessionId) { record.setSessionId(sessionId); return this; }
        public Builder messages(String messages) { record.setMessages(messages); return this; }
        public Builder userRole(String userRole) { record.setUserRole(userRole); return this; }
        public Builder userEmail(String userEmail) { record.setUserEmail(userEmail); return this; }
        public Builder userFullName(String userFullName) { record.setUserFullName(userFullName); return this; }
        public Builder messageCount(Integer messageCount) { record.setMessageCount(messageCount); return this; }
        public Builder firstMessage(String firstMessage) { record.setFirstMessage(firstMessage); return this; }
        public Builder lastMessage(String lastMessage) { record.setLastMessage(lastMessage); return this; }
        public Builder updatedAt(Instant updatedAt) { record.setUpdatedAt(updatedAt); return this; }

        public ChatMemoryRecord build() {
            return record;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getMessages() { return messages; }
    public void setMessages(String messages) { this.messages = messages; }

    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }

    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }

    public String getUserFullName() { return userFullName; }
    public void setUserFullName(String userFullName) { this.userFullName = userFullName; }

    public Integer getMessageCount() { return messageCount; }
    public void setMessageCount(Integer messageCount) { this.messageCount = messageCount; }

    public String getFirstMessage() { return firstMessage; }
    public void setFirstMessage(String firstMessage) { this.firstMessage = firstMessage; }

    public String getLastMessage() { return lastMessage; }
    public void setLastMessage(String lastMessage) { this.lastMessage = lastMessage; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
