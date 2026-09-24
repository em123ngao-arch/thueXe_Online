package com.driveshare.modules.oauth2.service;

import com.driveshare.modules.auth.dto.AuthResponse;
import com.driveshare.modules.oauth2.dto.CompleteRegistrationRequest;
import io.jsonwebtoken.Claims;

public interface OAuth2Service {

    String createTempGoogleToken(String googleId, String email, String name, String picture);

    Claims parseTempGoogleToken(String tempToken);

    AuthResponse completeRegistration(CompleteRegistrationRequest request);
}
