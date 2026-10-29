package com.driveshare.modules.notification;

import com.driveshare.modules.auth.entity.AuthSession;
import com.driveshare.modules.auth.repository.AuthSessionRepository;
import com.driveshare.modules.notification.websocket.WebSocketAuthInterceptor;
import com.driveshare.security.CustomUserDetails;
import com.driveshare.security.CustomUserDetailsService;
import com.driveshare.security.JwtTokenProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WebSocketAuthInterceptorTest {

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private CustomUserDetailsService userDetailsService;

    @Mock
    private AuthSessionRepository sessionRepository;

    @Mock
    private MessageChannel messageChannel;

    @InjectMocks
    private WebSocketAuthInterceptor authInterceptor;

    @Test
    @DisplayName("STOMP CONNECT với JWT hợp lệ: Xác thực thành công và gắn Principal")
    void preSend_ValidJwt_AuthenticatesSuccessfully() {
        String token = "valid.jwt.token";
        String jti = "jwt-session-uuid";
        Long userId = 2L;
        String username = "owner_test";
        Long tokenVersion = 1L;

        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setLeaveMutable(true);
        accessor.setNativeHeader("Authorization", "Bearer " + token);
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        when(tokenProvider.validateToken(token)).thenReturn(true);
        when(tokenProvider.getJtiFromToken(token)).thenReturn(jti);
        when(tokenProvider.getTokenVersionFromToken(token)).thenReturn(tokenVersion);
        when(tokenProvider.getUsernameFromToken(token)).thenReturn(username);
        when(tokenProvider.getUserIdFromToken(token)).thenReturn(userId);

        AuthSession session = AuthSession.builder()
                .jti(jti)
                .userId(userId)
                .tokenVersion(tokenVersion)
                .expiresAt(java.time.Instant.now().plusSeconds(3600))
                .revokedAt(null)
                .build();
        when(sessionRepository.findByJti(jti)).thenReturn(Optional.of(session));

        CustomUserDetails userDetails = new CustomUserDetails(
                userId, username, "owner@test.com", "hash",
                com.driveshare.common.enums.EUserStatus.ACTIVE,
                List.of(new SimpleGrantedAuthority("ROLE_OWNER"))
        );
        when(userDetailsService.loadUserByUsername(username)).thenReturn(userDetails);

        Message<?> result = authInterceptor.preSend(message, messageChannel);

        assertThat(result).isNotNull();
        StompHeaderAccessor resAccessor = StompHeaderAccessor.wrap(result);
        assertThat(resAccessor.getUser()).isNotNull();
        assertThat(resAccessor.getUser().getName()).isEqualTo(userId.toString());
    }

    @Test
    @DisplayName("STOMP CONNECT không có token: Giữ nguyên message không có user")
    void preSend_NoToken_NoUserSet() {
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        Message<?> result = authInterceptor.preSend(message, messageChannel);

        assertThat(result).isNotNull();
        StompHeaderAccessor resAccessor = StompHeaderAccessor.wrap(result);
        assertThat(resAccessor.getUser()).isNull();
    }
}
