package com.driveshare.modules.oauth2.application.port.out;

import com.driveshare.modules.oauth2.domain.model.OAuth2AccountDto;
import io.jsonwebtoken.Claims;

public interface OAuth2TokenPort {

    String createTempGoogleToken(String googleId, String email, String name, String picture);

    Claims parseTempGoogleToken(String tempToken);

    String generateAccessToken(OAuth2AccountDto account);

    String generateRefreshToken(OAuth2AccountDto account);

    Claims getClaims(String token);
}

