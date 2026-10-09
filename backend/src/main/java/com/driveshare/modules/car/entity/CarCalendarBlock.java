package com.driveshare.modules.car.entity;

import com.driveshare.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

/**
 * Entity lưu trữ các khoảng thời gian Chủ xe chủ động chặn lịch bận (Blackout Dates).
 * Ví dụ: Xe đi bảo dưỡng định kỳ, đăng kiểm, hoặc chủ xe dùng cho gia đình.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "car_calendar_blocks",
        indexes = {
                @Index(name = "idx_calendar_blocks_car_dates", columnList = "car_id, start_date, end_date"),
                @Index(name = "idx_calendar_blocks_deleted", columnList = "deleted_at")
        }
)
public class CarCalendarBlock extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "block_id")
    private Long blockId;

    @Column(name = "car_id", nullable = false)
    private Long carId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "car_id", insertable = false, updatable = false)
    private Car car;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "reason", length = 255)
    private String reason;
}
