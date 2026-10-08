package com.driveshare.modules.rental.controller;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.rental.dto.CreateRentalRequest;
import com.driveshare.modules.rental.dto.RentalResponse;
import com.driveshare.modules.rental.dto.response.RentalInspectionResponse;
import com.driveshare.modules.rental.dto.response.RentalSummaryResponse;
import com.driveshare.modules.rental.service.RentalInspectionService;
import com.driveshare.modules.rental.service.RentalQueryService;
import com.driveshare.modules.rental.service.RentalService;
import com.driveshare.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/rentals")
@RequiredArgsConstructor
@Tag(name = "Rental Management", description = "API quản lý và truy vấn yêu cầu thuê xe (CRP-41, CRP-42, CRP-44, Sprint 3 Inspection)")
@SecurityRequirement(name = "bearerAuth")
public class RentalController {

    private final RentalService rentalService;
    private final RentalQueryService rentalQueryService;
    private final RentalInspectionService rentalInspectionService;

    /**
     * CRP-41 & CRP-42: Gửi yêu cầu thuê xe mới (trạng thái ban đầu: PENDING).
     * Khống chế tối đa 3 đơn PENDING cho mỗi khách thuê.
     */
    @Operation(
            summary = "Gửi yêu cầu thuê xe mới (CRP-41, CRP-42)",
            description = "Khách thuê gửi yêu cầu thuê xe. Tối đa 3 đơn PENDING cho mỗi khách."
    )
    @PostMapping
    public ResponseEntity<ApiResponse<RentalResponse>> createRental(
            @Valid @RequestBody CreateRentalRequest request) {

        RentalResponse response = rentalService.createRentalRequest(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * CRP-44: Khách thuê xem danh sách đơn thuê của chính mình.
     */
    @GetMapping("/me")
    @PreAuthorize("hasRole('RENTER')")
    @Operation(summary = "Xem danh sách đơn thuê của tôi (CRP-44)", description = "Khách thuê xem toàn bộ lịch sử đơn thuê của chính mình")
    public ResponseEntity<ApiResponse<List<RentalSummaryResponse>>> getMyRentals() {
        List<RentalSummaryResponse> data = rentalQueryService.getMyRentals();
        return ResponseEntity.ok(
                ApiResponse.<List<RentalSummaryResponse>>builder()
                        .code(200)
                        .success(true)
                        .message("Lấy danh sách đơn thuê thành công")
                        .data(data)
                        .build()
        );
    }

    /**
     * CRP-44: Khách thuê tự hủy yêu cầu thuê xe khi đang ở trạng thái PENDING.
     */
    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('RENTER')")
    @Operation(summary = "Hủy yêu cầu thuê xe (CRP-44)", description = "Khách thuê tự hủy yêu cầu thuê xe khi đang ở trạng thái PENDING")
    public ResponseEntity<ApiResponse<RentalSummaryResponse>> cancelRental(@PathVariable("id") Long id) {
        RentalSummaryResponse data = rentalQueryService.cancelMyRental(id);
        return ResponseEntity.ok(
                ApiResponse.<RentalSummaryResponse>builder()
                        .code(200)
                        .success(true)
                        .message("Hủy yêu cầu thuê xe thành công")
                        .data(data)
                        .build()
        );
    }

    /**
     * Sprint 3: Xem toàn bộ biên bản bàn giao (Check-in) và nghiệm thu trả xe (Check-out) của chuyến đi.
     */
    @GetMapping("/{id}/inspections")
    @Operation(summary = "Xem biên bản bàn giao và trả xe (Sprint 3)", description = "Chủ xe hoặc khách thuê xem chi tiết 2 biên bản nhận & trả kèm ảnh đối chiếu")
    public ResponseEntity<ApiResponse<List<RentalInspectionResponse>>> getRentalInspections(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Long userId = userDetails != null ? userDetails.getUserId() : getCurrentUserId();
        List<RentalInspectionResponse> data = rentalInspectionService.getInspections(id, userId);
        return ResponseEntity.ok(
                ApiResponse.<List<RentalInspectionResponse>>builder()
                        .code(200)
                        .success(true)
                        .message("Lấy danh sách biên bản giao nhận thành công")
                        .data(data)
                        .build()
        );
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof CustomUserDetails userDetails) {
            return userDetails.getUserId();
        }
        throw new AppException(ErrorCode.UNAUTHENTICATED);
    }
}
