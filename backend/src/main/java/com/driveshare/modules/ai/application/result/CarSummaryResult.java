package com.driveshare.modules.ai.application.result;

import com.driveshare.common.enums.EFuelType;
import com.driveshare.common.enums.ETransmission;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

/**
 * Result DTO returned by CarDataQueryPort.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CarSummaryResult {
    private Long carId;
    private String brand;
    private String model;
    private Integer year;
    private BigDecimal pricePerDay;
    private Integer seats;
    private ETransmission transmission;
    private EFuelType fuelType;
    private String features;
    private BigDecimal rating;
    private Integer ratingCount;
    private String thumbnailUrl;
    private String address;
    private String province;
    private Boolean hasDriverService;
    private BigDecimal driverFeePerDay;

    @Builder.Default
    private List<String> images = Collections.emptyList();

    public CarSummaryResult(Long carId, String brand, String model, Integer year,
                            BigDecimal pricePerDay, Integer seats, ETransmission transmission,
                            EFuelType fuelType, String features, BigDecimal rating,
                            Integer ratingCount, String thumbnailUrl, String address,
                            String province, Boolean hasDriverService, BigDecimal driverFeePerDay) {
        this.carId = carId;
        this.brand = brand;
        this.model = model;
        this.year = year;
        this.pricePerDay = pricePerDay;
        this.seats = seats;
        this.transmission = transmission;
        this.fuelType = fuelType;
        this.features = features;
        this.rating = rating;
        this.ratingCount = ratingCount;
        this.thumbnailUrl = thumbnailUrl;
        this.address = address;
        this.province = province;
        this.hasDriverService = hasDriverService;
        this.driverFeePerDay = driverFeePerDay;
        this.images = Collections.emptyList();
    }

    public Long carId() { return carId; }
    public String brand() { return brand; }
    public String model() { return model; }
    public Integer year() { return year; }
    public BigDecimal pricePerDay() { return pricePerDay; }
    public Integer seats() { return seats; }
    public ETransmission transmission() { return transmission; }
    public EFuelType fuelType() { return fuelType; }
    public String features() { return features; }
    public BigDecimal rating() { return rating; }
    public Integer ratingCount() { return ratingCount; }
    public String thumbnailUrl() { return thumbnailUrl; }
    public String address() { return address; }
    public String province() { return province; }
    public Boolean hasDriverService() { return hasDriverService; }
    public BigDecimal driverFeePerDay() { return driverFeePerDay; }
    public List<String> images() { return images; }
}
