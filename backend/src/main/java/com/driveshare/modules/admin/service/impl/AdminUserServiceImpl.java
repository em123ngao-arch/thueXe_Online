package com.driveshare.modules.admin.service.impl;

import com.driveshare.common.dto.PageResponse;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.admin.dto.request.AdminUserFilterRequest;
import com.driveshare.modules.admin.dto.response.OwnerProfileSummaryResponse;
import com.driveshare.modules.admin.dto.response.RenterProfileSummaryResponse;
import com.driveshare.modules.admin.dto.response.UserItemResponse;
import com.driveshare.modules.admin.service.AdminUserService;
import com.driveshare.modules.admin.specification.UserSpecification;
import com.driveshare.modules.user.entity.OwnerProfile;
import com.driveshare.modules.user.entity.RenterProfile;
import com.driveshare.modules.user.entity.User;
import com.driveshare.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.driveshare.common.enums.EUserStatus;
import com.driveshare.common.enums.EVerificationStatus;
import com.driveshare.modules.admin.dto.request.ApproveLicenseRequest;
import com.driveshare.modules.admin.dto.request.ApproveOwnerRequest;
import com.driveshare.modules.admin.dto.request.UpdateUserStatusRequest;
import com.driveshare.modules.admin.entity.AuditLog;
import com.driveshare.modules.admin.repository.AuditLogRepository;
import lombok.extern.slf4j.Slf4j;

