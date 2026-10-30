package com.driveshare.modules.oauth2.domain.model;

public record OAuth2UserRecord(
        String googleId,
        String email,
        String name,
        String picture
) {
}

