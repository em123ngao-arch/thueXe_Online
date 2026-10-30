package com.driveshare.modules.oauth2.adapter.out.persistence;

import com.driveshare.common.enums.EAuthProvider;
import com.driveshare.common.enums.ERole;
import com.driveshare.common.enums.EUserStatus;
import com.driveshare.common.enums.EVerificationStatus;
import com.driveshare.modules.auth.adapter.out.persistence.AuthSessionJpaEntity;
import com.driveshare.modules.auth.repository.AuthSessionRepository;
import com.driveshare.modules.oauth2.application.port.out.OAuth2AccountPort;
import com.driveshare.modules.oauth2.domain.model.OAuth2AccountDto;
import com.driveshare.modules.oauth2.domain.model.OAuth2UserRecord;
import com.driveshare.modules.user.adapter.out.persistence.OwnerProfile;
import com.driveshare.modules.user.adapter.out.persistence.RenterProfile;
import com.driveshare.modules.user.adapter.out.persistence.Role;
import com.driveshare.modules.user.adapter.out.persistence.User;
import com.driveshare.modules.user.repository.OwnerProfileRepository;
import com.driveshare.modules.user.repository.RenterProfileRepository;
import com.driveshare.modules.user.repository.RoleRepository;
import com.driveshare.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OAuth2AccountPersistenceAdapter implements OAuth2AccountPort {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OwnerProfileRepository ownerProfileRepository;
    private final RenterProfileRepository renterProfileRepository;
    private final AuthSessionRepository authSessionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public Optional<OAuth2AccountDto> findByEmail(String email) {
        return userRepository.findByEmail(email).map(this::toAccountDto);
    }

    @Override
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    @Override
    public OAuth2AccountDto createGoogleUser(OAuth2UserRecord record, String username, String roleName) {
        ERole targetRole = "ROLE_OWNER".equalsIgnoreCase(roleName) || "OWNER".equalsIgnoreCase(roleName)
                ? ERole.ROLE_OWNER : ERole.ROLE_RENTER;
        EUserStatus targetStatus = targetRole == ERole.ROLE_OWNER ? EUserStatus.PENDING : EUserStatus.ACTIVE;

        Role role = roleRepository.findByRoleName(targetRole)
                .orElseGet(() -> roleRepository.save(Role.builder().roleName(targetRole).build()));

        User newUser = User.builder()
                .username(username)
                .email(record.email())
                .fullName(record.name() != null ? record.name() : username)
                .avatarUrl(record.picture())
                .googleId(record.googleId())
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

        return toAccountDto(savedUser);
    }

    @Override
    public void saveAuthSession(String jti, Long userId, Long tokenVersion, Instant expiresAt) {
        authSessionRepository.save(AuthSessionJpaEntity.builder()
                .jti(jti)
                .userId(userId)
                .tokenVersion(tokenVersion != null ? tokenVersion : 0L)
                .expiresAt(expiresAt)
                .build());
    }

    private OAuth2AccountDto toAccountDto(User user) {
        return new OAuth2AccountDto(
                user.getUserId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getAvatarUrl(),
                user.getAuthProvider() != null ? user.getAuthProvider().name() : "LOCAL",
                user.getTokenVersion(),
                user.getRoles().stream().map(r -> r.getRoleName().name()).toList()
        );
    }
}
