package com.driveshare.modules.user;

import com.driveshare.common.enums.ERole;
import com.driveshare.common.enums.EUserStatus;
import com.driveshare.common.enums.EVerificationStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.user.dto.request.OwnerProfileUpdateRequest;
import com.driveshare.modules.user.dto.request.RenterProfileUpdateRequest;
import com.driveshare.modules.user.dto.response.OwnerProfileResponse;
import com.driveshare.modules.user.dto.response.RenterProfileResponse;
import com.driveshare.modules.user.entity.OwnerProfile;
import com.driveshare.modules.user.entity.RenterProfile;
import com.driveshare.modules.user.entity.Role;
import com.driveshare.modules.user.entity.User;
import com.driveshare.modules.user.repository.OwnerProfileRepository;
import com.driveshare.modules.user.repository.RenterProfileRepository;
import com.driveshare.modules.user.repository.UserRepository;
import com.driveshare.modules.user.service.impl.UserProfileServiceImpl;
import com.driveshare.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private OwnerProfileRepository ownerProfileRepository;

    @Mock
    private RenterProfileRepository renterProfileRepository;

    @Mock
    private com.driveshare.common.service.CloudinaryService cloudinaryService;

    @InjectMocks
    private UserProfileServiceImpl userProfileService;

    private User sampleUser;
    private CustomUserDetails currentUser;

    @BeforeEach
    void setUp() {
        Role ownerRole = Role.builder().roleId(1L).roleName(ERole.ROLE_OWNER).build();

        sampleUser = User.builder()
                .userId(1L)
                .username("duyquan")
                .email("quan@example.com")
                .phone("0901234567")
                .fullName("Nguyễn Duy Quân")
                .status(EUserStatus.ACTIVE)
                .roles(Set.of(ownerRole))
                .build();

        currentUser = new CustomUserDetails(
                1L,
                "duyquan",
                "quan@example.com",
                "hashedpassword",
                EUserStatus.ACTIVE,
                List.of(new SimpleGrantedAuthority("ROLE_OWNER"))
        );
    }

    @Test
    @DisplayName("AC1: Given I edit my own owner profile, when I save, then only my own record is changed")
    void updateOwnerProfile_Success() {
        OwnerProfileUpdateRequest request = OwnerProfileUpdateRequest.builder()
                .fullName("Nguyễn Duy Quân (Đã sửa)")
                .phone("0909999888")
                .bankAccountNumber("123456789")
                .bankName("Techcombank")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(userRepository.existsByPhone("0909999888")).thenReturn(false);
        when(ownerProfileRepository.findById(1L)).thenReturn(Optional.of(
                OwnerProfile.builder().user(sampleUser).verificationStatus(EVerificationStatus.PENDING).build()
        ));
        when(ownerProfileRepository.save(any(OwnerProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OwnerProfileResponse response = userProfileService.updateOwnerProfile(1L, request, currentUser);

        assertNotNull(response);
        assertEquals(1L, response.getUserId());
        assertEquals("Nguyễn Duy Quân (Đã sửa)", response.getFullName());
        assertEquals("0909999888", response.getPhone());
        assertEquals("123456789", response.getBankAccountNumber());
        assertEquals("Techcombank", response.getBankName());

        verify(userRepository, times(1)).save(sampleUser);
        verify(ownerProfileRepository, times(1)).save(any(OwnerProfile.class));
    }

    @Test
    @DisplayName("AC2: Given I attempt to edit another user profile, when the request is authorised, then it is rejected")
    void updateOwnerProfile_AttemptEditAnotherUser_RejectedWith403() {
        OwnerProfileUpdateRequest request = OwnerProfileUpdateRequest.builder()
                .fullName("Hacker")
                .build();

        // currentUser has userId = 1L, but attempts to edit targetUserId = 2L
        AppException exception = assertThrows(AppException.class, () ->
                userProfileService.updateOwnerProfile(2L, request, currentUser)
        );

        assertEquals(ErrorCode.CANNOT_EDIT_OTHER_PROFILE, exception.getErrorCode());
        verify(userRepository, never()).save(any());
        verify(ownerProfileRepository, never()).save(any());
    }

    @Test
    @DisplayName("AC1 (Renter): Given I edit my own renter profile, when I save, then only my own record is changed")
    void updateRenterProfile_Success() {
        RenterProfileUpdateRequest request = RenterProfileUpdateRequest.builder()
                .fullName("Nguyễn Duy Quân (Renter)")
                .licenseNumber("079201012345")
                .licenseFullName("NGUYEN DUY QUAN")
                .licenseExpiryDate(LocalDate.now().plusYears(5))
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(renterProfileRepository.findById(1L)).thenReturn(Optional.of(
                RenterProfile.builder().user(sampleUser).licenseVerificationStatus(EVerificationStatus.PENDING).build()
        ));
        when(renterProfileRepository.save(any(RenterProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RenterProfileResponse response = userProfileService.updateRenterProfile(1L, request, currentUser);

        assertNotNull(response);
        assertEquals(1L, response.getUserId());
        assertEquals("Nguyễn Duy Quân (Renter)", response.getFullName());
        assertEquals("079201012345", response.getLicenseNumber());

        verify(userRepository, times(1)).save(sampleUser);
        verify(renterProfileRepository, times(1)).save(any(RenterProfile.class));
    }

    @Test
    @DisplayName("AC2 (Renter): Given I attempt to edit another renter profile, it is rejected")
    void updateRenterProfile_AttemptEditAnotherUser_Rejected() {
        RenterProfileUpdateRequest request = RenterProfileUpdateRequest.builder()
                .licenseNumber("123456789012")
                .build();

        AppException exception = assertThrows(AppException.class, () ->
                userProfileService.updateRenterProfile(99L, request, currentUser)
        );

        assertEquals(ErrorCode.CANNOT_EDIT_OTHER_PROFILE, exception.getErrorCode());
        verify(userRepository, never()).save(any());
        verify(renterProfileRepository, never()).save(any());
    }

    @Test
    @DisplayName("Validation: Trùng số điện thoại với người dùng khác thì ném lỗi PHONE_EXISTED")
    void updateOwnerProfile_PhoneExisted_ThrowsException() {
        OwnerProfileUpdateRequest request = OwnerProfileUpdateRequest.builder()
                .phone("0988888888")
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(userRepository.existsByPhone("0988888888")).thenReturn(true);

        AppException exception = assertThrows(AppException.class, () ->
                userProfileService.updateOwnerProfile(1L, request, currentUser)
        );

        assertEquals(ErrorCode.PHONE_EXISTED, exception.getErrorCode());
        verify(ownerProfileRepository, never()).save(any());
    }

    @Test
    @DisplayName("GET /me: Khi tài khoản chưa duyệt (PENDING), lockedFields rỗng")
    void getMyProfile_WhenPending_ReturnsEmptyLockedFields() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(ownerProfileRepository.findById(1L)).thenReturn(Optional.of(
                OwnerProfile.builder().user(sampleUser).verificationStatus(EVerificationStatus.PENDING).build()
        ));

        com.driveshare.modules.user.dto.response.CurrentUserProfileResponse response = userProfileService.getMyProfile(currentUser);

        assertNotNull(response);
        assertEquals("PENDING", response.getVerificationStatus());
        assertTrue(response.getLockedFields().isEmpty());
    }

    @Test
    @DisplayName("GET /me: Khi tài khoản đã duyệt (APPROVED/VERIFIED), lockedFields chứa thông tin định danh")
    void getMyProfile_WhenApproved_ReturnsLockedFields() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(ownerProfileRepository.findById(1L)).thenReturn(Optional.of(
                OwnerProfile.builder().user(sampleUser).verificationStatus(EVerificationStatus.VERIFIED).build()
        ));

        com.driveshare.modules.user.dto.response.CurrentUserProfileResponse response = userProfileService.getMyProfile(currentUser);

        assertNotNull(response);
        assertEquals("APPROVED", response.getVerificationStatus());
        assertFalse(response.getLockedFields().isEmpty());
        assertTrue(response.getLockedFields().contains("fullName"));
        assertTrue(response.getLockedFields().contains("nationalId"));
    }

    @Test
    @DisplayName("PUT /me: Khi đã duyệt, sửa fullName sẽ ném lỗi FIELD_LOCKED")
    void updateMyProfile_WhenApproved_ThrowsFieldLockedIfFullNameModified() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(ownerProfileRepository.findById(1L)).thenReturn(Optional.of(
                OwnerProfile.builder().user(sampleUser).verificationStatus(EVerificationStatus.VERIFIED).build()
        ));

        com.driveshare.modules.user.dto.request.UpdateMyProfileRequest request = com.driveshare.modules.user.dto.request.UpdateMyProfileRequest.builder()
                .fullName("Tên Mới Không Thể Đổi")
                .build();

        AppException exception = assertThrows(AppException.class, () ->
                userProfileService.updateMyProfile(request, currentUser)
        );

        assertEquals(ErrorCode.FIELD_LOCKED, exception.getErrorCode());
    }

    @Test
    @DisplayName("PUT /me: Cập nhật SĐT và địa chỉ thành công")
    void updateMyProfile_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(ownerProfileRepository.findById(1L)).thenReturn(Optional.of(
                OwnerProfile.builder().user(sampleUser).verificationStatus(EVerificationStatus.PENDING).build()
        ));
        when(userRepository.existsByPhone("0911223344")).thenReturn(false);

        com.driveshare.modules.user.dto.request.UpdateMyProfileRequest request = com.driveshare.modules.user.dto.request.UpdateMyProfileRequest.builder()
                .phoneNumber("0911223344")
                .address("123 Nguyễn Huệ, Q1")
                .build();

        com.driveshare.modules.user.dto.response.CurrentUserProfileResponse response = userProfileService.updateMyProfile(request, currentUser);

        assertNotNull(response);
        assertEquals("0911223344", response.getPhoneNumber());
        assertEquals("123 Nguyễn Huệ, Q1", response.getAddress());
        verify(userRepository, times(1)).save(sampleUser);
    }

    @Test
    @DisplayName("POST /me/cccd: Thiếu 1 trong 2 mặt ném lỗi MISSING_CCCD_SIDE")
    void uploadCccd_MissingOneSide_ThrowsMissingCccdSide() {
        org.springframework.mock.web.MockMultipartFile front = new org.springframework.mock.web.MockMultipartFile(
                "frontImage", "front.jpg", "image/jpeg", new byte[]{1, 2, 3}
        );

        AppException exception = assertThrows(AppException.class, () ->
                userProfileService.uploadCccd(front, null, currentUser)
        );

        assertEquals(ErrorCode.MISSING_CCCD_SIDE, exception.getErrorCode());
    }

    @Test
    @DisplayName("POST /me/cccd: Upload đủ 2 mặt thành công, trạng thái PENDING")
    void uploadCccd_Success() {
        org.springframework.mock.web.MockMultipartFile front = new org.springframework.mock.web.MockMultipartFile(
                "frontImage", "front.jpg", "image/jpeg", new byte[]{1, 2, 3}
        );
        org.springframework.mock.web.MockMultipartFile back = new org.springframework.mock.web.MockMultipartFile(
                "backImage", "back.jpg", "image/jpeg", new byte[]{4, 5, 6}
        );

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser));
        when(cloudinaryService.uploadImage(eq(front), anyString(), anyLong())).thenReturn("https://cloudinary/front.jpg");
        when(cloudinaryService.uploadImage(eq(back), anyString(), anyLong())).thenReturn("https://cloudinary/back.jpg");
        when(ownerProfileRepository.findById(1L)).thenReturn(Optional.of(
                OwnerProfile.builder().user(sampleUser).build()
        ));

        com.driveshare.modules.user.dto.response.UploadCccdResponse response = userProfileService.uploadCccd(front, back, currentUser);

        assertNotNull(response);
        assertEquals("https://cloudinary/front.jpg", response.getFrontImageUrl());
        assertEquals("https://cloudinary/back.jpg", response.getBackImageUrl());
        assertEquals("PENDING", response.getVerificationStatus());
    }

    @Test
    @DisplayName("POST /me/gplx: Người dùng không phải Renter bị từ chối ROLE_NOT_SUPPORTED")
    void uploadGplx_WhenNotRenter_ThrowsRoleNotSupported() {
        org.springframework.mock.web.MockMultipartFile license = new org.springframework.mock.web.MockMultipartFile(
                "licenseImage", "license.jpg", "image/jpeg", new byte[]{1, 2, 3}
        );

        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser)); // sampleUser has ROLE_OWNER only

        AppException exception = assertThrows(AppException.class, () ->
                userProfileService.uploadGplx(license, currentUser)
        );

        assertEquals(ErrorCode.ROLE_NOT_SUPPORTED, exception.getErrorCode());
    }

    @Test
    @DisplayName("POST /me/gplx: Renter upload thành công, trạng thái PENDING")
    void uploadGplx_WhenRenter_Success() {
        Role renterRole = Role.builder().roleId(4L).roleName(ERole.ROLE_RENTER).build();
        User renterUser = User.builder()
                .userId(4L)
                .username("nam_renter")
                .email("renter@example.com")
                .roles(Set.of(renterRole))
                .status(EUserStatus.ACTIVE)
                .build();
        CustomUserDetails renterDetails = new CustomUserDetails(
                4L, "nam_renter", "renter@example.com", "hash", EUserStatus.ACTIVE,
                List.of(new SimpleGrantedAuthority("ROLE_RENTER"))
        );

        org.springframework.mock.web.MockMultipartFile license = new org.springframework.mock.web.MockMultipartFile(
                "licenseImage", "license.jpg", "image/jpeg", new byte[]{1, 2, 3}
        );

        when(userRepository.findById(4L)).thenReturn(Optional.of(renterUser));
        when(cloudinaryService.uploadImage(eq(license), anyString(), anyLong())).thenReturn("https://cloudinary/license.jpg");
        when(renterProfileRepository.findById(4L)).thenReturn(Optional.of(
                RenterProfile.builder().user(renterUser).build()
        ));

        com.driveshare.modules.user.dto.response.UploadGplxResponse response = userProfileService.uploadGplx(license, renterDetails);

        assertNotNull(response);
        assertEquals("https://cloudinary/license.jpg", response.getLicenseImageUrl());
        assertEquals("PENDING", response.getVerificationStatus());
    }
}

