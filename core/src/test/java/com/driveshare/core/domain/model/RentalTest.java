package com.driveshare.core.domain.model;

import com.driveshare.core.domain.vo.Money;
import com.driveshare.core.domain.vo.RentalStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.*;

class RentalTest {

    @Test
    @DisplayName("Tính toán chính xác số ngày thuê xe")
    void shouldCalculateCorrectRentalDays() {
        LocalDate start = LocalDate.of(2026, 9, 20);
        LocalDate end = LocalDate.of(2026, 9, 22);

        Rental rental = new Rental(
                1L, 10L, 20L, start, end,
                Money.vnd(2400000), Money.vnd(500000),
                RentalStatus.PENDING, Instant.now()
        );

        assertThat(rental.calculateRentalDays()).isEqualTo(3);
    }

    @Test
    @DisplayName("Ném ngoại lệ nếu ngày kết thúc trước ngày bắt đầu")
    void shouldThrowExceptionWhenEndDateBeforeStartDate() {
        LocalDate start = LocalDate.of(2026, 9, 25);
        LocalDate end = LocalDate.of(2026, 9, 20);

        assertThatThrownBy(() -> new Rental(
                1L, 10L, 20L, start, end,
                Money.vnd(1000000), Money.vnd(0),
                RentalStatus.PENDING, Instant.now()
        )).isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("endDate cannot be before startDate");
    }

    @Test
    @DisplayName("Không thể hủy hợp đồng thuê khi đã hoàn thành COMPLETED")
    void shouldNotAllowCancelCompletedRental() {
        Rental rental = new Rental(
                1L, 10L, 20L, LocalDate.now(), LocalDate.now().plusDays(2),
                Money.vnd(1600000), Money.vnd(0),
                RentalStatus.COMPLETED, Instant.now()
        );

        assertThatThrownBy(rental::cancel)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot cancel a completed rental");
    }
}
