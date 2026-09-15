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
import org.springframework.security.test.context.support.WithMockUser;
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
}
