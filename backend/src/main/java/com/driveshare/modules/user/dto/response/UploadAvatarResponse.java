package com.driveshare.modules.user.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadAvatarResponse {

    @JsonProperty("avatarUrl")
    private String avatarUrl;
}
