package com.driveshare.modules.ai.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    @JsonProperty("carId")
    public Long getCarIdCamel() { return carId; }

    @JsonProperty("carName")
    public String getCarNameCamel() { return carName; }

    @JsonProperty("rentalDays")
    public Integer getRentalDaysCamel() { return rentalDays; }

    @JsonProperty("pricePerDay")
    public BigDecimal getPricePerDayCamel() { return pricePerDay; }

    @JsonProperty("totalRentalFee")
    public BigDecimal getTotalRentalFeeCamel() { return totalRentalFee; }

    @JsonProperty("withDriver")
    public Boolean getWithDriverCamel() { return withDriver; }

    @JsonProperty("driverFeePerDay")
    public BigDecimal getDriverFeePerDayCamel() { return driverFeePerDay; }

    @JsonProperty("totalDriverFee")
    public BigDecimal getTotalDriverFeeCamel() { return totalDriverFee; }

    @JsonProperty("grandTotal")
    public BigDecimal getGrandTotalCamel() { return grandTotal; }

    @JsonProperty("depositAmount")
    public BigDecimal getDepositAmountCamel() { return depositAmount; }

    @JsonProperty("remainingAmount")
    public BigDecimal getRemainingAmountCamel() { return remainingAmount; }

    @JsonProperty("depositFormatted")
    public String getDepositFormattedCamel() { return depositFormatted; }

    @JsonProperty("grandTotalFormatted")
    public String getGrandTotalFormattedCamel() { return grandTotalFormatted; }

    @JsonProperty("remainingFormatted")
    public String getRemainingFormattedCamel() { return remainingFormatted; }
}
