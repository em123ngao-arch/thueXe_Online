package com.driveshare.modules.car.service;

import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.car.dto.request.CalendarBlockCreateRequest;
import com.driveshare.modules.car.dto.response.CalendarBlockResponse;
import com.driveshare.modules.car.dto.response.CarCalendarOverviewResponse;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.entity.CarCalendarBlock;
import com.driveshare.modules.car.repository.CarCalendarBlockRepository;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.car.service.impl.CarCalendarServiceImpl;
import com.driveshare.modules.rental.entity.Rental;
import com.driveshare.modules.rental.repository.RentalRepository;
import com.driveshare.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CarCalendarServiceImplTest {

    @Mock
    private CarRepository carRepository;

    @Mock
    private CarCalendarBlockRepository carCalendarBlockRepository;

    @Mock
    private RentalRepository rentalRepository;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @Mock
    private CustomUserDetails userDetails;

    @InjectMocks
    private CarCalendarServiceImpl carCalendarService;

    private final Long OWNER_ID = 100L;
    private final Long CAR_ID = 10L;
    private Car testCar;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.setContext(securityContext);
        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        lenient().when(authentication.isAuthenticated()).thenReturn(true);
        lenient().when(authentication.getPrincipal()).thenReturn(userDetails);
        lenient().when(userDetails.getUserId()).thenReturn(OWNER_ID);

        testCar = Car.builder()
                .carId(CAR_ID)
                .ownerId(OWNER_ID)
                .brand("VinFast")
                .model("VF8")
                .plateNumber("51A-99999")
                .build();
    }

    @Test
    @DisplayName("getCarCalendar thành công: tổng hợp đơn thuê và lịch chặn bận")
    void getCarCalendar_success() {
        LocalDate today = LocalDate.now();
        LocalDate rentStart = today.plusDays(2);
        LocalDate rentEnd = today.plusDays(4);

        Rental rental = Rental.builder()
                .rentalId(1L)
                .carId(CAR_ID)
                .startDate(rentStart)
                .endDate(rentEnd)
                .status(ERentalStatus.CONFIRMED)
                .note("Đi công tác")
                .build();

        LocalDate blockStart = today.plusDays(6);
        LocalDate blockEnd = today.plusDays(7);

        CarCalendarBlock block = CarCalendarBlock.builder()
                .blockId(101L)
                .carId(CAR_ID)
                .startDate(blockStart)
                .endDate(blockEnd)
                .reason("Bảo dưỡng định kỳ")
                .build();

        when(carRepository.findByCarIdAndDeletedAtIsNull(CAR_ID)).thenReturn(Optional.of(testCar));
        when(rentalRepository.findActiveRentalsForCar(eq(CAR_ID), anyList(), any(LocalDate.class)))
                .thenReturn(List.of(rental));
        when(carCalendarBlockRepository.findByCarIdAndEndDateGreaterThanEqualAndDeletedAtIsNullOrderByStartDateAsc(eq(CAR_ID), any(LocalDate.class)))
                .thenReturn(List.of(block));

        CarCalendarOverviewResponse response = carCalendarService.getCarCalendar(CAR_ID, today);

        assertThat(response).isNotNull();
        assertThat(response.getCarId()).isEqualTo(CAR_ID);
        assertThat(response.getItems()).hasSize(2);
        assertThat(response.getUnavailableDates()).contains(rentStart, rentEnd, blockStart, blockEnd);
    }

    @Test
    @DisplayName("addCalendarBlock thành công khi không có xung đột")
    void addCalendarBlock_success() {
        LocalDate start = LocalDate.now().plusDays(5);
        LocalDate end = LocalDate.now().plusDays(7);
        CalendarBlockCreateRequest request = new CalendarBlockCreateRequest(start, end, "Xe đi bảo dưỡng");

        CarCalendarBlock savedBlock = CarCalendarBlock.builder()
                .blockId(200L)
                .carId(CAR_ID)
                .startDate(start)
                .endDate(end)
                .reason("Xe đi bảo dưỡng")
                .build();

        when(carRepository.findByCarIdAndDeletedAtIsNull(CAR_ID)).thenReturn(Optional.of(testCar));
        when(rentalRepository.hasDateConflict(eq(CAR_ID), eq(start), eq(end), anyList())).thenReturn(false);
        when(carCalendarBlockRepository.hasDateConflict(CAR_ID, start, end)).thenReturn(false);
        when(carCalendarBlockRepository.save(any(CarCalendarBlock.class))).thenReturn(savedBlock);

        CalendarBlockResponse response = carCalendarService.addCalendarBlock(CAR_ID, request);

        assertThat(response).isNotNull();
        assertThat(response.getBlockId()).isEqualTo(200L);
        assertThat(response.getReason()).isEqualTo("Xe đi bảo dưỡng");
    }

    @Test
    @DisplayName("addCalendarBlock thất bại khi trùng với đơn thuê xe của khách")
    void addCalendarBlock_conflictWithRental() {
        LocalDate start = LocalDate.now().plusDays(5);
        LocalDate end = LocalDate.now().plusDays(7);
        CalendarBlockCreateRequest request = new CalendarBlockCreateRequest(start, end, "Chặn bận");

        when(carRepository.findByCarIdAndDeletedAtIsNull(CAR_ID)).thenReturn(Optional.of(testCar));
        when(rentalRepository.hasDateConflict(eq(CAR_ID), eq(start), eq(end), anyList())).thenReturn(true);

        assertThatThrownBy(() -> carCalendarService.addCalendarBlock(CAR_ID, request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CALENDAR_BLOCK_CONFLICT);

        verify(carCalendarBlockRepository, never()).save(any());
    }

    @Test
    @DisplayName("addCalendarBlock thất bại khi người dùng không phải chủ sở hữu xe")
    void addCalendarBlock_notOwner() {
        Car otherCar = Car.builder()
                .carId(CAR_ID)
                .ownerId(999L)
                .build();

        when(carRepository.findByCarIdAndDeletedAtIsNull(CAR_ID)).thenReturn(Optional.of(otherCar));

        CalendarBlockCreateRequest request = new CalendarBlockCreateRequest(
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(2),
                "Chặn bận"
        );

        assertThatThrownBy(() -> carCalendarService.addCalendarBlock(CAR_ID, request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CAR_ACCESS_DENIED);
    }

    @Test
    @DisplayName("deleteCalendarBlock thành công (soft delete)")
    void deleteCalendarBlock_success() {
        CarCalendarBlock block = CarCalendarBlock.builder()
                .blockId(50L)
                .carId(CAR_ID)
                .startDate(LocalDate.now().plusDays(3))
                .endDate(LocalDate.now().plusDays(4))
                .build();

        when(carRepository.findByCarIdAndDeletedAtIsNull(CAR_ID)).thenReturn(Optional.of(testCar));
        when(carCalendarBlockRepository.findByBlockIdAndDeletedAtIsNull(50L)).thenReturn(Optional.of(block));

        carCalendarService.deleteCalendarBlock(CAR_ID, 50L);

        verify(carCalendarBlockRepository).save(argThat(b -> b.getDeletedAt() != null && b.getDeletedBy().equals(OWNER_ID)));
    }
}
