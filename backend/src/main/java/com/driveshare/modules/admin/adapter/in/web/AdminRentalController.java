package com.driveshare.modules.admin.adapter.in.web;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.common.enums.EDisputeStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.admin.dto.response.AdminRentalResponse;
import com.driveshare.modules.admin.dto.response.OverdueRentalResponse;
import com.driveshare.modules.admin.dto.response.ViolationDossierResponse;
import com.driveshare.modules.admin.service.AdminRentalService;
import com.driveshare.modules.rental.application.port.in.RentalDisputeUseCase;
import com.driveshare.modules.rental.dto.ResolveDisputeRequest;
import com.driveshare.modules.rental.dto.response.RentalDisputeResponse;
import com.driveshare.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/rentals")
@RequiredArgsConstructor
@Tag(name = "Admin Rentals", description = "Quản trị viên quản lý toàn bộ đơn đặt xe trên sàn")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminRentalController {

    private final AdminRentalService adminRentalService;
    private final RentalDisputeUseCase rentalDisputeUseCase;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Lấy toàn bộ đơn đặt xe trong hệ thống")
    public ResponseEntity<ApiResponse<List<AdminRentalResponse>>> getAllRentals(
            @RequestParam(required = false) String status
    ) {
        List<AdminRentalResponse> result = adminRentalService.getAllRentals(status);
        return ResponseEntity.ok(ApiResponse.success("Lấy toàn bộ đơn đặt xe thành công", result));
    }

    @PostMapping("/{rentalId}/payout")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Xác nhận đối soát & giải ngân thu nhập 90% cho chủ xe")
    public ResponseEntity<ApiResponse<String>> confirmPayoutToOwner(@PathVariable Long rentalId) {
        return ResponseEntity.ok(ApiResponse.success("Đã xác nhận giải ngân thành công cho chủ xe"));
    }

    /**
     * Sprint 3 Fix (Lâm Chí Vĩ): Admin giải quyết khiếu nại sự cố không nhận xe.
     * Hoàn 100% tiền cọc cho khách, hủy xe CANCELLED_BY_HOST và ghi nhận phạt chủ xe.
     */
    @PostMapping("/disputes/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Admin giải quyết khiếu nại sự cố bàn giao xe (Sprint 3)")
    public ResponseEntity<ApiResponse<RentalDisputeResponse>> resolveDispute(
            @PathVariable("id") Long id,
            @Valid @RequestBody ResolveDisputeRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        Long adminId = userDetails.getUserId();
        RentalDisputeResponse response = rentalDisputeUseCase.resolveDispute(
                id,
                request,
                adminId
        );
        return ResponseEntity.ok(ApiResponse.success("Xử lý khiếu nại tranh chấp thành công", response));
    }

    /**
     * Sprint 3 Fix: Admin xem danh sách toàn bộ khiếu nại tranh chấp.
     */
    @GetMapping("/disputes")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Admin xem danh sách khiếu nại tranh chấp (Sprint 3)")
    public ResponseEntity<ApiResponse<List<RentalDisputeResponse>>> getAllDisputes(
            @RequestParam(required = false) EDisputeStatus status
    ) {
        List<RentalDisputeResponse> result = rentalDisputeUseCase.getAllDisputes(status);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách khiếu nại thành công", result));
    }

    /**
     * Sprint 4 (Nguyễn Duy Quân): Admin xem danh sách các đơn quá hạn toàn hệ thống.
     */
    @GetMapping("/overdue")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Admin xem danh sách các đơn thuê quá hạn (Sprint 4)")
    public ResponseEntity<ApiResponse<List<OverdueRentalResponse>>> getOverdueRentals() {
        List<OverdueRentalResponse> result = adminRentalService.getOverdueRentals();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đơn quá hạn thành công", result));
    }

    /**
     * Sprint 4 (Nguyễn Duy Quân): Admin xuất hồ sơ pháp lý 1-click (Violation Dossier) chuyển công an/bảo hiểm.
     */
    @GetMapping("/{id}/dossier")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Admin xuất hồ sơ pháp lý 1-click (Violation Dossier) (Sprint 4)")
    public ResponseEntity<ApiResponse<ViolationDossierResponse>> getViolationDossier(
            @PathVariable("id") Long id
    ) {
        ViolationDossierResponse response = adminRentalService.getViolationDossier(id);
        return ResponseEntity.ok(ApiResponse.success("Xuất hồ sơ pháp lý vi phạm thành công", response));
    }
}

