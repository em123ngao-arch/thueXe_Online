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
}
