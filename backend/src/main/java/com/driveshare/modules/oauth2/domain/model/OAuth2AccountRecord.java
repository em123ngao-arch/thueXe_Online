package com.driveshare.modules.oauth2.domain.model;

import java.util.List;

/**
 * Domain record representing an OAuth2 account.
 */
public record OAuth2AccountRecord(
        Long userId,
        String username,
        String email,
        String fullName,
        String avatarUrl,
        String authProvider,
        Long tokenVersion,
        List<String> roles
) {
}

