package com.driveshare.modules.ai.repository;

import com.driveshare.modules.ai.entity.ChatMemoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChatMemoryRepository extends JpaRepository<ChatMemoryEntity, Long> {
    Optional<ChatMemoryEntity> findByUserIdAndSessionId(Long userId, String sessionId);
    Optional<ChatMemoryEntity> findBySessionId(String sessionId);
    Optional<ChatMemoryEntity> findFirstBySessionIdOrderByUpdatedAtDesc(String sessionId);
    java.util.List<ChatMemoryEntity> findBySessionIdOrderByUpdatedAtDesc(String sessionId);
    void deleteByUserIdAndSessionId(Long userId, String sessionId);
    void deleteBySessionId(String sessionId);

    java.util.List<ChatMemoryEntity> findByUserIdOrderByUpdatedAtDesc(Long userId);
    java.util.List<ChatMemoryEntity> findAllByOrderByUpdatedAtDesc();

    @org.springframework.data.jpa.repository.Query("SELECT c FROM ChatMemoryEntity c WHERE " +
            "(:userRole = 'GUEST' AND (c.userRole = 'GUEST' OR c.userRole IS NULL OR c.userId = 0)) " +
            "OR (c.userRole = :userRole) ORDER BY c.updatedAt DESC")
    java.util.List<ChatMemoryEntity> findByUserRoleOrderByUpdatedAtDesc(@org.springframework.data.repository.query.Param("userRole") String userRole);
}
