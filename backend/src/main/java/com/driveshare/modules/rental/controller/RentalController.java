package com.driveshare.modules.rental.controller;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.modules.rental.dto.response.RentalSummaryResponse;
import com.driveshare.modules.rental.service.RentalQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/rentals")
@RequiredArgsConstructor
@Tag(name = "Rental Query", description = "API quản lý và truy vấn đơn thuê dành cho Khách thuê (CRP-44)")
public class RentalController {

    private final RentalQueryService rentalQueryService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('RENTER')")
    @Operation(summary = "Xem danh sách đơn thuê của tôi", description = "Khách thuê xem toàn bộ lịch sử đơn thuê của chính mình (CRP-44)")
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

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('RENTER')")
    @Operation(summary = "Hủy yêu cầu thuê xe", description = "Khách thuê tự hủy yêu cầu thuê xe khi đang ở trạng thái PENDING (CRP-44)")
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
