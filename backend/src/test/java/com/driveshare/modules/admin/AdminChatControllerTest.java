package com.driveshare.modules.admin;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.modules.admin.controller.AdminChatController;
import com.driveshare.modules.ai.dto.ChatMessageDto;
import com.driveshare.modules.ai.dto.response.ChatSessionSummaryDto;
import com.driveshare.modules.ai.service.AiChatService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminChatControllerTest {

    @Mock
    private AiChatService aiChatService;

    @InjectMocks
    private AdminChatController adminChatController;

    @Test
    @DisplayName("Admin can get chat history with role filter and search")
    void testGetChatHistory() {
        ChatSessionSummaryDto summary = ChatSessionSummaryDto.builder()
                .sessionId("sess-100")
                .userId(1L)
                .userRole("ROLE_RENTER")
                .userFullName("Nguyễn Văn A")
                .userEmail("renter@gmail.com")
                .messageCount(4)
                .firstMessage("Tìm xe 5 chỗ")
                .lastMessage("Cảm ơn bot")
                .updatedAt(Instant.now())
                .updatedAtFormatted("24/10/2026")
                .build();

        when(aiChatService.getAllSessionsForAdmin("ROLE_RENTER", "Nguyễn")).thenReturn(List.of(summary));

        ResponseEntity<ApiResponse<List<ChatSessionSummaryDto>>> response =
                adminChatController.getChatHistory("ROLE_RENTER", "Nguyễn");

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getData()).hasSize(1);
        assertThat(response.getBody().getData().get(0).getSessionId()).isEqualTo("sess-100");
        assertThat(response.getBody().getData().get(0).getUserRole()).isEqualTo("ROLE_RENTER");
    }

    @Test
    @DisplayName("Admin can view complete transcript of a session")
    void testGetSessionTranscript() {
        ChatMessageDto msg1 = new ChatMessageDto("user", "Tôi muốn thuê xe");
        ChatMessageDto msg2 = new ChatMessageDto("assistant", "Em chào anh/chị ạ! Anh/chị cần xe gì?");

        when(aiChatService.getSessionTranscriptForAdmin("sess-200")).thenReturn(List.of(msg1, msg2));

        ResponseEntity<ApiResponse<List<ChatMessageDto>>> response =
                adminChatController.getSessionTranscript("sess-200");

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getData()).hasSize(2);
        assertThat(response.getBody().getData().get(0).getRole()).isEqualTo("user");
        assertThat(response.getBody().getData().get(1).getRole()).isEqualTo("assistant");
    }
}
