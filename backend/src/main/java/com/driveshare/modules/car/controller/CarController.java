package com.driveshare.modules.car.controller;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.common.dto.PageResponse;
import com.driveshare.modules.car.dto.request.CarCreateRequest;
import com.driveshare.modules.car.dto.request.CarStatusUpdateRequest;
import com.driveshare.modules.car.dto.request.CarUpdateRequest;
import com.driveshare.modules.car.dto.response.CarResponse;
import com.driveshare.modules.car.service.CarService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Controller xử lý các API liên quan đến xe (module car).
 *
 * <p>Base path: {@code /api/v1/cars}
 *
 * <ul>
 *   <li>CRP-23 | POST   /api/v1/cars            — Đăng xe mới</li>
 *   <li>CRP-24 | GET    /api/v1/cars/my-cars     — Lấy danh sách xe của Owner</li>
 *   <li>CRP-24 | PUT    /api/v1/cars/{id}        — Cập nhật thông tin xe</li>
 *   <li>CRP-24 | PATCH  /api/v1/cars/{id}/status — Đổi trạng thái xe</li>
 *   <li>CRP-24 | DELETE /api/v1/cars/{id}        — Xóa mềm xe</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/v1/cars")
@RequiredArgsConstructor
@Tag(name = "Car Management", description = "API quản lý xe (Owner)")
@SecurityRequirement(name = "bearerAuth")
public class CarController {

    private final CarService carService;

    // =====================================================================
    // CRP-23 — POST /api/v1/cars
    // =====================================================================

    @Operation(
            summary = "Đăng xe mới",
            description = "Owner đăng ký một xe cho thuê mới. " +
                    "Xe mới sẽ có trạng thái PENDING, chờ Admin/Staff xét duyệt."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Đăng xe thành công")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Tài khoản chủ xe chưa được duyệt")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Biển số xe đã tồn tại")
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'ROLE_OWNER')")
    public ResponseEntity<ApiResponse<CarResponse>> createCar(
            @Valid @RequestBody CarCreateRequest request) {

        CarResponse response = carService.createCar(request);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<CarResponse>builder()
                        .success(true)
                        .message("Đăng xe thành công! Xe của bạn đang chờ Admin xét duyệt.")
                        .data(response)
                        .build()
        );
    }

    // =====================================================================
    // CRP-24 — GET /api/v1/cars/my-cars
    // (Đặt trước /{id} để Spring không nhầm "my-cars" với một {id} Long)
    // =====================================================================

    @Operation(
            summary = "Lấy danh sách xe của tôi",
            description = "Owner lấy tất cả xe của mình (chưa bị xóa), có hỗ trợ lọc theo trạng thái và phân trang. " +
                    "Sắp xếp theo ngày tạo mới nhất."
    )
    @GetMapping("/my-cars")
    @PreAuthorize("hasAnyRole('OWNER', 'ROLE_OWNER')")
    public ResponseEntity<ApiResponse<PageResponse<CarResponse>>> getMyCars(
            @RequestParam(required = false) com.driveshare.common.enums.ECarStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageResponse<CarResponse> pageData = carService.getMyCarsPaged(status, page, size);

        return ResponseEntity.ok(
                ApiResponse.<PageResponse<CarResponse>>builder()
                        .success(true)
                        .message("Lấy danh sách xe thành công")
                        .data(pageData)
                        .build()
        );
    }

    // =====================================================================
    // CRP-24 — PUT /api/v1/cars/{id}
    // =====================================================================

    @Operation(
            summary = "Cập nhật thông tin xe",
            description = "Owner cập nhật thông tin xe của mình. " +
                    "Các trường không gửi lên (null) sẽ giữ nguyên giá trị cũ."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Cập nhật thành công")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không có quyền chỉnh sửa xe này")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Không tìm thấy xe")
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ROLE_OWNER')")
    public ResponseEntity<ApiResponse<CarResponse>> updateCar(
            @PathVariable Long id,
            @Valid @RequestBody CarUpdateRequest request) {

        CarResponse response = carService.updateCar(id, request);

        return ResponseEntity.ok(
                ApiResponse.<CarResponse>builder()
                        .success(true)
                        .message("Cập nhật thông tin xe thành công")
                        .data(response)
                        .build()
        );
    }

    // =====================================================================
    // CRP-24 — PATCH /api/v1/cars/{id}/status
    // =====================================================================

    @Operation(
            summary = "Đổi trạng thái xe",
            description = "Owner bật/tắt hiển thị xe (ACTIVE ↔ INACTIVE). " +
                    "Không thể đổi sang PENDING hoặc REJECTED — chỉ Admin/Staff mới có quyền đó."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Đổi trạng thái thành công")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Trạng thái không hợp lệ")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không có quyền thao tác xe này")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Không tìm thấy xe")
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('OWNER', 'ROLE_OWNER')")
    public ResponseEntity<ApiResponse<CarResponse>> updateCarStatus(
            @PathVariable Long id,
            @Valid @RequestBody CarStatusUpdateRequest request) {

        CarResponse response = carService.updateCarStatus(id, request);

        return ResponseEntity.ok(
                ApiResponse.<CarResponse>builder()
                        .success(true)
                        .message("Cập nhật trạng thái xe thành công")
                        .data(response)
                        .build()
        );
    }

    // =====================================================================
    // CRP-32 — PATCH /api/v1/cars/{id}/deactivate
    // =====================================================================

    @Operation(
            summary = "Ẩn xe (Deactivate)",
            description = "Owner chuyển trạng thái xe sang INACTIVE để ẩn khỏi kết quả tìm kiếm của khách."
    )
    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('OWNER', 'ROLE_OWNER')")
    public ResponseEntity<ApiResponse<CarResponse>> deactivateCar(@PathVariable Long id) {
        CarResponse response = carService.deactivateCar(id);

        return ResponseEntity.ok(
                ApiResponse.<CarResponse>builder()
                        .success(true)
                        .message("Ẩn xe (Deactivate) thành công")
                        .data(response)
                        .build()
        );
    }

    // =====================================================================
    // CRP-24 — DELETE /api/v1/cars/{id}
    // =====================================================================

    @Operation(
            summary = "Xóa xe",
            description = "Owner xóa mềm xe của mình (xe không bị xóa vật lý khỏi CSDL). " +
                    "Không thể xóa nếu xe đang có đơn đặt chưa hoàn tất."
    )
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Xóa xe thành công")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Xe đang có đơn đặt hoạt động")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không có quyền xóa xe này")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Không tìm thấy xe")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'ROLE_OWNER')")
    public ResponseEntity<ApiResponse<Void>> deleteCar(@PathVariable Long id) {
        carService.deleteCar(id);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Xóa xe thành công")
                        .build()
        );
    }
}
