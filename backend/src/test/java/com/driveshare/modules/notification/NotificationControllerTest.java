package com.driveshare.modules.notification;

import com.driveshare.common.enums.EUserStatus;
import com.driveshare.modules.notification.controller.NotificationController;
import com.driveshare.modules.notification.dto.NotificationDto;
import com.driveshare.modules.notification.service.NotificationService;
import com.driveshare.security.CustomUserDetails;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = NotificationController.class)
@AutoConfigureMockMvc(addFilters = false)
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private NotificationService notificationService;

    @MockBean
    private com.driveshare.security.JwtTokenProvider jwtTokenProvider;

    @MockBean
    private com.driveshare.security.CustomUserDetailsService customUserDetailsService;

    @MockBean
    private com.driveshare.modules.auth.repository.AuthSessionRepository authSessionRepository;

    @MockBean
    private com.driveshare.security.JwtAccessDeniedHandler jwtAccessDeniedHandler;

    @MockBean
    private com.driveshare.security.JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    private CustomUserDetails userDetails;

    @BeforeEach
    void setUp() {
        userDetails = new CustomUserDetails(
                2L,
                "owner_demo",
                "owner@test.com",
                "hash",
                EUserStatus.ACTIVE,
                List.of(new SimpleGrantedAuthority("ROLE_OWNER"))
        );
        Authentication auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("GET /api/v1/notifications/my-notifications - Lấy danh sách thông báo")
    void getMyNotifications_ReturnsSuccess() throws Exception {
        NotificationDto dto = new NotificationDto(1L, 1L, 2L, "Test Title", "Test Content", "GENERAL", 100L, false, Instant.now());
        when(notificationService.getMyNotifications(2L)).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/v1/notifications/my-notifications").with(user(userDetails)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].title").value("Test Title"));
    }

    @Test
    @DisplayName("GET /api/v1/notifications/unread-count - Lấy số lượng chưa đọc")
    void getUnreadCount_ReturnsSuccess() throws Exception {
        when(notificationService.getUnreadCount(2L)).thenReturn(3L);

        mockMvc.perform(get("/api/v1/notifications/unread-count").with(user(userDetails)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value(3));
    }

    @Test
    @DisplayName("PUT /api/v1/notifications/{id}/read - Đánh dấu đã đọc")
    void markAsRead_ReturnsSuccess() throws Exception {
        mockMvc.perform(put("/api/v1/notifications/1/read").with(user(userDetails)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("PUT /api/v1/notifications/read-all - Đánh dấu tất cả đã đọc")
    void markAllAsRead_ReturnsSuccess() throws Exception {
        mockMvc.perform(put("/api/v1/notifications/read-all").with(user(userDetails)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("POST /api/v1/notifications/test-send - Gửi thông báo test")
    void testSend_ReturnsSuccess() throws Exception {
        NotificationDto dto = new NotificationDto(99L, 99L, 2L, "Demo Title", "Demo Content", "GENERAL", 123L, false, Instant.now());
        when(notificationService.sendNotification(any(), any(), any(), any(), any())).thenReturn(dto);

        Map<String, Object> req = Map.of(
                "userId", 2,
                "title", "Demo Title",
                "content", "Demo Content"
        );

        mockMvc.perform(post("/api/v1/notifications/test-send")
                        .with(user(userDetails))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(99));
    }
}
