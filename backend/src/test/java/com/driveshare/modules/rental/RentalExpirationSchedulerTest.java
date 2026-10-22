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

import java.time.Instant;
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
}
