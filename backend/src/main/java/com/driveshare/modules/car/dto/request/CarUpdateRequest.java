package com.driveshare.modules.car.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

/**
 * DTO nhận dữ liệu khi Owner cập nhật thông tin xe (CRP-24).
 * Tất cả trường đều optional — chỉ validate khi giá trị được gửi lên (not null).
 * <p>
 * Lưu ý: {@code plateNumber} không cho phép thay đổi sau khi xe đã được tạo
 * (biển số là định danh duy nhất không đổi) — trường này bị loại khỏi request.
 */
@Data
public class CarUpdateRequest {

    @Size(max = 100, message = "Hãng xe không được vượt quá 100 ký tự")
    private String brand;

    @Size(max = 100, message = "Dòng xe không được vượt quá 100 ký tự")
    private String model;

    @Min(value = 2000, message = "Năm sản xuất phải từ 2000 trở lên")
    @Max(value = 2100, message = "Năm sản xuất không hợp lệ")
    private Integer year;

    @Size(max = 50, message = "Màu sắc không được vượt quá 50 ký tự")
    private String color;

    @Min(value = 2, message = "Số chỗ ngồi tối thiểu là 2")
    @Max(value = 16, message = "Số chỗ ngồi tối đa là 16")
    private Integer seats;

    @Pattern(
            regexp = "AUTOMATIC|MANUAL",
            message = "Hộp số phải là AUTOMATIC hoặc MANUAL"
    )
    private String transmission;

    @Pattern(
            regexp = "GASOLINE|DIESEL|ELECTRIC|HYBRID",
            message = "Loại nhiên liệu phải là GASOLINE, DIESEL, ELECTRIC hoặc HYBRID"
    )
    private String fuelType;

    @DecimalMin(value = "100000", message = "Giá thuê tối thiểu là 100.000 VNĐ/ngày")
    @DecimalMax(value = "10000000", message = "Giá thuê tối đa là 10.000.000 VNĐ/ngày")
    private BigDecimal pricePerDay;

    @Size(max = 500, message = "Địa chỉ không được vượt quá 500 ký tự")
    private String address;

    @Size(max = 100, message = "Tỉnh/Thành phố không được vượt quá 100 ký tự")
    private String province;

    @Size(max = 2000, message = "Mô tả không được vượt quá 2000 ký tự")
    private String description;

    @Size(max = 1000, message = "Danh sách tiện nghi không được vượt quá 1000 ký tự")
    private String features;

    @Size(max = 500, message = "URL ảnh bìa không được vượt quá 500 ký tự")
    private String thumbnailUrl;
}
