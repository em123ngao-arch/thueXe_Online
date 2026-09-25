package com.driveshare.modules.car.dto.request;

import com.driveshare.common.enums.EFuelType;
import com.driveshare.common.enums.ETransmission;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO chứa thông tin các tiêu chí tìm kiếm và lọc xe (CRP-39).
 */
@Data
@Schema(description = "Request DTO cho API tìm kiếm và lọc xe")
public class CarSearchRequest {

    @Schema(description = "Tỉnh/Thành phố (ví dụ: TP. Hồ Chí Minh, Hà Nội)", example = "TP. Hồ Chí Minh")
    private String province;

    @Schema(description = "Địa chỉ hoặc vị trí cụ thể", example = "Quận 1")
    private String location;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    @Schema(description = "Ngày bắt đầu thuê (YYYY-MM-DD)", example = "2026-10-01")
    private LocalDate startDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    @Schema(description = "Ngày kết thúc thuê (YYYY-MM-DD)", example = "2026-10-05")
    private LocalDate endDate;

    @Min(value = 0, message = "Giá thuê tối thiểu phải >= 0")
    @Schema(description = "Giá thuê tối thiểu/ngày (VNĐ)", example = "300000")
    private BigDecimal minPrice;

    @Schema(description = "Giá thuê tối đa/ngày (VNĐ)", example = "2000000")
    private BigDecimal maxPrice;

    @Schema(description = "Hãng xe (ví dụ: Toyota, Honda, Hyundai)", example = "Toyota")
    private String brand;

    @Schema(description = "Số chỗ ngồi (ví dụ: 4, 5, 7)", example = "5")
    private Integer seats;

    @Schema(description = "Hộp số (AUTOMATIC / MANUAL)", example = "AUTOMATIC")
    private ETransmission transmission;

    @Schema(description = "Nhiên liệu (GASOLINE / DIESEL / ELECTRIC / HYBRID)", example = "GASOLINE")
    private EFuelType fuelType;

    @Schema(description = "Tiêu chí sắp xếp: price_asc, price_desc, newest, rating", example = "price_asc")
    private String sortBy = "newest";

    @Min(value = 0, message = "Trang phải >= 0")
    @Schema(description = "Số trang (0-indexed)", example = "0")
    private int page = 0;

    @Min(value = 1, message = "Số lượng bản ghi mỗi trang phải >= 1")
    @Schema(description = "Số bản ghi trên 1 trang", example = "10")
    private int size = 10;
}
