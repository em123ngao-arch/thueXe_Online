package com.driveshare.modules.oauth2.adapter.out.security;

import com.driveshare.common.enums.EUserStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.oauth2.application.port.out.OAuth2TokenPort;
import com.driveshare.modules.oauth2.domain.model.OAuth2AccountRecord;
import com.driveshare.security.CustomUserDetails;
import com.driveshare.security.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2TokenAdapter implements OAuth2TokenPort {

    private final JwtTokenProvider jwtTokenProvider;

    @Value("${driveshare.jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}")
    private String jwtSecret;

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    @Override
    public String createTempGoogleToken(String googleId, String email, String name, String picture) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + 15 * 60 * 1000L); // 15 phút

        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject("GOOGLE_TEMP_REGISTRATION")
                .claim("googleId", googleId)
                .claim("email", email)
                .claim("name", name)
                .claim("picture", picture)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    @Override
    public Claims parseTempGoogleToken(String tempToken) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(tempToken)
                    .getPayload();
        } catch (Exception e) {
            log.warn("Invalid or expired temp Google token: {}", e.getMessage());
            throw new AppException(ErrorCode.TOKEN_INVALID, "Google token không hợp lệ hoặc đã hết hạn.");
        }
    }

    @Override
    public String generateAccessToken(OAuth2AccountRecord account) {
        CustomUserDetails userDetails = toUserDetails(account);
        return jwtTokenProvider.generateAccessToken(userDetails);
    }

    @Override
    public String generateRefreshToken(OAuth2AccountRecord account) {
        CustomUserDetails userDetails = toUserDetails(account);
        return jwtTokenProvider.generateRefreshToken(userDetails);
    }

    @Override
    public Claims getClaims(String token) {
        return jwtTokenProvider.getClaims(token);
    }

    private CustomUserDetails toUserDetails(OAuth2AccountRecord account) {
        List<SimpleGrantedAuthority> authorities = account.roles().stream()
                .map(SimpleGrantedAuthority::new)
                .toList();

        return new CustomUserDetails(
                account.userId(),
                account.username(),
                account.email(),
                "",
                EUserStatus.ACTIVE,
                authorities,
                account.tokenVersion() != null ? account.tokenVersion() : 0L
        );
    }
}
