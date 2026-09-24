package com.driveshare.modules.rental.controller;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.modules.rental.dto.CreateRentalRequest;
import com.driveshare.modules.rental.dto.RentalResponse;
import com.driveshare.modules.rental.dto.response.RentalSummaryResponse;
import com.driveshare.modules.rental.service.RentalQueryService;
import com.driveshare.modules.rental.service.RentalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/rentals")
@RequiredArgsConstructor
@Tag(name = "Rental Management", description = "API quản lý và truy vấn yêu cầu thuê xe (CRP-41, CRP-42, CRP-44)")
@SecurityRequirement(name = "bearerAuth")
public class RentalController {

    private final RentalService rentalService;
    private final RentalQueryService rentalQueryService;

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
}
