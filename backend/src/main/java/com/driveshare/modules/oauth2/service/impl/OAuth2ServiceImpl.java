package com.driveshare.modules.oauth2.service.impl;

import com.driveshare.common.enums.EAuthProvider;
import com.driveshare.common.enums.ERole;
import com.driveshare.common.enums.EUserStatus;
import com.driveshare.common.enums.EVerificationStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.auth.dto.AuthResponse;
import com.driveshare.modules.oauth2.dto.CompleteRegistrationRequest;
import com.driveshare.modules.oauth2.service.OAuth2Service;
import com.driveshare.modules.user.entity.OwnerProfile;
import com.driveshare.modules.user.entity.RenterProfile;
import com.driveshare.modules.user.entity.Role;
import com.driveshare.modules.user.entity.User;
import com.driveshare.modules.user.repository.OwnerProfileRepository;
import com.driveshare.modules.user.repository.RenterProfileRepository;
import com.driveshare.modules.user.repository.RoleRepository;
import com.driveshare.modules.user.repository.UserRepository;
import com.driveshare.security.CustomUserDetails;
import com.driveshare.security.JwtTokenProvider;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.SecretKey;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class OAuth2ServiceImpl implements OAuth2Service {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OwnerProfileRepository ownerProfileRepository;
    private final RenterProfileRepository renterProfileRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final com.driveshare.modules.auth.repository.AuthSessionRepository authSessionRepository;

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
    @Transactional
    public AuthResponse completeRegistration(CompleteRegistrationRequest request) {
        Claims claims = parseTempGoogleToken(request.getGoogleToken());
        String googleId = claims.get("googleId", String.class);
        String email = claims.get("email", String.class);
        String name = claims.get("name", String.class);
        String picture = claims.get("picture", String.class);

        // Kiểm tra email đã tồn tại với LOCAL
        Optional<User> existingUserOpt = userRepository.findByEmail(email);
        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();
            if (existingUser.getAuthProvider() == EAuthProvider.LOCAL) {
                throw new AppException(ErrorCode.EMAIL_EXISTED, "Email này đã được đăng ký bằng mật khẩu. Vui lòng đăng nhập bằng mật khẩu!");
            }
            // Đã tồn tại bằng GOOGLE -> Trả token đăng nhập
            CustomUserDetails userDetails = CustomUserDetails.build(existingUser);
            String accessToken = jwtTokenProvider.generateAccessToken(userDetails);
            String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

            // Lưu session vào DB để JwtAuthenticationFilter xác thực được
            io.jsonwebtoken.Claims accessClaims = jwtTokenProvider.getClaims(accessToken);
            authSessionRepository.save(com.driveshare.modules.auth.entity.AuthSession.builder()
                    .jti(accessClaims.getId())
                    .userId(existingUser.getUserId())
                    .tokenVersion(existingUser.getTokenVersion())
                    .expiresAt(accessClaims.getExpiration().toInstant())
                    .build());

            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .tokenType("Bearer")
                    .userId(existingUser.getUserId())
                    .username(existingUser.getUsername())
                    .email(existingUser.getEmail())
                    .roles(existingUser.getRoles().stream().map(r -> r.getRoleName().name()).toList())
                    .build();
        }

        // Tạo tài khoản mới
        String selectedRole = request.getRole() != null ? request.getRole().trim().toUpperCase() : "RENTER";
        ERole targetRole = "OWNER".equals(selectedRole) ? ERole.ROLE_OWNER : ERole.ROLE_RENTER;
        EUserStatus targetStatus = "OWNER".equals(selectedRole) ? EUserStatus.PENDING : EUserStatus.ACTIVE;

        Role role = roleRepository.findByRoleName(targetRole)
                .orElseGet(() -> roleRepository.save(Role.builder().roleName(targetRole).build()));

        // Sinh username duy nhất từ email
        String baseUsername = email.contains("@") ? email.substring(0, email.indexOf("@")) : "google_user";
        String uniqueUsername = baseUsername;
        int counter = 1;
        while (userRepository.existsByUsername(uniqueUsername)) {
            uniqueUsername = baseUsername + "_" + counter++;
        }

        User newUser = User.builder()
                .username(uniqueUsername)
                .email(email)
                .fullName(name != null ? name : uniqueUsername)
                .avatarUrl(picture)
                .googleId(googleId)
                .authProvider(EAuthProvider.GOOGLE)
                .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                .status(targetStatus)
                .roles(new HashSet<>(Set.of(role)))
                .build();

        User savedUser = userRepository.save(newUser);

        if (targetRole == ERole.ROLE_OWNER) {
            OwnerProfile ownerProfile = OwnerProfile.builder()
                    .user(savedUser)
                    .verificationStatus(EVerificationStatus.PENDING)
                    .build();
            ownerProfileRepository.save(ownerProfile);
        } else {
            RenterProfile renterProfile = RenterProfile.builder()
                    .user(savedUser)
                    .verificationStatus(EVerificationStatus.PENDING)
                    .licenseVerificationStatus(EVerificationStatus.PENDING)
                    .build();
            renterProfileRepository.save(renterProfile);
        }

        CustomUserDetails userDetails = CustomUserDetails.build(savedUser);
        String accessToken = jwtTokenProvider.generateAccessToken(userDetails);
        String refreshToken = jwtTokenProvider.generateRefreshToken(userDetails);

        // Lưu session vào DB để JwtAuthenticationFilter xác thực được
        io.jsonwebtoken.Claims newAccessClaims = jwtTokenProvider.getClaims(accessToken);
        authSessionRepository.save(com.driveshare.modules.auth.entity.AuthSession.builder()
                .jti(newAccessClaims.getId())
                .userId(savedUser.getUserId())
                .tokenVersion(savedUser.getTokenVersion())
                .expiresAt(newAccessClaims.getExpiration().toInstant())
                .build());

        log.info("Google OAuth2 user registered successfully: userId={}, email={}, role={}",
                savedUser.getUserId(), savedUser.getEmail(), targetRole);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(savedUser.getUserId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .roles(List.of(targetRole.name()))
                .build();
    }
}
