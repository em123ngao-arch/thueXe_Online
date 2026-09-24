package com.driveshare.modules.car.controller;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.modules.car.dto.response.CarImageResponse;
import com.driveshare.modules.car.service.CarImageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Controller quản lý Upload và quản lý ảnh xe dành cho Owner (CRP-33).
 */
@RestController
@RequestMapping("/api/v1/cars/{carId}/photos")
@RequiredArgsConstructor
@Tag(name = "Car Photos Management", description = "API quản lý ảnh xe (Owner)")
public class CarPhotoController {

    private final CarImageService carImageService;

    @Operation(summary = "Tải lên ảnh xe", description = "Owner tải lên ảnh mới cho xe của mình (tối đa 10 ảnh, dung lượng <= 5MB).")
    @SecurityRequirement(name = "bearerAuth")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('OWNER', 'ROLE_OWNER')")
    public ResponseEntity<ApiResponse<CarImageResponse>> uploadPhoto(
            @PathVariable Long carId,
            @RequestParam("file") MultipartFile file) {

        CarImageResponse response = carImageService.uploadPhoto(carId, file);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                ApiResponse.<CarImageResponse>builder()
                        .success(true)
                        .message("Tải lên hình ảnh xe thành công")
                        .data(response)
                        .build()
        );
    }

    @Operation(summary = "Lấy danh sách ảnh của xe", description = "Xem tất cả hình ảnh của xe.")
    @GetMapping
    public ResponseEntity<ApiResponse<List<CarImageResponse>>> getCarPhotos(@PathVariable Long carId) {
        List<CarImageResponse> photos = carImageService.getCarPhotos(carId);

        return ResponseEntity.ok(
                ApiResponse.<List<CarImageResponse>>builder()
                        .success(true)
                        .message("Lấy danh sách hình ảnh thành công")
                        .data(photos)
                        .build()
        );
    }

    @Operation(summary = "Xóa ảnh xe", description = "Owner xóa một hình ảnh khỏi danh sách ảnh xe.")
    @SecurityRequirement(name = "bearerAuth")
    @DeleteMapping("/{photoId}")
    @PreAuthorize("hasAnyRole('OWNER', 'ROLE_OWNER')")
    public ResponseEntity<ApiResponse<Void>> deletePhoto(
            @PathVariable Long carId,
            @PathVariable Long photoId) {

        carImageService.deletePhoto(carId, photoId);

        return ResponseEntity.ok(
                ApiResponse.<Void>builder()
                        .success(true)
                        .message("Xóa hình ảnh thành công")
                        .build()
        );
    }

    @Operation(summary = "Đặt ảnh đại diện (Thumbnail)", description = "Owner chọn một hình ảnh làm ảnh đại diện chính cho xe.")
    @SecurityRequirement(name = "bearerAuth")
    @PatchMapping("/{photoId}/set-primary")
    @PreAuthorize("hasAnyRole('OWNER', 'ROLE_OWNER')")
    public ResponseEntity<ApiResponse<CarImageResponse>> setPrimaryPhoto(
            @PathVariable Long carId,
            @PathVariable Long photoId) {

        CarImageResponse response = carImageService.setPrimaryPhoto(carId, photoId);

        return ResponseEntity.ok(
                ApiResponse.<CarImageResponse>builder()
                        .success(true)
                        .message("Đặt hình ảnh làm ảnh đại diện thành công")
                        .data(response)
                        .build()
        );
    }
}
