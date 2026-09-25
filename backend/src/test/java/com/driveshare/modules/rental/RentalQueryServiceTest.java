package com.driveshare.modules.rental;

import com.driveshare.common.enums.ECarStatus;
import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.common.enums.EUserStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.rental.dto.response.RentalSummaryResponse;
import com.driveshare.modules.rental.entity.Rental;
import com.driveshare.modules.rental.repository.RentalRepository;
import com.driveshare.modules.rental.service.impl.RentalQueryServiceImpl;
import com.driveshare.modules.user.entity.User;
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
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RentalQueryServiceTest {

    @Mock
    private RentalRepository rentalRepository;

    @Mock
    private CarRepository carRepository;

    @InjectMocks
    private RentalQueryServiceImpl rentalQueryService;

    private User sampleRenter;
    private Car sampleCar;
    private Rental sampleRental;

    @BeforeEach
    void setUp() {
        sampleRenter = User.builder()
                .userId(100L)
                .username("renter_test")
                .fullName("Khách Thuê Test")
                .phone("0912345678")
                .build();

        sampleCar = Car.builder()
                .carId(1L)
                .ownerId(200L)
                .brand("Honda")
                .model("Civic")
                .plateNumber("51B-99999")
                .status(ECarStatus.ACTIVE)
                .build();

        sampleRental = Rental.builder()
                .rentalId(10L)
                .carId(1L)
                .car(sampleCar)
                .renterId(100L)
                .renter(sampleRenter)
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(3))
                .totalDays(2)
                .pricePerDay(new BigDecimal("800000"))
                .totalPrice(new BigDecimal("1600000"))
                .depositAmount(new BigDecimal("480000"))
                .status(ERentalStatus.PENDING)
                .build();

        // Giả lập Renter đang đăng nhập (userId = 100L)
        CustomUserDetails renterDetails = new CustomUserDetails(
                100L,
                "renter_test",
                "renter@test.com",
                "hashedpwd",
                EUserStatus.ACTIVE,
                List.of(new SimpleGrantedAuthority("ROLE_RENTER"))
        );
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(renterDetails, null, renterDetails.getAuthorities())
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("CRP-44: Khách thuê xem danh sách đơn thuê của chính mình")
    void getMyRentals_Success() {
        when(rentalRepository.findByRenterIdOrderByCreatedAtDesc(100L))
                .thenReturn(List.of(sampleRental));

        List<RentalSummaryResponse> results = rentalQueryService.getMyRentals();

        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals(10L, results.get(0).getRentalId());
        assertEquals("Honda", results.get(0).getCarBrand());
        assertEquals("Khách Thuê Test", results.get(0).getRenterFullName());
        verify(rentalRepository).findByRenterIdOrderByCreatedAtDesc(100L);
    }

    @Test
    @DisplayName("CRP-44: Khách thuê hủy đơn PENDING thành công")
    void cancelMyRental_Success() {
        when(rentalRepository.findById(10L)).thenReturn(Optional.of(sampleRental));
        when(rentalRepository.save(any(Rental.class))).thenAnswer(inv -> inv.getArgument(0));

        RentalSummaryResponse response = rentalQueryService.cancelMyRental(10L);

        assertNotNull(response);
        assertEquals(ERentalStatus.CANCELLED, response.getStatus());
        verify(rentalRepository).save(sampleRental);
    }

    @Test
    @DisplayName("CRP-44: Hủy đơn không tồn tại ném RENTAL_NOT_FOUND")
    void cancelMyRental_NotFound_ThrowsException() {
        when(rentalRepository.findById(999L)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> rentalQueryService.cancelMyRental(999L));
        assertEquals(ErrorCode.RENTAL_NOT_FOUND, ex.getErrorCode());
        verify(rentalRepository, never()).save(any());
    }

    @Test
    @DisplayName("CRP-44: Hủy đơn của khách khác ném UNAUTHORIZED")
    void cancelMyRental_Unauthorized_ThrowsException() {
        sampleRental.setRenterId(999L); // Không phải 100L
        when(rentalRepository.findById(10L)).thenReturn(Optional.of(sampleRental));

        AppException ex = assertThrows(AppException.class, () -> rentalQueryService.cancelMyRental(10L));
        assertEquals(ErrorCode.UNAUTHORIZED, ex.getErrorCode());
        verify(rentalRepository, never()).save(any());
    }

    @Test
    @DisplayName("CRP-44: Hủy đơn đã APPROVED ném RENTAL_CANNOT_BE_CANCELLED")
    void cancelMyRental_AlreadyApproved_ThrowsException() {
        sampleRental.setStatus(ERentalStatus.APPROVED);
        when(rentalRepository.findById(10L)).thenReturn(Optional.of(sampleRental));

        AppException ex = assertThrows(AppException.class, () -> rentalQueryService.cancelMyRental(10L));
        assertEquals(ErrorCode.RENTAL_CANNOT_BE_CANCELLED, ex.getErrorCode());
        verify(rentalRepository, never()).save(any());
    }

    @Test
    @DisplayName("CRP-46: Chủ xe không có xe trả về danh sách rỗng")
    void getOwnerIncomingRentals_NoCars_ReturnsEmptyList() {
        // Giả lập Owner đăng nhập
        CustomUserDetails ownerDetails = new CustomUserDetails(
                200L,
                "owner_test",
                "owner@test.com",
                "hashedpwd",
                EUserStatus.ACTIVE,
                List.of(new SimpleGrantedAuthority("ROLE_OWNER"))
        );
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(ownerDetails, null, ownerDetails.getAuthorities())
        );

        when(carRepository.findByOwnerIdAndDeletedAtIsNull(200L)).thenReturn(Collections.emptyList());

        List<RentalSummaryResponse> results = rentalQueryService.getOwnerIncomingRentals(null);

        assertNotNull(results);
        assertTrue(results.isEmpty());
        verify(rentalRepository, never()).findByCarIdInOrderByCreatedAtDesc(any());
    }

    @Test
    @DisplayName("CRP-46: Chủ xe xem danh sách yêu cầu thuê có lọc status")
    void getOwnerIncomingRentals_WithStatusFilter_Success() {
        CustomUserDetails ownerDetails = new CustomUserDetails(
                200L,
                "owner_test",
                "owner@test.com",
                "hashedpwd",
                EUserStatus.ACTIVE,
                List.of(new SimpleGrantedAuthority("ROLE_OWNER"))
        );
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(ownerDetails, null, ownerDetails.getAuthorities())
        );

        when(carRepository.findByOwnerIdAndDeletedAtIsNull(200L)).thenReturn(List.of(sampleCar));
        when(rentalRepository.findByCarIdInAndStatusOrderByCreatedAtDesc(List.of(1L), ERentalStatus.PENDING))
                .thenReturn(List.of(sampleRental));

        List<RentalSummaryResponse> results = rentalQueryService.getOwnerIncomingRentals(ERentalStatus.PENDING);

        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals(ERentalStatus.PENDING, results.get(0).getStatus());
        verify(rentalRepository).findByCarIdInAndStatusOrderByCreatedAtDesc(List.of(1L), ERentalStatus.PENDING);
    }
}
