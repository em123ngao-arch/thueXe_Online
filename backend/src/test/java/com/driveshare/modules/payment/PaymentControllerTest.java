package com.driveshare.modules.payment;

import com.driveshare.common.enums.EPaymentMethod;
import com.driveshare.common.enums.EPaymentStatus;
import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.common.enums.EUserStatus;
import com.driveshare.modules.payment.controller.PaymentController;
import com.driveshare.modules.payment.dto.response.OwnerEarningsResponse;
import com.driveshare.modules.payment.dto.response.PaymentResponse;
import com.driveshare.modules.payment.dto.response.PaymentTransactionDto;
import com.driveshare.modules.payment.service.PaymentService;
import com.driveshare.security.CustomUserDetails;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PaymentController.class)
@AutoConfigureMockMvc(addFilters = false)
class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PaymentService paymentService;

    @MockBean
    private com.driveshare.security.CustomUserDetailsService customUserDetailsService;
    @MockBean
    private com.driveshare.security.JwtTokenProvider jwtTokenProvider;
    @MockBean
    private com.driveshare.modules.auth.repository.AuthSessionRepository authSessionRepository;
    @MockBean
    private com.driveshare.security.JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    @MockBean
    private com.driveshare.security.JwtAccessDeniedHandler jwtAccessDeniedHandler;

    private CustomUserDetails setAuthContext(Long userId, String username, String role) {
        CustomUserDetails userDetails = new CustomUserDetails(
                userId, username, "user@test.com", "pass",
                EUserStatus.ACTIVE,
                List.of(new SimpleGrantedAuthority("ROLE_" + role))
        );
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
        return userDetails;
    }

    @Test
    @DisplayName("CRP-51: POST /api/v1/rentals/{id}/payment trả về 201 Created và dữ liệu VietQR")
    void createRentalPayment_Success() throws Exception {
        CustomUserDetails user = setAuthContext(4L, "renter_nam", "RENTER");

        PaymentResponse response = PaymentResponse.builder()
                .paymentId(100L)
                .rentalId(1L)
                .amount(new BigDecimal("900000"))
                .depositAmount(new BigDecimal("900000"))
                .status(EPaymentStatus.PENDING)
                .paymentMethod(EPaymentMethod.VIETQR)
                .qrCodeUrl("https://img.vietqr.io/image/MB-090123456789-compact2.png")
                .transactionCode("DSPAY1_999")
                .build();

        when(paymentService.createDepositPayment(eq(1L), any(), eq(4L))).thenReturn(response);

        mockMvc.perform(post("/api/v1/rentals/1/payment")
                        .with(user(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.payment_id").value(100))
                .andExpect(jsonPath("$.data.deposit_amount").value(900000))
                .andExpect(jsonPath("$.data.qr_code_url").exists());
    }

    @Test
    @DisplayName("CRP-52 & CRP-53: POST /api/v1/payments/{id}/confirm trả về 200 OK và trạng thái SUCCESS/CONFIRMED")
    void confirmPayment_Success() throws Exception {
        CustomUserDetails user = setAuthContext(4L, "renter_nam", "RENTER");

        PaymentResponse response = PaymentResponse.builder()
                .paymentId(100L)
                .rentalId(1L)
                .amount(new BigDecimal("900000"))
                .status(EPaymentStatus.SUCCESS)
                .rentalStatus(ERentalStatus.CONFIRMED)
                .paidAt(Instant.now())
                .build();

        when(paymentService.confirmPayment(eq(100L), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/payments/100/confirm")
                        .with(user(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.payment_status").value("SUCCESS"))
                .andExpect(jsonPath("$.data.rental_status").value("CONFIRMED"));
    }

    @Test
    @DisplayName("CRP-54: GET /api/v1/owner/earnings trả về 200 OK với doanh thu của chủ xe")
    void getOwnerEarnings_Success() throws Exception {
        CustomUserDetails user = setAuthContext(2L, "owner_lan", "OWNER");

        OwnerEarningsResponse response = OwnerEarningsResponse.builder()
                .ownerId(2L)
                .totalEarnings(new BigDecimal("3500000"))
                .pendingEarnings(new BigDecimal("900000"))
                .totalTransactions(3L)
                .completedRentals(2L)
                .transactions(List.of(
                        PaymentTransactionDto.builder()
                                .paymentId(100L)
                                .rentalId(1L)
                                .carBrand("Toyota")
                                .carModel("Camry")
                                .amount(new BigDecimal("900000"))
                                .status(EPaymentStatus.SUCCESS)
                                .build()
                ))
                .build();

        when(paymentService.getOwnerEarnings(eq(2L))).thenReturn(response);

        mockMvc.perform(get("/api/v1/owner/earnings")
                        .with(user(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.total_earnings").value(3500000))
                .andExpect(jsonPath("$.data.total_transactions").value(3))
                .andExpect(jsonPath("$.data.transactions[0].car_brand").value("Toyota"));
    }
}
