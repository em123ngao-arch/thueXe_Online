package com.driveshare.modules.rental;

import com.driveshare.common.dto.ErrorResponse;
import com.driveshare.common.enums.EDisputeStatus;
import com.driveshare.common.enums.ERole;
import com.driveshare.common.enums.EUserStatus;
import com.driveshare.modules.admin.adapter.in.web.AdminRentalController;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.oauth2.adapter.in.web.OAuth2SuccessHandler;
import com.driveshare.modules.rental.dto.ResolveDisputeRequest;
import com.driveshare.modules.rental.dto.response.RentalDisputeResponse;
import com.driveshare.modules.rental.repository.RentalRepository;
import com.driveshare.modules.rental.service.RentalDisputeService;
import com.driveshare.modules.user.adapter.out.persistence.Role;
import com.driveshare.modules.user.adapter.out.persistence.User;
import com.driveshare.modules.user.repository.UserRepository;
import com.driveshare.security.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AdminRentalController.class)
@Import({SecurityConfig.class, JwtAuthenticationEntryPoint.class, JwtAccessDeniedHandler.class})
@AutoConfigureMockMvc
class AdminRentalSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RentalRepository rentalRepository;

    @MockBean
    private CarRepository carRepository;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private RentalDisputeService rentalDisputeService;

    @MockBean
    private CustomUserDetailsService userDetailsService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private OAuth2SuccessHandler oAuth2SuccessHandler;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private com.driveshare.modules.admin.service.AdminRentalService adminRentalService;

    private CustomUserDetails adminUserDetails;
    private CustomUserDetails staffUserDetails;
    private CustomUserDetails renterUserDetails;
    private CustomUserDetails ownerUserDetails;

    @BeforeEach
    void setupFilterAndUsers() throws Exception {
        doAnswer(invocation -> {
            HttpServletRequest req = invocation.getArgument(0);
            HttpServletResponse res = invocation.getArgument(1);
            FilterChain chain = invocation.getArgument(2);
            chain.doFilter(req, res);
            return null;
        }).when(jwtAuthenticationFilter).doFilter(any(), any(), any());

        Role adminRole = Role.builder().roleId(1L).roleName(ERole.ROLE_ADMIN).build();
        User admin = User.builder().userId(1L).username("admin").roles(Set.of(adminRole)).status(EUserStatus.ACTIVE).passwordHash("hash").build();
        adminUserDetails = CustomUserDetails.build(admin);

        Role staffRole = Role.builder().roleId(2L).roleName(ERole.ROLE_STAFF).build();
        User staff = User.builder().userId(2L).username("staff").roles(Set.of(staffRole)).status(EUserStatus.ACTIVE).passwordHash("hash").build();
        staffUserDetails = CustomUserDetails.build(staff);

        Role renterRole = Role.builder().roleId(3L).roleName(ERole.ROLE_RENTER).build();
        User renter = User.builder().userId(3L).username("renter").roles(Set.of(renterRole)).status(EUserStatus.ACTIVE).passwordHash("hash").build();
        renterUserDetails = CustomUserDetails.build(renter);

        Role ownerRole = Role.builder().roleId(4L).roleName(ERole.ROLE_OWNER).build();
        User owner = User.builder().userId(4L).username("owner").roles(Set.of(ownerRole)).status(EUserStatus.ACTIVE).passwordHash("hash").build();
        ownerUserDetails = CustomUserDetails.build(owner);
    }

    @Test
    @DisplayName("Edge Case 1 - Chưa đăng nhập gọi GET /api/v1/admin/rentals/disputes -> HTTP 401 UNAUTHORIZED")
    void getAllDisputes_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/rentals/disputes"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error_code").value("UNAUTHENTICATED"));
    }

    @Test
    @DisplayName("Edge Case 1 - Chưa đăng nhập gọi POST /api/v1/admin/rentals/disputes/1/resolve -> HTTP 401 UNAUTHORIZED")
    void resolveDispute_Unauthenticated_Returns401() throws Exception {
        ResolveDisputeRequest request = ResolveDisputeRequest.builder()
                .action("REFUND_RENTER")
                .adminNote("Unauthenticated test")
                .build();

        mockMvc.perform(post("/api/v1/admin/rentals/disputes/1/resolve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error_code").value("UNAUTHENTICATED"));
    }

    @Test
    @DisplayName("Edge Case 1 - Khách thuê (ROLE_RENTER) gọi POST resolve -> HTTP 403 FORBIDDEN")
    void resolveDispute_RenterRole_Returns403() throws Exception {
        ResolveDisputeRequest request = ResolveDisputeRequest.builder()
                .action("REFUND_RENTER")
                .adminNote("Renter hacking admin endpoint")
                .build();

        mockMvc.perform(post("/api/v1/admin/rentals/disputes/1/resolve")
                        .with(user(renterUserDetails))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error_code").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("Edge Case 1 - Chủ xe (ROLE_OWNER) gọi POST resolve -> HTTP 403 FORBIDDEN")
    void resolveDispute_OwnerRole_Returns403() throws Exception {
        ResolveDisputeRequest request = ResolveDisputeRequest.builder()
                .action("REFUND_RENTER")
                .adminNote("Owner trying to resolve")
                .build();

        mockMvc.perform(post("/api/v1/admin/rentals/disputes/1/resolve")
                        .with(user(ownerUserDetails))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error_code").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("Edge Case 1 - Khách thuê (ROLE_RENTER) xem danh sách khiếu nại -> HTTP 403 FORBIDDEN")
    void getAllDisputes_RenterRole_Returns403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/rentals/disputes")
                        .with(user(renterUserDetails)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error_code").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("Admin (ROLE_ADMIN) xem danh sách khiếu nại -> HTTP 200 OK")
    void getAllDisputes_AdminRole_Returns200() throws Exception {
        when(rentalDisputeService.getAllDisputes(any())).thenReturn(List.of(
                RentalDisputeResponse.builder().id(1L).status(EDisputeStatus.PENDING).build()
        ));

        mockMvc.perform(get("/api/v1/admin/rentals/disputes")
                        .with(user(adminUserDetails)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    @DisplayName("Staff (ROLE_STAFF) xem danh sách khiếu nại -> HTTP 200 OK")
    void getAllDisputes_StaffRole_Returns200() throws Exception {
        when(rentalDisputeService.getAllDisputes(any())).thenReturn(List.of(
                RentalDisputeResponse.builder().id(1L).status(EDisputeStatus.PENDING).build()
        ));

        mockMvc.perform(get("/api/v1/admin/rentals/disputes")
                        .with(user(staffUserDetails)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200));
    }

    @Test
    @DisplayName("Admin (ROLE_ADMIN) giải quyết khiếu nại hợp lệ -> HTTP 200 OK")
    void resolveDispute_AdminRole_Returns200() throws Exception {
        ResolveDisputeRequest request = ResolveDisputeRequest.builder()
                .action("REFUND_RENTER")
                .adminNote("Chấp thuận hoàn tiền")
                .penaltyAmount(new BigDecimal("600000"))
                .build();

        RentalDisputeResponse response = RentalDisputeResponse.builder()
                .id(1L)
                .rentalId(10L)
                .status(EDisputeStatus.RESOLVED_REFUND)
                .refundAmount(new BigDecimal("600000"))
                .penaltyAmount(new BigDecimal("600000"))
                .resolvedBy(1L)
                .build();

        when(rentalDisputeService.resolveDispute(eq(1L), any(ResolveDisputeRequest.class), eq(1L)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/admin/rentals/disputes/1/resolve")
                        .with(user(adminUserDetails))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.status").value("RESOLVED_REFUND"));
    }

    @Test
    @DisplayName("Staff (ROLE_STAFF) giải quyết khiếu nại hợp lệ -> HTTP 200 OK")
    void resolveDispute_StaffRole_Returns200() throws Exception {
        ResolveDisputeRequest request = ResolveDisputeRequest.builder()
                .action("REJECT")
                .adminNote("Từ chối do chủ xe đã giao xe đúng hẹn")
                .build();

        RentalDisputeResponse response = RentalDisputeResponse.builder()
                .id(1L)
                .rentalId(10L)
                .status(EDisputeStatus.REJECTED)
                .resolvedBy(2L)
                .build();

        when(rentalDisputeService.resolveDispute(eq(1L), any(ResolveDisputeRequest.class), eq(2L)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/admin/rentals/disputes/1/resolve")
                        .with(user(staffUserDetails))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.status").value("REJECTED"));
    }

    @Test
    @DisplayName("TC-Q01: User thường (ROLE_RENTER) gọi API dossier -> Nhận HTTP 403 Forbidden")
    void getDossier_RenterRole_Returns403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/rentals/1/dossier")
                        .with(user(renterUserDetails)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error_code").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("TC-Q01 (bổ sung): User thường (ROLE_RENTER) gọi GET overdue -> Nhận HTTP 403 Forbidden")
    void getOverdueRentals_RenterRole_Returns403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/rentals/overdue")
                        .with(user(renterUserDetails)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error_code").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("Admin (ROLE_ADMIN) gọi GET /api/v1/admin/rentals/overdue -> Nhận HTTP 200 OK")
    void getOverdueRentals_AdminRole_Returns200() throws Exception {
        when(adminRentalService.getOverdueRentals()).thenReturn(List.of(
                com.driveshare.modules.admin.dto.response.OverdueRentalResponse.builder()
                        .rentalId(1L)
                        .overdueHours(24)
                        .build()
        ));

        mockMvc.perform(get("/api/v1/admin/rentals/overdue")
                        .with(user(adminUserDetails)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.length()").value(1));
    }
}
