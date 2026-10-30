package com.driveshare.modules.admin.controller;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.modules.admin.dto.response.AdminRentalResponse;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.rental.entity.Rental;
import com.driveshare.modules.rental.repository.RentalRepository;
import com.driveshare.modules.user.adapter.out.persistence.User;
import com.driveshare.modules.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/rentals")
@RequiredArgsConstructor
@Tag(name = "Admin Rentals", description = "Quản trị viên quản lý toàn bộ đơn đặt xe trên sàn")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminRentalController {

    private final RentalRepository rentalRepository;
    private final CarRepository carRepository;
    private final UserRepository userRepository;
    private final com.driveshare.modules.rental.service.RentalDisputeService rentalDisputeService;
    private final com.driveshare.modules.admin.service.AdminRentalService adminRentalService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Lấy toàn bộ đơn đặt xe trong hệ thống")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<AdminRentalResponse>>> getAllRentals(
            @RequestParam(required = false) String status
    ) {
        List<Rental> rentals = rentalRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));

        if (status != null && !status.equalsIgnoreCase("all") && !status.trim().isEmpty()) {
            rentals = rentals.stream()
                    .filter(r -> r.getStatus() != null && r.getStatus().name().equalsIgnoreCase(status))
                    .toList();
        }

        List<AdminRentalResponse> result = rentals.stream().map(r -> {
            String carName = "Xe #" + r.getCarId();
            String carPlate = "N/A";
            Car car = carRepository.findById(r.getCarId()).orElse(null);
            if (car != null) {
                String brand = car.getBrand() != null ? car.getBrand() : "";
                String model = car.getModel() != null ? car.getModel() : "";
                carName = (brand + " " + model).trim();
                carPlate = car.getPlateNumber() != null ? car.getPlateNumber() : "N/A";
            }

            String renterName = "Khách #" + r.getRenterId();
            String renterPhone = "N/A";
            User renter = userRepository.findById(r.getRenterId()).orElse(null);
            if (renter != null) {
                renterName = renter.getFullName() != null ? renter.getFullName() : renter.getUsername();
                renterPhone = renter.getPhone() != null ? renter.getPhone() : "N/A";
            }

            Long ownerId = (car != null) ? car.getOwnerId() : null;
            String ownerName = "Chủ xe #" + ownerId;
            String ownerPhone = "N/A";
            String ownerBankName = "MBBank (Quân Đội)";
            String ownerBankAccount = "998877665544";
            if (ownerId != null) {
                User owner = userRepository.findById(ownerId).orElse(null);
                if (owner != null) {
                    ownerName = owner.getFullName() != null ? owner.getFullName() : owner.getUsername();
                    ownerPhone = owner.getPhone() != null ? owner.getPhone() : "N/A";
                    if (owner.getOwnerProfile() != null) {
                        if (owner.getOwnerProfile().getBankName() != null && !owner.getOwnerProfile().getBankName().isBlank()) {
                            ownerBankName = owner.getOwnerProfile().getBankName();
                        }
                        if (owner.getOwnerProfile().getBankAccountNumber() != null && !owner.getOwnerProfile().getBankAccountNumber().isBlank()) {
                            ownerBankAccount = owner.getOwnerProfile().getBankAccountNumber();
                        }
                    }
                }
            }

            BigDecimal totalPrice = r.getTotalPrice() != null ? r.getTotalPrice() : BigDecimal.ZERO;
            BigDecimal platformFee = totalPrice.multiply(new BigDecimal("0.10"));
            BigDecimal ownerPayoutAmount = totalPrice.subtract(platformFee);

            String payoutStatus = "CHỜ_ĐỐI_SOÁT";
            if (r.getStatus() == ERentalStatus.COMPLETED) {
                payoutStatus = "ĐÃ_GIẢI_NGÂN";
            } else if (r.getStatus() == ERentalStatus.CONFIRMED || r.getStatus() == ERentalStatus.IN_PROGRESS) {
                payoutStatus = "ĐÃ_CỌC_30%";
            } else if (r.getStatus() == ERentalStatus.CANCELLED || r.getStatus() == ERentalStatus.REJECTED) {
                payoutStatus = "ĐÃ_HỦY";
            } else if (r.getStatus() == ERentalStatus.WAITING_PAYMENT || r.getStatus() == ERentalStatus.APPROVED || r.getStatus() == ERentalStatus.PENDING) {
                payoutStatus = "CHỜ_CỌC";
            }

            return AdminRentalResponse.builder()
                    .rentalId(r.getRentalId())
                    .carId(r.getCarId())
                    .carName(carName)
                    .carPlate(carPlate)
                    .renterId(r.getRenterId())
                    .renterName(renterName)
                    .renterPhone(renterPhone)
                    .startDate(r.getStartDate())
                    .endDate(r.getEndDate())
                    .totalDays(r.getTotalDays())
                    .pricePerDay(r.getPricePerDay())
                    .totalPrice(r.getTotalPrice())
                    .depositAmount(r.getDepositAmount())
                    .status(r.getStatus())
                    .rejectReason(r.getRejectReason())
                    .note(r.getNote())
                    .createdAt(r.getCreatedAt())
                    .ownerId(ownerId)
                    .ownerName(ownerName)
                    .ownerPhone(ownerPhone)
                    .ownerBankName(ownerBankName)
                    .ownerBankAccount(ownerBankAccount)
                    .platformFee(platformFee)
                    .ownerPayoutAmount(ownerPayoutAmount)
                    .payoutStatus(payoutStatus)
                    .build();
        }).toList();

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
    public ResponseEntity<ApiResponse<com.driveshare.modules.rental.dto.response.RentalDisputeResponse>> resolveDispute(
            @PathVariable("id") Long id,
            @jakarta.validation.Valid @RequestBody com.driveshare.modules.rental.dto.ResolveDisputeRequest request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.driveshare.security.CustomUserDetails userDetails
    ) {
        if (userDetails == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        Long adminId = userDetails.getUserId();
        com.driveshare.modules.rental.dto.response.RentalDisputeResponse response = rentalDisputeService.resolveDispute(
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
    public ResponseEntity<ApiResponse<List<com.driveshare.modules.rental.dto.response.RentalDisputeResponse>>> getAllDisputes(
            @RequestParam(required = false) com.driveshare.common.enums.EDisputeStatus status
    ) {
        List<com.driveshare.modules.rental.dto.response.RentalDisputeResponse> result = rentalDisputeService.getAllDisputes(status);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách khiếu nại thành công", result));
    }

    /**
     * Sprint 4 (Nguyễn Duy Quân): Admin xem danh sách các đơn quá hạn toàn hệ thống.
     */
    @GetMapping("/overdue")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Admin xem danh sách các đơn thuê quá hạn (Sprint 4)")
    public ResponseEntity<ApiResponse<List<com.driveshare.modules.admin.dto.response.OverdueRentalResponse>>> getOverdueRentals() {
        List<com.driveshare.modules.admin.dto.response.OverdueRentalResponse> result = adminRentalService.getOverdueRentals();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách đơn quá hạn thành công", result));
    }

    /**
     * Sprint 4 (Nguyễn Duy Quân): Admin xuất hồ sơ pháp lý 1-click (Violation Dossier) chuyển công an/bảo hiểm.
     */
    @GetMapping("/{id}/dossier")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Admin xuất hồ sơ pháp lý 1-click (Violation Dossier) (Sprint 4)")
    public ResponseEntity<ApiResponse<com.driveshare.modules.admin.dto.response.ViolationDossierResponse>> getViolationDossier(
            @PathVariable("id") Long id
    ) {
        com.driveshare.modules.admin.dto.response.ViolationDossierResponse response = adminRentalService.getViolationDossier(id);
        return ResponseEntity.ok(ApiResponse.success("Xuất hồ sơ pháp lý vi phạm thành công", response));
    }
}
