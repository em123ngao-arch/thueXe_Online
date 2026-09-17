package com.driveshare.modules.car.dto.request;

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
    private Integer seats;

    @NotBlank(message = "Hộp số không được để trống")
    @Pattern(
            regexp = "AUTOMATIC|MANUAL",
            message = "Hộp số phải là AUTOMATIC hoặc MANUAL"
    )
    private String transmission;

    @NotBlank(message = "Loại nhiên liệu không được để trống")
    @Pattern(
            regexp = "GASOLINE|DIESEL|ELECTRIC|HYBRID",
            message = "Loại nhiên liệu phải là GASOLINE, DIESEL, ELECTRIC hoặc HYBRID"
    )
    private String fuelType;

    // -----------------------------------------------------------------
    // Giá & Địa điểm
    // -----------------------------------------------------------------

    @NotNull(message = "Giá thuê mỗi ngày không được để trống")
    @DecimalMin(value = "100000", message = "Giá thuê tối thiểu là 100.000 VNĐ/ngày")
    @DecimalMax(value = "10000000", message = "Giá thuê tối đa là 10.000.000 VNĐ/ngày")
    private BigDecimal pricePerDay;

    @NotBlank(message = "Địa chỉ xe không được để trống")
    @Size(max = 500, message = "Địa chỉ không được vượt quá 500 ký tự")
    private String address;

    @NotBlank(message = "Tỉnh/Thành phố không được để trống")
    @Size(max = 100, message = "Tỉnh/Thành phố không được vượt quá 100 ký tự")
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
    private String thumbnailUrl;
}
