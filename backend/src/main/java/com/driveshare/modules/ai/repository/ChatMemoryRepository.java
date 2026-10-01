package com.driveshare.modules.ai.repository;

import com.driveshare.modules.ai.entity.ChatMemoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChatMemoryRepository extends JpaRepository<ChatMemoryEntity, Long> {
    Optional<ChatMemoryEntity> findByUserIdAndSessionId(Long userId, String sessionId);
    Optional<ChatMemoryEntity> findBySessionId(String sessionId);
    void deleteByUserIdAndSessionId(Long userId, String sessionId);
}
