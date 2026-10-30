package com.driveshare.modules.car.domain.model;

import com.driveshare.common.enums.ECarStatus;
import com.driveshare.common.enums.EFuelType;
import com.driveshare.common.enums.ETransmission;

import java.math.BigDecimal;

public record CarRecord(
        Long carId,
        Long ownerId,
        String brand,
        String model,
        Integer year,
        String plateNumber,
        BigDecimal pricePerDay,
        ECarStatus status,
        ETransmission transmission,
        EFuelType fuelType,
        Integer seats,
        String province,
        String address
) {
}

