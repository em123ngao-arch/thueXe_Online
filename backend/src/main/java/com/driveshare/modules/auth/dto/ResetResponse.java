package com.driveshare.modules.auth.dto;
import lombok.*;
@Getter @Builder @AllArgsConstructor @NoArgsConstructor
public class ResetResponse { private String message; private String resetUrl; }
