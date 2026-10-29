package com.driveshare.config;

import com.driveshare.modules.notification.websocket.AuthHandshakeInterceptor;
import com.driveshare.modules.notification.websocket.WebSocketAuthInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Cấu hình WebSocket STOMP Message Broker cho hệ thống DriveShare (Task 57).
 * <p>
 * Broker quản lý các destination:
 * <ul>
 *   <li>{@code /topic}: Thông báo broadcast công khai hoặc theo nhóm</li>
 *   <li>{@code /queue}: Tin nhắn định tuyến cá nhân hóa cho từng người dùng</li>
 *   <li>{@code /app}: Prefix nhận lệnh gửi từ Client lên Application Controller</li>
 *   <li>{@code /user}: Prefix tự động ánh xạ đến user-specific session</li>
 * </ul>
 */
@Configuration
@EnableWebSocketMessageBroker
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthInterceptor authInterceptor;
    private final AuthHandshakeInterceptor handshakeInterceptor;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Kích hoạt In-Memory Simple Broker cho topic (broadcast) và queue (hàng đợi cá nhân)
        registry.enableSimpleBroker("/topic", "/queue");
        // Prefix cho các message gửi từ STOMP client lên server
        registry.setApplicationDestinationPrefixes("/app");
        // Prefix định tuyến riêng cho từng user
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint WebSocket chuẩn cho Web & Mobile client
        registry.addEndpoint("/ws")
                .addInterceptors(handshakeInterceptor)
                .setAllowedOriginPatterns("*");

        // Endpoint WebSocket hỗ trợ SockJS fallback
        registry.addEndpoint("/ws")
                .addInterceptors(handshakeInterceptor)
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(authInterceptor);
    }
}

