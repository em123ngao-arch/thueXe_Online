package com.driveshare.core.domain.model;

import com.driveshare.core.domain.vo.CarStatus;
import com.driveshare.core.domain.vo.Money;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

class CarTest {

    @Test
    @DisplayName("Xe mới tạo với trạng thái mặc định phải là AVAILABLE")
    void shouldBeAvailableByDefault() {
        Car car = new Car(
                1L, 100L, "Toyota", "Vios", "51A-12345",
                5, "Tự động", "Xăng", Money.vnd(800000),
                null, "Quận 1, TP.HCM", "Xe mới sạch sẽ", List.of(), Instant.now()
        );

        assertThat(car.isAvailable()).isTrue();
        assertThat(car.getStatus()).isEqualTo(CarStatus.AVAILABLE);
    }

    @Test
    @DisplayName("Đánh dấu xe đã thuê thành công khi xe đang AVAILABLE")
    void shouldMarkAsRentedWhenAvailable() {
        Car car = new Car(
                1L, 100L, "Toyota", "Vios", "51A-12345",
                5, "Tự động", "Xăng", Money.vnd(800000),
                CarStatus.AVAILABLE, "Quận 1, TP.HCM", "Xe mới", List.of(), Instant.now()
        );

        car.markAsRented();

        assertThat(car.isAvailable()).isFalse();
        assertThat(car.getStatus()).isEqualTo(CarStatus.RENTED);
    }

    @Test
    @DisplayName("Ném ngoại lệ khi đánh dấu thuê nếu xe không ở trạng thái AVAILABLE")
    void shouldThrowExceptionWhenMarkingRentedIfNotAvailable() {
        Car car = new Car(
                1L, 100L, "Toyota", "Vios", "51A-12345",
                5, "Tự động", "Xăng", Money.vnd(800000),
                CarStatus.MAINTENANCE, "Quận 1, TP.HCM", "Bảo dưỡng", List.of(), Instant.now()
        );

        assertThatThrownBy(car::markAsRented)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Car is not available for rent");
    }
}
