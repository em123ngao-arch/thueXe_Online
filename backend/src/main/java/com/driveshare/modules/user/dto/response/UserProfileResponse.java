package com.driveshare.modules.user.dto.response;

import com.driveshare.common.enums.EUserStatus;
import lombok.*;

import java.time.Instant;
import java.util.Set;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    private Long userId;
    private String username;
    private String email;
    private String phone;
    private String fullName;
    private String avatarUrl;
    private String idCardNumber;
    private EUserStatus status;
    private Set<String> roles;
    private OwnerProfileResponse ownerProfile;
    private RenterProfileResponse renterProfile;
    private Instant createdAt;
    private Instant updatedAt;
    private Long updatedBy;
}
