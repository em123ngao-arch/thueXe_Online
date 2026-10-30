package com.driveshare.modules.ai.application.port.out;

import com.driveshare.modules.ai.domain.model.ChatMemoryRecord;

import java.util.List;
import java.util.Optional;

/**
 * Outbound Port for Chat Memory persistence.
 */
public interface ChatMemoryPort {
    Optional<ChatMemoryRecord> findByUserIdAndSessionId(Long userId, String sessionId);
    Optional<ChatMemoryRecord> findBySessionId(String sessionId);
    Optional<ChatMemoryRecord> findFirstBySessionIdOrderByUpdatedAtDesc(String sessionId);
    List<ChatMemoryRecord> findByUserIdOrderByUpdatedAtDesc(Long userId);
    List<ChatMemoryRecord> findByUserRoleOrderByUpdatedAtDesc(String userRole);
    List<ChatMemoryRecord> findAllByOrderByUpdatedAtDesc();
    void save(ChatMemoryRecord record);
    void deleteByUserIdAndSessionId(Long userId, String sessionId);
    void deleteBySessionId(String sessionId);
}

