package com.driveshare.modules.rental.controller;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.modules.rental.dto.RejectRentalRequest;
import com.driveshare.modules.rental.dto.response.RentalSummaryResponse;
import com.driveshare.modules.rental.service.OwnerRentalService;
import com.driveshare.modules.rental.service.RentalQueryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/owner/rentals")
@RequiredArgsConstructor
@Tag(name = "Owner Rental Management", description = "API quản lý yêu cầu thuê gửi đến xe của Chủ xe (CRP-46, CRP-47, CRP-48, Giai đoạn 2 & 3)")
public class OwnerRentalController {

    private final RentalQueryService rentalQueryService;
    private final OwnerRentalService ownerRentalService;

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

    /**
     * CRP-47 & Giai đoạn 2 & 3: Chủ xe duyệt yêu cầu thuê xe.
     * Chuyển trạng thái sang WAITING_PAYMENT (Soft Lock 45 phút), chuyển các đơn trùng sang ON_HOLD.
     */
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Duyệt yêu cầu thuê xe (CRP-47)", description = "Chủ xe chấp thuận yêu cầu thuê xe, kích hoạt Soft Lock 45 phút (WAITING_PAYMENT)")
    public ResponseEntity<ApiResponse<RentalSummaryResponse>> approveRental(@PathVariable("id") Long id) {
        RentalSummaryResponse data = ownerRentalService.approveRental(id);
        return ResponseEntity.ok(
                ApiResponse.<RentalSummaryResponse>builder()
                        .code(200)
                        .success(true)
                        .message("Duyệt yêu cầu thuê xe thành công. Đã kích hoạt giữ chỗ 45 phút.")
                        .data(data)
                        .build()
        );
    }

    /**
     * CRP-48: Chủ xe từ chối yêu cầu thuê xe kèm lý do.
     */
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Từ chối yêu cầu thuê xe (CRP-48)", description = "Chủ xe từ chối yêu cầu thuê xe, bắt buộc cung cấp lý do")
    public ResponseEntity<ApiResponse<RentalSummaryResponse>> rejectRental(
            @PathVariable("id") Long id,
            @Valid @RequestBody RejectRentalRequest request
    ) {
        RentalSummaryResponse data = ownerRentalService.rejectRental(id, request);
        return ResponseEntity.ok(
                ApiResponse.<RentalSummaryResponse>builder()
                        .code(200)
                        .success(true)
                        .message("Từ chối yêu cầu thuê xe thành công")
                        .data(data)
                        .build()
        );
    }

    /**
     * Giai đoạn 4: Chủ xe bấm bắt đầu chuyến đi (bàn giao xe).
     */
    @PutMapping("/{id}/start")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Bắt đầu chuyến đi (Giao nhận xe)", description = "Chủ xe bàn giao xe và bắt đầu chuyến đi, chuyển trạng thái sang IN_PROGRESS")
    public ResponseEntity<ApiResponse<RentalSummaryResponse>> startRental(@PathVariable("id") Long id) {
        RentalSummaryResponse data = ownerRentalService.startRental(id);
        return ResponseEntity.ok(
                ApiResponse.<RentalSummaryResponse>builder()
                        .code(200)
                        .success(true)
                        .message("Bắt đầu chuyến đi thành công")
                        .data(data)
                        .build()
        );
    }

    /**
     * Giai đoạn 4: Chủ xe bấm hoàn tất chuyến đi (khách trả xe).
     */
    @PutMapping("/{id}/complete")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Hoàn tất chuyến đi (Trả xe)", description = "Chủ xe nhận lại xe và hoàn tất chuyến đi, chuyển trạng thái sang COMPLETED")
    public ResponseEntity<ApiResponse<RentalSummaryResponse>> completeRental(@PathVariable("id") Long id) {
        RentalSummaryResponse data = ownerRentalService.completeRental(id);
        return ResponseEntity.ok(
                ApiResponse.<RentalSummaryResponse>builder()
                        .code(200)
                        .success(true)
                        .message("Hoàn tất chuyến đi thành công")
                        .data(data)
                        .build()
        );
    }
}

