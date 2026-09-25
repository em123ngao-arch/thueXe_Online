package com.driveshare.modules.car;

import com.driveshare.common.dto.PageResponse;
import com.driveshare.common.enums.ECarStatus;
import com.driveshare.common.enums.EFuelType;
import com.driveshare.common.enums.ETransmission;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.car.dto.request.CarSearchFilterRequest;
import com.driveshare.modules.car.dto.response.CarResponse;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.car.service.impl.CarSearchServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.mockito.ArgumentMatchers;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CarSearchServiceTest {

    @Mock
    private CarRepository carRepository;

    @InjectMocks
    private CarSearchServiceImpl carSearchService;

    private Car sampleCar;

    @BeforeEach
    void setUp() {
        sampleCar = Car.builder()
                .carId(1L)
                .ownerId(10L)
                .plateNumber("51A-12345")
                .brand("Toyota")
                .model("Camry")
                .year(2022)
                .seats(5)
                .transmission(ETransmission.AUTOMATIC)
                .fuelType(EFuelType.GASOLINE)
                .pricePerDay(new BigDecimal("1000000"))
                .province("TP. Hồ Chí Minh")
                .status(ECarStatus.ACTIVE)
                .build();
    }

    @Test
    @DisplayName("CRP-35: Tìm kiếm xe mặc định trả về danh sách xe ACTIVE")
    void searchPublicCars_DefaultFilter_Success() {
        CarSearchFilterRequest request = new CarSearchFilterRequest();
        Page<Car> page = new PageImpl<>(List.of(sampleCar));

        when(carRepository.findAll(ArgumentMatchers.<Specification<Car>>any(), any(Pageable.class))).thenReturn(page);

        PageResponse<CarResponse> result = carSearchService.searchPublicCars(request);

        assertNotNull(result);
        assertEquals(1, result.getItems().size());
        assertEquals("Toyota", result.getItems().get(0).getBrand());
        assertEquals("Camry", result.getItems().get(0).getModel());
        verify(carRepository).findAll(ArgumentMatchers.<Specification<Car>>any(), any(Pageable.class));
    }

    @Test
    @DisplayName("CRP-38: Tìm kiếm xe với ngày kết thúc trước ngày bắt đầu ném INVALID_RENTAL_DATES")
    void searchPublicCars_InvalidDates_ThrowsException() {
        CarSearchFilterRequest request = CarSearchFilterRequest.builder()
                .startDate(LocalDate.now().plusDays(5))
                .endDate(LocalDate.now().plusDays(2))
                .build();

        AppException ex = assertThrows(AppException.class, () -> carSearchService.searchPublicCars(request));
        assertEquals(ErrorCode.INVALID_RENTAL_DATES, ex.getErrorCode());
        verify(carRepository, never()).findAll(ArgumentMatchers.<Specification<Car>>any(), any(Pageable.class));
    }

    @Test
    @DisplayName("CRP-35 & CRP-38: Tìm kiếm xe với đầy đủ bộ lọc đa tiêu chí và khoảng ngày hợp lệ")
    void searchPublicCars_WithAllFilters_Success() {
        CarSearchFilterRequest request = CarSearchFilterRequest.builder()
                .brand("Toyota")
                .model("Camry")
                .priceMin(new BigDecimal("500000"))
                .priceMax(new BigDecimal("1500000"))
                .seats(5)
                .transmission(ETransmission.AUTOMATIC)
                .fuelType(EFuelType.GASOLINE)
                .province("Hồ Chí Minh")
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(3))
                .sortBy("price_asc")
                .page(0)
                .size(10)
                .build();

        Page<Car> page = new PageImpl<>(List.of(sampleCar));
        when(carRepository.findAll(ArgumentMatchers.<Specification<Car>>any(), any(Pageable.class))).thenReturn(page);

        PageResponse<CarResponse> result = carSearchService.searchPublicCars(request);

        assertNotNull(result);
        assertEquals(1, result.getItems().size());
        assertEquals(1, result.getPagination().getTotalItems());
    }

    @Test
    @DisplayName("CRP-36: Sắp xếp theo giá tăng dần (price_asc)")
    void searchPublicCars_SortPriceAsc_Success() {
        CarSearchFilterRequest request = CarSearchFilterRequest.builder()
                .sortBy("price_asc")
                .build();

        Page<Car> page = new PageImpl<>(List.of(sampleCar));
        when(carRepository.findAll(ArgumentMatchers.<Specification<Car>>any(), any(Pageable.class))).thenReturn(page);

        PageResponse<CarResponse> result = carSearchService.searchPublicCars(request);
        assertNotNull(result);
        verify(carRepository).findAll(ArgumentMatchers.<Specification<Car>>any(), any(Pageable.class));
    }

    @Test
    @DisplayName("CRP-36: Sắp xếp theo năm sản xuất giảm dần (year_desc)")
    void searchPublicCars_SortYearDesc_Success() {
        CarSearchFilterRequest request = CarSearchFilterRequest.builder()
                .sortBy("year_desc")
                .build();

        Page<Car> page = new PageImpl<>(List.of(sampleCar));
        when(carRepository.findAll(ArgumentMatchers.<Specification<Car>>any(), any(Pageable.class))).thenReturn(page);

        PageResponse<CarResponse> result = carSearchService.searchPublicCars(request);
        assertNotNull(result);
        verify(carRepository).findAll(ArgumentMatchers.<Specification<Car>>any(), any(Pageable.class));
    }
}
