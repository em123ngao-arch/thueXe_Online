package com.driveshare.modules.ai.domain.model;

import java.time.Instant;

/**
 * Pure Java Domain Model for Chat Session.
 */
public class ChatSession {
    private String sessionId;
    private Long userId;
    private String userRole;
    private Instant createdAt;
    private Instant updatedAt;

    public ChatSession() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public ChatSession(String sessionId, Long userId, String userRole) {
        this.sessionId = sessionId;
        this.userId = userId;
        this.userRole = userRole;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserRole() { return userRole; }
    public void setUserRole(String userRole) { this.userRole = userRole; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

