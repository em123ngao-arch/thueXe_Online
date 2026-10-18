package com.driveshare.modules.admin;

import com.driveshare.common.enums.BankVerificationStatus;
import com.driveshare.modules.admin.controller.AdminUserController;
import com.driveshare.modules.admin.dto.request.VerifyBankRequest;
import com.driveshare.modules.admin.dto.response.UserItemResponse;
import com.driveshare.modules.admin.service.AdminUserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AdminUserController.class)
@AutoConfigureMockMvc(addFilters = false)
class AdminUserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AdminUserService adminUserService;

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

    @Test
    @DisplayName("Admin Controller - PUT /api/v1/admin/users/{userId}/verify-bank - Thành công khi duyệt VERIFIED")
    void verifyBank_Approve_Success() throws Exception {
        VerifyBankRequest request = VerifyBankRequest.builder()
                .status(BankVerificationStatus.VERIFIED)
                .build();

        UserItemResponse mockResponse = UserItemResponse.builder()
                .userId(3L)
                .username("tuan_owner")
                .bankVerificationStatus(BankVerificationStatus.VERIFIED)
                .build();

        when(adminUserService.verifyBank(eq(3L), any(VerifyBankRequest.class), any(), any()))
                .thenReturn(mockResponse);

        mockMvc.perform(put("/api/v1/admin/users/3/verify-bank")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Đã phê duyệt tài khoản ngân hàng thành công"))
                .andExpect(jsonPath("$.data.bank_verification_status").value("VERIFIED"));
    }

    @Test
    @DisplayName("Admin Controller - PUT /api/v1/admin/users/{userId}/verify-bank - Thành công khi từ chối REJECTED")
    void verifyBank_Reject_Success() throws Exception {
        VerifyBankRequest request = VerifyBankRequest.builder()
                .status(BankVerificationStatus.REJECTED)
                .reason("Tên chủ thẻ không khớp với họ tên CCCD")
                .build();

        UserItemResponse mockResponse = UserItemResponse.builder()
                .userId(3L)
                .username("tuan_owner")
                .bankVerificationStatus(BankVerificationStatus.REJECTED)
                .bankRejectionReason("Tên chủ thẻ không khớp với họ tên CCCD")
                .build();

        when(adminUserService.verifyBank(eq(3L), any(VerifyBankRequest.class), any(), any()))
                .thenReturn(mockResponse);

        mockMvc.perform(put("/api/v1/admin/users/3/verify-bank")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Đã từ chối tài khoản ngân hàng"))
                .andExpect(jsonPath("$.data.bank_verification_status").value("REJECTED"))
                .andExpect(jsonPath("$.data.bank_rejection_reason").value("Tên chủ thẻ không khớp với họ tên CCCD"));
    }

    @Test
    @DisplayName("Admin Controller - PUT /api/v1/admin/users/{userId}/verify-bank - Thất bại 400 khi thiếu status")
    void verifyBank_MissingStatus_BadRequest() throws Exception {
        String invalidPayload = "{\"reason\": \"Thiếu status\"}";

        mockMvc.perform(put("/api/v1/admin/users/3/verify-bank")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidPayload))
                .andExpect(status().isBadRequest());
    }
}
