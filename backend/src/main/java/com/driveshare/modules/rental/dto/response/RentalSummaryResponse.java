package com.driveshare.modules.rental.dto.response;

import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.modules.rental.entity.Rental;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RentalSummaryResponse {

    private Long rentalId;
    private Long carId;
    private Long renterId;

    // Thông tin xe
    private String carBrand;
    private String carModel;
    private String carPlateNumber;
    private String carThumbnailUrl;

    // Thông tin khách thuê
    private String renterFullName;
    private String renterPhone;

    // Chi tiết cuốc thuê
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer totalDays;
    private BigDecimal pricePerDay;
    private BigDecimal totalPrice;
    private BigDecimal depositAmount;

    // Trạng thái & ghi chú
    private ERentalStatus status;
    private String rejectReason;
    private String note;
    private Instant createdAt;

    public static RentalSummaryResponse fromEntity(Rental rental) {
        if (rental == null) {
            return null;
        }

        String brand = rental.getCar() != null ? rental.getCar().getBrand() : null;
        String model = rental.getCar() != null ? rental.getCar().getModel() : null;
        String plateNumber = rental.getCar() != null ? rental.getCar().getPlateNumber() : null;
        String thumbnailUrl = rental.getCar() != null ? rental.getCar().getThumbnailUrl() : null;

        String renterFullName = rental.getRenter() != null ? rental.getRenter().getFullName() : null;
        String renterPhone = rental.getRenter() != null ? rental.getRenter().getPhone() : null;

        return RentalSummaryResponse.builder()
                .rentalId(rental.getRentalId())
                .carId(rental.getCarId())
                .renterId(rental.getRenterId())
                .carBrand(brand)
                .carModel(model)
                .carPlateNumber(plateNumber)
                .carThumbnailUrl(thumbnailUrl)
                .renterFullName(renterFullName)
                .renterPhone(renterPhone)
                .startDate(rental.getStartDate())
                .endDate(rental.getEndDate())
                .totalDays(rental.getTotalDays())
                .pricePerDay(rental.getPricePerDay())
                .totalPrice(rental.getTotalPrice())
                .depositAmount(rental.getDepositAmount())
                .status(rental.getStatus())
                .rejectReason(rental.getRejectReason())
                .note(rental.getNote())
                .createdAt(rental.getCreatedAt())
                .build();
    }
}
