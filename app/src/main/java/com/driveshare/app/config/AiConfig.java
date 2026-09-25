package com.driveshare.app.config;

import com.driveshare.core.application.port.in.ChatUseCase;
import com.driveshare.core.application.port.out.CarSuggestionPort;
import com.driveshare.core.application.port.out.ChatMemoryPort;
import com.driveshare.core.application.usecase.ChatUseCaseImpl;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiConfig {

    @Bean
    public ChatUseCase chatUseCase(ChatMemoryPort chatMemoryPort, CarSuggestionPort carSuggestionPort) {
        return new ChatUseCaseImpl(chatMemoryPort, carSuggestionPort);
    }
}
