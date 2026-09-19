package com.driveshare.modules.user.service.impl;

import com.driveshare.common.enums.EVerificationStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.user.dto.request.OwnerProfileUpdateRequest;
import com.driveshare.modules.user.dto.request.RenterProfileUpdateRequest;
import com.driveshare.modules.user.dto.response.OwnerProfileResponse;
import com.driveshare.modules.user.dto.response.RenterProfileResponse;
import com.driveshare.modules.user.dto.response.UserProfileResponse;
import com.driveshare.modules.user.entity.OwnerProfile;
import com.driveshare.modules.user.entity.RenterProfile;
import com.driveshare.modules.user.entity.User;
import com.driveshare.modules.user.repository.OwnerProfileRepository;
import com.driveshare.modules.user.repository.RenterProfileRepository;
import com.driveshare.modules.user.repository.UserRepository;
import com.driveshare.modules.user.service.UserProfileService;
import com.driveshare.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserProfileServiceImpl implements UserProfileService {

    private final UserRepository userRepository;
    private final OwnerProfileRepository ownerProfileRepository;
    private final RenterProfileRepository renterProfileRepository;

    @Override
    @Transactional
    public OwnerProfileResponse updateOwnerProfile(Long targetUserId, OwnerProfileUpdateRequest request, CustomUserDetails currentUser) {
        validatePermission(targetUserId, currentUser);

        User user = getUserOrThrow(targetUserId);

        // Validate unique phone & idCardNumber if changed
        validateUniqueUserFields(user, request.getPhone(), request.getIdCardNumber());

        // Update basic user info
        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl());
        if (request.getIdCardNumber() != null) user.setIdCardNumber(request.getIdCardNumber());

        // Update or create owner profile
        OwnerProfile ownerProfile = ownerProfileRepository.findById(user.getUserId())
                .orElseGet(() -> OwnerProfile.builder()
                        .user(user)
                        .verificationStatus(EVerificationStatus.PENDING)
                        .build());

        if (request.getBankAccountNumber() != null) ownerProfile.setBankAccountNumber(request.getBankAccountNumber());
        if (request.getBankName() != null) ownerProfile.setBankName(request.getBankName());
        if (request.getIdCardFrontUrl() != null) ownerProfile.setIdCardFrontUrl(request.getIdCardFrontUrl());
        if (request.getIdCardBackUrl() != null) ownerProfile.setIdCardBackUrl(request.getIdCardBackUrl());

        userRepository.save(user);
        OwnerProfile savedProfile = ownerProfileRepository.save(ownerProfile);

        // Audit log
        log.info("[AUDIT_TRAIL] ACTION=UPDATE_OWNER_PROFILE, USER_ID={}, ACTOR_ID={}, TIMESTAMP={}",
                user.getUserId(), currentUser.getUserId(), Instant.now());

        return mapToOwnerResponse(user, savedProfile);
    }

    @Override
    @Transactional
    public RenterProfileResponse updateRenterProfile(Long targetUserId, RenterProfileUpdateRequest request, CustomUserDetails currentUser) {
        validatePermission(targetUserId, currentUser);

        User user = getUserOrThrow(targetUserId);

        // Validate unique phone & idCardNumber if changed
        validateUniqueUserFields(user, request.getPhone(), request.getIdCardNumber());

        // Update basic user info
        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl());
        if (request.getIdCardNumber() != null) user.setIdCardNumber(request.getIdCardNumber());

        // Update or create renter profile
        RenterProfile renterProfile = renterProfileRepository.findById(user.getUserId())
                .orElseGet(() -> RenterProfile.builder()
                        .user(user)
                        .licenseVerificationStatus(EVerificationStatus.PENDING)
                        .build());

        // Validate unique license number if changed
        if (request.getLicenseNumber() != null
                && !request.getLicenseNumber().equals(renterProfile.getLicenseNumber())
                && renterProfileRepository.existsByLicenseNumber(request.getLicenseNumber())) {
            throw new AppException(ErrorCode.LICENSE_NUMBER_EXISTED);
        }

        if (request.getLicenseNumber() != null) renterProfile.setLicenseNumber(request.getLicenseNumber());
        if (request.getLicenseFullName() != null) renterProfile.setLicenseFullName(request.getLicenseFullName());
        if (request.getLicenseDob() != null) renterProfile.setLicenseDob(request.getLicenseDob());
        if (request.getLicenseIssueDate() != null) renterProfile.setLicenseIssueDate(request.getLicenseIssueDate());
        if (request.getLicenseExpiryDate() != null) renterProfile.setLicenseExpiryDate(request.getLicenseExpiryDate());
        if (request.getLicenseFrontUrl() != null) renterProfile.setLicenseFrontUrl(request.getLicenseFrontUrl());
        if (request.getLicenseBackUrl() != null) renterProfile.setLicenseBackUrl(request.getLicenseBackUrl());

        userRepository.save(user);
        RenterProfile savedProfile = renterProfileRepository.save(renterProfile);

        // Audit log
        log.info("[AUDIT_TRAIL] ACTION=UPDATE_RENTER_PROFILE, USER_ID={}, ACTOR_ID={}, TIMESTAMP={}",
                user.getUserId(), currentUser.getUserId(), Instant.now());

        return mapToRenterResponse(user, savedProfile);
    }

    @Override
    @Transactional(readOnly = true)
    public OwnerProfileResponse getOwnerProfile(Long targetUserId, CustomUserDetails currentUser) {
        validatePermission(targetUserId, currentUser);
        User user = getUserOrThrow(targetUserId);
        OwnerProfile ownerProfile = ownerProfileRepository.findById(user.getUserId())
                .orElse(OwnerProfile.builder().user(user).verificationStatus(EVerificationStatus.PENDING).build());
        return mapToOwnerResponse(user, ownerProfile);
    }

    @Override
    @Transactional(readOnly = true)
    public RenterProfileResponse getRenterProfile(Long targetUserId, CustomUserDetails currentUser) {
        validatePermission(targetUserId, currentUser);
        User user = getUserOrThrow(targetUserId);
        RenterProfile renterProfile = renterProfileRepository.findById(user.getUserId())
                .orElse(RenterProfile.builder().user(user).licenseVerificationStatus(EVerificationStatus.PENDING).build());
        return mapToRenterResponse(user, renterProfile);
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile(CustomUserDetails currentUser) {
        User user = getUserOrThrow(currentUser.getUserId());
        OwnerProfile ownerProfile = ownerProfileRepository.findById(user.getUserId()).orElse(null);
        RenterProfile renterProfile = renterProfileRepository.findById(user.getUserId()).orElse(null);

        return UserProfileResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .phone(user.getPhone())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .idCardNumber(user.getIdCardNumber())
                .status(user.getStatus())
                .roles(user.getRoles().stream().map(r -> r.getRoleName().name()).collect(Collectors.toSet()))
                .ownerProfile(ownerProfile != null ? mapToOwnerResponse(user, ownerProfile) : null)
                .renterProfile(renterProfile != null ? mapToRenterResponse(user, renterProfile) : null)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .updatedBy(user.getUpdatedBy())
                .build();
    }

    private void validatePermission(Long targetUserId, CustomUserDetails currentUser) {
        if (currentUser == null || !currentUser.getUserId().equals(targetUserId)) {
            log.warn("Security rejection: Current user [{}] attempted to access/modify profile of user [{}]",
                    currentUser != null ? currentUser.getUserId() : "Anonymous", targetUserId);
            throw new AppException(ErrorCode.CANNOT_EDIT_OTHER_PROFILE);
        }
    }

    private User getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private void validateUniqueUserFields(User user, String newPhone, String newIdCardNumber) {
        if (newPhone != null && !newPhone.equals(user.getPhone()) && userRepository.existsByPhone(newPhone)) {
            throw new AppException(ErrorCode.PHONE_EXISTED);
        }
        if (newIdCardNumber != null && !newIdCardNumber.equals(user.getIdCardNumber()) && userRepository.existsByIdCardNumber(newIdCardNumber)) {
            throw new AppException(ErrorCode.ID_CARD_EXISTED);
        }
    }

    private OwnerProfileResponse mapToOwnerResponse(User user, OwnerProfile profile) {
        return OwnerProfileResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .phone(user.getPhone())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .idCardNumber(user.getIdCardNumber())
                .bankAccountNumber(profile != null ? profile.getBankAccountNumber() : null)
                .bankName(profile != null ? profile.getBankName() : null)
                .idCardFrontUrl(profile != null ? profile.getIdCardFrontUrl() : null)
                .idCardBackUrl(profile != null ? profile.getIdCardBackUrl() : null)
                .verificationStatus(profile != null ? profile.getVerificationStatus() : EVerificationStatus.PENDING)
                .updatedAt(user.getUpdatedAt())
                .updatedBy(user.getUpdatedBy())
                .build();
    }

    private RenterProfileResponse mapToRenterResponse(User user, RenterProfile profile) {
        return RenterProfileResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .phone(user.getPhone())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .idCardNumber(user.getIdCardNumber())
                .licenseNumber(profile != null ? profile.getLicenseNumber() : null)
                .licenseFullName(profile != null ? profile.getLicenseFullName() : null)
                .licenseDob(profile != null ? profile.getLicenseDob() : null)
                .licenseIssueDate(profile != null ? profile.getLicenseIssueDate() : null)
                .licenseExpiryDate(profile != null ? profile.getLicenseExpiryDate() : null)
                .licenseFrontUrl(profile != null ? profile.getLicenseFrontUrl() : null)
                .licenseBackUrl(profile != null ? profile.getLicenseBackUrl() : null)
                .licenseVerificationStatus(profile != null ? profile.getLicenseVerificationStatus() : EVerificationStatus.PENDING)
                .updatedAt(user.getUpdatedAt())
                .updatedBy(user.getUpdatedBy())
                .build();
    }
}
