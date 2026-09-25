package com.driveshare.modules.user;

import com.driveshare.common.enums.EUserStatus;
import com.driveshare.common.enums.EVerificationStatus;
import com.driveshare.modules.user.controller.UserProfileController;
import com.driveshare.modules.user.dto.request.OwnerProfileUpdateRequest;
import com.driveshare.modules.user.dto.response.OwnerProfileResponse;
import com.driveshare.modules.user.service.UserProfileService;
import com.driveshare.security.CustomUserDetails;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = UserProfileController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserProfileService userProfileService;

    @MockBean
    private com.driveshare.security.JwtTokenProvider jwtTokenProvider;

    @MockBean
    private com.driveshare.security.CustomUserDetailsService customUserDetailsService;

    @MockBean
    private com.driveshare.modules.auth.repository.AuthSessionRepository authSessionRepository;

    @MockBean
    private com.driveshare.security.JwtAccessDeniedHandler jwtAccessDeniedHandler;

    @MockBean
    private com.driveshare.security.JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        CustomUserDetails userDetails = new CustomUserDetails(
                1L, "duyquan", "quan@example.com", "pass",
                EUserStatus.ACTIVE, List.of(new SimpleGrantedAuthority("ROLE_OWNER"))
        );
        org.springframework.security.core.Authentication auth =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("AC3: Given invalid values are submitted, when I save, then per-field validation errors are shown")
    void updateOwnerProfile_InvalidValues_ReturnsFieldValidationErrors() throws Exception {
        // Submit invalid phone format and invalid idCardNumber
        OwnerProfileUpdateRequest invalidRequest = OwnerProfileUpdateRequest.builder()
                .phone("12345") // Invalid VN phone
                .idCardNumber("abc") // Invalid CCCD
                .bankAccountNumber("12") // Too short (< 6 digits)
                .build();

        CustomUserDetails userDetails = new CustomUserDetails(
                1L, "duyquan", "quan@example.com", "pass",
                EUserStatus.ACTIVE, List.of(new SimpleGrantedAuthority("ROLE_OWNER"))
        );

        mockMvc.perform(put("/api/v1/users/me/owner-profile")
                        .with(user(userDetails))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error_code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("AC1: Given valid values, when I save, then success response is returned")
    void updateOwnerProfile_ValidValues_ReturnsSuccess() throws Exception {
        OwnerProfileUpdateRequest validRequest = OwnerProfileUpdateRequest.builder()
                .fullName("Nguyễn Duy Quân")
                .phone("0901234567")
                .bankAccountNumber("123456789")
                .bankName("Vietcombank")
                .build();

        CustomUserDetails userDetails = new CustomUserDetails(
                1L, "duyquan", "quan@example.com", "pass",
                EUserStatus.ACTIVE, List.of(new SimpleGrantedAuthority("ROLE_OWNER"))
        );

        org.springframework.security.core.Authentication auth =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);

        OwnerProfileResponse mockResponse = OwnerProfileResponse.builder()
                .userId(1L)
                .fullName("Nguyễn Duy Quân")
                .phone("0901234567")
                .bankAccountNumber("123456789")
                .bankName("Vietcombank")
                .verificationStatus(EVerificationStatus.PENDING)
                .build();

        when(userProfileService.updateOwnerProfile(eq(1L), any(), any()))
                .thenReturn(mockResponse);

        mockMvc.perform(put("/api/v1/users/me/owner-profile")
                        .with(user(userDetails))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.user_id").value(1L))
                .andExpect(jsonPath("$.data.full_name").value("Nguyễn Duy Quân"));
    }

    @Test
    @DisplayName("GET /api/v1/users/me: Thành công trả về đúng chuẩn API Spec")
    void getCurrentUser_Success() throws Exception {
        CustomUserDetails userDetails = new CustomUserDetails(
                1L, "duyquan", "quan@example.com", "pass",
                EUserStatus.ACTIVE, List.of(new SimpleGrantedAuthority("ROLE_RENTER"))
        );

        com.driveshare.modules.user.dto.response.CurrentUserProfileResponse mockResponse =
                com.driveshare.modules.user.dto.response.CurrentUserProfileResponse.builder()
                        .userId(1L)
                        .email("quan@example.com")
                        .fullName("Nguyễn Duy Quân")
                        .phoneNumber("0901234567")
                        .address("TP.HCM")
                        .role("RENTER")
                        .status("ACTIVE")
                        .verificationStatus("APPROVED")
                        .lockedFields(List.of("fullName", "nationalId", "nationalIdImages"))
                        .build();

        when(userProfileService.getMyProfile(any())).thenReturn(mockResponse);

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/users/me")
                        .with(user(userDetails)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.userId").value(1L))
                .andExpect(jsonPath("$.data.fullName").value("Nguyễn Duy Quân"))
                .andExpect(jsonPath("$.data.verificationStatus").value("APPROVED"))
                .andExpect(jsonPath("$.data.lockedFields[0]").value("fullName"));
    }

    @Test
    @DisplayName("POST /api/v1/users/me/avatar: Upload file avatar thành công")
    void uploadAvatar_Success() throws Exception {
        CustomUserDetails userDetails = new CustomUserDetails(
                1L, "duyquan", "quan@example.com", "pass",
                EUserStatus.ACTIVE, List.of(new SimpleGrantedAuthority("ROLE_RENTER"))
        );

        org.springframework.mock.web.MockMultipartFile file = new org.springframework.mock.web.MockMultipartFile(
                "file", "avatar.png", "image/png", new byte[]{1, 2, 3}
        );

        when(userProfileService.uploadAvatar(any(), any()))
                .thenReturn(com.driveshare.modules.user.dto.response.UploadAvatarResponse.builder()
                        .avatarUrl("https://res.cloudinary.com/driveshare/avatar.png")
                        .build());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/v1/users/me/avatar")
                        .file(file)
                        .with(user(userDetails))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.avatarUrl").value("https://res.cloudinary.com/driveshare/avatar.png"));
    }

    @Test
    @DisplayName("POST /api/v1/users/me/cccd: Upload CCCD 2 mặt thành công")
    void uploadCccd_Success() throws Exception {
        CustomUserDetails userDetails = new CustomUserDetails(
                1L, "duyquan", "quan@example.com", "pass",
                EUserStatus.ACTIVE, List.of(new SimpleGrantedAuthority("ROLE_RENTER"))
        );

        org.springframework.mock.web.MockMultipartFile front = new org.springframework.mock.web.MockMultipartFile(
                "frontImage", "front.png", "image/png", new byte[]{1, 2, 3}
        );
        org.springframework.mock.web.MockMultipartFile back = new org.springframework.mock.web.MockMultipartFile(
                "backImage", "back.png", "image/png", new byte[]{4, 5, 6}
        );

        when(userProfileService.uploadCccd(any(), any(), any()))
                .thenReturn(com.driveshare.modules.user.dto.response.UploadCccdResponse.builder()
                        .frontImageUrl("https://res.cloudinary.com/front.png")
                        .backImageUrl("https://res.cloudinary.com/back.png")
                        .verificationStatus("PENDING")
                        .build());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart("/api/v1/users/me/cccd")
                        .file(front)
                        .file(back)
                        .with(user(userDetails))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.message").value("Upload CCCD thành công. Đang chờ Admin xét duyệt."))
                .andExpect(jsonPath("$.data.verificationStatus").value("PENDING"));
    }
}

