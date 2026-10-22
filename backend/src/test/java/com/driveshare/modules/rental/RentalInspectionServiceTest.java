package com.driveshare.modules.rental;

import com.driveshare.common.enums.EInspectionType;
import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.rental.dto.CheckInRequest;
import com.driveshare.modules.rental.dto.CheckOutRequest;
import com.driveshare.modules.rental.dto.response.RentalInspectionResponse;
import com.driveshare.modules.rental.entity.Rental;
import com.driveshare.modules.rental.entity.RentalInspection;
import com.driveshare.modules.rental.repository.RentalInspectionRepository;
import com.driveshare.modules.rental.repository.RentalRepository;
import com.driveshare.modules.rental.service.impl.RentalInspectionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RentalInspectionServiceTest {

    @Mock
    private RentalRepository rentalRepository;

    @Mock
    private RentalInspectionRepository rentalInspectionRepository;

    @Mock
    private CarRepository carRepository;

    @InjectMocks
    private RentalInspectionServiceImpl rentalInspectionService;

    private final Long ownerId = 200L;
    private final Long renterId = 100L;
    private final Long carId = 1L;
    private final Long rentalId = 10L;

    private Car car;
    private Rental rental;

    @BeforeEach
    void setUp() {
        car = Car.builder()
                .carId(carId)
                .ownerId(ownerId)
                .brand("VinFast")
                .model("VF8")
                .plateNumber("30A-99999")
                .pricePerDay(BigDecimal.valueOf(1_000_000))
                .hasDriverService(true)
                .driverFeePerDay(BigDecimal.valueOf(500_000))
                .build();

        rental = Rental.builder()
                .rentalId(rentalId)
                .carId(carId)
                .renterId(renterId)
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(3))
                .totalDays(2)
                .pricePerDay(BigDecimal.valueOf(1_000_000))
                .totalPrice(BigDecimal.valueOf(2_000_000))
                .depositAmount(BigDecimal.valueOf(600_000))
                .status(ERentalStatus.CONFIRMED)
                .build();
    }

    @Test
    @DisplayName("Sprint 3 - Check-in: Bàn giao xe thành công khi đơn ở trạng thái CONFIRMED")
    void checkIn_Success() {
        CheckInRequest request = new CheckInRequest(
                12500,
                90,
                "https://images.com/front.jpg,https://images.com/back.jpg",
                "Xe sạch, không trầy xước"
        );

        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(carRepository.findById(carId)).thenReturn(Optional.of(car));
        when(rentalInspectionRepository.existsByRentalIdAndInspectionType(rentalId, EInspectionType.CHECK_IN)).thenReturn(false);
        when(rentalInspectionRepository.save(any(RentalInspection.class))).thenAnswer(inv -> {
            RentalInspection ins = inv.getArgument(0);
            ins.setInspectionId(1L);
            return ins;
        });

        RentalInspectionResponse response = rentalInspectionService.checkIn(rentalId, ownerId, request);

        assertThat(response).isNotNull();
        assertThat(response.getInspectionId()).isEqualTo(1L);
        assertThat(response.getRentalId()).isEqualTo(rentalId);
        assertThat(response.getInspectionType()).isEqualTo(EInspectionType.CHECK_IN);
        assertThat(response.getOdoMeter()).isEqualTo(12500);
        assertThat(response.getFuelLevel()).isEqualTo(90);
        assertThat(response.getPerformedBy()).isEqualTo(ownerId);

        assertThat(rental.getStatus()).isEqualTo(ERentalStatus.IN_PROGRESS);
        verify(rentalRepository).save(rental);
        verify(rentalInspectionRepository).save(any(RentalInspection.class));
    }

    @Test
    @DisplayName("Sprint 3 - Check-in: Ném CAR_ACCESS_DENIED khi không phải chủ xe thao tác")
    void checkIn_WhenNotOwner_ThrowsException() {
        CheckInRequest request = new CheckInRequest(12500, 90, null, null);
        Long wrongOwnerId = 999L;

        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(carRepository.findById(carId)).thenReturn(Optional.of(car));

        assertThatThrownBy(() -> rentalInspectionService.checkIn(rentalId, wrongOwnerId, request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.CAR_ACCESS_DENIED));

        verify(rentalInspectionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Sprint 3 - Check-in: Ném RENTAL_CANNOT_BE_STARTED khi đơn chưa CONFIRMED")
    void checkIn_WhenNotConfirmed_ThrowsException() {
        rental.setStatus(ERentalStatus.WAITING_PAYMENT);
        CheckInRequest request = new CheckInRequest(12500, 90, null, null);

        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(carRepository.findById(carId)).thenReturn(Optional.of(car));

        assertThatThrownBy(() -> rentalInspectionService.checkIn(rentalId, ownerId, request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.RENTAL_CANNOT_BE_STARTED));

        verify(rentalInspectionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Sprint 3 - Check-in: Ném INSPECTION_ALREADY_EXISTS khi đơn đã check-in trước đó")
    void checkIn_WhenAlreadyCheckedIn_ThrowsException() {
        CheckInRequest request = new CheckInRequest(12500, 90, null, null);

        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(carRepository.findById(carId)).thenReturn(Optional.of(car));
        when(rentalInspectionRepository.existsByRentalIdAndInspectionType(rentalId, EInspectionType.CHECK_IN)).thenReturn(true);

        assertThatThrownBy(() -> rentalInspectionService.checkIn(rentalId, ownerId, request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.INSPECTION_ALREADY_EXISTS));

        verify(rentalInspectionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Sprint 3 - Check-out: Nghiệm thu trả xe thành công khi đơn ở trạng thái IN_PROGRESS")
    void checkOut_Success() {
        rental.setStatus(ERentalStatus.IN_PROGRESS);
        CheckOutRequest request = new CheckOutRequest(
                12800,
                85,
                BigDecimal.valueOf(150_000),
                "Phụ phí rửa xe và vượt 30km",
                "https://images.com/return.jpg",
                "Trả xe đúng hẹn, xe hơi dơ"
        );

        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(carRepository.findById(carId)).thenReturn(Optional.of(car));
        when(rentalInspectionRepository.existsByRentalIdAndInspectionType(rentalId, EInspectionType.CHECK_OUT)).thenReturn(false);
        when(rentalInspectionRepository.save(any(RentalInspection.class))).thenAnswer(inv -> {
            RentalInspection ins = inv.getArgument(0);
            ins.setInspectionId(2L);
            return ins;
        });

        RentalInspectionResponse response = rentalInspectionService.checkOut(rentalId, ownerId, request);

        assertThat(response).isNotNull();
        assertThat(response.getInspectionId()).isEqualTo(2L);
        assertThat(response.getInspectionType()).isEqualTo(EInspectionType.CHECK_OUT);
        assertThat(response.getOdoMeter()).isEqualTo(12800);
        assertThat(response.getFuelLevel()).isEqualTo(85);
        assertThat(response.getExtraFee()).isEqualByComparingTo(BigDecimal.valueOf(150_000));
        assertThat(response.getExtraFeeReason()).isEqualTo("Phụ phí rửa xe và vượt 30km");

        assertThat(rental.getStatus()).isEqualTo(ERentalStatus.COMPLETED);
        verify(rentalRepository).save(rental);
        verify(rentalInspectionRepository).save(any(RentalInspection.class));
    }

    @Test
    @DisplayName("Sprint 3 - Check-out: Ném RENTAL_CANNOT_BE_COMPLETED khi đơn chưa IN_PROGRESS")
    void checkOut_WhenNotInProgress_ThrowsException() {
        rental.setStatus(ERentalStatus.CONFIRMED);
        CheckOutRequest request = new CheckOutRequest(12800, 85, BigDecimal.ZERO, null, null, null);

        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(carRepository.findById(carId)).thenReturn(Optional.of(car));

        assertThatThrownBy(() -> rentalInspectionService.checkOut(rentalId, ownerId, request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.RENTAL_CANNOT_BE_COMPLETED));

        verify(rentalInspectionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Sprint 3 - Xem biên bản: Lấy danh sách thành công cho chủ xe hoặc khách thuê")
    void getInspections_Success() {
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(carRepository.findById(carId)).thenReturn(Optional.of(car));

        RentalInspection checkIn = RentalInspection.builder()
                .inspectionId(1L)
                .rentalId(rentalId)
                .inspectionType(EInspectionType.CHECK_IN)
                .odoMeter(10000)
                .fuelLevel(100)
                .performedBy(ownerId)
                .createdAt(Instant.now())
                .build();

        when(rentalInspectionRepository.findByRentalIdOrderByCreatedAtAsc(rentalId))
                .thenReturn(List.of(checkIn));

        List<RentalInspectionResponse> list = rentalInspectionService.getInspections(rentalId, renterId);

        assertThat(list).hasSize(1);
        assertThat(list.get(0).getInspectionType()).isEqualTo(EInspectionType.CHECK_IN);
    }

    @Test
    @DisplayName("Sprint 3 - Xem biên bản: Ném UNAUTHORIZED khi người dùng lạ cố gắng truy cập")
    void getInspections_WhenStranger_ThrowsException() {
        Long strangerId = 999L;
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(carRepository.findById(carId)).thenReturn(Optional.of(car));

        assertThatThrownBy(() -> rentalInspectionService.getInspections(rentalId, strangerId))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.UNAUTHORIZED));
    }
}
