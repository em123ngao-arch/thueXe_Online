package com.driveshare.modules.rental;

import com.driveshare.common.enums.EDisputeStatus;
import com.driveshare.modules.admin.adapter.in.web.AdminRentalController;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.rental.adapter.in.web.RentalController;
import com.driveshare.modules.rental.dto.ResolveDisputeRequest;
import com.driveshare.modules.rental.dto.response.RentalDisputeResponse;
import com.driveshare.modules.rental.repository.RentalRepository;
import com.driveshare.modules.rental.service.RentalDisputeService;
import com.driveshare.modules.rental.service.RentalInspectionService;
import com.driveshare.modules.rental.service.RentalQueryService;
import com.driveshare.modules.rental.service.RentalService;
import com.driveshare.modules.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {RentalController.class, AdminRentalController.class})
@AutoConfigureMockMvc(addFilters = false)
class RentalDisputeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RentalService rentalService;

    @MockBean
    private RentalQueryService rentalQueryService;

    @MockBean
    private RentalInspectionService rentalInspectionService;

    @MockBean
    private RentalDisputeService rentalDisputeService;

    @MockBean
    private RentalRepository rentalRepository;

    @MockBean
    private CarRepository carRepository;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private com.driveshare.modules.admin.service.AdminRentalService adminRentalService;

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
    void setUpSecurity() {
        com.driveshare.modules.user.adapter.out.persistence.Role adminRole = com.driveshare.modules.user.adapter.out.persistence.Role.builder()
                .roleId(1L)
                .roleName(com.driveshare.common.enums.ERole.ROLE_ADMIN)
                .build();
        com.driveshare.modules.user.adapter.out.persistence.User mockUser = com.driveshare.modules.user.adapter.out.persistence.User.builder()
                .userId(100L)
                .username("admin01")
                .email("admin01@example.com")
                .passwordHash("hashed")
                .status(com.driveshare.common.enums.EUserStatus.ACTIVE)
                .roles(java.util.Set.of(adminRole))
                .build();
        com.driveshare.security.CustomUserDetails userDetails = com.driveshare.security.CustomUserDetails.build(mockUser);
        org.springframework.security.core.Authentication auth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities()
        );
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @org.junit.jupiter.api.AfterEach
    void tearDownSecurity() {
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("POST /api/v1/rentals/{id}/report-no-show: Khách gửi khiếu nại multipart thành công -> 200 OK")
    void reportNoShow_Success() throws Exception {
        RentalDisputeResponse responseDto = RentalDisputeResponse.builder()
                .id(1L)
                .rentalId(10L)
                .reporterId(100L)
                .reason("Chủ xe không tới giao xe tại điểm hẹn")
                .proofUrls(List.of("https://res.cloudinary.com/demo/image/upload/proof1.jpg"))
                .status(EDisputeStatus.PENDING)
                .createdAt(Instant.now())
                .build();

        when(rentalDisputeService.reportNoShow(eq(10L), any(), any(), any())).thenReturn(responseDto);

        MockMultipartFile file = new MockMultipartFile(
                "evidenceFiles", "proof.jpg", "image/jpeg", "dummy_bytes".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/rentals/{id}/report-no-show", 10L)
                        .file(file)
                        .param("reason", "Chủ xe không tới giao xe tại điểm hẹn"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    @Test
    @DisplayName("GET /api/v1/rentals/{id}/dispute: Lấy thông tin khiếu nại của đơn thuê -> 200 OK")
    void getDispute_Success() throws Exception {
        RentalDisputeResponse responseDto = RentalDisputeResponse.builder()
                .id(1L)
                .rentalId(10L)
                .reporterId(100L)
                .reason("Chủ xe không tới")
                .status(EDisputeStatus.PENDING)
                .build();

        when(rentalDisputeService.getDisputeByRentalId(eq(10L), any())).thenReturn(responseDto);

        mockMvc.perform(get("/api/v1/rentals/{id}/dispute", 10L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.rental_id").value(10))
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    @Test
    @DisplayName("POST /api/v1/admin/rentals/disputes/{id}/resolve: Admin giải quyết khiếu nại thành công -> 200 OK")
    void resolveDispute_Success() throws Exception {
        ResolveDisputeRequest request = ResolveDisputeRequest.builder()
                .action("REFUND_RENTER")
                .adminNote("Đã xác minh bằng chứng hợp lệ, hoàn cọc cho khách")
                .penaltyAmount(new BigDecimal("600000"))
                .build();

        RentalDisputeResponse responseDto = RentalDisputeResponse.builder()
                .id(1L)
                .rentalId(10L)
                .status(EDisputeStatus.RESOLVED_REFUND)
                .refundAmount(new BigDecimal("600000"))
                .penaltyAmount(new BigDecimal("600000"))
                .adminNote(request.getAdminNote())
                .build();

        when(rentalDisputeService.resolveDispute(eq(1L), any(ResolveDisputeRequest.class), any())).thenReturn(responseDto);

        mockMvc.perform(post("/api/v1/admin/rentals/disputes/{id}/resolve", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.status").value("RESOLVED_REFUND"))
                .andExpect(jsonPath("$.data.refund_amount").value(600000));
    }

    @Test
    @DisplayName("POST /api/v1/admin/rentals/disputes/{id}/resolve: Action trống -> 400 Bad Request")
    void resolveDispute_BlankAction_BadRequest() throws Exception {
        ResolveDisputeRequest request = ResolveDisputeRequest.builder()
                .action("")
                .adminNote("Thiếu action")
                .build();

        mockMvc.perform(post("/api/v1/admin/rentals/disputes/{id}/resolve", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/v1/admin/rentals/disputes: Admin xem toàn bộ danh sách khiếu nại -> 200 OK")
    void getAllDisputes_Success() throws Exception {
        RentalDisputeResponse dispute1 = RentalDisputeResponse.builder().id(1L).status(EDisputeStatus.PENDING).build();
        RentalDisputeResponse dispute2 = RentalDisputeResponse.builder().id(2L).status(EDisputeStatus.RESOLVED_REFUND).build();

        when(rentalDisputeService.getAllDisputes(any())).thenReturn(List.of(dispute1, dispute2));

        mockMvc.perform(get("/api/v1/admin/rentals/disputes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.length()").value(2));
    }
}
