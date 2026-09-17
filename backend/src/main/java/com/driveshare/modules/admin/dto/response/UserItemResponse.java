package com.driveshare.modules.admin.dto.response;

import com.driveshare.common.enums.EUserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserItemResponse {
    private Long userId;
    private String username;
    private String email;
    private String phone;
    private String fullName;
    private String avatarUrl;
    private String idCardNumber;
    private EUserStatus status;
    private Set<String> roles;
    private Instant createdAt;
    private OwnerProfileSummaryResponse ownerProfile;
    private RenterProfileSummaryResponse renterProfile;
}
