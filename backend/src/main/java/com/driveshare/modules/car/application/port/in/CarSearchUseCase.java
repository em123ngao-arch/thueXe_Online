package com.driveshare.modules.car.application.port.in;

import com.driveshare.common.dto.PageResponse;
import com.driveshare.modules.car.dto.request.CarSearchFilterRequest;
import com.driveshare.modules.car.dto.response.CarResponse;

public interface CarSearchUseCase {

    PageResponse<CarResponse> searchPublicCars(CarSearchFilterRequest request);
}

