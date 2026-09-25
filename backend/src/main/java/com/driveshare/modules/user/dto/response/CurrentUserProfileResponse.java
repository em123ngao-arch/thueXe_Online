package com.driveshare.modules.user.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CurrentUserProfileResponse {

    @JsonProperty("userId")
    private Long userId;

    @JsonProperty("user_id")
    public Long getUserIdSnakeCase() {
        return userId;
    }

    @JsonProperty("username")
    private String username;

    @JsonProperty("email")
    private String email;

    @JsonProperty("fullName")
    private String fullName;

    @JsonProperty("phoneNumber")
    private String phoneNumber;

    @JsonProperty("address")
    private String address;

    @JsonProperty("avatarUrl")
    private String avatarUrl;

    @JsonProperty("role")
    private String role;

    @JsonProperty("status")
    private String status;

    @JsonProperty("verificationStatus")
    private String verificationStatus;

    @JsonProperty("profile")
    private SubProfileDetail profile;

    @JsonProperty("lockedFields")
    private List<String> lockedFields;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SubProfileDetail {
        // RENTER fields
        @JsonProperty("licenseNumber")
        private String licenseNumber;

        @JsonProperty("licenseImageUrl")
        private String licenseImageUrl;

        // OWNER fields
        @JsonProperty("bankName")
        private String bankName;

        @JsonProperty("bankAccountNumber")
        private String bankAccountNumber;
    }
}
