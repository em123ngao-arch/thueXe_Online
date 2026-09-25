package com.driveshare.modules.car.dto.request;

import com.driveshare.common.enums.EFuelType;
import com.driveshare.common.enums.ETransmission;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

/**
 * DTO nhận dữ liệu từ Client khi Owner đăng ký xe mới (CRP-23).
 * Mọi trường bắt buộc được validate ngay tại đây trước khi vào Service.
 */
@Data
public class CarCreateRequest {

    // -----------------------------------------------------------------
    // Thông tin nhận diện xe
    // -----------------------------------------------------------------

    @NotBlank(message = "Biển số xe không được để trống")
    @Pattern(
            regexp = "^[0-9]{2}[A-Z]-[0-9]{4,5}$|^[0-9]{2}[A-Z][0-9]-[0-9]{4}$",
            message = "Biển số xe không đúng định dạng Việt Nam (VD: 51A-12345, 50F1-1234)"
    )
    @JsonProperty("plateNumber")
    @JsonAlias({"plate_number", "licensePlate", "license_plate"})
    private String plateNumber;

    @NotBlank(message = "Hãng xe không được để trống")
    @Size(max = 100, message = "Hãng xe không được vượt quá 100 ký tự")
    private String brand;

    @NotBlank(message = "Dòng xe không được để trống")
    @Size(max = 100, message = "Dòng xe không được vượt quá 100 ký tự")
    private String model;

    @NotNull(message = "Năm sản xuất không được để trống")
    @Min(value = 2000, message = "Năm sản xuất phải từ 2000 trở lên")
    @Max(value = 2100, message = "Năm sản xuất không hợp lệ")
    private Integer year;

    @Size(max = 50, message = "Màu sắc không được vượt quá 50 ký tự")
    private String color;

    @NotNull(message = "Số chỗ ngồi không được để trống")
    @Min(value = 2, message = "Số chỗ ngồi tối thiểu là 2")
    @Max(value = 16, message = "Số chỗ ngồi tối đa là 16")
    @JsonProperty("seats")
    @JsonAlias({"seat_count", "seatCount"})
    private Integer seats;

    @NotNull(message = "Hộp số không được để trống")
    private ETransmission transmission;

    @NotNull(message = "Loại nhiên liệu không được để trống")
    @JsonProperty("fuelType")
    @JsonAlias({"fuel_type", "fuel"})
    private EFuelType fuelType;

    // -----------------------------------------------------------------
    // Giá & Địa điểm
    // -----------------------------------------------------------------

    @NotNull(message = "Giá thuê mỗi ngày không được để trống")
    @DecimalMin(value = "100000", message = "Giá thuê tối thiểu là 100.000 VNĐ/ngày")
    @DecimalMax(value = "10000000", message = "Giá thuê tối đa là 10.000.000 VNĐ/ngày")
    @JsonProperty("pricePerDay")
    @JsonAlias({"price_per_day", "price"})
    private BigDecimal pricePerDay;

    @NotBlank(message = "Địa chỉ xe không được để trống")
    @Size(max = 500, message = "Địa chỉ không được vượt quá 500 ký tự")
    @JsonProperty("address")
    @JsonAlias({"pickupAddress", "pickup_address"})
    private String address;

    @NotBlank(message = "Tỉnh/Thành phố không được để trống")
    @Size(max = 100, message = "Tỉnh/Thành phố không được vượt quá 100 ký tự")
    @JsonProperty("province")
    @JsonAlias({"city"})
    private String province;

    // -----------------------------------------------------------------
    // Mô tả & Tiện nghi
    // -----------------------------------------------------------------

    @Size(max = 2000, message = "Mô tả không được vượt quá 2000 ký tự")
    private String description;

    /**
     * Danh sách tiện nghi, lưu dạng chuỗi phân cách bởi dấu phẩy.
     * VD: "GPS,Bluetooth,Camera lùi,Cửa sổ trời"
     */
    @Size(max = 1000, message = "Danh sách tiện nghi không được vượt quá 1000 ký tự")
    private String features;

    @Size(max = 500, message = "URL ảnh bìa không được vượt quá 500 ký tự")
    @JsonProperty("thumbnailUrl")
    @JsonAlias({"thumbnail_url", "imageUrl", "image_url"})
    private String thumbnailUrl;
}
