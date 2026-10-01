package com.driveshare.modules.rental;

import com.driveshare.common.enums.ECarStatus;
import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.rental.dto.RejectRentalRequest;
import com.driveshare.modules.rental.dto.response.RentalSummaryResponse;
import com.driveshare.modules.rental.entity.Rental;
import com.driveshare.modules.rental.repository.RentalRepository;
import com.driveshare.modules.rental.service.impl.OwnerRentalServiceImpl;
import com.driveshare.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OwnerRentalServiceTest {

    @Mock
    private RentalRepository rentalRepository;

    @Mock
    private CarRepository carRepository;

    @InjectMocks
    private OwnerRentalServiceImpl ownerRentalService;

    private final Long ownerId = 200L;
    private final Long carId = 1L;
    private final Long rentalId = 10L;

    private Car car;
    private Rental rental;

    @BeforeEach
    void setUp() {
        CustomUserDetails userDetails = new CustomUserDetails(
                ownerId,
                "owner_demo",
                "owner@demo.com",
                "encodedPassword",
                com.driveshare.common.enums.EUserStatus.ACTIVE,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_OWNER"))
        );
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authentication);

        car = Car.builder()
                .carId(carId)
                .ownerId(ownerId)
                .brand("Toyota")
                .model("Camry")
                .plateNumber("51A-99999")
                .status(ECarStatus.ACTIVE)
                .pricePerDay(BigDecimal.valueOf(1000000))
                .build();

        rental = Rental.builder()
                .rentalId(rentalId)
                .carId(carId)
                .renterId(100L)
                .startDate(LocalDate.now().plusDays(2))
                .endDate(LocalDate.now().plusDays(4))
                .totalDays(2)
                .pricePerDay(BigDecimal.valueOf(1000000))
                .totalPrice(BigDecimal.valueOf(2000000))
                .depositAmount(BigDecimal.valueOf(600000))
                .status(ERentalStatus.PENDING_APPROVAL)
                .car(car)
                .build();
    }

    @Test
    @DisplayName("CRP-47 & Giai đoạn 2 & 3: Chủ xe duyệt đơn -> Chuyển WAITING_PAYMENT, đặt Soft Lock 45p, chuyển đơn trùng sang ON_HOLD")
    void approveRental_Success_SetsWaitingPaymentAndSoftLock() {
        Rental competing = Rental.builder()
                .rentalId(11L)
                .carId(carId)
                .renterId(101L)
                .startDate(rental.getStartDate())
                .endDate(rental.getEndDate())
                .status(ERentalStatus.PENDING_APPROVAL)
                .build();

        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(carRepository.findById(carId)).thenReturn(Optional.of(car));
        when(rentalRepository.hasDateConflict(eq(carId), eq(rental.getStartDate()), eq(rental.getEndDate()), any()))
                .thenReturn(false);
        when(rentalRepository.save(any(Rental.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(rentalRepository.findCompetingRentals(eq(carId), eq(rental.getStartDate()), eq(rental.getEndDate()), eq(rentalId), any()))
                .thenReturn(List.of(competing));

        RentalSummaryResponse response = ownerRentalService.approveRental(rentalId);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(ERentalStatus.WAITING_PAYMENT);
        assertThat(response.getPaymentExpiresAt()).isNotNull();

        assertThat(competing.getStatus()).isEqualTo(ERentalStatus.ON_HOLD);
        verify(rentalRepository).saveAll(List.of(competing));
    }

    @Test
    @DisplayName("CRP-47: Không phải chủ xe -> ném CAR_ACCESS_DENIED")
    void approveRental_NotOwner_ThrowsException() {
        Car anotherCar = Car.builder()
                .carId(carId)
                .ownerId(999L)
                .build();

        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(carRepository.findById(carId)).thenReturn(Optional.of(anotherCar));

        AppException ex = assertThrows(AppException.class, () -> ownerRentalService.approveRental(rentalId));
        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.CAR_ACCESS_DENIED);
    }

    @Test
    @DisplayName("CRP-47: Đơn đã xử lý trước đó -> ném RENTAL_ALREADY_PROCESSED")
    void approveRental_AlreadyProcessed_ThrowsException() {
        rental.setStatus(ERentalStatus.CONFIRMED);

        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(carRepository.findById(carId)).thenReturn(Optional.of(car));

        AppException ex = assertThrows(AppException.class, () -> ownerRentalService.approveRental(rentalId));
        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.RENTAL_ALREADY_PROCESSED);
    }

    @Test
    @DisplayName("CRP-47 & Giai đoạn 3: Xe đã có cuốc giữ chỗ/xác nhận trùng giờ -> ném CAR_ALREADY_RENTED")
    void approveRental_DateConflict_ThrowsException() {
        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(carRepository.findById(carId)).thenReturn(Optional.of(car));
        when(rentalRepository.hasDateConflict(eq(carId), eq(rental.getStartDate()), eq(rental.getEndDate()), any()))
                .thenReturn(true);

        AppException ex = assertThrows(AppException.class, () -> ownerRentalService.approveRental(rentalId));
        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.CAR_ALREADY_RENTED);
    }

    @Test
    @DisplayName("CRP-48: Chủ xe từ chối đơn kèm lý do -> Chuyển sang REJECTED")
    void rejectRental_Success_SetsRejected() {
        RejectRentalRequest request = new RejectRentalRequest("Xe cần sửa chữa");

        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(carRepository.findById(carId)).thenReturn(Optional.of(car));
        when(rentalRepository.save(any(Rental.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RentalSummaryResponse response = ownerRentalService.rejectRental(rentalId, request);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(ERentalStatus.REJECTED);
        assertThat(response.getRejectReason()).isEqualTo("Xe cần sửa chữa");
    }

    @Test
    @DisplayName("CRP-48: Từ chối thiếu lý do -> ném REJECT_REASON_REQUIRED")
    void rejectRental_EmptyReason_ThrowsException() {
        RejectRentalRequest request = new RejectRentalRequest("");

        AppException ex = assertThrows(AppException.class, () -> ownerRentalService.rejectRental(rentalId, request));
        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.REJECT_REASON_REQUIRED);
    }

    @Test
    @DisplayName("Giai đoạn 3: Từ chối đơn đang WAITING_PAYMENT -> Giải phóng Soft Lock và mở lại các đơn ON_HOLD")
    void rejectRental_WaitingPayment_RevivesOnHoldRentals() {
        rental.setStatus(ERentalStatus.WAITING_PAYMENT);

        Rental onHoldRental = Rental.builder()
                .rentalId(11L)
                .carId(carId)
                .renterId(101L)
                .startDate(rental.getStartDate())
                .endDate(rental.getEndDate())
                .status(ERentalStatus.ON_HOLD)
                .rejectReason("Tạm hoãn")
                .build();

        RejectRentalRequest request = new RejectRentalRequest("Khách gọi báo hủy");

        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(carRepository.findById(carId)).thenReturn(Optional.of(car));
        when(rentalRepository.save(any(Rental.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(rentalRepository.findCompetingRentals(eq(carId), eq(rental.getStartDate()), eq(rental.getEndDate()), eq(rentalId), any()))
                .thenReturn(List.of(onHoldRental));

        RentalSummaryResponse response = ownerRentalService.rejectRental(rentalId, request);

        assertThat(response.getStatus()).isEqualTo(ERentalStatus.REJECTED);
        assertThat(onHoldRental.getStatus()).isEqualTo(ERentalStatus.PENDING_APPROVAL);
        assertThat(onHoldRental.getRejectReason()).isNull();
        verify(rentalRepository).saveAll(List.of(onHoldRental));
    }

    @Test
    @DisplayName("Giai đoạn 4: Chủ xe bắt đầu chuyến đi -> Chuyển sang IN_PROGRESS")
    void startRental_Success() {
        rental.setStatus(ERentalStatus.CONFIRMED);

        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(carRepository.findById(carId)).thenReturn(Optional.of(car));
        when(rentalRepository.save(any(Rental.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RentalSummaryResponse response = ownerRentalService.startRental(rentalId);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(ERentalStatus.IN_PROGRESS);
    }

    @Test
    @DisplayName("Giai đoạn 4: Bắt đầu chuyến khi chưa CONFIRMED -> ném RENTAL_CANNOT_BE_STARTED")
    void startRental_NotConfirmed_ThrowsException() {
        rental.setStatus(ERentalStatus.WAITING_PAYMENT);

        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(carRepository.findById(carId)).thenReturn(Optional.of(car));

        AppException ex = assertThrows(AppException.class, () -> ownerRentalService.startRental(rentalId));
        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.RENTAL_CANNOT_BE_STARTED);
    }

    @Test
    @DisplayName("Giai đoạn 4: Chủ xe hoàn tất chuyến đi -> Chuyển sang COMPLETED")
    void completeRental_Success() {
        rental.setStatus(ERentalStatus.IN_PROGRESS);

        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(carRepository.findById(carId)).thenReturn(Optional.of(car));
        when(rentalRepository.save(any(Rental.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RentalSummaryResponse response = ownerRentalService.completeRental(rentalId);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(ERentalStatus.COMPLETED);
    }

    @Test
    @DisplayName("Giai đoạn 4: Hoàn tất chuyến khi chưa IN_PROGRESS -> ném RENTAL_CANNOT_BE_COMPLETED")
    void completeRental_NotInProgress_ThrowsException() {
        rental.setStatus(ERentalStatus.CONFIRMED);

        when(rentalRepository.findById(rentalId)).thenReturn(Optional.of(rental));
        when(carRepository.findById(carId)).thenReturn(Optional.of(car));

        AppException ex = assertThrows(AppException.class, () -> ownerRentalService.completeRental(rentalId));
        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.RENTAL_CANNOT_BE_COMPLETED);
    }
}

