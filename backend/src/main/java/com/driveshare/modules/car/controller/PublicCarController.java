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

import com.driveshare.modules.car.dto.request.CarSearchRequest;
import jakarta.validation.Valid;
import org.springdoc.core.annotations.ParameterObject;

@RestController
@RequestMapping("/api/v1/public/cars")
@RequiredArgsConstructor
@Tag(name = "Public Cars", description = "API công khai xem và tìm kiếm xe dành cho khách thuê (CRP-39)")
public class PublicCarController {

    private final CarService carService;

    @GetMapping
    @Operation(summary = "Xem danh sách xe công khai", description = "Chỉ trả về các xe có trạng thái ACTIVE (BR-04-2)")
    public ResponseEntity<ApiResponse<PageResponse<CarResponse>>> getPublicCars(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PageResponse<CarResponse> pageData = carService.getPublicActiveCars(page, size);
        return ResponseEntity.ok(
                ApiResponse.<PageResponse<CarResponse>>builder()
                        .code(200)
                        .success(true)
                        .message("Lấy danh sách xe thành công")
                        .data(pageData)
                        .build()
        );
    }

    @GetMapping("/search")
    @Operation(
            summary = "Tìm kiếm và lọc danh sách xe (CRP-39)",
            description = "Cho phép tìm kiếm xe theo nhiều tiêu chí động: Địa điểm, Khoảng ngày thuê, Khoảng giá, Hãng xe, Số chỗ, Hộp số, Nhiên liệu..."
    )
    public ResponseEntity<ApiResponse<PageResponse<CarResponse>>> searchCars(
            @ParameterObject @Valid CarSearchRequest request) {

        PageResponse<CarResponse> pageData = carService.searchCars(request);

        return ResponseEntity.ok(
                ApiResponse.<PageResponse<CarResponse>>builder()
                        .success(true)
                        .message("Tìm kiếm danh sách xe thành công")
                        .data(pageData)
                        .build()
        );
    }

    // =====================================================================
    // CRP-37 — GET /api/v1/public/cars/{carId}
    // =====================================================================

    @GetMapping("/{carId}")
    @Operation(
            summary = "Xem chi tiết thông tin xe (CRP-37)",
            description = "Khách thuê hoặc người dùng ẩn danh xem trang chi tiết xe: thông số, ảnh gallery, thông tin chủ xe, lịch ngày đã đặt."
    )
    public ResponseEntity<ApiResponse<com.driveshare.modules.car.dto.response.CarDetailResponse>> getCarDetail(
            @PathVariable Long carId) {

        com.driveshare.modules.car.dto.response.CarDetailResponse detail = carService.getPublicCarDetail(carId);

        return ResponseEntity.ok(
                ApiResponse.<com.driveshare.modules.car.dto.response.CarDetailResponse>builder()
                        .success(true)
                        .message("Lấy thông tin chi tiết xe thành công")
                        .data(detail)
                        .build()
        );
    }
}

