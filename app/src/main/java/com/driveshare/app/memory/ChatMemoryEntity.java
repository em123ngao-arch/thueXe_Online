package com.driveshare.app.memory;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "chat_memory", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_session", columnNames = {"user_id", "session_id"})
})
public class ChatMemoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "session_id", nullable = false, length = 100)
    private String sessionId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String messages;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public ChatMemoryEntity() {
    }

    public ChatMemoryEntity(Long userId, String sessionId, String messages) {
        this.userId = userId;
        this.sessionId = sessionId;
        this.messages = messages;
        this.updatedAt = Instant.now();
    }

    public ChatMemoryEntity withMessages(String messages) {
        this.messages = messages;
        this.updatedAt = Instant.now();
        return this;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getMessages() { return messages; }
    public void setMessages(String messages) { this.messages = messages; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
