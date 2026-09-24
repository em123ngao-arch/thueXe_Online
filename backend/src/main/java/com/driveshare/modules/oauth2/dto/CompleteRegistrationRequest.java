package com.driveshare.modules.oauth2.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CompleteRegistrationRequest {
    @NotBlank(message = "google_token is required")
    @JsonProperty("google_token")
    @JsonAlias({"googleToken", "google_token"})
    private String googleToken;

    @NotBlank(message = "role is required")
    private String role; // "RENTER" or "OWNER"
}
