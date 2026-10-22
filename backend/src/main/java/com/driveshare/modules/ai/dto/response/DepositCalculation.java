package com.driveshare.modules.ai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO tính toán tiền cọc 30% VietQR.
 * Được đính kèm vào phản hồi khi AI phát hiện khách hỏi về giá / cọc cho xe cụ thể.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepositCalculation {

    /** ID xe được tính cọc */
    private Long carId;

    /** Tên xe */
    private String carName;

    /** Số ngày thuê */
    private Integer rentalDays;

    /** Giá thuê xe/ngày */
    private BigDecimal pricePerDay;

    /** Tổng tiền thuê xe = pricePerDay × rentalDays */
    private BigDecimal totalRentalFee;

    /** Có thuê tài xế không */
    private Boolean withDriver;

    /** Phí tài xế/ngày */
    private BigDecimal driverFeePerDay;

    /** Tổng phí tài xế = driverFeePerDay × rentalDays */
    private BigDecimal totalDriverFee;

    /** Tổng cộng = totalRentalFee + totalDriverFee */
    private BigDecimal grandTotal;

    /** Tiền cọc 30% = grandTotal × 0.3 */
    private BigDecimal depositAmount;

    /** Số tiền còn lại khi nhận xe = grandTotal × 0.7 */
    private BigDecimal remainingAmount;

    /** Tiền cọc đã format: "810.000 đ" */
    private String depositFormatted;

    /** Tổng cộng đã format */
    private String grandTotalFormatted;

    /** Còn lại đã format */
    private String remainingFormatted;
}
