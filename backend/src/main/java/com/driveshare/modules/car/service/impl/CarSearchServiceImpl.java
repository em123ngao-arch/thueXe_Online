package com.driveshare.modules.car.service.impl;

import com.driveshare.common.dto.PageResponse;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.car.dto.request.CarSearchFilterRequest;
import com.driveshare.modules.car.dto.response.CarResponse;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.car.service.CarSearchService;
import com.driveshare.modules.car.specification.CarSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CarSearchServiceImpl implements CarSearchService {

    private final CarRepository carRepository;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CarResponse> searchPublicCars(CarSearchFilterRequest request) {
        if (request == null) {
            request = new CarSearchFilterRequest();
        }

        // Validate ngày hợp lệ (nếu truyền)
        if (request.getStartDate() != null && request.getEndDate() != null) {
            if (request.getStartDate().isAfter(request.getEndDate())) {
                throw new AppException(ErrorCode.INVALID_RENTAL_DATES);
            }
        }

        // Xây dựng Sort
        Sort sort = resolveSort(request.getSortBy());

        // Phân trang
        int page = Math.max(0, request.getPage());
        int size = request.getSize() > 0 ? request.getSize() : 10;
        Pageable pageable = PageRequest.of(page, size, sort);

        // Lọc với CarSpecification
        Specification<Car> spec = CarSpecification.filterCars(request);
        Page<CarResponse> resultPage = carRepository.findAll(spec, pageable)
                .map(CarResponse::fromEntity);

        return PageResponse.from(resultPage);
    }

    private Sort resolveSort(String sortBy) {
        if ("price_asc".equalsIgnoreCase(sortBy)) {
            return Sort.by(Sort.Direction.ASC, "pricePerDay");
        } else if ("price_desc".equalsIgnoreCase(sortBy)) {
            return Sort.by(Sort.Direction.DESC, "pricePerDay");
        } else if ("year_desc".equalsIgnoreCase(sortBy)) {
            return Sort.by(Sort.Direction.DESC, "year");
        }
        return Sort.by(Sort.Direction.DESC, "createdAt");
    }
}
