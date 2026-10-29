package com.driveshare.modules.auth.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResetTokenResponse {
    private String resetToken;
    private Long expiresInSeconds;
}

