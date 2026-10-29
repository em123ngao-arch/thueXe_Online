package com.driveshare.modules.ai.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "chat_memory",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_user_session", columnNames = {"user_id", "session_id"})
        }
)
public class ChatMemoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "session_id", nullable = false, length = 100)
    private String sessionId;

    @Column(name = "messages", columnDefinition = "TEXT", nullable = false)
    private String messages;

    @Column(name = "user_role", length = 30)
    @Builder.Default
    private String userRole = "GUEST";

    @Column(name = "user_email", length = 150)
    private String userEmail;

    @Column(name = "user_full_name", length = 150)
    private String userFullName;

    @Column(name = "message_count")
    @Builder.Default
    private Integer messageCount = 0;

    @Column(name = "first_message", length = 500)
    private String firstMessage;

    @Column(name = "last_message", length = 500)
    private String lastMessage;

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
