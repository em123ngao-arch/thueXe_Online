package com.driveshare.modules.car.dto.response;

import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.entity.ECarStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * DTO trả về thông tin xe cho Client.
 * Dùng cho cả danh sách ({@code GET /my-cars}) và chi tiết sau khi tạo/cập nhật.
 */
@Data
@Builder
public class CarResponse {

    private Long carId;
    private Long ownerId;

    // Thông tin xe
    private String plateNumber;
    private String brand;
    private String model;
    private Integer year;
    private String color;
    private Integer seats;
    private String transmission;
    private String fuelType;

    // Giá & Địa điểm
    private BigDecimal pricePerDay;
    private String address;
    private String province;

    // Mô tả & Tiện nghi
    private String description;
    private String features;
    private String thumbnailUrl;

    // Trạng thái
    private ECarStatus status;
    private String rejectionReason;

    // Audit
    private Instant createdAt;
    private Instant updatedAt;

    /**
     * Factory method: ánh xạ từ Entity sang DTO.
     * Đặt tại đây để tránh dependency ngược từ entity sang dto.
     */
    public static CarResponse fromEntity(Car car) {
        return CarResponse.builder()
                .carId(car.getCarId())
                .ownerId(car.getOwnerId())
                .plateNumber(car.getPlateNumber())
                .brand(car.getBrand())
                .model(car.getModel())
                .year(car.getYear())
                .color(car.getColor())
                .seats(car.getSeats())
                .transmission(car.getTransmission())
                .fuelType(car.getFuelType())
                .pricePerDay(car.getPricePerDay())
                .address(car.getAddress())
                .province(car.getProvince())
                .description(car.getDescription())
                .features(car.getFeatures())
                .thumbnailUrl(car.getThumbnailUrl())
                .status(car.getStatus())
                .rejectionReason(car.getRejectionReason())
                .createdAt(car.getCreatedAt())
                .updatedAt(car.getUpdatedAt())
                .build();
    }
}
