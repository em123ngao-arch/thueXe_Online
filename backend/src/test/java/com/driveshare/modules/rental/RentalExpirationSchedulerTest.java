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
        assertThat(rental1.getRejectReason()).isEqualTo("Yêu cầu thuê tự động hết hạn do không được phản hồi sau 60 phút");
        assertThat(rental2.getStatus()).isEqualTo(ERentalStatus.EXPIRED);
        assertThat(rental2.getRejectReason()).isEqualTo("Yêu cầu thuê tự động hết hạn do không được phản hồi sau 60 phút");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Rental>> captor = ArgumentCaptor.forClass(List.class);
        verify(rentalRepository).saveAll(captor.capture());

        List<Rental> saved = captor.getValue();
        assertThat(saved).hasSize(2);
        assertThat(saved).allMatch(r -> r.getStatus() == ERentalStatus.EXPIRED);
    }

    @Test
    @DisplayName("CRP-43: Kiểm tra scheduler chỉ tìm đơn PENDING với ngưỡng thời gian đúng 60 phút trước")
    void autoExpirePendingRentals_QueriesPendingRentalsWith60MinutesThreshold() {
        Instant beforeRun = Instant.now().minus(60, java.time.temporal.ChronoUnit.MINUTES);

        ArgumentCaptor<Instant> thresholdCaptor = ArgumentCaptor.forClass(Instant.class);
        ArgumentCaptor<ERentalStatus> statusCaptor = ArgumentCaptor.forClass(ERentalStatus.class);

        when(rentalRepository.findExpiredPendingRentals(statusCaptor.capture(), thresholdCaptor.capture()))
                .thenReturn(Collections.emptyList());

        scheduler.autoExpirePendingRentals();

        Instant afterRun = Instant.now().minus(60, java.time.temporal.ChronoUnit.MINUTES);

        // Đảm bảo chỉ tìm đơn PENDING, không tìm status khác
        assertThat(statusCaptor.getValue()).isEqualTo(ERentalStatus.PENDING);

        // Đảm bảo ngưỡng threshold là createdAt <= now - 60 minutes
        Instant threshold = thresholdCaptor.getValue();
        assertThat(threshold).isAfterOrEqualTo(beforeRun.minusSeconds(1));
        assertThat(threshold).isBeforeOrEqualTo(afterRun.plusSeconds(1));
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
    @DisplayName("CRP-43: Xử lý đồng thời nhiều đơn PENDING quá hạn trong cùng 1 lần chạy")
    void autoExpirePendingRentals_MultipleExpiredRentals_ProcessesAll() {
        List<Rental> expiredBatch = java.util.stream.IntStream.rangeClosed(1, 5)
                .mapToObj(i -> Rental.builder()
                        .rentalId((long) i)
                        .status(ERentalStatus.PENDING)
                        .build())
                .toList();

        when(rentalRepository.findExpiredPendingRentals(eq(ERentalStatus.PENDING), any(Instant.class)))
                .thenReturn(expiredBatch);

        scheduler.autoExpirePendingRentals();

        assertThat(expiredBatch).hasSize(5);
        assertThat(expiredBatch).allMatch(r -> r.getStatus() == ERentalStatus.EXPIRED);
        assertThat(expiredBatch).allMatch(r -> "Yêu cầu thuê tự động hết hạn do không được phản hồi sau 60 phút".equals(r.getRejectReason()));

        verify(rentalRepository).saveAll(expiredBatch);
    }
}
