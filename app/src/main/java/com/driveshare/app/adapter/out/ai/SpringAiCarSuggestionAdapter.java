package com.driveshare.app.adapter.out.ai;

import com.driveshare.core.application.dto.CarSuggestion;
import com.driveshare.core.application.dto.CarSuggestionCommand;
import com.driveshare.core.application.port.out.CarSuggestionPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;

@Component
public class SpringAiCarSuggestionAdapter implements CarSuggestionPort {

    private static final Logger log = LoggerFactory.getLogger(SpringAiCarSuggestionAdapter.class);

    private final ChatClient chatClient;
    private final String systemPrompt;

    public SpringAiCarSuggestionAdapter(
            ChatClient.Builder builder,
            @Value("classpath:prompts/car-advisor-system.txt") Resource systemPromptResource) {
        this.chatClient = builder != null ? builder.build() : null;
        this.systemPrompt = readText(systemPromptResource);
    }

    @Override
    public CarSuggestion suggest(CarSuggestionCommand command) {
        if (chatClient == null) {
            return fallbackSuggestion();
        }

        try {
            String userMessage = buildUserPrompt(command);
            return chatClient.prompt()
                    .system(systemPrompt)
                    .user(userMessage)
                    .call()
                    .entity(CarSuggestion.class);
        } catch (Exception e) {
            log.warn("Spring AI call failed or API key not configured, returning fallback recommendation: {}", e.getMessage());
            return fallbackSuggestion();
        }
    }

    private CarSuggestion fallbackSuggestion() {
        return new CarSuggestion(
                "VinFast VF8 2024",
                "5 chỗ",
                "1.100.000đ",
                "Tự động",
                "Điện",
                "Xe điện cao cấp, công nghệ trợ lái thông minh, nội thất sang trọng và êm ái cho mọi hành trình."
        );
    }

    private String buildUserPrompt(CarSuggestionCommand command) {
        StringBuilder sb = new StringBuilder();
        if (command.query() != null) sb.append("Yêu cầu của khách: ").append(command.query()).append("\n");
        if (command.location() != null) sb.append("Địa điểm thuê: ").append(command.location()).append("\n");
        if (command.seats() != null) sb.append("Số chỗ: ").append(command.seats()).append("\n");
        if (command.budget() != null) sb.append("Ngân sách tối đa: ").append(command.budget()).append(" VND\n");
        return sb.toString();
    }

    private static String readText(Resource resource) {
        try (InputStream in = resource.getInputStream()) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to read system prompt from " + resource, e);
        }
    }
}
