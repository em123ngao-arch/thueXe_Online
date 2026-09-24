package com.driveshare.modules.payment.controller;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.payment.dto.request.CreatePaymentRequest;
import com.driveshare.modules.payment.dto.request.PaymentStatusUpdateRequest;
import com.driveshare.modules.payment.dto.response.OwnerEarningsResponse;
import com.driveshare.modules.payment.dto.response.PaymentResponse;
import com.driveshare.modules.payment.service.PaymentService;
import com.driveshare.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@Tag(name = "Payment Management", description = "API quản lý thanh toán đặt cọc VietQR & doanh thu chủ xe (CRP-51 -> CRP-54)")
@SecurityRequirement(name = "bearerAuth")
public class PaymentController {

    private final PaymentService paymentService;

    // =========================================================================
    // CRP-51: Renter Pay for Approved Booking (Khách thuê thanh toán cọc 30%)
    // =========================================================================

    @Operation(
            summary = "CRP-51: Khởi tạo thanh toán đặt cọc 30% cho đơn thuê đã duyệt",
            description = "Tạo giao dịch cọc 30% tổng tiền và sinh mã VietQR động để khách quét mã thanh toán."
    )
    @PostMapping({"/api/v1/rentals/{rentalId}/payment", "/api/v1/payments/rental/{rentalId}"})
    public ResponseEntity<ApiResponse<PaymentResponse>> createRentalPayment(
            @PathVariable("rentalId") Long rentalId,
            @RequestBody(required = false) CreatePaymentRequest request
    ) {
        Long currentUserId = getCurrentUserId();
        PaymentResponse response = paymentService.createDepositPayment(rentalId, request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Khởi tạo thanh toán cọc thành công", response));
    }

    @Operation(
            summary = "Khởi tạo thanh toán đặt cọc qua body rental_id",
            description = "Hỗ trợ POST /api/v1/payments nhận rental_id trong request body."
    )
    @PostMapping("/api/v1/payments")
    public ResponseEntity<ApiResponse<PaymentResponse>> createPaymentDirect(
            @RequestBody @Valid CreatePaymentRequest request
    ) {
        if (request == null || request.getRentalId() == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }
        Long currentUserId = getCurrentUserId();
        PaymentResponse response = paymentService.createDepositPayment(request.getRentalId(), request, currentUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Khởi tạo thanh toán cọc thành công", response));
    }

    // =========================================================================
    // CRP-52 & CRP-53: Xử lý trạng thái kết quả thanh toán & cập nhật Lifecycle đơn
    // =========================================================================

    @Operation(
            summary = "CRP-52 & CRP-53: Xác nhận thanh toán cọc thành công",
            description = "Chuyển trạng thái thanh toán sang SUCCESS và cập nhật đơn thuê sang CONFIRMED."
    )
    @PostMapping("/api/v1/payments/{paymentId}/confirm")
    public ResponseEntity<ApiResponse<PaymentResponse>> confirmPayment(
            @PathVariable("paymentId") Long paymentId
    ) {
        Long currentUserId = getCurrentUserId();
        PaymentResponse response = paymentService.confirmPayment(paymentId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Xác nhận thanh toán cọc thành công", response));
    }

    @Operation(
            summary = "CRP-52: Đánh dấu giao dịch thanh toán thất bại",
            description = "Chuyển trạng thái thanh toán sang FAILED khi cổng thanh toán báo lỗi."
    )
    @PostMapping("/api/v1/payments/{paymentId}/fail")
    public ResponseEntity<ApiResponse<PaymentResponse>> failPayment(
            @PathVariable("paymentId") Long paymentId,
            @RequestBody(required = false) PaymentStatusUpdateRequest request
    ) {
        Long currentUserId = getCurrentUserId();
        String note = (request != null) ? request.getNote() : null;
        PaymentResponse response = paymentService.failPayment(paymentId, currentUserId, note);
        return ResponseEntity.ok(ApiResponse.success("Đã ghi nhận giao dịch thất bại", response));
    }

    @Operation(
            summary = "CRP-52: Hủy giao dịch thanh toán",
            description = "Chuyển trạng thái thanh toán sang CANCELLED khi khách hủy thanh toán."
    )
    @PostMapping("/api/v1/payments/{paymentId}/cancel")
    public ResponseEntity<ApiResponse<PaymentResponse>> cancelPayment(
            @PathVariable("paymentId") Long paymentId,
            @RequestBody(required = false) PaymentStatusUpdateRequest request
    ) {
        Long currentUserId = getCurrentUserId();
        String note = (request != null) ? request.getNote() : null;
        PaymentResponse response = paymentService.cancelPayment(paymentId, currentUserId, note);
        return ResponseEntity.ok(ApiResponse.success("Đã hủy giao dịch thanh toán", response));
    }

    @Operation(
            summary = "Cập nhật trạng thái thanh toán (SUCCESS, FAILED, CANCELLED)",
            description = "Hỗ trợ linh hoạt cho Webhook và Callback kiểm tra giao dịch."
    )
    @PutMapping("/api/v1/payments/{paymentId}/status")
    public ResponseEntity<ApiResponse<PaymentResponse>> updatePaymentStatus(
            @PathVariable("paymentId") Long paymentId,
            @RequestBody @Valid PaymentStatusUpdateRequest request
    ) {
        Long currentUserId = getCurrentUserId();
        PaymentResponse response = paymentService.updatePaymentStatus(paymentId, request.getStatus(), request.getNote(), currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thanh toán thành công", response));
    }

    // =========================================================================
    // Tra cứu chi tiết giao dịch thanh toán
    // =========================================================================

    @Operation(
            summary = "Xem chi tiết giao dịch thanh toán theo ID",
            description = "Lấy thông tin thanh toán, mã QR và trạng thái hiện tại."
    )
    @GetMapping("/api/v1/payments/{paymentId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentById(
            @PathVariable("paymentId") Long paymentId
    ) {
        Long currentUserId = getCurrentUserId();
        PaymentResponse response = paymentService.getPaymentById(paymentId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @Operation(
            summary = "Xem thông tin thanh toán theo mã đơn thuê (rental_id)",
            description = "Lấy trạng thái và mã QR thanh toán của đơn thuê."
    )
    @GetMapping("/api/v1/payments/rental/{rentalId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentByRentalId(
            @PathVariable("rentalId") Long rentalId
    ) {
        Long currentUserId = getCurrentUserId();
        PaymentResponse response = paymentService.getPaymentByRentalId(rentalId, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // =========================================================================
    // CRP-54: Owner View Earnings and Payment History (Chủ xe xem doanh thu & dòng tiền)
    // =========================================================================

    @Operation(
            summary = "CRP-54: Chủ xe xem thống kê doanh thu và lịch sử dòng tiền",
            description = "Tổng hợp tổng doanh thu đã nhận, tiền cọc đang chờ và danh sách chi tiết các giao dịch thanh toán của các xe thuộc sở hữu."
    )
    @GetMapping({"/api/v1/owner/earnings", "/api/v1/payments/owner/earnings", "/api/v1/owner/payments/history"})
    @PreAuthorize("hasAnyRole('OWNER', 'ROLE_OWNER', 'ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<ApiResponse<OwnerEarningsResponse>> getOwnerEarnings() {
        Long currentUserId = getCurrentUserId();
        OwnerEarningsResponse response = paymentService.getOwnerEarnings(currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Lấy thống kê doanh thu thành công", response));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper lấy current user
    // ─────────────────────────────────────────────────────────────────────────

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof CustomUserDetails userDetails) {
            return userDetails.getUserId();
        }
        return null;
    }
}
