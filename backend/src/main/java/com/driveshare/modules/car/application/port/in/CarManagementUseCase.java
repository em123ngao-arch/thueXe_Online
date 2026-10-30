package com.driveshare.modules.car.application.port.in;

import com.driveshare.common.dto.PageResponse;
import com.driveshare.common.enums.ECarStatus;
import com.driveshare.modules.car.dto.request.CarCreateRequest;
import com.driveshare.modules.car.dto.request.CarSearchRequest;
import com.driveshare.modules.car.dto.request.CarStatusUpdateRequest;
import com.driveshare.modules.car.dto.request.CarUpdateRequest;
import com.driveshare.modules.car.dto.response.CarDetailResponse;
import com.driveshare.modules.car.dto.response.CarResponse;

public interface CarManagementUseCase {

    CarResponse createCar(CarCreateRequest request);

    CarResponse updateCar(Long carId, CarUpdateRequest request);

    CarResponse updateCarStatus(Long carId, CarStatusUpdateRequest request);

    CarResponse deactivateCar(Long carId);

    void deleteCar(Long carId);

    PageResponse<CarResponse> getMyCarsPaged(ECarStatus status, int page, int size);

    PageResponse<CarResponse> getPublicActiveCars(int page, int size);

    CarDetailResponse getPublicCarDetail(Long carId);

    PageResponse<CarResponse> searchCars(CarSearchRequest request);
}

