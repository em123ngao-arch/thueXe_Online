package com.driveshare.modules.rental.controller;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.common.enums.ERentalStatus;
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
@RequestMapping("/api/v1/owner/rentals")
@RequiredArgsConstructor
@Tag(name = "Owner Rental Query", description = "API quản lý yêu cầu thuê gửi đến xe của Chủ xe (CRP-46)")
public class OwnerRentalController {

    private final RentalQueryService rentalQueryService;

    @GetMapping
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Xem danh sách yêu cầu thuê xe", description = "Chủ xe xem danh sách các yêu cầu thuê gửi đến các xe của mình, hỗ trợ lọc theo trạng thái (CRP-46)")
    public ResponseEntity<ApiResponse<List<RentalSummaryResponse>>> getOwnerIncomingRentals(
            @RequestParam(name = "status", required = false) ERentalStatus status
    ) {
        List<RentalSummaryResponse> data = rentalQueryService.getOwnerIncomingRentals(status);
        return ResponseEntity.ok(
                ApiResponse.<List<RentalSummaryResponse>>builder()
                        .code(200)
                        .success(true)
                        .message("Lấy danh sách yêu cầu thuê thành công")
                        .data(data)
                        .build()
        );
    }
}
