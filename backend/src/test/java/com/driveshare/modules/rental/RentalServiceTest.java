package com.driveshare.modules.rental;

import com.driveshare.common.enums.ECarStatus;
import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.common.enums.EUserStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.rental.dto.CreateRentalRequest;
import com.driveshare.modules.rental.dto.RentalResponse;
import com.driveshare.modules.rental.entity.Rental;
import com.driveshare.modules.rental.repository.RentalRepository;
import com.driveshare.modules.rental.service.impl.RentalServiceImpl;
import com.driveshare.security.CustomUserDetails;
import org.junit.jupiter.api.AfterEach;
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
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RentalServiceTest {

    @Mock
    private RentalRepository rentalRepository;

    @Mock
    private CarRepository carRepository;

    @Mock
    private com.driveshare.modules.user.repository.RenterProfileRepository renterProfileRepository;

    @InjectMocks
    private RentalServiceImpl rentalService;

    private static final Long RENTER_ID = 100L;
    private static final Long OWNER_ID = 200L;
    private static final Long CAR_ID = 1L;

    @BeforeEach
    void setUp() {
        CustomUserDetails userDetails = new CustomUserDetails(
                RENTER_ID, "renter_test", "renter@test.com", "pass",
                EUserStatus.ACTIVE, List.of(new SimpleGrantedAuthority("ROLE_RENTER"))
        );
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("CRP-41: Tạo yêu cầu thuê xe thành công, tính đúng số ngày và tiền cọc 30%")
    void createRentalRequest_Success() {
        LocalDate startDate = LocalDate.now().plusDays(1);
        LocalDate endDate = LocalDate.now().plusDays(3); // 2 ngày

        CreateRentalRequest request = CreateRentalRequest.builder()
                .carId(CAR_ID)
                .startDate(startDate)
                .endDate(endDate)
                .note("Cần xe sạch sẽ")
                .build();

        Car car = Car.builder()
                .carId(CAR_ID)
                .ownerId(OWNER_ID)
                .pricePerDay(BigDecimal.valueOf(500_000))
                .status(ECarStatus.ACTIVE)
                .build();

        when(rentalRepository.countByRenterIdAndStatus(RENTER_ID, ERentalStatus.PENDING)).thenReturn(1L);
        when(carRepository.findByCarIdAndDeletedAtIsNull(CAR_ID)).thenReturn(Optional.of(car));
        when(rentalRepository.save(any(Rental.class))).thenAnswer(invocation -> {
            Rental r = invocation.getArgument(0);
            r.setRentalId(10L);
            return r;
        });

        RentalResponse response = rentalService.createRentalRequest(request);

        assertThat(response).isNotNull();
        assertThat(response.getRentalId()).isEqualTo(10L);
        assertThat(response.getCarId()).isEqualTo(CAR_ID);
        assertThat(response.getRenterId()).isEqualTo(RENTER_ID);
        assertThat(response.getTotalDays()).isEqualTo(2);
        assertThat(response.getPricePerDay()).isEqualByComparingTo(BigDecimal.valueOf(500_000));
        assertThat(response.getTotalPrice()).isEqualByComparingTo(BigDecimal.valueOf(1_000_000));
        assertThat(response.getDepositAmount()).isEqualByComparingTo(BigDecimal.valueOf(300_000)); // 30% của 1,000,000
        assertThat(response.getStatus()).isEqualTo(ERentalStatus.PENDING);
        assertThat(response.getNote()).isEqualTo("Cần xe sạch sẽ");

        org.mockito.ArgumentCaptor<Rental> rentalCaptor = org.mockito.ArgumentCaptor.forClass(Rental.class);
        verify(rentalRepository).save(rentalCaptor.capture());
        Rental savedRental = rentalCaptor.getValue();
        assertThat(savedRental.getStatus()).isEqualTo(ERentalStatus.PENDING);
        assertThat(savedRental.getTotalDays()).isEqualTo(2);
        assertThat(savedRental.getTotalPrice()).isEqualByComparingTo(BigDecimal.valueOf(1_000_000));
        assertThat(savedRental.getDepositAmount()).isEqualByComparingTo(BigDecimal.valueOf(300_000));
    }

    @Test
    @DisplayName("CRP-42: Khách đã có 3 đơn PENDING -> ném MAX_PENDING_RENTALS_EXCEEDED")
    void createRentalRequest_WhenPendingCountIs3_ThrowsException() {
        CreateRentalRequest request = CreateRentalRequest.builder()
                .carId(CAR_ID)
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(2))
                .build();

        when(rentalRepository.countByRenterIdAndStatus(RENTER_ID, ERentalStatus.PENDING)).thenReturn(3L);

        assertThatThrownBy(() -> rentalService.createRentalRequest(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo(ErrorCode.MAX_PENDING_RENTALS_EXCEEDED);
                });

        verify(carRepository, never()).findByCarIdAndDeletedAtIsNull(anyLong());
        verify(rentalRepository, never()).save(any(Rental.class));
    }

    @Test
    @DisplayName("CRP-41: User chưa đăng nhập -> ném UNAUTHENTICATED")
    void createRentalRequest_Unauthenticated_ThrowsException() {
        SecurityContextHolder.clearContext();

        CreateRentalRequest request = CreateRentalRequest.builder()
                .carId(CAR_ID)
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(2))
                .build();

        assertThatThrownBy(() -> rentalService.createRentalRequest(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo(ErrorCode.UNAUTHENTICATED);
                });

        verify(rentalRepository, never()).save(any(Rental.class));
    }

    @Test
    @DisplayName("CRP-42: User có 0 đơn PENDING -> tạo được rental thành công")
    void createRentalRequest_WhenPendingCountIs0_Success() {
        LocalDate startDate = LocalDate.now().plusDays(1);
        LocalDate endDate = LocalDate.now().plusDays(2);

        CreateRentalRequest request = CreateRentalRequest.builder()
                .carId(CAR_ID)
                .startDate(startDate)
                .endDate(endDate)
                .build();

        Car car = Car.builder()
                .carId(CAR_ID)
                .ownerId(OWNER_ID)
                .pricePerDay(BigDecimal.valueOf(500_000))
                .status(ECarStatus.ACTIVE)
                .build();

        when(rentalRepository.countByRenterIdAndStatus(RENTER_ID, ERentalStatus.PENDING)).thenReturn(0L);
        when(carRepository.findByCarIdAndDeletedAtIsNull(CAR_ID)).thenReturn(Optional.of(car));
        when(rentalRepository.save(any(Rental.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RentalResponse response = rentalService.createRentalRequest(request);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(ERentalStatus.PENDING);
        verify(rentalRepository).save(any(Rental.class));
    }

    @Test
    @DisplayName("CRP-42: User có 1 đơn PENDING -> tạo được đơn thứ 2 thành công")
    void createRentalRequest_WhenPendingCountIs1_Success() {
        LocalDate startDate = LocalDate.now().plusDays(1);
        LocalDate endDate = LocalDate.now().plusDays(2);

        CreateRentalRequest request = CreateRentalRequest.builder()
                .carId(CAR_ID)
                .startDate(startDate)
                .endDate(endDate)
                .build();

        Car car = Car.builder()
                .carId(CAR_ID)
                .ownerId(OWNER_ID)
                .pricePerDay(BigDecimal.valueOf(500_000))
                .status(ECarStatus.ACTIVE)
                .build();

        when(rentalRepository.countByRenterIdAndStatus(RENTER_ID, ERentalStatus.PENDING)).thenReturn(1L);
        when(carRepository.findByCarIdAndDeletedAtIsNull(CAR_ID)).thenReturn(Optional.of(car));
        when(rentalRepository.save(any(Rental.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RentalResponse response = rentalService.createRentalRequest(request);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(ERentalStatus.PENDING);
        verify(rentalRepository).save(any(Rental.class));
    }

    @Test
    @DisplayName("CRP-42: Chỉ đếm request PENDING của chính renter hiện tại, không đếm của user khác")
    void createRentalRequest_CountsOnlyCurrentRenterPendingRequests_NotOtherUsers() {
        LocalDate startDate = LocalDate.now().plusDays(1);
        LocalDate endDate = LocalDate.now().plusDays(2);

        CreateRentalRequest request = CreateRentalRequest.builder()
                .carId(CAR_ID)
                .startDate(startDate)
                .endDate(endDate)
                .build();

        Car car = Car.builder()
                .carId(CAR_ID)
                .ownerId(OWNER_ID)
                .pricePerDay(BigDecimal.valueOf(500_000))
                .status(ECarStatus.ACTIVE)
                .build();

        // Renter hiện tại chỉ có 0 đơn PENDING
        when(rentalRepository.countByRenterIdAndStatus(RENTER_ID, ERentalStatus.PENDING)).thenReturn(0L);
        when(carRepository.findByCarIdAndDeletedAtIsNull(CAR_ID)).thenReturn(Optional.of(car));
        when(rentalRepository.save(any(Rental.class))).thenAnswer(invocation -> invocation.getArgument(0));

        rentalService.createRentalRequest(request);

        // Xác nhận chỉ đếm cho RENTER_ID hiện tại
        verify(rentalRepository).countByRenterIdAndStatus(RENTER_ID, ERentalStatus.PENDING);
        verify(rentalRepository, never()).countByRenterIdAndStatus(eq(999L), any());
    }

    @Test
    @DisplayName("Validation: Ngày bắt đầu ở quá khứ -> ném INVALID_RENTAL_DATES")
    void createRentalRequest_StartDateInPast_ThrowsException() {
        CreateRentalRequest request = CreateRentalRequest.builder()
                .carId(CAR_ID)
                .startDate(LocalDate.now().minusDays(1))
                .endDate(LocalDate.now().plusDays(2))
                .build();

        when(rentalRepository.countByRenterIdAndStatus(RENTER_ID, ERentalStatus.PENDING)).thenReturn(0L);

        assertThatThrownBy(() -> rentalService.createRentalRequest(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo(ErrorCode.INVALID_RENTAL_DATES);
                });
    }

    @Test
    @DisplayName("Validation: Ngày bắt đầu là hôm nay (< 1 ngày) -> ném INVALID_RENTAL_DATES")
    void createRentalRequest_StartDateToday_ThrowsException() {
        CreateRentalRequest request = CreateRentalRequest.builder()
                .carId(CAR_ID)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(2))
                .build();

        when(rentalRepository.countByRenterIdAndStatus(RENTER_ID, ERentalStatus.PENDING)).thenReturn(0L);

        assertThatThrownBy(() -> rentalService.createRentalRequest(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo(ErrorCode.INVALID_RENTAL_DATES);
                });
    }

    @Test
    @DisplayName("Validation: Ngày kết thúc trước ngày bắt đầu -> ném INVALID_RENTAL_DATES")
    void createRentalRequest_EndDateBeforeStartDate_ThrowsException() {
        CreateRentalRequest request = CreateRentalRequest.builder()
                .carId(CAR_ID)
                .startDate(LocalDate.now().plusDays(3))
                .endDate(LocalDate.now().plusDays(1))
                .build();

        when(rentalRepository.countByRenterIdAndStatus(RENTER_ID, ERentalStatus.PENDING)).thenReturn(0L);

        assertThatThrownBy(() -> rentalService.createRentalRequest(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo(ErrorCode.INVALID_RENTAL_DATES);
                });
    }

    @Test
    @DisplayName("Validation: Xe không tồn tại -> ném CAR_NOT_FOUND")
    void createRentalRequest_CarNotFound_ThrowsException() {
        CreateRentalRequest request = CreateRentalRequest.builder()
                .carId(999L)
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(2))
                .build();

        when(rentalRepository.countByRenterIdAndStatus(RENTER_ID, ERentalStatus.PENDING)).thenReturn(0L);
        when(carRepository.findByCarIdAndDeletedAtIsNull(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> rentalService.createRentalRequest(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo(ErrorCode.CAR_NOT_FOUND);
                });
    }

    @Test
    @DisplayName("Validation: Xe không ở trạng thái ACTIVE -> ném CAR_NOT_FOUND")
    void createRentalRequest_CarNotActive_ThrowsException() {
        CreateRentalRequest request = CreateRentalRequest.builder()
                .carId(CAR_ID)
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(2))
                .build();

        Car car = Car.builder()
                .carId(CAR_ID)
                .ownerId(OWNER_ID)
                .status(ECarStatus.INACTIVE)
                .build();

        when(rentalRepository.countByRenterIdAndStatus(RENTER_ID, ERentalStatus.PENDING)).thenReturn(0L);
        when(carRepository.findByCarIdAndDeletedAtIsNull(CAR_ID)).thenReturn(Optional.of(car));

        assertThatThrownBy(() -> rentalService.createRentalRequest(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo(ErrorCode.CAR_NOT_FOUND);
                });
    }

    @Test
    @DisplayName("Validation: Chủ xe không thể tự thuê xe của mình -> ném INVALID_REQUEST")
    void createRentalRequest_OwnerRentsOwnCar_ThrowsException() {
        CreateRentalRequest request = CreateRentalRequest.builder()
                .carId(CAR_ID)
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(2))
                .build();

        Car car = Car.builder()
                .carId(CAR_ID)
                .ownerId(RENTER_ID) // Trùng với ID người đang login
                .status(ECarStatus.ACTIVE)
                .build();

        when(rentalRepository.countByRenterIdAndStatus(RENTER_ID, ERentalStatus.PENDING)).thenReturn(0L);
        when(carRepository.findByCarIdAndDeletedAtIsNull(CAR_ID)).thenReturn(Optional.of(car));

        assertThatThrownBy(() -> rentalService.createRentalRequest(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo(ErrorCode.INVALID_REQUEST);
                });
    }

    @Test
    @DisplayName("Giai đoạn 1 & CRP-38: Xe bị trùng lịch thuê -> ném CAR_ALREADY_RENTED")
    void createRentalRequest_ConflictingDates_ThrowsException() {
        LocalDate startDate = LocalDate.now().plusDays(1);
        LocalDate endDate = LocalDate.now().plusDays(3);

        CreateRentalRequest request = CreateRentalRequest.builder()
                .carId(CAR_ID)
                .startDate(startDate)
                .endDate(endDate)
                .build();

        Car car = Car.builder()
                .carId(CAR_ID)
                .ownerId(OWNER_ID)
                .pricePerDay(BigDecimal.valueOf(500_000))
                .status(ECarStatus.ACTIVE)
                .build();

        when(rentalRepository.countByRenterIdAndStatus(RENTER_ID, ERentalStatus.PENDING)).thenReturn(0L);
        when(carRepository.findByCarIdAndDeletedAtIsNull(CAR_ID)).thenReturn(Optional.of(car));
        when(rentalRepository.hasDateConflict(eq(CAR_ID), eq(startDate), eq(endDate), anyList())).thenReturn(true);

        assertThatThrownBy(() -> rentalService.createRentalRequest(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo(ErrorCode.CAR_ALREADY_RENTED);
                });
    }

    @Test
    @DisplayName("CRP-42: Khách đã có 2 đơn PENDING (< 3) -> tạo đơn thứ 3 thành công")
    void createRentalRequest_WhenPendingCountIs2_Success() {
        LocalDate startDate = LocalDate.now().plusDays(1);
        LocalDate endDate = LocalDate.now().plusDays(2);

        CreateRentalRequest request = CreateRentalRequest.builder()
                .carId(CAR_ID)
                .startDate(startDate)
                .endDate(endDate)
                .build();

        Car car = Car.builder()
                .carId(CAR_ID)
                .ownerId(OWNER_ID)
                .pricePerDay(BigDecimal.valueOf(500_000))
                .status(ECarStatus.ACTIVE)
                .build();

        when(rentalRepository.countByRenterIdAndStatus(RENTER_ID, ERentalStatus.PENDING)).thenReturn(2L);
        when(carRepository.findByCarIdAndDeletedAtIsNull(CAR_ID)).thenReturn(Optional.of(car));
        when(rentalRepository.save(any(Rental.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RentalResponse response = rentalService.createRentalRequest(request);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(ERentalStatus.PENDING);
        verify(rentalRepository).save(any(Rental.class));
    }

    @Test
    @DisplayName("CRP-42: Các đơn cũ đã sang EXPIRED/REJECTED/CANCELLED không tính vào giới hạn PENDING")
    void createRentalRequest_OldRequestsNotPending_DoesNotCountTowardsLimit() {
        LocalDate startDate = LocalDate.now().plusDays(1);
        LocalDate endDate = LocalDate.now().plusDays(2);

        CreateRentalRequest request = CreateRentalRequest.builder()
                .carId(CAR_ID)
                .startDate(startDate)
                .endDate(endDate)
                .build();

        Car car = Car.builder()
                .carId(CAR_ID)
                .ownerId(OWNER_ID)
                .pricePerDay(BigDecimal.valueOf(500_000))
                .status(ECarStatus.ACTIVE)
                .build();

        // Khách từng có 5 đơn cũ nhưng chỉ 1 đơn ở PENDING, các đơn khác đã EXPIRED/REJECTED/CANCELLED
        when(rentalRepository.countByRenterIdAndStatus(RENTER_ID, ERentalStatus.PENDING)).thenReturn(1L);
        when(carRepository.findByCarIdAndDeletedAtIsNull(CAR_ID)).thenReturn(Optional.of(car));
        when(rentalRepository.save(any(Rental.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RentalResponse response = rentalService.createRentalRequest(request);

        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(ERentalStatus.PENDING);
        // Đảm bảo không đếm PENDING_APPROVAL
        verify(rentalRepository, never()).countByRenterIdAndStatus(RENTER_ID, ERentalStatus.PENDING_APPROVAL);
    }

    @Test
    @DisplayName("CRP-41: Renter đã có đơn PENDING trùng ngày cho cùng xe -> ném DUPLICATE_RENTAL_REQUEST")
    void createRentalRequest_DuplicateRequestSameCarAndDates_ThrowsException() {
        LocalDate startDate = LocalDate.now().plusDays(1);
        LocalDate endDate = LocalDate.now().plusDays(2);

        CreateRentalRequest request = CreateRentalRequest.builder()
                .carId(CAR_ID)
                .startDate(startDate)
                .endDate(endDate)
                .build();

        Car car = Car.builder()
                .carId(CAR_ID)
                .ownerId(OWNER_ID)
                .pricePerDay(BigDecimal.valueOf(500_000))
                .status(ECarStatus.ACTIVE)
                .build();

        when(rentalRepository.countByRenterIdAndStatus(RENTER_ID, ERentalStatus.PENDING)).thenReturn(0L);
        when(carRepository.findByCarIdAndDeletedAtIsNull(CAR_ID)).thenReturn(Optional.of(car));
        when(rentalRepository.hasActiveOrPendingRentalForUserAndCar(eq(CAR_ID), eq(RENTER_ID), eq(startDate), eq(endDate), anyList()))
                .thenReturn(true);

        assertThatThrownBy(() -> rentalService.createRentalRequest(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo(ErrorCode.DUPLICATE_RENTAL_REQUEST);
                });
    }

    @Test
    @DisplayName("Validation: Ngày thuê null -> ném INVALID_REQUEST")
    void createRentalRequest_DatesNull_ThrowsException() {
        CreateRentalRequest request = CreateRentalRequest.builder()
                .carId(CAR_ID)
                .startDate(null)
                .endDate(null)
                .build();

        when(rentalRepository.countByRenterIdAndStatus(RENTER_ID, ERentalStatus.PENDING)).thenReturn(0L);

        assertThatThrownBy(() -> rentalService.createRentalRequest(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo(ErrorCode.INVALID_REQUEST);
                });
    }
}
