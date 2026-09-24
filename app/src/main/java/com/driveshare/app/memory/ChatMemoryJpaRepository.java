package com.driveshare.app.memory;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChatMemoryJpaRepository extends JpaRepository<ChatMemoryEntity, Long> {
    Optional<ChatMemoryEntity> findByUserIdAndSessionId(Long userId, String sessionId);
}
