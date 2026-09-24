package com.driveshare.app.adapter.in.web;

import com.driveshare.core.application.dto.ChatCommand;
import com.driveshare.core.application.dto.ChatMessage;
import com.driveshare.core.application.dto.ChatReply;
import com.driveshare.core.application.port.in.ChatUseCase;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ChatControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ChatUseCase chatUseCase;

    @Test
    @DisplayName("POST /api/v1/chat: Trả về 200 và nội dung phản hồi từ ChatUseCase")
    void shouldReplyMessageSuccessfully() throws Exception {
        ChatReply reply = new ChatReply("sess-001", "Gợi ý xe: VinFast VF8 2024");
        when(chatUseCase.reply(any(ChatCommand.class))).thenReturn(reply);

        String payload = """
                {
                    "sessionId": "sess-001",
                    "message": "Cần thuê xe 5 chỗ"
                }
                """;

        mockMvc.perform(post("/api/v1/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.sessionId").value("sess-001"))
                .andExpect(jsonPath("$.data.message").value("Gợi ý xe: VinFast VF8 2024"));
    }

    @Test
    @DisplayName("GET /api/v1/chat/{sessionId}/history: Trả về 200 và danh sách lịch sử tin nhắn")
    void shouldGetHistorySuccessfully() throws Exception {
        List<ChatMessage> messages = List.of(
                ChatMessage.user("Xin chào"),
                ChatMessage.assistant("Chào bạn, tôi là trợ lý AI DriveShare!")
        );
        when(chatUseCase.getHistory(0L, "sess-001")).thenReturn(messages);

        mockMvc.perform(get("/api/v1/chat/sess-001/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.sessionId").value("sess-001"))
                .andExpect(jsonPath("$.data.messages[0].text").value("Xin chào"))
                .andExpect(jsonPath("$.data.messages[1].text").value("Chào bạn, tôi là trợ lý AI DriveShare!"));
    }

    @Test
    @DisplayName("DELETE /api/v1/chat/{sessionId}: Xóa lịch sử và trả về 200")
    void shouldClearHistorySuccessfully() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete("/api/v1/chat/sess-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Đã xóa lịch sử trò chuyện"));
    }

    @Test
    @DisplayName("POST /api/v1/chat: Trả về 400 khi message rỗng (GlobalExceptionHandler)")
    void shouldReturnBadRequestWhenMessageIsBlank() throws Exception {
        String invalidPayload = """
                {
                    "sessionId": "sess-001",
                    "message": ""
                }
                """;

        mockMvc.perform(post("/api/v1/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value(400));
    }
}

