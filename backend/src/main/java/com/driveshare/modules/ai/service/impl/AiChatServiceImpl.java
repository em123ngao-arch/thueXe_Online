package com.driveshare.modules.ai.service.impl;

import com.driveshare.modules.ai.adapter.out.car.CarDataQueryLegacyAdapter;
import com.driveshare.modules.ai.adapter.out.llm.GeminiLlmAdapter;
import com.driveshare.modules.ai.adapter.out.persistence.ChatMemoryPersistenceAdapter;
import com.driveshare.modules.ai.adapter.out.user.UserQueryLegacyAdapter;
import com.driveshare.modules.ai.adapter.out.persistence.ChatMemoryJpaRepository;
import com.driveshare.modules.ai.application.port.out.*;
import com.driveshare.modules.ai.application.usecase.AiChatUseCaseImpl;
import com.driveshare.modules.ai.repository.ChatMemoryRepository;
import com.driveshare.modules.ai.service.AiChatService;
import com.driveshare.modules.ai.service.GeminiService;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@Primary
public class AiChatServiceImpl extends AiChatUseCaseImpl implements AiChatService {

    @Autowired
    public AiChatServiceImpl(ChatMemoryPort chatMemoryPort,
                             CarDataQueryPort carDataQueryPort,
                             LlmClientPort llmClientPort,
                             UserQueryPort userQueryPort,
                             DocumentSearchPort documentSearchPort,
                             AiObservabilityPort observabilityPort,
                             ObjectMapper objectMapper) {
        super(chatMemoryPort, carDataQueryPort, llmClientPort, userQueryPort, documentSearchPort, observabilityPort, objectMapper);
    }

    // Constructor for unit tests (AiChatServiceImplTest, AiChatbotHandoverEmergencyTest)
    public AiChatServiceImpl(ChatMemoryRepository chatMemoryRepository,
                             CarRepository carRepository,
                             ObjectMapper objectMapper,
                             GeminiService geminiService) {
        this(chatMemoryRepository, carRepository, objectMapper, geminiService, null);
    }

    public AiChatServiceImpl(ChatMemoryRepository chatMemoryRepository,
                             CarRepository carRepository,
                             ObjectMapper objectMapper,
                             GeminiService geminiService,
                             UserRepository userRepository) {
        super(
                new ChatMemoryPersistenceAdapter(chatMemoryRepository),
                new CarDataQueryLegacyAdapter(carRepository),
                new GeminiLlmAdapter(geminiService),
                new UserQueryLegacyAdapter(userRepository),
                (query, topK) -> Collections.emptyList(),
                (traceId, name, sessionId, userId, model, systemPrompt, input, output, latencyMs, success, errorMessage) -> {},
                objectMapper
        );
    }
}
