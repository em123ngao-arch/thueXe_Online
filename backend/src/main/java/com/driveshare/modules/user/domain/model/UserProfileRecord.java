package com.driveshare.modules.user.domain.model;

import com.driveshare.common.enums.EAuthProvider;
import com.driveshare.common.enums.EUserStatus;
import lombok.*;

import java.time.Instant;
import java.util.Set;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileRecord {
    private Long userId;
    private String username;
    private String email;
    private String phone;
    private String fullName;
    private String avatarUrl;
    private String address;
    private String idCardNumber;
    private Boolean emailVerified;
    private EUserStatus status;
    private EAuthProvider authProvider;
    private Set<String> roles;
    private Instant createdAt;
}

