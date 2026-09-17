package com.driveshare.modules.auth.dto;
import lombok.*;
import java.util.List;
@Getter @Builder @AllArgsConstructor @NoArgsConstructor
public class AuthResponse { private String accessToken; private String refreshToken; private String tokenType; private Long userId; private String username; private String email; private List<String> roles; }
