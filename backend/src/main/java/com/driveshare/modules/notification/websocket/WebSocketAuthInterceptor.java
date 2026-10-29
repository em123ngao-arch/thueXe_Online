package com.driveshare.modules.notification.websocket;

import com.driveshare.modules.auth.repository.AuthSessionRepository;
import com.driveshare.security.CustomUserDetailsService;
import com.driveshare.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * ChannelInterceptor xác thực JWT cho các kết nối STOMP qua WebSocket (Task 57).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService userDetailsService;
    private final AuthSessionRepository sessionRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            authenticateStomp(accessor);
        }
        return message;
    }

    private void authenticateStomp(StompHeaderAccessor accessor) {
        String token = resolveToken(accessor);
        if (StringUtils.hasText(token) && tokenProvider.validateToken(token)) {
            try {
                String jti = tokenProvider.getJtiFromToken(token);
                Long tokenVersion = tokenProvider.getTokenVersionFromToken(token);
                var session = sessionRepository.findByJti(jti).orElse(null);
                if (session == null || (session.isActive() && tokenVersion != null && session.getTokenVersion() == tokenVersion)) {
                    String username = tokenProvider.getUsernameFromToken(token);
                    Long userId = tokenProvider.getUserIdFromToken(token);
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                    // Khởi tạo StompPrincipal với principal name là userId (dạng chuỗi)
                    // để tương thích hoàn hảo với SimpMessagingTemplate.convertAndSendToUser(userId.toString(), ...)
                    String principalName = userId != null ? userId.toString() : username;
                    StompPrincipal principal = new StompPrincipal(principalName, userId, userDetails);
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            principal, null, userDetails.getAuthorities()
                    );
                    accessor.setUser(auth);
                    log.info("WebSocket STOMP xác thực JWT thành công: userId={}, username={}", userId, username);
                } else {
                    log.warn("WebSocket STOMP: Phiên đăng nhập jti={} không hợp lệ hoặc đã bị vô hiệu hóa", jti);
                }
            } catch (Exception e) {
                log.error("WebSocket STOMP: Lỗi xác thực JWT: {}", e.getMessage());
            }
        } else {
            log.debug("WebSocket STOMP: Kết nối không kèm JWT token hợp lệ");
        }
    }

    private String resolveToken(StompHeaderAccessor accessor) {
        // 1. STOMP Native headers
        String bearer = accessor.getFirstNativeHeader("Authorization");
        if (!StringUtils.hasText(bearer)) {
            bearer = accessor.getFirstNativeHeader("authorization");
        }
        if (!StringUtils.hasText(bearer)) {
            bearer = accessor.getFirstNativeHeader("token");
        }
        if (!StringUtils.hasText(bearer)) {
            bearer = accessor.getPasscode();
        }
        if (StringUtils.hasText(bearer)) {
            if (bearer.startsWith("Bearer ") || bearer.startsWith("bearer ")) {
                return bearer.substring(7).trim();
            }
            return bearer.trim();
        }

        // 2. Thuộc tính phiên bắt tay (từ AuthHandshakeInterceptor)
        if (accessor.getSessionAttributes() != null) {
            Object attr = accessor.getSessionAttributes().get(AuthHandshakeInterceptor.ATTR_TOKEN);
            if (attr != null && StringUtils.hasText(attr.toString())) {
                return attr.toString().trim();
            }
        }
        return null;
    }
}
