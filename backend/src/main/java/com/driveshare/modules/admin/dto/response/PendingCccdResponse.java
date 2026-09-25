package com.driveshare.modules.admin.dto.response;

import lombok.*;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingCccdResponse {
    private Long userId;
    private String fullName;
    private String email;
    private String phone;
    private String role;
    private String cccdFrontUrl;
    private String cccdBackUrl;
    private Instant submittedAt;
}
