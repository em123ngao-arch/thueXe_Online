package com.driveshare.modules.oauth2.domain.model;

import java.util.List;

public record OAuth2AccountDto(
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