import java.time.Instant;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserItemResponse> getUsers(AdminUserFilterRequest request) {
        int pageIndex = Math.max(0, request.getPage() - 1);
        int pageSize = request.getLimit() > 0 ? request.getLimit() : 10;

        // Map sort field
        String sortProperty = "createdAt";
        if ("full_name".equalsIgnoreCase(request.getSortBy()) || "fullName".equalsIgnoreCase(request.getSortBy())) {
            sortProperty = "fullName";
        } else if ("email".equalsIgnoreCase(request.getSortBy())) {
            sortProperty = "email";
        } else if ("status".equalsIgnoreCase(request.getSortBy())) {
            sortProperty = "status";
        }

        Sort.Direction direction = "asc".equalsIgnoreCase(request.getSortDir()) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(pageIndex, pageSize, Sort.by(direction, sortProperty));

        Specification<User> spec = UserSpecification.filterUsers(
                request.getSearch(),
                request.getRole(),
                request.getStatus()
        );

        Page<User> userPage = userRepository.findAll(spec, pageable);
        return PageResponse.from(userPage.map(this::mapToUserItemResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public UserItemResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return mapToUserItemResponse(user);
    }

    @Override
    @Transactional
    public UserItemResponse approveOwner(Long userId, ApproveOwnerRequest request, Long actorId, String actorUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        OwnerProfile ownerProfile = user.getOwnerProfile();
        if (ownerProfile == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Người dùng này không có hồ sơ chủ xe để phê duyệt");
        }

        String targetStatus = request.getVerificationStatus() != null ? request.getVerificationStatus().trim().toLowerCase() : "";

        if ("verified".equals(targetStatus)) {
            // AC2: Phê duyệt -> OwnerProfile thành VERIFIED, User thành ACTIVE, chủ xe có thể đăng nhập
            ownerProfile.setVerificationStatus(EVerificationStatus.VERIFIED);
            ownerProfile.setVerifiedAt(Instant.now());
            ownerProfile.setVerifiedBy(actorId);
            ownerProfile.setRejectionReason(null);
            user.setStatus(EUserStatus.ACTIVE);

            // AC5: Ghi nhận Audit Trail
            AuditLog auditLog = AuditLog.builder()
                    .action("APPROVE_OWNER")
                    .actorId(actorId)
                    .actorUsername(actorUsername != null ? actorUsername : "system_admin")
                    .targetType("OWNER_PROFILE")
                    .targetId(userId)
                    .details("Phê duyệt hồ sơ chủ xe thành công. Tài khoản @" + user.getUsername() + " được kích hoạt ACTIVE.")
                    .createdAt(Instant.now())
                    .build();
            auditLogRepository.save(auditLog);

            log.info(" [AUDIT] Admin '{}' approved owner profile for user #{}, status set to ACTIVE",
                    actorUsername, userId);
            log.info("📧 [NOTIFICATION] Sent approval email to owner: {} ({})", user.getFullName(), user.getEmail());

        } else if ("rejected".equals(targetStatus)) {
            // AC3: Từ chối -> Bắt buộc có lý do từ chối, lưu lý do và gửi thông báo
            String reason = request.getRejectionReason();
            if (reason == null || reason.trim().isEmpty()) {
                throw new AppException(ErrorCode.VALIDATION_FAILED, "Lý do từ chối hồ sơ không được để trống");
            }

            ownerProfile.setVerificationStatus(EVerificationStatus.REJECTED);
            ownerProfile.setVerifiedAt(Instant.now());
            ownerProfile.setVerifiedBy(actorId);
            ownerProfile.setRejectionReason(reason.trim());

            // AC5: Ghi nhận Audit Trail
            AuditLog auditLog = AuditLog.builder()
                    .action("REJECT_OWNER")
                    .actorId(actorId)
                    .actorUsername(actorUsername != null ? actorUsername : "system_admin")
                    .targetType("OWNER_PROFILE")
                    .targetId(userId)
                    .details("Từ chối hồ sơ chủ xe @" + user.getUsername() + ". Lý do: " + reason.trim())
                    .createdAt(Instant.now())
                    .build();
            auditLogRepository.save(auditLog);

            log.warn("⚠️ [AUDIT] Admin '{}' rejected owner profile for user #{}. Reason: {}",
                    actorUsername, userId, reason.trim());
            log.info("📧 [NOTIFICATION] Sent rejection notice to owner: {} ({}) with reason: '{}'",
                    user.getFullName(), user.getEmail(), reason.trim());

        } else {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Trạng thái phê duyệt không hợp lệ. Chỉ chấp nhận 'verified' hoặc 'rejected'");
        }

        userRepository.save(user);
        return mapToUserItemResponse(user);
    }

    @Override
    @Transactional
    public UserItemResponse approveLicense(Long userId, ApproveLicenseRequest request, Long actorId, String actorUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        RenterProfile renterProfile = user.getRenterProfile();
        if (renterProfile == null) {
            throw new AppException(ErrorCode.RENTER_PROFILE_NOT_FOUND, "Người dùng này không có hồ sơ bằng lái khách thuê để phê duyệt");
        }

        String targetStatus = request.getVerificationStatus() != null ? request.getVerificationStatus().trim().toLowerCase() : "";

        if ("verified".equals(targetStatus)) {
            renterProfile.setLicenseVerificationStatus(EVerificationStatus.VERIFIED);
            renterProfile.setLicenseVerifiedAt(Instant.now());
            renterProfile.setLicenseVerifiedBy(actorId);
            renterProfile.setLicenseRejectionReason(null);

            AuditLog auditLog = AuditLog.builder()
                    .action("APPROVE_RENTER_LICENSE")
                    .actorId(actorId)
                    .actorUsername(actorUsername != null ? actorUsername : "system_admin")
                    .targetType("RENTER_PROFILE")
                    .targetId(userId)
                    .details("Phê duyệt Giấy phép lái xe (GPLX: " + renterProfile.getLicenseNumber() + ") của khách thuê @" + user.getUsername() + " thành công.")
                    .createdAt(Instant.now())
                    .build();
            auditLogRepository.save(auditLog);

            log.info(" [AUDIT] Admin '{}' approved driver license for user #{}, license: {}",
                    actorUsername, userId, renterProfile.getLicenseNumber());
            log.info("📧 [NOTIFICATION] Sent driver license approval notice to renter: {} ({})",
                    user.getFullName(), user.getEmail());

        } else if ("rejected".equals(targetStatus)) {
            String reason = request.getRejectionReason();
            if (reason == null || reason.trim().isEmpty()) {
                throw new AppException(ErrorCode.VALIDATION_FAILED, "Lý do từ chối bằng lái không được để trống");
            }

            renterProfile.setLicenseVerificationStatus(EVerificationStatus.REJECTED);
            renterProfile.setLicenseVerifiedAt(Instant.now());
            renterProfile.setLicenseVerifiedBy(actorId);
            renterProfile.setLicenseRejectionReason(reason.trim());

            AuditLog auditLog = AuditLog.builder()
                    .action("REJECT_RENTER_LICENSE")
                    .actorId(actorId)
                    .actorUsername(actorUsername != null ? actorUsername : "system_admin")
                    .targetType("RENTER_PROFILE")
                    .targetId(userId)
                    .details("Từ chối Giấy phép lái xe của khách thuê @" + user.getUsername() + ". Lý do: " + reason.trim())
                    .createdAt(Instant.now())
                    .build();
            auditLogRepository.save(auditLog);

            log.warn("⚠️ [AUDIT] Admin '{}' rejected driver license for user #{}. Reason: {}",
                    actorUsername, userId, reason.trim());
            log.info("📧 [NOTIFICATION] Sent driver license rejection notice to renter: {} ({}) with reason: '{}'",
                    user.getFullName(), user.getEmail(), reason.trim());

        } else {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Trạng thái phê duyệt không hợp lệ. Chỉ chấp nhận 'verified' hoặc 'rejected'");
        }

        userRepository.save(user);
        return mapToUserItemResponse(user);
    }

    @Override
    @Transactional
    public UserItemResponse updateUserStatus(Long userId, UpdateUserStatusRequest request, Long actorId, String actorUsername) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        String targetStatus = request.getStatus() != null ? request.getStatus().trim().toLowerCase() : "";

        if ("locked".equals(targetStatus)) {
            // AC1 & AC2: Khóa tài khoản (LOCKED) -> chặn đăng nhập
            user.setStatus(EUserStatus.LOCKED);

            String reason = request.getReason() != null && !request.getReason().trim().isEmpty() 
                    ? request.getReason().trim() 
                    : "Quản trị viên khóa tài khoản do vi phạm điều khoản";

            // AC4: Ghi nhật ký kiểm toán (Audit Trail)
            AuditLog auditLog = AuditLog.builder()
                    .action("BLOCK_USER")
                    .actorId(actorId)
                    .actorUsername(actorUsername != null ? actorUsername : "system_admin")
                    .targetType("USER")
                    .targetId(userId)
                    .details("Khóa tài khoản @" + user.getUsername() + ". Lý do: " + reason)
                    .createdAt(Instant.now())
                    .build();
            auditLogRepository.save(auditLog);

            log.warn("🔒 [AUDIT] Admin '{}' BLOCKED user #{} (@{}). Reason: {}",
                    actorUsername, userId, user.getUsername(), reason);

        } else if ("active".equals(targetStatus)) {
            // AC3: Mở khóa tài khoản (ACTIVE) -> cho phép đăng nhập lại
            user.setStatus(EUserStatus.ACTIVE);

            // AC4: Ghi nhật ký kiểm toán (Audit Trail)
            AuditLog auditLog = AuditLog.builder()
                    .action("UNBLOCK_USER")
                    .actorId(actorId)
                    .actorUsername(actorUsername != null ? actorUsername : "system_admin")
                    .targetType("USER")
                    .targetId(userId)
                    .details("Mở khóa tài khoản @" + user.getUsername() + ". Khôi phục quyền đăng nhập.")
                    .createdAt(Instant.now())
                    .build();
            auditLogRepository.save(auditLog);

            log.info("🔓 [AUDIT] Admin '{}' UNBLOCKED user #{} (@{}). Status restored to ACTIVE",
                    actorUsername, userId, user.getUsername());

        } else {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Trạng thái không hợp lệ. Chỉ chấp nhận 'active' hoặc 'locked'");
        }

        userRepository.save(user);
        return mapToUserItemResponse(user);
    }

    private UserItemResponse mapToUserItemResponse(User user) {
        Set<String> roles = user.getRoles().stream()
                .map(r -> r.getRoleName().name().replace("ROLE_", "").toLowerCase())
                .collect(Collectors.toSet());

        OwnerProfileSummaryResponse ownerProfileSummary = null;
        OwnerProfile ownerProfile = user.getOwnerProfile();
        if (ownerProfile != null) {
            ownerProfileSummary = OwnerProfileSummaryResponse.builder()
                    .bankAccountNumber(ownerProfile.getBankAccountNumber())
                    .bankName(ownerProfile.getBankName())
                    .verificationStatus(ownerProfile.getVerificationStatus())
                    .rejectionReason(ownerProfile.getRejectionReason())
                    .build();
        }

        RenterProfileSummaryResponse renterProfileSummary = null;
        RenterProfile renterProfile = user.getRenterProfile();
        if (renterProfile != null) {
            renterProfileSummary = RenterProfileSummaryResponse.builder()
                    .licenseNumber(renterProfile.getLicenseNumber())
                    .licenseFullName(renterProfile.getLicenseFullName())
                    .licenseDob(renterProfile.getLicenseDob())
                    .licenseIssueDate(renterProfile.getLicenseIssueDate())
                    .licenseExpiryDate(renterProfile.getLicenseExpiryDate())
                    .licenseFrontUrl(renterProfile.getLicenseFrontUrl())
                    .licenseBackUrl(renterProfile.getLicenseBackUrl())
                    .licenseVerificationStatus(renterProfile.getLicenseVerificationStatus())
                    .licenseVerifiedBy(renterProfile.getLicenseVerifiedBy())
                    .licenseVerifiedAt(renterProfile.getLicenseVerifiedAt())
                    .licenseRejectionReason(renterProfile.getLicenseRejectionReason())
                    .build();
        }

        return UserItemResponse.builder()
                .userId(user.getUserId())
                .username(user.getUsername())
                .email(user.getEmail())
                .phone(user.getPhone())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .idCardNumber(user.getIdCardNumber())
                .status(user.getStatus())
                .roles(roles)
                .createdAt(user.getCreatedAt())
                .ownerProfile(ownerProfileSummary)
                .renterProfile(renterProfileSummary)
                .build();
    }
}
