package com.driveshare.modules.user.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadCccdResponse {

    @JsonProperty("frontImageUrl")
    private String frontImageUrl;

    @JsonProperty("backImageUrl")
    private String backImageUrl;

    @JsonProperty("verificationStatus")
    private String verificationStatus;
}
