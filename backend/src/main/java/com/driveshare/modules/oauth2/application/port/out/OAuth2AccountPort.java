package com.driveshare.modules.oauth2.application.port.out;

import com.driveshare.modules.oauth2.domain.model.OAuth2AccountRecord;
import com.driveshare.modules.oauth2.domain.model.OAuth2UserRecord;

import java.time.Instant;
import java.util.Optional;

public interface OAuth2AccountPort {

    Optional<OAuth2AccountRecord> findByEmail(String email);

    boolean existsByUsername(String username);

    OAuth2AccountRecord createGoogleUser(OAuth2UserRecord record, String username, String roleName);

    void saveAuthSession(String jti, Long userId, Long tokenVersion, Instant expiresAt);
}
