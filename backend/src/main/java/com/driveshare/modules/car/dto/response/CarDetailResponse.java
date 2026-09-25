package com.driveshare.modules.car.dto.response;

import com.driveshare.common.enums.ECarStatus;
import com.driveshare.common.enums.EFuelType;
import com.driveshare.common.enums.ETransmission;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Response DTO chi tiết thông tin xe cho trang Vehicle Detail Page (CRP-37)")
public class CarDetailResponse {

    @Schema(description = "ID xe", example = "1")
    private Long carId;

    @Schema(description = "Biển số xe (mã hóa bớt số cuối công khai)", example = "51A-123.XX")
    private String plateNumberMasked;

    @Schema(description = "Hãng xe", example = "Toyota")
    private String brand;

    @Schema(description = "Dòng xe / Model", example = "Camry")
    private String model;

    @Schema(description = "Năm sản xuất", example = "2022")
    private Integer year;

    @Schema(description = "Màu sắc", example = "Trắng")
    private String color;

    @Schema(description = "Số chỗ ngồi", example = "5")
    private Integer seats;

    @Schema(description = "Hộp số")
    private ETransmission transmission;

    @Schema(description = "Loại nhiên liệu")
    private EFuelType fuelType;

    @Schema(description = "Giá thuê / ngày (VNĐ)", example = "1200000")
    private BigDecimal pricePerDay;

    @Schema(description = "Địa chỉ nhận xe", example = "123 Nguyễn Huệ, Quận 1")
    private String address;

    @Schema(description = "Tỉnh / Thành phố", example = "TP. Hồ Chí Minh")
    private String province;

    @Schema(description = "Mô tả chi tiết")
    private String description;

    @Schema(description = "Các tiện ích xe", example = "GPS, Bluetooth, Camera lùi")
    private String features;

    @Schema(description = "Ảnh đại diện (Thumbnail)", example = "https://res.cloudinary.com/driveshare/image/upload/car1.jpg")
    private String thumbnailUrl;

    @Schema(description = "Trạng thái xe")
    private ECarStatus status;

    @Schema(description = "Danh sách bộ sưu tập ảnh xe")
    private List<CarImageResponse> images;

    @Schema(description = "Thông tin chủ xe")
    private OwnerInfo owner;

    @Schema(description = "Danh sách các ngày xe đã được đặt (không thể đặt)")
    private List<LocalDate> unavailableDates;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OwnerInfo {
        private Long ownerId;
        private String fullName;
        private String avatarUrl;
        private Double rating;
        private Long totalCars;
    }
}
