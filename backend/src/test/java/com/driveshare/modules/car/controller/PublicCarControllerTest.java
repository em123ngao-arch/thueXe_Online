package com.driveshare.modules.car.controller;

import com.driveshare.common.dto.PageResponse;
import com.driveshare.common.enums.ECarStatus;
import com.driveshare.common.enums.EFuelType;
import com.driveshare.common.enums.ETransmission;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.car.dto.response.CarDetailResponse;
import com.driveshare.modules.car.dto.response.CarImageResponse;
import com.driveshare.modules.car.dto.response.CarResponse;
import com.driveshare.modules.car.service.CarService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PublicCarController.class)
@AutoConfigureMockMvc(addFilters = false)
class PublicCarControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CarService carService;

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
    @DisplayName("CRP-37: GET /api/v1/public/cars/{carId} - Thành công trả về thông tin chi tiết xe và thông tin chủ xe")
    void getCarDetail_Success() throws Exception {
        Long carId = 1L;
        CarDetailResponse mockDetail = CarDetailResponse.builder()
                .carId(carId)
                .plateNumberMasked("51A-123.XX")
                .brand("Toyota")
                .model("Camry")
                .year(2022)
                .color("Trắng")
                .seats(5)
                .transmission(ETransmission.AUTOMATIC)
                .fuelType(EFuelType.GASOLINE)
                .pricePerDay(BigDecimal.valueOf(1200000))
                .address("123 Nguyễn Huệ, Quận 1")
                .province("TP. Hồ Chí Minh")
                .description("Xe đẹp, máy êm, bảo dưỡng định kỳ")
                .features("GPS, Bluetooth, Camera lùi")
                .thumbnailUrl("https://res.cloudinary.com/driveshare/image/upload/car1.jpg")
                .status(ECarStatus.ACTIVE)
                .images(List.of(
                        CarImageResponse.builder().imageId(10L).imageUrl("https://res.cloudinary.com/driveshare/img1.jpg").isThumbnail(true).build()
                ))
                .owner(CarDetailResponse.OwnerInfo.builder()
                        .ownerId(100L)
                        .fullName("Nguyễn Văn Hùng")
                        .avatarUrl("https://res.cloudinary.com/driveshare/avatar.jpg")
                        .rating(5.0)
                        .totalCars(3L)
                        .build())
                .unavailableDates(List.of())
                .build();

        when(carService.getPublicCarDetail(carId)).thenReturn(mockDetail);

        mockMvc.perform(get("/api/v1/public/cars/{carId}", carId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Lấy thông tin chi tiết xe thành công"))
                .andExpect(jsonPath("$.data.car_id").value(1L))
                .andExpect(jsonPath("$.data.plate_number_masked").value("51A-123.XX"))
                .andExpect(jsonPath("$.data.brand").value("Toyota"))
                .andExpect(jsonPath("$.data.model").value("Camry"))
                .andExpect(jsonPath("$.data.year").value(2022))
                .andExpect(jsonPath("$.data.price_per_day").value(1200000))
                .andExpect(jsonPath("$.data.owner.owner_id").value(100L))
                .andExpect(jsonPath("$.data.owner.full_name").value("Nguyễn Văn Hùng"))
                .andExpect(jsonPath("$.data.owner.total_cars").value(3));
    }

    @Test
    @DisplayName("CRP-37: GET /api/v1/public/cars/{carId} - Xe không tồn tại trả về lỗi 404 CAR_NOT_FOUND")
    void getCarDetail_NotFound() throws Exception {
        Long carId = 999L;
        when(carService.getPublicCarDetail(carId))
                .thenThrow(new AppException(ErrorCode.CAR_NOT_FOUND));

        mockMvc.perform(get("/api/v1/public/cars/{carId}", carId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error_code").value("CAR_NOT_FOUND"));
    }

    @Test
    @DisplayName("BR-04-2: GET /api/v1/public/cars - Lấy danh sách xe công khai thành công")
    void getPublicCars_Success() throws Exception {
        CarResponse carResponse = CarResponse.builder()
                .carId(1L)
                .brand("Honda")
                .model("Civic")
                .status(ECarStatus.ACTIVE)
                .build();

        PageResponse<CarResponse> pageResponse = PageResponse.from(
                new PageImpl<>(List.of(carResponse), PageRequest.of(0, 10), 1)
        );

        when(carService.getPublicActiveCars(eq(0), eq(10))).thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/public/cars")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items[0].brand").value("Honda"));
    }
}
