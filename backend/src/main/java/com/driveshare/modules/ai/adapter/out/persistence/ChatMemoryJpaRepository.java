package com.driveshare.modules.ai.adapter.out.persistence;

import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@Primary
public interface ChatMemoryJpaRepository extends JpaRepository<ChatMemoryJpaEntity, Long> {
    Optional<ChatMemoryJpaEntity> findByUserIdAndSessionId(Long userId, String sessionId);
    Optional<ChatMemoryJpaEntity> findBySessionId(String sessionId);
    Optional<ChatMemoryJpaEntity> findFirstBySessionIdOrderByUpdatedAtDesc(String sessionId);
    List<ChatMemoryJpaEntity> findBySessionIdOrderByUpdatedAtDesc(String sessionId);
    void deleteByUserIdAndSessionId(Long userId, String sessionId);
    void deleteBySessionId(String sessionId);

    List<ChatMemoryJpaEntity> findByUserIdOrderByUpdatedAtDesc(Long userId);
    List<ChatMemoryJpaEntity> findAllByOrderByUpdatedAtDesc();

    @Query("SELECT c FROM ChatMemoryEntity c WHERE " +
            "(:userRole = 'GUEST' AND (c.userRole = 'GUEST' OR c.userRole IS NULL OR c.userId = 0)) " +
            "OR (c.userRole = :userRole) ORDER BY c.updatedAt DESC")
    List<ChatMemoryJpaEntity> findByUserRoleOrderByUpdatedAtDesc(@Param("userRole") String userRole);
}
