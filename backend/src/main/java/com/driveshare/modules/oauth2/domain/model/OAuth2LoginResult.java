package com.driveshare.modules.oauth2.domain.model;

public record OAuth2LoginResult(
        boolean isNewUser,
        boolean isLocalConflict,
        String token,
        String errorMessage
) {
    public static OAuth2LoginResult localConflict(String message) {
        return new OAuth2LoginResult(false, true, null, message);
    }

    public static OAuth2LoginResult existingUser(String accessToken) {
        return new OAuth2LoginResult(false, false, accessToken, null);
    }

    public static OAuth2LoginResult newUser(String tempToken) {
        return new OAuth2LoginResult(true, false, tempToken, null);
    }
}

