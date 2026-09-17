package com.driveshare.modules.admin;

import com.driveshare.common.dto.PageResponse;
import com.driveshare.common.enums.ERole;
import com.driveshare.common.enums.EUserStatus;
import com.driveshare.common.enums.EVerificationStatus;
import com.driveshare.modules.admin.dto.request.AdminUserFilterRequest;
import com.driveshare.modules.admin.dto.response.UserItemResponse;
import com.driveshare.modules.admin.service.impl.AdminUserServiceImpl;
import com.driveshare.modules.user.entity.OwnerProfile;
import com.driveshare.modules.user.entity.Role;
import com.driveshare.modules.user.entity.User;
import com.driveshare.modules.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.admin.dto.request.ApproveOwnerRequest;
import com.driveshare.modules.admin.dto.request.UpdateUserStatusRequest;
import com.driveshare.modules.admin.entity.AuditLog;
import com.driveshare.modules.admin.repository.AuditLogRepository;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private AdminUserServiceImpl adminUserService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        Role ownerRole = Role.builder().roleId(1L).roleName(ERole.ROLE_OWNER).build();
        OwnerProfile ownerProfile = OwnerProfile.builder()
                .userId(1L)
                .bankName("Techcombank")
                .bankAccountNumber("1903345678901")
                .verificationStatus(EVerificationStatus.VERIFIED)
                .build();

        sampleUser = User.builder()
                .userId(1L)
                .username("hung_toyota")
                .email("owner.hung@gmail.com")
                .phone("0901234567")
                .passwordHash("$2a$10$SensitivePasswordHashDoNotExpose")
                .fullName("Nguyễn Văn Hùng")
                .status(EUserStatus.ACTIVE)
                .roles(Set.of(ownerRole))
                .ownerProfile(ownerProfile)
                .build();
        sampleUser.setCreatedAt(Instant.now());
    }

    @Test
    @DisplayName("AC1, AC4 & AC5: Get users returns paginated list, includes owner verification status, excludes password hash")
    void testGetUsers_Success() {
        AdminUserFilterRequest request = AdminUserFilterRequest.builder()
                .page(1)
                .limit(10)
                .role("owner")
                .status("active")
                .build();

        when(userRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(sampleUser)));

        PageResponse<UserItemResponse> response = adminUserService.getUsers(request);

        assertNotNull(response);
        assertEquals(1, response.getItems().size());
        UserItemResponse item = response.getItems().get(0);

        // AC1: Pagination metadata
        assertEquals(1, response.getPagination().getPage());
        assertEquals(1, response.getPagination().getTotalItems());

        // AC4: Owner verification status
        assertNotNull(item.getOwnerProfile());
        assertEquals(EVerificationStatus.VERIFIED, item.getOwnerProfile().getVerificationStatus());
        assertTrue(item.getRoles().contains("owner"));

        // AC5: No sensitive fields
        assertEquals("Nguyễn Văn Hùng", item.getFullName());
        assertEquals("owner.hung@gmail.com", item.getEmail());
        // Verify UserItemResponse class does not have password field
        assertFalse(item.toString().contains("SensitivePasswordHashDoNotExpose"));
    }

    @Test
    @DisplayName("Admin View User Detail - AC1 & AC2: Get user by ID returns profile, roles, status, approval status and excludes password hash")
    void testGetUserById_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));

        UserItemResponse response = adminUserService.getUserById(1L);

        assertNotNull(response);
        // Profile fields
        assertEquals(1L, response.getUserId());
        assertEquals("hung_toyota", response.getUsername());
        assertEquals("Nguyễn Văn Hùng", response.getFullName());
        assertEquals("owner.hung@gmail.com", response.getEmail());
        assertEquals("0901234567", response.getPhone());
        
        // Roles & Account status
        assertTrue(response.getRoles().contains("owner"));
        assertEquals(EUserStatus.ACTIVE, response.getStatus());

        // Approval status (Owner profile)
        assertNotNull(response.getOwnerProfile());
        assertEquals("Techcombank", response.getOwnerProfile().getBankName());
        assertEquals("1903345678901", response.getOwnerProfile().getBankAccountNumber());
        assertEquals(EVerificationStatus.VERIFIED, response.getOwnerProfile().getVerificationStatus());

        // Sensitive field verification (AC2)
        assertFalse(response.toString().contains("SensitivePasswordHashDoNotExpose"));
    }

    @Test
    @DisplayName("Admin View User Detail - AC3: Request non-existent user throws USER_NOT_FOUND (HTTP 404)")
    void testGetUserById_NotFound_Throws404() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        AppException exception = assertThrows(AppException.class, () -> {
            adminUserService.getUserById(999L);
        });

        assertEquals(ErrorCode.USER_NOT_FOUND, exception.getErrorCode());
        assertEquals(404, exception.getErrorCode().getHttpStatus().value());
    }

    @Test
    @DisplayName("Admin Approve Owner - AC2 & AC5: Approving a pending owner sets user status to ACTIVE and records audit log")
    void testApproveOwner_Success() {
        // Given pending owner
        OwnerProfile pendingProfile = OwnerProfile.builder()
                .userId(3L)
                .bankName("MB Bank")
                .bankAccountNumber("0988123456")
                .verificationStatus(EVerificationStatus.PENDING)
                .build();
        User pendingUser = User.builder()
                .userId(3L)
                .username("kiet_sedan")
                .email("owner.kiet@gmail.com")
                .status(EUserStatus.PENDING)
                .roles(Set.of(Role.builder().roleId(3L).roleName(ERole.ROLE_OWNER).build()))
                .ownerProfile(pendingProfile)
                .build();

        when(userRepository.findById(3L)).thenReturn(Optional.of(pendingUser));
        when(userRepository.save(any(User.class))).thenReturn(pendingUser);

        ApproveOwnerRequest request = ApproveOwnerRequest.builder()
                .verificationStatus("verified")
                .build();

        // When
        UserItemResponse result = adminUserService.approveOwner(3L, request, 6L, "admin_tin");

        // Then
        // AC2: Account becomes ACTIVE and profile becomes VERIFIED
        assertEquals(EUserStatus.ACTIVE, pendingUser.getStatus());
        assertEquals(EVerificationStatus.VERIFIED, pendingProfile.getVerificationStatus());
        assertNotNull(pendingProfile.getVerifiedAt());
        assertEquals(6L, pendingProfile.getVerifiedBy());
        assertNull(pendingProfile.getRejectionReason());

        // AC5: Audit log is recorded
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("Admin Approve Owner - AC3 & AC5: Rejecting a pending owner stores rejection reason and records audit log")
    void testRejectOwner_Success() {
        // Given pending owner
        OwnerProfile pendingProfile = OwnerProfile.builder()
                .userId(3L)
                .bankName("MB Bank")
                .bankAccountNumber("0988123456")
                .verificationStatus(EVerificationStatus.PENDING)
                .build();
        User pendingUser = User.builder()
                .userId(3L)
                .username("kiet_sedan")
                .email("owner.kiet@gmail.com")
                .status(EUserStatus.PENDING)
                .roles(Set.of(Role.builder().roleId(3L).roleName(ERole.ROLE_OWNER).build()))
                .ownerProfile(pendingProfile)
                .build();

        when(userRepository.findById(3L)).thenReturn(Optional.of(pendingUser));
        when(userRepository.save(any(User.class))).thenReturn(pendingUser);

        ApproveOwnerRequest request = ApproveOwnerRequest.builder()
                .verificationStatus("rejected")
                .rejectionReason("Ảnh chụp CCCD bị mờ, vui lòng chụp lại rõ nét")
                .build();

        // When
        UserItemResponse result = adminUserService.approveOwner(3L, request, 6L, "admin_tin");

        // Then
        // AC3: Rejection reason is required and stored
        assertEquals(EVerificationStatus.REJECTED, pendingProfile.getVerificationStatus());
        assertEquals("Ảnh chụp CCCD bị mờ, vui lòng chụp lại rõ nét", pendingProfile.getRejectionReason());
        assertNotNull(pendingProfile.getVerifiedAt());

        // AC5: Audit log is recorded
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("Admin Approve Owner - AC3: Rejecting without a reason throws VALIDATION_FAILED (400 Bad Request)")
    void testRejectOwner_MissingReason_ThrowsValidationFailed() {
        OwnerProfile pendingProfile = OwnerProfile.builder()
                .userId(3L)
                .verificationStatus(EVerificationStatus.PENDING)
                .build();
        User pendingUser = User.builder()
                .userId(3L)
                .ownerProfile(pendingProfile)
                .build();

        when(userRepository.findById(3L)).thenReturn(Optional.of(pendingUser));

        ApproveOwnerRequest request = ApproveOwnerRequest.builder()
                .verificationStatus("rejected")
                .rejectionReason("   ") // Blank
                .build();

        AppException ex = assertThrows(AppException.class, () -> {
            adminUserService.approveOwner(3L, request, 6L, "admin_tin");
        });

        assertEquals(ErrorCode.VALIDATION_FAILED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Admin Block User - AC1 & AC4: Blocking a user sets status to LOCKED and records audit log")
    void testBlockUser_Success() {
        User activeRenter = User.builder()
                .userId(4L)
                .username("nam_renter")
                .email("renter.nam@gmail.com")
                .status(EUserStatus.ACTIVE)
                .roles(Set.of(Role.builder().roleId(4L).roleName(ERole.ROLE_RENTER).build()))
                .build();

        when(userRepository.findById(4L)).thenReturn(Optional.of(activeRenter));
        when(userRepository.save(any(User.class))).thenReturn(activeRenter);

        UpdateUserStatusRequest request = UpdateUserStatusRequest.builder()
                .status("locked")
                .reason("Gian lận đặt xe")
                .build();

        // When
        UserItemResponse response = adminUserService.updateUserStatus(4L, request, 6L, "admin_tin");

        // Then
        // AC1: User status becomes LOCKED
        assertEquals(EUserStatus.LOCKED, activeRenter.getStatus());
        assertEquals(EUserStatus.LOCKED, response.getStatus());

        // AC4: Audit log is saved
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("Admin Block User - AC2 & AC4: Blocking an approved owner sets status to LOCKED and records audit log")
    void testBlockApprovedOwner_Success() {
        OwnerProfile approvedProfile = OwnerProfile.builder()
                .userId(1L)
                .verificationStatus(EVerificationStatus.VERIFIED)
                .build();
        User approvedOwner = User.builder()
                .userId(1L)
                .username("hung_toyota")
                .status(EUserStatus.ACTIVE)
                .roles(Set.of(Role.builder().roleId(3L).roleName(ERole.ROLE_OWNER).build()))
                .ownerProfile(approvedProfile)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(approvedOwner));
        when(userRepository.save(any(User.class))).thenReturn(approvedOwner);

        UpdateUserStatusRequest request = UpdateUserStatusRequest.builder()
                .status("locked")
                .reason("Vi phạm hợp đồng đối tác")
                .build();

        // When
        UserItemResponse response = adminUserService.updateUserStatus(1L, request, 6L, "admin_tin");

        // Then
        // AC2: Approved owner status becomes LOCKED, disabling login
        assertEquals(EUserStatus.LOCKED, approvedOwner.getStatus());
        assertEquals(EVerificationStatus.VERIFIED, approvedProfile.getVerificationStatus()); // profile stays verified, but account locked

        // AC4: Audit log is saved
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("Admin Unblock User - AC3 & AC4: Unblocking a locked user restores status to ACTIVE and records audit log")
    void testUnblockUser_Success() {
        User lockedUser = User.builder()
                .userId(4L)
                .username("nam_renter")
                .status(EUserStatus.LOCKED)
                .roles(Set.of(Role.builder().roleId(4L).roleName(ERole.ROLE_RENTER).build()))
                .build();

        when(userRepository.findById(4L)).thenReturn(Optional.of(lockedUser));
        when(userRepository.save(any(User.class))).thenReturn(lockedUser);

        UpdateUserStatusRequest request = UpdateUserStatusRequest.builder()
                .status("active")
                .build();

        // When
        UserItemResponse response = adminUserService.updateUserStatus(4L, request, 6L, "admin_tin");

        // Then
        // AC3: Status restored to ACTIVE so login works again
        assertEquals(EUserStatus.ACTIVE, lockedUser.getStatus());
        assertEquals(EUserStatus.ACTIVE, response.getStatus());

        // AC4: Audit log is saved
        verify(auditLogRepository).save(any(AuditLog.class));
    }
}
