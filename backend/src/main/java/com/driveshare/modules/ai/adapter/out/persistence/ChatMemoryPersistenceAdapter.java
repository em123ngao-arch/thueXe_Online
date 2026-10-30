package com.driveshare.modules.ai.adapter.out.persistence;

import com.driveshare.modules.ai.application.port.out.ChatMemoryPort;
import com.driveshare.modules.ai.domain.model.ChatMemoryRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class ChatMemoryPersistenceAdapter implements ChatMemoryPort {

    private final ChatMemoryJpaRepository jpaRepository;

    @Autowired
    public ChatMemoryPersistenceAdapter(ChatMemoryJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<ChatMemoryRecord> findByUserIdAndSessionId(Long userId, String sessionId) {
        return jpaRepository.findByUserIdAndSessionId(userId, sessionId).map(this::toRecord);
    }

    @Override
    public Optional<ChatMemoryRecord> findBySessionId(String sessionId) {
        return jpaRepository.findBySessionId(sessionId).map(this::toRecord);
    }

    @Override
    public Optional<ChatMemoryRecord> findFirstBySessionIdOrderByUpdatedAtDesc(String sessionId) {
        return jpaRepository.findFirstBySessionIdOrderByUpdatedAtDesc(sessionId).map(this::toRecord);
    }

    @Override
    public List<ChatMemoryRecord> findByUserIdOrderByUpdatedAtDesc(Long userId) {
        return jpaRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(this::toRecord)
                .collect(Collectors.toList());
    }

    @Override
    public List<ChatMemoryRecord> findByUserRoleOrderByUpdatedAtDesc(String userRole) {
        return jpaRepository.findByUserRoleOrderByUpdatedAtDesc(userRole).stream()
                .map(this::toRecord)
                .collect(Collectors.toList());
    }

    @Override
    public List<ChatMemoryRecord> findAllByOrderByUpdatedAtDesc() {
        return jpaRepository.findAllByOrderByUpdatedAtDesc().stream()
                .map(this::toRecord)
                .collect(Collectors.toList());
    }

    @Override
    public void save(ChatMemoryRecord record) {
        ChatMemoryJpaEntity entity = null;
        if (record.getId() != null) {
            entity = jpaRepository.findById(record.getId()).orElse(null);
        }
        if (entity == null && record.getUserId() != null && record.getSessionId() != null) {
            entity = jpaRepository.findByUserIdAndSessionId(record.getUserId(), record.getSessionId()).orElse(null);
        }
        if (entity == null) {
            entity = new ChatMemoryJpaEntity();
            entity.setUserId(record.getUserId());
            entity.setSessionId(record.getSessionId());
        }

        // Cập nhật các trường trên entity đang được quản lý (tránh mất metadata)
        entity.setMessages(record.getMessages());
        entity.setUserRole(record.getUserRole());
        entity.setUserEmail(record.getUserEmail());
        entity.setUserFullName(record.getUserFullName());
        entity.setMessageCount(record.getMessageCount());
        entity.setFirstMessage(record.getFirstMessage());
        entity.setLastMessage(record.getLastMessage());
        entity.setUpdatedAt(record.getUpdatedAt());

        ChatMemoryJpaEntity saved = jpaRepository.save(entity);
        if (saved != null) {
            record.setId(saved.getId());
        }
    }

    @Override
    public void deleteByUserIdAndSessionId(Long userId, String sessionId) {
        jpaRepository.deleteByUserIdAndSessionId(userId, sessionId);
    }

    @Override
    public void deleteBySessionId(String sessionId) {
        jpaRepository.deleteBySessionId(sessionId);
    }

    private ChatMemoryRecord toRecord(ChatMemoryJpaEntity entity) {
        return new ChatMemoryRecord(
                entity.getId(),
                entity.getUserId(),
                entity.getSessionId(),
                entity.getMessages(),
                entity.getUserRole(),
                entity.getUserEmail(),
                entity.getUserFullName(),
                entity.getMessageCount(),
                entity.getFirstMessage(),
                entity.getLastMessage(),
                entity.getUpdatedAt()
        );
    }
}
