package com.driveshare.modules.car.service;

import com.driveshare.common.dto.PageResponse;
import com.driveshare.modules.car.dto.request.CarSearchFilterRequest;
import com.driveshare.modules.car.dto.response.CarResponse;

public interface CarSearchService {

    /**
     * Tìm kiếm danh sách xe công khai có bộ lọc đa tiêu chí, phân trang và sắp xếp (CRP-35, 36, 38).
     *
     * @param request bộ lọc tìm kiếm
     * @return danh sách xe phân trang
     */
    PageResponse<CarResponse> searchPublicCars(CarSearchFilterRequest request);
}
