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
}
