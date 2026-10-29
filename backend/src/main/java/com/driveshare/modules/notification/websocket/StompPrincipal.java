package com.driveshare.modules.notification.websocket;

import lombok.Getter;
import org.springframework.security.core.userdetails.UserDetails;

import java.security.Principal;

/**
 * Principal đại diện cho một kết nối WebSocket STOMP đã xác thực thành công.
 * {@link #getName()} trả về chuỗi định danh (thường là userId hoặc username)
 * dùng để định tuyến tin nhắn qua SimpMessagingTemplate.convertAndSendToUser.
 */
@Getter
public class StompPrincipal implements Principal {

    private final String name;
    private final Long userId;
    private final UserDetails userDetails;

    public StompPrincipal(String name, Long userId, UserDetails userDetails) {
        this.name = name;
        this.userId = userId;
        this.userDetails = userDetails;
    }

    @Override
    public String getName() {
        return name;
    }
}

