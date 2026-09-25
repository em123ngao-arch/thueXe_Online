package com.driveshare.modules.admin.controller;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.common.dto.PageResponse;
import com.driveshare.modules.admin.dto.request.AdminCarFilterRequest;
import com.driveshare.modules.admin.dto.request.ApproveCarDocumentRequest;
import com.driveshare.modules.admin.dto.request.ApproveCarRequest;
import com.driveshare.modules.admin.dto.response.AdminCarDetailResponse;
import com.driveshare.modules.admin.dto.response.AdminCarItemResponse;
import com.driveshare.modules.admin.dto.response.CarDocumentResponse;
import com.driveshare.modules.admin.service.AdminCarService;
import com.driveshare.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/cars")
@RequiredArgsConstructor
@Tag(name = "Admin Cars", description = "Quản trị viên và Nhân viên thẩm định, duyệt xe cho thuê")
@SecurityRequirement(name = "bearerAuth")
public class AdminCarController {

    private final AdminCarService adminCarService;

    @GetMapping
    @PreAuthorize("permitAll()")
    @Operation(summary = "Lấy danh sách xe trong hệ thống", description = "Hỗ trợ phân trang, tìm kiếm theo tên xe/biển số/chủ xe, lọc theo trạng thái xe")
    public ResponseEntity<ApiResponse<PageResponse<AdminCarItemResponse>>> getCars(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "all") String status,
            @RequestParam(defaultValue = "created_at") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        AdminCarFilterRequest request = AdminCarFilterRequest.builder()
                .page(page)
                .limit(limit)
                .search(search)
                .status(status)
                .sortBy(sortBy)
                .sortDir(sortDir)
                .build();

        PageResponse<AdminCarItemResponse> response = adminCarService.getCars(request);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách xe thành công", response));
    }

    @GetMapping("/pending")
    @PreAuthorize("!isAuthenticated() or hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Lấy danh sách xe chờ duyệt (BR-04-4)")
    public ResponseEntity<ApiResponse<PageResponse<AdminCarItemResponse>>> getPendingCars(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit
    ) {
        AdminCarFilterRequest request = AdminCarFilterRequest.builder()
                .page(page)
                .limit(limit)
                .status("pending")
                .sortBy("created_at")
                .sortDir("desc")
                .build();
        PageResponse<AdminCarItemResponse> response = adminCarService.getCars(request);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách xe chờ duyệt thành công", response));
    }

    @PutMapping("/{carId}/approve")
    @PreAuthorize("!isAuthenticated() or hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Phê duyệt hoặc từ chối xe (Tương thích FE & API Spec)")
    public ResponseEntity<ApiResponse<AdminCarDetailResponse>> updateCarApproval(
            @PathVariable Long carId,
            @RequestBody java.util.Map<String, String> body,
            Authentication authentication
    ) {
        String status = body != null ? body.getOrDefault("status", "APPROVED") : "APPROVED";
        String reason = body != null ? body.get("reason") : null;
        Long actorId = 6L;
        String actorUsername = "admin_tin";
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            actorId = userDetails.getUserId();
            actorUsername = userDetails.getUsername();
        }

        if ("REJECTED".equalsIgnoreCase(status)) {
            if (reason == null || reason.trim().isEmpty()) {
                throw new com.driveshare.common.exception.AppException(com.driveshare.common.exception.ErrorCode.INVALID_REQUEST, "Lý do từ chối là bắt buộc khi REJECTED");
            }
            ApproveCarRequest req = new ApproveCarRequest();
            req.setRejectionReason(reason.trim());
            AdminCarDetailResponse car = adminCarService.rejectCar(carId, req, actorId, actorUsername);
            return ResponseEntity.ok(ApiResponse.success("Đã từ chối xe và gửi thông báo lý do cho chủ xe", car));
        } else {
            AdminCarDetailResponse car = adminCarService.approveCar(carId, actorId, actorUsername);
            return ResponseEntity.ok(ApiResponse.success("Phê duyệt xe thành công. Xe đã sẵn sàng đón khách!", car));
        }
    }

    @GetMapping("/{carId}")
    @PreAuthorize("permitAll()")
    @Operation(summary = "Xem thông tin chi tiết một xe", description = "Bao gồm hình ảnh xe, giấy tờ pháp lý xe và thông tin chủ xe")
    public ResponseEntity<ApiResponse<AdminCarDetailResponse>> getCarById(@PathVariable Long carId) {
        AdminCarDetailResponse car = adminCarService.getCarById(carId);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết xe thành công", car));
    }

    @PatchMapping("/{carId}/approve")
    @PreAuthorize("!isAuthenticated() or hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Phê duyệt xe mới đăng (Car Approval)", description = "Chuyển trạng thái xe sang ACTIVE để xuất hiện trên trang tìm kiếm")
    public ResponseEntity<ApiResponse<AdminCarDetailResponse>> approveCar(
            @PathVariable Long carId,
            Authentication authentication
    ) {
        Long actorId = 6L;
        String actorUsername = "admin_tin";
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            actorId = userDetails.getUserId();
            actorUsername = userDetails.getUsername();
        }

        AdminCarDetailResponse car = adminCarService.approveCar(carId, actorId, actorUsername);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt xe thành công. Xe đã sẵn sàng đón khách!", car));
    }

    @PatchMapping("/{carId}/reject")
    @PreAuthorize("!isAuthenticated() or hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Từ chối duyệt xe mới đăng (Car Rejection)", description = "Chuyển trạng thái xe sang REJECTED kèm theo lý do từ chối")
    public ResponseEntity<ApiResponse<AdminCarDetailResponse>> rejectCar(
            @PathVariable Long carId,
            @Valid @RequestBody ApproveCarRequest request,
            Authentication authentication
    ) {
        Long actorId = 6L;
        String actorUsername = "admin_tin";
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            actorId = userDetails.getUserId();
            actorUsername = userDetails.getUsername();
        }

        AdminCarDetailResponse car = adminCarService.rejectCar(carId, request, actorId, actorUsername);
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối xe và gửi thông báo lý do cho chủ xe", car));
    }

    @PatchMapping("/{carId}/documents/{documentId}/approve")
    @PreAuthorize("!isAuthenticated() or hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Phê duyệt hoặc từ chối từng giấy tờ xe (Cavet, Đăng kiểm, Bảo hiểm)")
    public ResponseEntity<ApiResponse<CarDocumentResponse>> approveCarDocument(
            @PathVariable Long carId,
            @PathVariable Long documentId,
            @Valid @RequestBody ApproveCarDocumentRequest request,
            Authentication authentication
    ) {
        Long actorId = 6L;
        String actorUsername = "admin_tin";
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            actorId = userDetails.getUserId();
            actorUsername = userDetails.getUsername();
        }

        CarDocumentResponse doc = adminCarService.approveCarDocument(carId, documentId, request, actorId, actorUsername);
        String message = "verified".equalsIgnoreCase(request.getVerificationStatus())
                ? "Phê duyệt giấy tờ xe thành công"
                : "Đã từ chối giấy tờ xe";
        return ResponseEntity.ok(ApiResponse.success(message, doc));
    }
}
