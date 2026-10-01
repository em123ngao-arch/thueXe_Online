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
import com.driveshare.modules.rental.scheduler.RentalExpirationScheduler;
import com.driveshare.modules.rental.service.impl.RentalServiceImpl;
import com.driveshare.security.CustomUserDetails;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * End-to-End Flow Test cho CRP-41, CRP-42, CRP-43:
 *
 * Flow:
 * Renter -> createRentalRequest -> PENDING
 *           -> chưa đủ 60 phút -> PENDING
 *           -> đủ 60 phút -> Scheduler -> EXPIRED
 *           -> CRP-42: Đơn EXPIRED không còn tính vào giới hạn PENDING -> tạo được đơn mới
 */
@ExtendWith(MockitoExtension.class)
class RentalFlowEndToEndTest {

    @Mock
    private RentalRepository rentalRepository;

    @Mock
    private CarRepository carRepository;

    @Mock
    private com.driveshare.modules.user.repository.RenterProfileRepository renterProfileRepository;

    @InjectMocks
    private RentalServiceImpl rentalService;

    private RentalExpirationScheduler scheduler;

    private static final Long RENTER_ID = 500L;
    private static final Long OWNER_ID = 600L;
    private static final Long CAR_ID = 50L;

    @BeforeEach
    void setUp() {
        CustomUserDetails userDetails = new CustomUserDetails(
                RENTER_ID, "flow_renter", "flow@test.com", "pass",
                EUserStatus.ACTIVE, List.of(new SimpleGrantedAuthority("ROLE_RENTER"))
        );
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        scheduler = new RentalExpirationScheduler(rentalRepository);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("End-to-End Flow: CRP-41 tạo PENDING -> CRP-43 chờ 60p -> EXPIRED -> CRP-42 giải phóng slot")
    void testEndToEndFlow_CRP41_CRP42_CRP43() {
        // --- BƯỚC 1: Renter gửi yêu cầu thuê xe (CRP-41) ---
        LocalDate startDate = LocalDate.now().plusDays(2);
        LocalDate endDate = LocalDate.now().plusDays(5); // 3 ngày

        CreateRentalRequest request = CreateRentalRequest.builder()
                .carId(CAR_ID)
                .startDate(startDate)
                .endDate(endDate)
                .note("Yêu cầu xe có camera hành trình")
                .build();

        Car car = Car.builder()
                .carId(CAR_ID)
                .ownerId(OWNER_ID)
                .pricePerDay(BigDecimal.valueOf(800_000))
                .status(ECarStatus.ACTIVE)
                .build();

        // Ban đầu renter có 0 đơn PENDING
        AtomicLong activePendingCount = new AtomicLong(0L);
        when(rentalRepository.countByRenterIdAndStatus(RENTER_ID, ERentalStatus.PENDING))
                .thenAnswer(inv -> activePendingCount.get());
        when(carRepository.findByCarIdAndDeletedAtIsNull(CAR_ID)).thenReturn(Optional.of(car));

        // Mock lưu rental vào repository
        Rental storedRental = new Rental();
        when(rentalRepository.save(any(Rental.class))).thenAnswer(invocation -> {
            Rental r = invocation.getArgument(0);
            storedRental.setRentalId(101L);
            storedRental.setCarId(r.getCarId());
            storedRental.setRenterId(r.getRenterId());
            storedRental.setStartDate(r.getStartDate());
            storedRental.setEndDate(r.getEndDate());
            storedRental.setTotalDays(r.getTotalDays());
            storedRental.setPricePerDay(r.getPricePerDay());
            storedRental.setTotalPrice(r.getTotalPrice());
            storedRental.setDepositAmount(r.getDepositAmount());
            storedRental.setStatus(r.getStatus());
            storedRental.setNote(r.getNote());
            storedRental.setCreatedAt(Instant.now());
            return storedRental;
        });

        RentalResponse response = rentalService.createRentalRequest(request);

        // Kiểm tra CRP-41: Status ban đầu là PENDING, tính đúng ngày, giá, cọc 30%
        assertThat(response).isNotNull();
        assertThat(response.getRentalId()).isEqualTo(101L);
        assertThat(response.getStatus()).isEqualTo(ERentalStatus.PENDING);
        assertThat(response.getTotalDays()).isEqualTo(3);
        assertThat(response.getPricePerDay()).isEqualByComparingTo(BigDecimal.valueOf(800_000));
        assertThat(response.getTotalPrice()).isEqualByComparingTo(BigDecimal.valueOf(2_400_000));
        assertThat(response.getDepositAmount()).isEqualByComparingTo(BigDecimal.valueOf(720_000)); // 30% của 2,400,000

        // Entity lưu trong DB phải mang trạng thái PENDING
        assertThat(storedRental.getStatus()).isEqualTo(ERentalStatus.PENDING);
        activePendingCount.set(1L);

        // --- BƯỚC 2: Chưa đủ 60 phút -> Scheduler chạy -> Status vẫn là PENDING (CRP-43) ---
        // Giả sử rental được tạo cách đây 30 phút (< 60 phút)
        when(rentalRepository.findExpiredPendingRentals(eq(ERentalStatus.PENDING), any(Instant.class)))
                .thenReturn(Collections.emptyList());

        scheduler.autoExpirePendingRentals();

        // Không có đơn nào bị expire, status vẫn là PENDING
        assertThat(storedRental.getStatus()).isEqualTo(ERentalStatus.PENDING);
        verify(rentalRepository, never()).saveAll(any());

        // --- BƯỚC 3: Đủ 60 phút trôi qua -> Scheduler chạy -> Tự động chuyển sang EXPIRED (CRP-43) ---
        storedRental.setCreatedAt(Instant.now().minus(65, ChronoUnit.MINUTES));
        when(rentalRepository.findExpiredPendingRentals(eq(ERentalStatus.PENDING), any(Instant.class)))
                .thenReturn(List.of(storedRental));

        scheduler.autoExpirePendingRentals();

        // Trạng thái đã chuyển thành EXPIRED kèm lý do đúng quy chuẩn
        assertThat(storedRental.getStatus()).isEqualTo(ERentalStatus.EXPIRED);
        assertThat(storedRental.getRejectReason()).isEqualTo("Yêu cầu thuê tự động hết hạn do không được phản hồi sau 60 phút");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Rental>> saveAllCaptor = ArgumentCaptor.forClass(List.class);
        verify(rentalRepository).saveAll(saveAllCaptor.capture());
        assertThat(saveAllCaptor.getValue()).contains(storedRental);

        // --- BƯỚC 4: CRP-42 - Đơn đã EXPIRED không còn tính vào giới hạn PENDING ---
        activePendingCount.set(0L); // Vì đơn đã sang EXPIRED nên count PENDING giảm về 0

        // Renter gửi tiếp yêu cầu thuê mới thành công vì chưa vượt quá 3 đơn PENDING
        CreateRentalRequest secondRequest = CreateRentalRequest.builder()
                .carId(CAR_ID)
                .startDate(LocalDate.now().plusDays(10))
                .endDate(LocalDate.now().plusDays(12))
                .build();

        RentalResponse secondResponse = rentalService.createRentalRequest(secondRequest);
        assertThat(secondResponse).isNotNull();
        assertThat(secondResponse.getStatus()).isEqualTo(ERentalStatus.PENDING);
    }

    @Test
    @DisplayName("End-to-End CRP-42: Đạt tối đa 3 đơn PENDING -> Chặn đơn thứ 4 -> Khi 1 đơn EXPIRED -> Cho phép tạo lại")
    void testPendingLimitFlow() {
        LocalDate startDate = LocalDate.now().plusDays(1);
        LocalDate endDate = LocalDate.now().plusDays(3);

        CreateRentalRequest request = CreateRentalRequest.builder()
                .carId(CAR_ID)
                .startDate(startDate)
                .endDate(endDate)
                .build();

        // Khi khách đã có 3 đơn PENDING
        when(rentalRepository.countByRenterIdAndStatus(RENTER_ID, ERentalStatus.PENDING)).thenReturn(3L);

        // Đơn thứ 4 bị từ chối
        assertThatThrownBy(() -> rentalService.createRentalRequest(request))
                .isInstanceOf(AppException.class)
                .satisfies(ex -> {
                    AppException appEx = (AppException) ex;
                    assertThat(appEx.getErrorCode()).isEqualTo(ErrorCode.MAX_PENDING_RENTALS_EXCEEDED);
                });

        // 1 đơn cũ hết hạn và chuyển sang EXPIRED -> số đơn PENDING chỉ còn 2
        when(rentalRepository.countByRenterIdAndStatus(RENTER_ID, ERentalStatus.PENDING)).thenReturn(2L);
        Car car = Car.builder()
                .carId(CAR_ID)
                .ownerId(OWNER_ID)
                .pricePerDay(BigDecimal.valueOf(500_000))
                .status(ECarStatus.ACTIVE)
                .build();
        when(carRepository.findByCarIdAndDeletedAtIsNull(CAR_ID)).thenReturn(Optional.of(car));
        when(rentalRepository.save(any(Rental.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Renter tạo lại đơn -> thành công
        RentalResponse response = rentalService.createRentalRequest(request);
        assertThat(response).isNotNull();
        assertThat(response.getStatus()).isEqualTo(ERentalStatus.PENDING);
    }
}
