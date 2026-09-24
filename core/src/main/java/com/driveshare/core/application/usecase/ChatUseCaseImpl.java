package com.driveshare.core.application.usecase;

import com.driveshare.core.application.dto.*;
import com.driveshare.core.application.port.in.ChatUseCase;
import com.driveshare.core.application.port.out.CarSuggestionPort;
import com.driveshare.core.application.port.out.ChatMemoryPort;
import com.driveshare.core.domain.vo.ChatRole;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class ChatUseCaseImpl implements ChatUseCase {

    private final ChatMemoryPort chatMemoryPort;
    private final CarSuggestionPort carSuggestionPort;

    public ChatUseCaseImpl(ChatMemoryPort chatMemoryPort, CarSuggestionPort carSuggestionPort) {
        this.chatMemoryPort = Objects.requireNonNull(chatMemoryPort, "chatMemoryPort must not be null");
        this.carSuggestionPort = Objects.requireNonNull(carSuggestionPort, "carSuggestionPort must not be null");
    }

    @Override
    public ChatReply reply(ChatCommand command) {
        ChatMemoryId memoryId = new ChatMemoryId(command.userId(), command.sessionId());
        List<ChatMessage> history = new ArrayList<>(chatMemoryPort.getMessages(memoryId));

        // Append user's new message
        history.add(new ChatMessage(ChatRole.USER, command.message()));

        // Call AI advisor
        CarSuggestionCommand suggestionCommand = new CarSuggestionCommand(
                command.message(),
                null,
                null,
                null
        );
        CarSuggestion suggestion = carSuggestionPort.suggest(suggestionCommand);

        String replyMessage;
        if (suggestion != null && suggestion.carName() != null && !suggestion.carName().isBlank()) {
            replyMessage = String.format("Gợi ý xe cho bạn: %s (%s, %s) - Giá: %s/ngày. Lý do: %s",
                    suggestion.carName(),
                    suggestion.seats() != null ? suggestion.seats() : "4-7 chỗ",
                    suggestion.transmission() != null ? suggestion.transmission() : "Tự động",
                    suggestion.pricePerDay() != null ? suggestion.pricePerDay() : "Thỏa thuận",
                    suggestion.reason() != null ? suggestion.reason() : "Phù hợp với nhu cầu của bạn.");
        } else {
            replyMessage = "Xin chào! Tôi là Trợ lý AI DriveShare. Tôi có thể giúp bạn tìm và thuê xe phù hợp với ngân sách và địa điểm. Bạn cần thuê xe bao nhiêu chỗ và đi đâu?";
        }

        // Append assistant's response to history and persist
        history.add(new ChatMessage(ChatRole.ASSISTANT, replyMessage));
        chatMemoryPort.updateMessages(memoryId, history);

        return new ChatReply(command.sessionId(), replyMessage);
    }

    @Override
    public List<ChatMessage> getHistory(Long userId, String sessionId) {
        return chatMemoryPort.getMessages(new ChatMemoryId(userId, sessionId));
    }

    @Override
    public void clearHistory(Long userId, String sessionId) {
        chatMemoryPort.deleteMessages(new ChatMemoryId(userId, sessionId));
    }
}
