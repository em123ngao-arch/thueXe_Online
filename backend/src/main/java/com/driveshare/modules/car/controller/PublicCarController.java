package com.driveshare.modules.car.controller;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.common.dto.PageResponse;
import com.driveshare.modules.car.dto.response.CarResponse;
import com.driveshare.modules.car.service.CarService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/public/cars")
@RequiredArgsConstructor
@Tag(name = "Public Cars", description = "API công khai xem danh sách xe dành cho khách thuê (BR-04-2)")
public class PublicCarController {

    private final CarService carService;
    private final com.driveshare.modules.car.service.CarSearchService carSearchService;

    @GetMapping
    @Operation(summary = "Xem và tìm kiếm danh sách xe công khai", description = "Chỉ trả về các xe ACTIVE, hỗ trợ lọc theo hãng, giá, chỗ ngồi, ngày trống (CRP-35, 36, 38)")
    public ResponseEntity<ApiResponse<PageResponse<CarResponse>>> getPublicCars(
            @jakarta.validation.Valid @ModelAttribute com.driveshare.modules.car.dto.request.CarSearchFilterRequest request
    ) {
        PageResponse<CarResponse> pageData = carSearchService.searchPublicCars(request);
        return ResponseEntity.ok(
                ApiResponse.<PageResponse<CarResponse>>builder()
                        .code(200)
                        .success(true)
                        .message("Lấy danh sách xe thành công")
                        .data(pageData)
                        .build()
        );
    }
}

