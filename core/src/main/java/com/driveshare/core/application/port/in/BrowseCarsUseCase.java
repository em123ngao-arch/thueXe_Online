package com.driveshare.core.application.port.in;

import com.driveshare.core.application.dto.CarResult;

import java.util.List;

public interface BrowseCarsUseCase {
    List<CarResult> getAvailableCars();
    CarResult getCarById(Long id);
}
