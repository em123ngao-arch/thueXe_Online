package com.driveshare.modules.rental;

import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.modules.rental.entity.Rental;
import com.driveshare.modules.rental.repository.RentalRepository;
import com.driveshare.modules.rental.scheduler.RentalExpirationScheduler;
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
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RentalExpirationSchedulerTest {

    @Mock
    private RentalRepository rentalRepository;

    @Mock
    private com.driveshare.modules.user.repository.UserRepository userRepository;

    @InjectMocks
    private RentalExpirationScheduler scheduler;

    @Test
    @DisplayName("CRP-43: Tự động hết hạn các đơn PENDING tạo hơn 60 phút trước")
    void autoExpirePendingRentals_ExpiredRentalsFound_UpdatesToExpired() {
        Rental rental1 = Rental.builder()
                .rentalId(1L)
                .status(ERentalStatus.PENDING)
                .build();
        Rental rental2 = Rental.builder()
                .rentalId(2L)
                .status(ERentalStatus.PENDING)
                .build();

        when(rentalRepository.findExpiredPendingRentals(eq(ERentalStatus.PENDING), any(Instant.class)))
                .thenReturn(List.of(rental1, rental2));

        scheduler.autoExpirePendingRentals();

        assertThat(rental1.getStatus()).isEqualTo(ERentalStatus.EXPIRED);
        assertThat(rental1.getRejectReason()).contains("60 phút");
        assertThat(rental2.getStatus()).isEqualTo(ERentalStatus.EXPIRED);
        assertThat(rental2.getRejectReason()).contains("60 phút");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Rental>> captor = ArgumentCaptor.forClass(List.class);
        verify(rentalRepository).saveAll(captor.capture());

        List<Rental> saved = captor.getValue();
        assertThat(saved).hasSize(2);
        assertThat(saved).allMatch(r -> r.getStatus() == ERentalStatus.EXPIRED);
    }

    @Test
    @DisplayName("CRP-43: Khi không có đơn nào quá hạn -> không gọi saveAll")
    void autoExpirePendingRentals_NoExpiredRentals_DoesNothing() {
        when(rentalRepository.findExpiredPendingRentals(eq(ERentalStatus.PENDING), any(Instant.class)))
                .thenReturn(Collections.emptyList());

        scheduler.autoExpirePendingRentals();

        verify(rentalRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("Giai đoạn 3 & 4: Tự động hết hạn đơn WAITING_PAYMENT quá 45 phút và phục hồi các đơn ON_HOLD")
    void autoExpireWaitingPaymentSoftLocks_ExpiredRentalsFound_UpdatesToExpiredAndRevivesOnHoldRentals() {
        Rental expiredRental = Rental.builder()
                .rentalId(10L)
                .carId(1L)
                .startDate(java.time.LocalDate.now().plusDays(2))
                .endDate(java.time.LocalDate.now().plusDays(4))
                .status(ERentalStatus.WAITING_PAYMENT)
                .paymentExpiresAt(Instant.now().minusSeconds(120))
                .build();

        Rental onHoldRental = Rental.builder()
                .rentalId(11L)
                .carId(1L)
                .startDate(expiredRental.getStartDate())
                .endDate(expiredRental.getEndDate())
                .status(ERentalStatus.ON_HOLD)
                .rejectReason("Chờ thanh toán")
                .build();

        when(rentalRepository.findExpiredWaitingPaymentRentals(eq(ERentalStatus.WAITING_PAYMENT), any(Instant.class)))
                .thenReturn(List.of(expiredRental));
        when(rentalRepository.findCompetingRentals(eq(1L), any(), any(), eq(10L), any()))
                .thenReturn(List.of(onHoldRental));

        scheduler.autoExpireWaitingPaymentSoftLocks();

        // Đơn quá hạn chuyển sang EXPIRED
        assertThat(expiredRental.getStatus()).isEqualTo(ERentalStatus.EXPIRED);
        assertThat(expiredRental.getRejectReason()).contains("45 phút");

        // Đơn ON_HOLD được hồi sinh về PENDING_APPROVAL
        assertThat(onHoldRental.getStatus()).isEqualTo(ERentalStatus.PENDING_APPROVAL);
        assertThat(onHoldRental.getRejectReason()).isNull();

        verify(rentalRepository).saveAll(List.of(onHoldRental));
        verify(rentalRepository).saveAll(List.of(expiredRental));
    }

    @Test
    @DisplayName("Giai đoạn 3 & 4: Không có đơn WAITING_PAYMENT quá hạn -> không thực hiện giải phóng")
    void autoExpireWaitingPaymentSoftLocks_NoExpiredRentals_DoesNothing() {
        when(rentalRepository.findExpiredWaitingPaymentRentals(eq(ERentalStatus.WAITING_PAYMENT), any(Instant.class)))
                .thenReturn(Collections.emptyList());

        scheduler.autoExpireWaitingPaymentSoftLocks();

        verify(rentalRepository, never()).saveAll(any());
    }

    // =========================================================================
    // SPRINT 4 (ISSUE #50 - NGUYỄN DUY QUÂN): BLACKLIST VÀ KHÓA TÀI KHOẢN
    // =========================================================================

    @Test
    @DisplayName("TC-Q03: Khách có đơn OVERDUE quá 24h -> Trạng thái user đổi thành BLOCKED")
    void autoDetectOverdueRentals_OverdueOver24Hours_BlocksUserAndTriggersBlacklist() {
        java.time.LocalDate twoDaysAgo = java.time.LocalDate.now().minusDays(2);
        Rental rental = Rental.builder()
                .rentalId(101L)
                .carId(5L)
                .renterId(77L)
                .startDate(twoDaysAgo.minusDays(3))
                .endDate(twoDaysAgo)
                .pricePerDay(java.math.BigDecimal.valueOf(500_000))
                .status(ERentalStatus.IN_PROGRESS)
                .isBlacklistedTriggered(false)
                .build();

        com.driveshare.modules.user.entity.User user = com.driveshare.modules.user.entity.User.builder()
                .userId(77L)
                .username("violating_renter")
                .status(com.driveshare.common.enums.EUserStatus.ACTIVE)
                .build();

        when(rentalRepository.findOverdueRentals(eq(ERentalStatus.IN_PROGRESS), any()))
                .thenReturn(List.of(rental));
        when(rentalRepository.findByStatusOrderByCreatedAtDesc(ERentalStatus.OVERDUE))
                .thenReturn(Collections.emptyList());
        when(userRepository.findById(77L)).thenReturn(java.util.Optional.of(user));

        scheduler.autoDetectOverdueRentals();

        assertThat(rental.getStatus()).isEqualTo(ERentalStatus.OVERDUE);
        assertThat(rental.getOverdueHours()).isGreaterThanOrEqualTo(24);
        assertThat(rental.getIsBlacklistedTriggered()).isTrue();
        assertThat(rental.getPenaltyFee()).isGreaterThan(java.math.BigDecimal.ZERO);
        assertThat(user.getStatus()).isEqualTo(com.driveshare.common.enums.EUserStatus.BLOCKED);

        verify(userRepository).save(user);
        verify(rentalRepository).saveAll(List.of(rental));
    }

    // =========================================================================
    // SPRINT 4 (ISSUE #49 - LÂM CHÍ VĨ): BỘ TEST OVERDUE & TÍNH PHÍ PHẠT
    // =========================================================================

    @Test
    @DisplayName("TC-V01: Tạo đơn có endDate trước hôm nay -> Scheduler quét -> Đơn đổi sang status = OVERDUE")
    void autoCheckOverdueRentals_WhenOverdue_UpdatesStatusToOverdue() {
        Rental overdueRental = Rental.builder()
                .rentalId(50L)
                .carId(1L)
                .startDate(LocalDate.now().minusDays(3))
                .endDate(LocalDate.now().minusDays(1))
                .pricePerDay(BigDecimal.valueOf(1000000))
                .status(ERentalStatus.IN_PROGRESS)
                .build();

        when(rentalRepository.findOverdueRentals(eq(ERentalStatus.IN_PROGRESS), any(LocalDate.class)))
                .thenReturn(List.of(overdueRental));

        scheduler.autoCheckOverdueRentals();

        assertThat(overdueRental.getStatus()).isEqualTo(ERentalStatus.OVERDUE);
        assertThat(overdueRental.getOverdueHours()).isEqualTo(24);
        assertThat(overdueRental.getPenaltyFee()).isGreaterThan(BigDecimal.ZERO);
        assertThat(overdueRental.getRejectReason()).contains("quá thời hạn kết thúc chuyến đi");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Rental>> captor = ArgumentCaptor.forClass(List.class);
        verify(rentalRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).contains(overdueRental);
    }

    @Test
    @DisplayName("TC-V02: Kiểm tra công thức tính penalty_fee: trễ 3 giờ với đơn giá 100k/h -> Phí phạt đúng 450.000 đ")
    void calculatePenaltyFee_Within24Hours_ThreeHoursLateWith100kRate_Penalty450k() {
        // Đơn giá ngày 1.000.000 đ/ngày -> đơn giá giờ = 1.000.000 / 10 = 100.000 đ/h
        BigDecimal pricePerDay = BigDecimal.valueOf(1000000);
        int overdueHours = 3;

        // Phạt = 3 * (100.000 * 1.5) = 450.000 đ
        BigDecimal penalty = scheduler.calculatePenaltyFee(pricePerDay, overdueHours);

        assertThat(penalty).isEqualByComparingTo(BigDecimal.valueOf(450000));
    }

    @Test
    @DisplayName("TC-V03: Trễ trên 24 giờ -> Phạt lũy tiến gấp đôi đơn giá ngày thuê")
    void calculatePenaltyFee_Over24Hours_ProgressiveDoubleDailyRate() {
        BigDecimal pricePerDay = BigDecimal.valueOf(1000000);

        // Trễ 48 giờ (2 ngày) -> Phạt = 1.000.000 * 2 * 2 = 4.000.000 đ
        BigDecimal penalty48h = scheduler.calculatePenaltyFee(pricePerDay, 48);
        assertThat(penalty48h).isEqualByComparingTo(BigDecimal.valueOf(4000000));

        // Trễ 25 giờ (bước sang ngày thứ 2 lũy tiến) -> Phạt = 1.000.000 * 2 * 2 = 4.000.000 đ
        BigDecimal penalty25h = scheduler.calculatePenaltyFee(pricePerDay, 25);
        assertThat(penalty25h).isEqualByComparingTo(BigDecimal.valueOf(4000000));
    }

    @Test
    @DisplayName("TC-V06: Trễ 0 giờ hoặc số âm -> Phí phạt bằng 0")
    void calculatePenaltyFee_ZeroOrNegativeHours_ReturnsZero() {
        BigDecimal pricePerDay = BigDecimal.valueOf(1000000);

        assertThat(scheduler.calculatePenaltyFee(pricePerDay, 0)).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(scheduler.calculatePenaltyFee(pricePerDay, -5)).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("TC-V07: Đơn giá null hoặc xe không có giá -> Phí phạt bằng 0")
    void calculatePenaltyFee_NullPrice_ReturnsZero() {
        assertThat(scheduler.calculatePenaltyFee((BigDecimal) null, 5)).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(scheduler.calculatePenaltyFee((Rental) null, 5)).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("TC-V08: Không có đơn quá hạn -> Không thực hiện cập nhật DB")
    void autoCheckOverdueRentals_NoOverdueRentals_DoesNothing() {
        when(rentalRepository.findOverdueRentals(eq(ERentalStatus.IN_PROGRESS), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        scheduler.autoCheckOverdueRentals();

        verify(rentalRepository, never()).saveAll(any());
    }
}

