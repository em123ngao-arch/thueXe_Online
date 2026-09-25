package com.driveshare.modules.car.dto.request;

import com.driveshare.common.enums.EFuelType;
import com.driveshare.common.enums.ETransmission;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Bộ lọc tìm kiếm xe công khai đa tiêu chí (CRP-35, 36, 38)")
public class CarSearchFilterRequest {

    @Schema(description = "Hãng xe (VD: Toyota, Mazda, Honda)", example = "Toyota")
    private String brand;

    @Schema(description = "Dòng xe (VD: Camry, CX-5, Civic)", example = "Camry")
    private String model;

    @Min(value = 0, message = "Giá tối thiểu không được âm")
    @Schema(description = "Giá thuê tối thiểu / ngày", example = "500000")
    private BigDecimal priceMin;

    @Min(value = 0, message = "Giá tối đa không được âm")
    @Schema(description = "Giá thuê tối đa / ngày", example = "2000000")
    private BigDecimal priceMax;

    @Schema(description = "Số chỗ ngồi (VD: 4, 5, 7)", example = "5")
    private Integer seats;

    @Schema(description = "Loại hộp số (MANUAL, AUTOMATIC)", example = "AUTOMATIC")
    private ETransmission transmission;

    @Schema(description = "Loại nhiên liệu (GASOLINE, DIESEL, ELECTRIC)", example = "GASOLINE")
    private EFuelType fuelType;

    @Schema(description = "Tỉnh/Thành phố (VD: Hà Nội, TP. Hồ Chí Minh)", example = "TP. Hồ Chí Minh")
    private String province;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    @Schema(description = "Ngày bắt đầu thuê (YYYY-MM-DD)", example = "2026-10-01")
    private LocalDate startDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    @Schema(description = "Ngày kết thúc thuê (YYYY-MM-DD)", example = "2026-10-05")
    private LocalDate endDate;

    @Builder.Default
    @Schema(description = "Tiêu chí sắp xếp: price_asc, price_desc, year_desc, newest", example = "newest")
    private String sortBy = "newest";

    @Builder.Default
    @Min(value = 0, message = "Trang phải >= 0")
    @Schema(description = "Số trang (bắt đầu từ 0)", example = "0")
    private int page = 0;

    @Builder.Default
    @Min(value = 1, message = "Kích thước trang phải >= 1")
    @Schema(description = "Số bản ghi trên mỗi trang", example = "10")
    private int size = 10;
}
