package com.driveshare.core.application.usecase;

import com.driveshare.core.application.dto.*;
import com.driveshare.core.application.port.out.CarSuggestionPort;
import com.driveshare.core.application.port.out.ChatMemoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;

class ChatUseCaseTest {

    private FakeChatMemoryPort memoryPort;
    private FakeCarSuggestionPort suggestionPort;
    private ChatUseCaseImpl chatUseCase;

    @BeforeEach
    void setUp() {
        memoryPort = new FakeChatMemoryPort();
        suggestionPort = new FakeCarSuggestionPort();
        chatUseCase = new ChatUseCaseImpl(memoryPort, suggestionPort);
    }

    @Test
    @DisplayName("Gửi tin nhắn chat thành công và lưu lịch sử vào memory")
    void shouldReplyAndSaveHistory() {
        suggestionPort.nextSuggestion = new CarSuggestion(
                "Toyota Fortuner 2023",
                "7 chỗ",
                "1.200.000đ",
                "Tự động",
                "Dầu",
                "Phù hợp đi đường đèo dốc."
        );

        ChatCommand command = new ChatCommand(1L, "sess-123", "Tôi muốn thuê xe đi Đà Lạt");
        ChatReply reply = chatUseCase.reply(command);

        assertThat(reply.sessionId()).isEqualTo("sess-123");
        assertThat(reply.message()).contains("Toyota Fortuner 2023");
        assertThat(reply.message()).contains("1.200.000đ");

        List<ChatMessage> history = chatUseCase.getHistory(1L, "sess-123");
        assertThat(history).hasSize(2);
        assertThat(history.get(0).text()).isEqualTo("Tôi muốn thuê xe đi Đà Lạt");
        assertThat(history.get(1).text()).contains("Toyota Fortuner 2023");
    }

    @Test
    @DisplayName("Xóa lịch sử chat thành công")
    void shouldClearHistory() {
        ChatCommand command = new ChatCommand(1L, "sess-999", "Xin chào");
        chatUseCase.reply(command);

        assertThat(chatUseCase.getHistory(1L, "sess-999")).isNotEmpty();

        chatUseCase.clearHistory(1L, "sess-999");
        assertThat(chatUseCase.getHistory(1L, "sess-999")).isEmpty();
    }

    // Hand-written test double fakes (no mockito on core classpath)
    static class FakeChatMemoryPort implements ChatMemoryPort {
        private final Map<ChatMemoryId, List<ChatMessage>> store = new HashMap<>();

        @Override
        public List<ChatMessage> getMessages(ChatMemoryId id) {
            return store.getOrDefault(id, Collections.emptyList());
        }

        @Override
        public void updateMessages(ChatMemoryId id, List<ChatMessage> messages) {
            store.put(id, new ArrayList<>(messages));
        }

        @Override
        public void deleteMessages(ChatMemoryId id) {
            store.remove(id);
        }
    }

    static class FakeCarSuggestionPort implements CarSuggestionPort {
        CarSuggestion nextSuggestion;

        @Override
        public CarSuggestion suggest(CarSuggestionCommand command) {
            return nextSuggestion;
        }
    }
}
