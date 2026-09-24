package com.driveshare.app.memory;

import com.driveshare.core.application.dto.ChatMemoryId;
import com.driveshare.core.application.dto.ChatMessage;
import com.driveshare.core.application.port.out.ChatMemoryPort;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
public class JpaChatMemoryStore implements ChatMemoryPort {

    private static final Logger log = LoggerFactory.getLogger(JpaChatMemoryStore.class);

    private final ChatMemoryJpaRepository repository;
    private final ObjectMapper objectMapper;

    public JpaChatMemoryStore(ChatMemoryJpaRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Override
    public List<ChatMessage> getMessages(ChatMemoryId id) {
        return repository.findByUserIdAndSessionId(id.userId(), id.sessionId())
                .map(entity -> {
                    try {
                        return objectMapper.readValue(entity.getMessages(), new TypeReference<List<ChatMessage>>() {});
                    } catch (Exception e) {
                        log.error("Failed to deserialize chat messages for session: {}", id.sessionId(), e);
                        return Collections.<ChatMessage>emptyList();
                    }
                })
                .orElseGet(Collections::emptyList);
    }

    @Override
    public void updateMessages(ChatMemoryId id, List<ChatMessage> messages) {
        try {
            String json = objectMapper.writeValueAsString(messages);
            ChatMemoryEntity entity = repository.findByUserIdAndSessionId(id.userId(), id.sessionId())
                    .map(existing -> existing.withMessages(json))
                    .orElseGet(() -> new ChatMemoryEntity(id.userId(), id.sessionId(), json));
            repository.save(entity);
        } catch (Exception e) {
            log.error("Failed to serialize chat messages for session: {}", id.sessionId(), e);
        }
    }

    @Override
    public void deleteMessages(ChatMemoryId id) {
        repository.findByUserIdAndSessionId(id.userId(), id.sessionId())
                .ifPresent(repository::delete);
    }
}
