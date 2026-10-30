package com.driveshare.modules.oauth2.application.usecase;

import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.auth.dto.AuthResponse;
import com.driveshare.modules.oauth2.application.port.in.OAuth2UseCase;
import com.driveshare.modules.oauth2.application.port.out.OAuth2AccountPort;
import com.driveshare.modules.oauth2.application.port.out.OAuth2TokenPort;
import com.driveshare.modules.oauth2.domain.model.OAuth2AccountDto;
import com.driveshare.modules.oauth2.domain.model.OAuth2LoginResult;
import com.driveshare.modules.oauth2.domain.model.OAuth2UserRecord;
import com.driveshare.modules.oauth2.domain.policy.OAuth2Policy;
import com.driveshare.modules.oauth2.dto.CompleteRegistrationRequest;
import com.driveshare.modules.oauth2.service.OAuth2Service;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class OAuth2UseCaseImpl implements OAuth2UseCase, OAuth2Service {

    private final OAuth2AccountPort accountPort;
    private final OAuth2TokenPort tokenPort;

    @Override
    public String createTempGoogleToken(String googleId, String email, String name, String picture) {
        return tokenPort.createTempGoogleToken(googleId, email, name, picture);
    }

    @Override
    public Claims parseTempGoogleToken(String tempToken) {
        return tokenPort.parseTempGoogleToken(tempToken);
    }

    @Override
    public OAuth2LoginResult processOAuth2Login(String googleId, String email, String name, String picture) {
        Optional<OAuth2AccountDto> existingAccountOpt = accountPort.findByEmail(email);

        if (existingAccountOpt.isPresent()) {
            OAuth2AccountDto existingAccount = existingAccountOpt.get();

            if ("LOCAL".equalsIgnoreCase(existingAccount.authProvider())) {
                log.warn("Email {} đã đăng ký bằng tài khoản Local, từ chối đăng nhập Google", email);
                return OAuth2LoginResult.localConflict("Email này đã được đăng ký bằng mật khẩu. Vui lòng đăng nhập bằng mật khẩu!");
            }

            String accessToken = tokenPort.generateAccessToken(existingAccount);
            Claims claims = tokenPort.getClaims(accessToken);
            accountPort.saveAuthSession(
                    claims.getId(),
                    existingAccount.userId(),
                    existingAccount.tokenVersion(),
                    claims.getExpiration().toInstant()
            );

            return OAuth2LoginResult.existingUser(accessToken);
        } else {
            String tempToken = tokenPort.createTempGoogleToken(googleId, email, name, picture);
            return OAuth2LoginResult.newUser(tempToken);
        }
    }

    @Override
    @Transactional
    public AuthResponse completeRegistration(CompleteRegistrationRequest request) {
        Claims claims = parseTempGoogleToken(request.getGoogleToken());
        String googleId = claims.get("googleId", String.class);
        String email = claims.get("email", String.class);
        String name = claims.get("name", String.class);
        String picture = claims.get("picture", String.class);

        Optional<OAuth2AccountDto> existingOpt = accountPort.findByEmail(email);
        if (existingOpt.isPresent()) {
            OAuth2AccountDto existingAccount = existingOpt.get();
            if ("LOCAL".equalsIgnoreCase(existingAccount.authProvider())) {
                throw new AppException(ErrorCode.EMAIL_EXISTED, "Email này đã được đăng ký bằng mật khẩu. Vui lòng đăng nhập bằng mật khẩu!");
            }

            String accessToken = tokenPort.generateAccessToken(existingAccount);
            String refreshToken = tokenPort.generateRefreshToken(existingAccount);

            Claims accessClaims = tokenPort.getClaims(accessToken);
            accountPort.saveAuthSession(
                    accessClaims.getId(),
                    existingAccount.userId(),
                    existingAccount.tokenVersion(),
                    accessClaims.getExpiration().toInstant()
            );

            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .tokenType("Bearer")
                    .userId(existingAccount.userId())
                    .username(existingAccount.username())
                    .email(existingAccount.email())
                    .roles(existingAccount.roles())
                    .build();
        }

        String targetRole = OAuth2Policy.normalizeRole(request.getRole());
        String baseUsername = OAuth2Policy.generateBaseUsername(email);
        String uniqueUsername = baseUsername;
        int counter = 1;
        while (accountPort.existsByUsername(uniqueUsername)) {
            uniqueUsername = baseUsername + "_" + counter++;
        }

        OAuth2UserRecord userRecord = new OAuth2UserRecord(googleId, email, name, picture);
        OAuth2AccountDto savedAccount = accountPort.createGoogleUser(userRecord, uniqueUsername, targetRole);

        String accessToken = tokenPort.generateAccessToken(savedAccount);
        String refreshToken = tokenPort.generateRefreshToken(savedAccount);

        Claims accessClaims = tokenPort.getClaims(accessToken);
        accountPort.saveAuthSession(
                accessClaims.getId(),
                savedAccount.userId(),
                savedAccount.tokenVersion(),
                accessClaims.getExpiration().toInstant()
        );

        log.info("Google OAuth2 user registered successfully: userId={}, email={}, role={}",
                savedAccount.userId(), savedAccount.email(), targetRole);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(savedAccount.userId())
                .username(savedAccount.username())
                .email(savedAccount.email())
                .roles(List.of(targetRole))
                .build();
    }
}

