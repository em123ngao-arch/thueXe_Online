package com.driveshare.modules.rental;

import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.modules.rental.controller.RentalController;
import com.driveshare.modules.rental.dto.CreateRentalRequest;
import com.driveshare.modules.rental.dto.RentalResponse;
import com.driveshare.modules.rental.service.RentalService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = RentalController.class)
@AutoConfigureMockMvc(addFilters = false)
class RentalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private RentalService rentalService;

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
    @DisplayName("POST /api/v1/rentals: Gửi yêu cầu thuê xe thành công -> trả 200 OK với thông tin đơn PENDING")
    void createRental_Success_Returns200() throws Exception {
        CreateRentalRequest request = CreateRentalRequest.builder()
                .carId(1L)
                .startDate(LocalDate.of(2026, 11, 1))
                .endDate(LocalDate.of(2026, 11, 3))
                .note("Yêu cầu xe sạch")
                .build();

        RentalResponse mockResponse = RentalResponse.builder()
                .rentalId(101L)
                .carId(1L)
                .renterId(5L)
                .startDate(LocalDate.of(2026, 11, 1))
                .endDate(LocalDate.of(2026, 11, 3))
                .totalDays(2)
                .pricePerDay(BigDecimal.valueOf(600_000))
                .totalPrice(BigDecimal.valueOf(1_200_000))
                .depositAmount(BigDecimal.valueOf(360_000))
                .status(ERentalStatus.PENDING)
                .note("Yêu cầu xe sạch")
                .build();

        when(rentalService.createRentalRequest(any(CreateRentalRequest.class))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/rentals")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.rental_id").value(101))
                .andExpect(jsonPath("$.data.car_id").value(1))
                .andExpect(jsonPath("$.data.total_days").value(2))
                .andExpect(jsonPath("$.data.total_price").value(1200000))
                .andExpect(jsonPath("$.data.deposit_amount").value(360000))
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    @Test
    @DisplayName("POST /api/v1/rentals: Thiếu trường bắt buộc (carId) -> trả 400 Bad Request")
    void createRental_MissingCarId_Returns400() throws Exception {
        CreateRentalRequest invalidRequest = CreateRentalRequest.builder()
                .startDate(LocalDate.of(2026, 11, 1))
                .endDate(LocalDate.of(2026, 11, 3))
                .build();

        mockMvc.perform(post("/api/v1/rentals")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }
}
