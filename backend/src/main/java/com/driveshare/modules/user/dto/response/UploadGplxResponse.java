package com.driveshare.modules.user.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadGplxResponse {

    @JsonProperty("licenseImageUrl")
    private String licenseImageUrl;

    @JsonProperty("verificationStatus")
    private String verificationStatus;
}
