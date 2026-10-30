package com.driveshare.modules.user.adapter.out.persistence;

import com.driveshare.modules.user.application.port.out.UserPersistencePort;
import com.driveshare.modules.user.domain.model.OwnerProfileRecord;
import com.driveshare.modules.user.domain.model.RenterProfileRecord;
import com.driveshare.modules.user.domain.model.UserProfileRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class UserPersistenceAdapter implements UserPersistencePort {

    private final UserJpaRepository userRepository;
    private final OwnerProfileJpaRepository ownerProfileRepository;
    private final RenterProfileJpaRepository renterProfileRepository;

    @Override
    public Optional<UserProfileRecord> findUserById(Long userId) {
        return userRepository.findById(userId).map(u -> UserProfileRecord.builder()
                .userId(u.getUserId())
                .username(u.getUsername())
                .email(u.getEmail())
                .phone(u.getPhone())
                .fullName(u.getFullName())
                .avatarUrl(u.getAvatarUrl())
                .address(u.getAddress())
                .idCardNumber(u.getIdCardNumber())
                .emailVerified(u.getEmailVerified())
                .status(u.getStatus())
                .authProvider(u.getAuthProvider())
                .roles(u.getRoles().stream().map(r -> r.getRoleName().name()).collect(Collectors.toSet()))
                .createdAt(u.getCreatedAt())
                .build());
    }

    @Override
    public Optional<OwnerProfileRecord> findOwnerProfileById(Long userId) {
        return ownerProfileRepository.findById(userId).map(p -> OwnerProfileRecord.builder()
                .userId(p.getUserId())
                .idCardFrontUrl(p.getIdCardFrontUrl())
                .idCardBackUrl(p.getIdCardBackUrl())
                .bankAccountNumber(p.getBankAccountNumber())
                .bankName(p.getBankName())
                .verificationStatus(p.getVerificationStatus())
                .verifiedBy(p.getVerifiedBy())
                .verifiedAt(p.getVerifiedAt())
                .build());
    }

    @Override
    public Optional<RenterProfileRecord> findRenterProfileById(Long userId) {
        return renterProfileRepository.findById(userId).map(p -> RenterProfileRecord.builder()
                .userId(p.getUserId())
                .licenseNumber(p.getLicenseNumber())
                .licenseFullName(p.getLicenseFullName())
                .licenseDob(p.getLicenseDob())
                .licenseIssueDate(p.getLicenseIssueDate())
                .licenseExpiryDate(p.getLicenseExpiryDate())
                .licenseFrontUrl(p.getLicenseFrontUrl())
                .licenseBackUrl(p.getLicenseBackUrl())
                .idCardFrontUrl(p.getIdCardFrontUrl())
                .idCardBackUrl(p.getIdCardBackUrl())
                .verificationStatus(p.getVerificationStatus())
                .licenseVerificationStatus(p.getLicenseVerificationStatus())
                .build());
    }
}

