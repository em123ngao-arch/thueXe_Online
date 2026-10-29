package com.driveshare.modules.rental;

import com.driveshare.common.enums.EDisputeStatus;
import com.driveshare.common.enums.EInspectionStatus;
import com.driveshare.common.enums.EInspectionType;
import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.rental.dto.CheckInRequest;
import com.driveshare.modules.rental.dto.CheckOutRequest;
import com.driveshare.modules.rental.dto.ConfirmInspectionRequest;
import com.driveshare.modules.rental.dto.response.RentalInspectionResponse;
import com.driveshare.modules.rental.entity.Rental;
import com.driveshare.modules.rental.entity.RentalDispute;
import com.driveshare.modules.rental.entity.RentalInspection;
import com.driveshare.modules.rental.repository.RentalDisputeRepository;
import com.driveshare.modules.rental.repository.RentalInspectionRepository;
import com.driveshare.modules.rental.repository.RentalRepository;
import com.driveshare.modules.rental.service.impl.RentalInspectionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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

    @Mock
    private RentalDisputeRepository rentalDisputeRepository;

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

    // =========================================================================
    // TC-I01: Chủ xe tạo Check-in -> PENDING_RENTER_CONFIRMATION, đơn chưa IN_PROGRESS
    // =========================================================================
    @Test
    @DisplayName("TC-I01: Chủ xe tạo Check-in -> Biên bản mang trạng thái PENDING_RENTER_CONFIRMATION, đơn chưa chuyển IN_PROGRESS")
    void checkIn_Success_PendingConfirmation() {
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
        assertThat(response.getStatus()).isEqualTo(EInspectionStatus.PENDING_RENTER_CONFIRMATION);
        assertThat(response.getOdoMeter()).isEqualTo(12500);
        assertThat(response.getFuelLevel()).isEqualTo(90);
        assertThat(response.getPerformedBy()).isEqualTo(ownerId);

        // Đơn thuê chưa chuyển trạng thái sang IN_PROGRESS ngay mà chờ Khách xác nhận
        assertThat(rental.getStatus()).isEqualTo(ERentalStatus.CONFIRMED);
        verify(rentalRepository).save(rental);
        verify(rentalInspectionRepository).save(any(RentalInspection.class));
    }

    @Test
    @DisplayName("Check-in: Ném CAR_ACCESS_DENIED khi không phải chủ xe thao tác")
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
    @DisplayName("Check-in: Ném RENTAL_CANNOT_BE_STARTED khi đơn chưa CONFIRMED")
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
    @DisplayName("Check-in: Ném INSPECTION_ALREADY_EXISTS khi đơn đã check-in trước đó")
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

    // =========================================================================
    // TC-I02: Khách bấm xác nhận biên bản Check-in -> Đơn chuyển IN_PROGRESS
    // =========================================================================
    @Test
    @DisplayName("TC-I02: Khách bấm xác nhận biên bản Check-in -> Đơn chính thức chuyển sang IN_PROGRESS")
    void confirmInspection_CheckIn_Agreed_Success() {
        Long inspectionId = 1L;
        RentalInspection inspection = RentalInspection.builder()
                .inspectionId(inspectionId)
                .rentalId(rentalId)
                .inspectionType(EInspectionType.CHECK_IN)
                .status(EInspectionStatus.PENDING_RENTER_CONFIRMATION)
                .odoMeter(12500)
                .fuelLevel(90)
                .performedBy(ownerId)
                .build();

        ConfirmInspectionRequest request = new ConfirmInspectionRequest(true, null, null);

        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(rentalInspectionRepository.findById(inspectionId)).thenReturn(Optional.of(inspection));
        when(rentalInspectionRepository.save(any(RentalInspection.class))).thenAnswer(inv -> inv.getArgument(0));

        RentalInspectionResponse response = rentalInspectionService.confirmInspection(rentalId, inspectionId, renterId, request);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(EInspectionStatus.CONFIRMED);
        assertThat(rental.getStatus()).isEqualTo(ERentalStatus.IN_PROGRESS);

        verify(rentalInspectionRepository).save(inspection);
        verify(rentalRepository).save(rental);
        verifyNoInteractions(rentalDisputeRepository);
    }

    // =========================================================================
    // TC-I03: Chủ xe tạo Check-out -> Khách xem ảnh & ODO -> Bấm xác nhận -> COMPLETED
    // =========================================================================
    @Test
    @DisplayName("TC-I03: Chủ xe tạo Check-out và Khách xác nhận -> Đơn chuyển sang hoàn tất (COMPLETED)")
    void checkOut_And_Confirm_Success() {
        // Bước 1: Chủ xe tạo Check-out
        rental.setStatus(ERentalStatus.IN_PROGRESS);
        CheckOutRequest checkOutRequest = new CheckOutRequest(
                12800,
                85,
                BigDecimal.valueOf(150_000),
                "Phụ phí rửa xe và vượt 30km",
                "https://images.com/return.jpg",
                "Trả xe đúng hẹn"
        );

        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(carRepository.findById(carId)).thenReturn(Optional.of(car));
        when(rentalInspectionRepository.existsByRentalIdAndInspectionType(rentalId, EInspectionType.CHECK_OUT)).thenReturn(false);
        when(rentalInspectionRepository.save(any(RentalInspection.class))).thenAnswer(inv -> {
            RentalInspection ins = inv.getArgument(0);
            ins.setInspectionId(2L);
            return ins;
        });

        RentalInspectionResponse checkOutResp = rentalInspectionService.checkOut(rentalId, ownerId, checkOutRequest);

        assertThat(checkOutResp.getStatus()).isEqualTo(EInspectionStatus.PENDING_RENTER_CONFIRMATION);
        assertThat(rental.getStatus()).isEqualTo(ERentalStatus.IN_PROGRESS); // Chưa hoàn tất khi khách chưa duyệt

        // Bước 2: Khách kiểm tra ODO, vạch xăng và bấm Đồng ý
        RentalInspection checkOutInspection = RentalInspection.builder()
                .inspectionId(2L)
                .rentalId(rentalId)
                .inspectionType(EInspectionType.CHECK_OUT)
                .status(EInspectionStatus.PENDING_RENTER_CONFIRMATION)
                .odoMeter(12800)
                .fuelLevel(85)
                .extraFee(BigDecimal.valueOf(150_000))
                .performedBy(ownerId)
                .build();

        when(rentalInspectionRepository.findById(2L)).thenReturn(Optional.of(checkOutInspection));
        ConfirmInspectionRequest confirmReq = new ConfirmInspectionRequest(true, null, null);

        RentalInspectionResponse confirmResp = rentalInspectionService.confirmInspection(rentalId, 2L, renterId, confirmReq);

        assertThat(confirmResp.getStatus()).isEqualTo(EInspectionStatus.CONFIRMED);
        assertThat(rental.getStatus()).isEqualTo(ERentalStatus.COMPLETED);
        assertThat(rental.getActualReturnTime()).isNotNull();

        verify(rentalRepository, atLeast(2)).save(rental);
        verify(rentalInspectionRepository, atLeast(2)).save(any(RentalInspection.class));
    }

    // =========================================================================
    // TC-I04: Khách bấm "Khiếu nại sai lệch" -> Sinh Dispute trong rental_disputes
    // =========================================================================
    @Test
    @DisplayName("TC-I04: Khách bấm Khiếu nại sai lệch trên biên bản -> Tự động sinh bản ghi Dispute trong bảng rental_disputes")
    void confirmInspection_Dispute_Success() {
        Long inspectionId = 1L;
        RentalInspection inspection = RentalInspection.builder()
                .inspectionId(inspectionId)
                .rentalId(rentalId)
                .inspectionType(EInspectionType.CHECK_IN)
                .status(EInspectionStatus.PENDING_RENTER_CONFIRMATION)
                .odoMeter(15000)
                .fuelLevel(50)
                .performedBy(ownerId)
                .build();

        ConfirmInspectionRequest request = new ConfirmInspectionRequest(
                false,
                "Số ODO thực tế trên đồng hồ là 16.200km và xăng chỉ còn 2 vạch chứ không phải 50%",
                "https://images.com/real_odo.jpg"
        );

        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(rentalInspectionRepository.findById(inspectionId)).thenReturn(Optional.of(inspection));
        when(rentalInspectionRepository.save(any(RentalInspection.class))).thenAnswer(inv -> inv.getArgument(0));

        RentalInspectionResponse response = rentalInspectionService.confirmInspection(rentalId, inspectionId, renterId, request);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(EInspectionStatus.DISPUTED);
        assertThat(rental.getStatus()).isEqualTo(ERentalStatus.DISPUTED);

        ArgumentCaptor<RentalDispute> disputeCaptor = ArgumentCaptor.forClass(RentalDispute.class);
        verify(rentalDisputeRepository).save(disputeCaptor.capture());

        RentalDispute captured = disputeCaptor.getValue();
        assertThat(captured.getRentalId()).isEqualTo(rentalId);
        assertThat(captured.getReporterId()).isEqualTo(renterId);
        assertThat(captured.getReason()).contains("Số ODO thực tế");
        assertThat(captured.getProofUrls()).isEqualTo("https://images.com/real_odo.jpg");
        assertThat(captured.getStatus()).isEqualTo(EDisputeStatus.PENDING);
    }

    @Test
    @DisplayName("Confirm Inspection: Ném UNAUTHORIZED khi người lạ cố tình xác nhận biên bản")
    void confirmInspection_WhenStranger_ThrowsException() {
        Long strangerId = 999L;
        ConfirmInspectionRequest request = new ConfirmInspectionRequest(true, null, null);

        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));

        assertThatThrownBy(() -> rentalInspectionService.confirmInspection(rentalId, 1L, strangerId, request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.UNAUTHORIZED));

        verifyNoInteractions(rentalInspectionRepository);
        verifyNoInteractions(rentalDisputeRepository);
    }

    @Test
    @DisplayName("Confirm Inspection: Ném INSPECTION_ALREADY_PROCESSED khi biên bản đã CONFIRMED")
    void confirmInspection_WhenAlreadyConfirmed_ThrowsException() {
        Long inspectionId = 1L;
        RentalInspection inspection = RentalInspection.builder()
                .inspectionId(inspectionId)
                .rentalId(rentalId)
                .inspectionType(EInspectionType.CHECK_IN)
                .status(EInspectionStatus.CONFIRMED)
                .build();

        ConfirmInspectionRequest request = new ConfirmInspectionRequest(true, null, null);

        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(rentalInspectionRepository.findById(inspectionId)).thenReturn(Optional.of(inspection));

        assertThatThrownBy(() -> rentalInspectionService.confirmInspection(rentalId, inspectionId, renterId, request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.INSPECTION_ALREADY_PROCESSED));
    }

    @Test
    @DisplayName("Check-out: Ném RENTAL_CANNOT_BE_COMPLETED khi đơn chưa IN_PROGRESS hoặc OVERDUE")
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
    @DisplayName("Xem biên bản: Lấy danh sách thành công cho chủ xe hoặc khách thuê")
    void getInspections_Success() {
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(carRepository.findById(carId)).thenReturn(Optional.of(car));

        RentalInspection checkIn = RentalInspection.builder()
                .inspectionId(1L)
                .rentalId(rentalId)
                .inspectionType(EInspectionType.CHECK_IN)
                .status(EInspectionStatus.PENDING_RENTER_CONFIRMATION)
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
        assertThat(list.get(0).getStatus()).isEqualTo(EInspectionStatus.PENDING_RENTER_CONFIRMATION);
    }

    @Test
    @DisplayName("Xem biên bản: Ném UNAUTHORIZED khi người dùng lạ cố gắng truy cập")
    void getInspections_WhenStranger_ThrowsException() {
        Long strangerId = 999L;
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(carRepository.findById(carId)).thenReturn(Optional.of(car));

        assertThatThrownBy(() -> rentalInspectionService.getInspections(rentalId, strangerId))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> assertThat(((AppException) ex).getErrorCode()).isEqualTo(ErrorCode.UNAUTHORIZED));
    }
}
