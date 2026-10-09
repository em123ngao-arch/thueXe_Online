package com.driveshare.modules.rental;

import com.driveshare.common.dto.PageResponse;
import com.driveshare.modules.rental.controller.ReviewController;
import com.driveshare.modules.rental.dto.CreateReviewRequest;
import com.driveshare.modules.rental.dto.response.ReviewResponse;
import com.driveshare.modules.rental.service.ReviewService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ReviewController.class)
@AutoConfigureMockMvc(addFilters = false)
class ReviewControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ReviewService reviewService;

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
    @DisplayName("GET /api/v1/public/cars/{carId}/reviews: Lấy danh sách đánh giá công khai thành công")
    void getCarReviews_Success() throws Exception {
        ReviewResponse review = ReviewResponse.builder()
                .reviewId(1L)
                .carId(1L)
                .renterId(10L)
                .renterName("Nguyễn Duy Quân")
                .rating(5)
                .comment("Xe chạy rất êm")
                .createdAt(Instant.now())
                .build();

        PageResponse<ReviewResponse> pageResponse = PageResponse.from(
                new PageImpl<>(List.of(review), PageRequest.of(0, 10), 1)
        );

        when(reviewService.getCarReviews(eq(1L), any(Pageable.class))).thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/public/cars/1/reviews")
                        .param("page", "0")
                        .param("size", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items[0].rating").value(5))
                .andExpect(jsonPath("$.data.items[0].renter_name").value("Nguyễn Duy Quân"));
    }

    @Test
    @DisplayName("GET /api/v1/rentals/{rentalId}/reviews: Lấy đánh giá của đơn thuê thành công")
    void getRentalReview_Success() throws Exception {
        ReviewResponse review = ReviewResponse.builder()
                .reviewId(1L)
                .rentalId(100L)
                .rating(5)
                .comment("Hài lòng")
                .build();

        when(reviewService.getReviewByRentalId(100L)).thenReturn(review);

        mockMvc.perform(get("/api/v1/rentals/100/reviews")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.data.rating").value(5));
    }

    @Test
    @DisplayName("POST /api/v1/rentals/{rentalId}/reviews: Validation thất bại khi rating ngoài khoảng 1-5")
    void createReview_InvalidRating_Returns400() throws Exception {
        CreateReviewRequest invalidRequest = new CreateReviewRequest(6, "Quá 5 sao");

        mockMvc.perform(post("/api/v1/rentals/100/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());
    }
}
