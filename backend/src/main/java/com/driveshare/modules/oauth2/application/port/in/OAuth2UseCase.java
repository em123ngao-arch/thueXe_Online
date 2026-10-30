package com.driveshare.modules.oauth2.application.port.in;

import com.driveshare.modules.auth.dto.AuthResponse;
import com.driveshare.modules.oauth2.domain.model.OAuth2LoginResult;
import com.driveshare.modules.oauth2.dto.CompleteRegistrationRequest;
import io.jsonwebtoken.Claims;

public interface OAuth2UseCase {

    String createTempGoogleToken(String googleId, String email, String name, String picture);

    Claims parseTempGoogleToken(String tempToken);

    AuthResponse completeRegistration(CompleteRegistrationRequest request);

    OAuth2LoginResult processOAuth2Login(String googleId, String email, String name, String picture);
}

