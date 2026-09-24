package com.driveshare.modules.user.service.impl;

import com.driveshare.common.enums.ERole;
import com.driveshare.common.enums.EVerificationStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.common.service.CloudinaryService;
import com.driveshare.modules.user.dto.request.OwnerProfileUpdateRequest;
import com.driveshare.modules.user.dto.request.RenterProfileUpdateRequest;
import com.driveshare.modules.user.dto.request.UpdateMyProfileRequest;
import com.driveshare.modules.user.dto.response.*;
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
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserProfileServiceImpl implements UserProfileService {

    private final UserRepository userRepository;
    private final OwnerProfileRepository ownerProfileRepository;
    private final RenterProfileRepository renterProfileRepository;
    private final CloudinaryService cloudinaryService;

    @Override
    @Transactional(readOnly = true)
    public CurrentUserProfileResponse getMyProfile(CustomUserDetails currentUser) {
        User user = getUserOrThrow(currentUser.getUserId());
        OwnerProfile ownerProfile = ownerProfileRepository.findById(user.getUserId()).orElse(null);
        RenterProfile renterProfile = renterProfileRepository.findById(user.getUserId()).orElse(null);

        String role = resolvePrimaryRole(user);
        String verificationStatus = resolveVerificationStatus(role, ownerProfile, renterProfile);
        boolean isApproved = "APPROVED".equalsIgnoreCase(verificationStatus) || "VERIFIED".equalsIgnoreCase(verificationStatus);

        List<String> lockedFields = isApproved
                ? List.of("fullName", "nationalId", "nationalIdImages")
                : Collections.emptyList();

        CurrentUserProfileResponse.SubProfileDetail subProfile = null;
        if ("RENTER".equalsIgnoreCase(role)) {
            subProfile = CurrentUserProfileResponse.SubProfileDetail.builder()
                    .licenseNumber(renterProfile != null ? renterProfile.getLicenseNumber() : null)
                    .licenseImageUrl(renterProfile != null ? renterProfile.getLicenseFrontUrl() : null)
                    .build();
        } else if ("OWNER".equalsIgnoreCase(role)) {
            subProfile = CurrentUserProfileResponse.SubProfileDetail.builder()
                    .bankName(ownerProfile != null ? ownerProfile.getBankName() : null)
                    .bankAccountNumber(ownerProfile != null ? ownerProfile.getBankAccountNumber() : null)
                    .build();
        }

        return CurrentUserProfileResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhone())
                .address(user.getAddress())
                .avatarUrl(user.getAvatarUrl())
                .role(role)
                .status(user.getStatus() != null ? user.getStatus().name() : "ACTIVE")
                .verificationStatus(isApproved ? "APPROVED" : verificationStatus)
                .profile(subProfile)
                .lockedFields(lockedFields)
                .build();
    }

    @Override
    @Transactional
    public CurrentUserProfileResponse updateMyProfile(UpdateMyProfileRequest request, CustomUserDetails currentUser) {
        User user = getUserOrThrow(currentUser.getUserId());
        OwnerProfile ownerProfile = ownerProfileRepository.findById(user.getUserId()).orElse(null);
        RenterProfile renterProfile = renterProfileRepository.findById(user.getUserId()).orElse(null);

        String role = resolvePrimaryRole(user);
        String verificationStatus = resolveVerificationStatus(role, ownerProfile, renterProfile);
        boolean isApproved = "APPROVED".equalsIgnoreCase(verificationStatus) || "VERIFIED".equalsIgnoreCase(verificationStatus);

        // If verified/approved, cannot change fullName
        if (isApproved && request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            String currentFullName = user.getFullName() != null ? user.getFullName().trim() : "";
            if (!request.getFullName().trim().equalsIgnoreCase(currentFullName)) {
                throw new AppException(ErrorCode.FIELD_LOCKED);
            }
        } else if (!isApproved && request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
        }

        String phone = request.resolvePhoneNumber();
        if (phone != null && !phone.isBlank()) {
            if (!phone.equals(user.getPhone()) && userRepository.existsByPhone(phone)) {
                throw new AppException(ErrorCode.PHONE_EXISTED);
            }
            user.setPhone(phone);
        }

        if (request.getAddress() != null) {
            user.setAddress(request.getAddress().trim());
        }

        userRepository.save(user);
        log.info("[AUDIT_TRAIL] ACTION=UPDATE_MY_PROFILE, USER_ID={}, TIMESTAMP={}", user.getUserId(), Instant.now());

        return getMyProfile(currentUser);
    }

    @Override
    @Transactional
    public UploadAvatarResponse uploadAvatar(MultipartFile file, CustomUserDetails currentUser) {
        User user = getUserOrThrow(currentUser.getUserId());
        String avatarUrl = cloudinaryService.uploadImage(file, "driveshare/avatars", 5 * 1024 * 1024L);
        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);

        log.info("[AUDIT_TRAIL] ACTION=UPLOAD_AVATAR, USER_ID={}, URL={}, TIMESTAMP={}",
                user.getUserId(), avatarUrl, Instant.now());
        return UploadAvatarResponse.builder().avatarUrl(avatarUrl).build();
    }

    @Override
    @Transactional
    public UploadCccdResponse uploadCccd(MultipartFile frontImage, MultipartFile backImage, CustomUserDetails currentUser) {
        if (frontImage == null || frontImage.isEmpty() || backImage == null || backImage.isEmpty()) {
            throw new AppException(ErrorCode.MISSING_CCCD_SIDE);
        }

        User user = getUserOrThrow(currentUser.getUserId());
        String frontUrl = cloudinaryService.uploadImage(frontImage, "driveshare/cccd", 10 * 1024 * 1024L);
        String backUrl = cloudinaryService.uploadImage(backImage, "driveshare/cccd", 10 * 1024 * 1024L);

        // Update OwnerProfile if present
        ownerProfileRepository.findById(user.getUserId()).ifPresent(op -> {
            op.setIdCardFrontUrl(frontUrl);
            op.setIdCardBackUrl(backUrl);
            op.setVerificationStatus(EVerificationStatus.PENDING);
            ownerProfileRepository.save(op);
        });

        // Update RenterProfile if present
        renterProfileRepository.findById(user.getUserId()).ifPresent(rp -> {
            rp.setIdCardFrontUrl(frontUrl);
            rp.setIdCardBackUrl(backUrl);
            rp.setVerificationStatus(EVerificationStatus.PENDING);
            renterProfileRepository.save(rp);
        });

        boolean hasOwner = user.getRoles().stream().anyMatch(r -> r.getRoleName() == ERole.ROLE_OWNER);
        boolean hasRenter = user.getRoles().stream().anyMatch(r -> r.getRoleName() == ERole.ROLE_RENTER);

        if (hasOwner && !ownerProfileRepository.existsById(user.getUserId())) {
            OwnerProfile op = OwnerProfile.builder()
                    .user(user)
                    .idCardFrontUrl(frontUrl)
                    .idCardBackUrl(backUrl)
                    .verificationStatus(EVerificationStatus.PENDING)
                    .build();
            ownerProfileRepository.save(op);
        }
        if ((hasRenter || !hasOwner) && !renterProfileRepository.existsById(user.getUserId())) {
            RenterProfile rp = RenterProfile.builder()
                    .user(user)
                    .idCardFrontUrl(frontUrl)
                    .idCardBackUrl(backUrl)
                    .verificationStatus(EVerificationStatus.PENDING)
                    .licenseVerificationStatus(EVerificationStatus.PENDING)
                    .build();
            renterProfileRepository.save(rp);
        }

        log.info("[AUDIT_TRAIL] ACTION=UPLOAD_CCCD, USER_ID={}, TIMESTAMP={}", user.getUserId(), Instant.now());
        return UploadCccdResponse.builder()
                .frontImageUrl(frontUrl)
                .backImageUrl(backUrl)
                .verificationStatus("PENDING")
                .build();
    }

    @Override
    @Transactional
    public UploadGplxResponse uploadGplx(MultipartFile licenseImage, CustomUserDetails currentUser) {
        User user = getUserOrThrow(currentUser.getUserId());
        boolean isRenter = user.getRoles().stream().anyMatch(r -> r.getRoleName() == ERole.ROLE_RENTER);
        if (!isRenter) {
            throw new AppException(ErrorCode.ROLE_NOT_SUPPORTED);
        }

        if (licenseImage == null || licenseImage.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        String licenseUrl = cloudinaryService.uploadImage(licenseImage, "driveshare/gplx", 10 * 1024 * 1024L);

        RenterProfile renterProfile = renterProfileRepository.findById(user.getUserId())
                .orElseGet(() -> RenterProfile.builder()
                        .user(user)
                        .verificationStatus(EVerificationStatus.PENDING)
                        .build());

        renterProfile.setLicenseFrontUrl(licenseUrl);
        renterProfile.setLicenseVerificationStatus(EVerificationStatus.PENDING);
        renterProfile.setVerificationStatus(EVerificationStatus.PENDING);
        renterProfileRepository.save(renterProfile);

        log.info("[AUDIT_TRAIL] ACTION=UPLOAD_GPLX, USER_ID={}, TIMESTAMP={}", user.getUserId(), Instant.now());
        return UploadGplxResponse.builder()
                .licenseImageUrl(licenseUrl)
                .verificationStatus("PENDING")
                .build();
    }

    private String resolvePrimaryRole(User user) {
        if (user.getRoles().stream().anyMatch(r -> r.getRoleName() == ERole.ROLE_ADMIN)) {
            return "ADMIN";
        }
        if (user.getRoles().stream().anyMatch(r -> r.getRoleName() == ERole.ROLE_OWNER)) {
            return "OWNER";
        }
        if (user.getRoles().stream().anyMatch(r -> r.getRoleName() == ERole.ROLE_STAFF)) {
            return "STAFF";
        }
        return "RENTER";
    }

    private String resolveVerificationStatus(String role, OwnerProfile ownerProfile, RenterProfile renterProfile) {
        if ("OWNER".equalsIgnoreCase(role)) {
            if (ownerProfile != null && ownerProfile.getVerificationStatus() != null) {
                return ownerProfile.getVerificationStatus().name();
            }
        } else {
            if (renterProfile != null && renterProfile.getVerificationStatus() != null) {
                return renterProfile.getVerificationStatus().name();
            }
            if (renterProfile != null && renterProfile.getLicenseVerificationStatus() != null) {
                return renterProfile.getLicenseVerificationStatus().name();
            }
        }
        return EVerificationStatus.PENDING.name();
    }

    @Override
    @Transactional
    public OwnerProfileResponse updateOwnerProfile(Long targetUserId, OwnerProfileUpdateRequest request, CustomUserDetails currentUser) {
        validatePermission(targetUserId, currentUser);

        User user = getUserOrThrow(targetUserId);

        validateUniqueUserFields(user, request.getPhone(), request.getIdCardNumber());

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl());
        if (request.getIdCardNumber() != null) user.setIdCardNumber(request.getIdCardNumber());

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

        log.info("[AUDIT_TRAIL] ACTION=UPDATE_OWNER_PROFILE, USER_ID={}, ACTOR_ID={}, TIMESTAMP={}",
                user.getUserId(), currentUser.getUserId(), Instant.now());

        return mapToOwnerResponse(user, savedProfile);
    }

    @Override
    @Transactional
    public RenterProfileResponse updateRenterProfile(Long targetUserId, RenterProfileUpdateRequest request, CustomUserDetails currentUser) {
        validatePermission(targetUserId, currentUser);

        User user = getUserOrThrow(targetUserId);

        validateUniqueUserFields(user, request.getPhone(), request.getIdCardNumber());

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl());
        if (request.getIdCardNumber() != null) user.setIdCardNumber(request.getIdCardNumber());

        RenterProfile renterProfile = renterProfileRepository.findById(user.getUserId())
                .orElseGet(() -> RenterProfile.builder()
                        .user(user)
                        .licenseVerificationStatus(EVerificationStatus.PENDING)
                        .verificationStatus(EVerificationStatus.PENDING)
                        .build());

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
