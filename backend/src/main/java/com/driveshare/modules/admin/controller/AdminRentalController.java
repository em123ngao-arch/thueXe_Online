package com.driveshare.modules.admin.controller;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.modules.admin.dto.response.AdminRentalResponse;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.rental.entity.Rental;
import com.driveshare.modules.rental.repository.RentalRepository;
import com.driveshare.modules.user.entity.User;
import com.driveshare.modules.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/rentals")
@RequiredArgsConstructor
@Tag(name = "Admin Rentals", description = "Quản trị viên quản lý toàn bộ đơn đặt xe trên sàn")
@SecurityRequirement(name = "bearerAuth")
public class AdminRentalController {

    private final RentalRepository rentalRepository;
    private final CarRepository carRepository;
    private final UserRepository userRepository;

    @GetMapping
    @PreAuthorize("!isAuthenticated() or hasAnyRole('ADMIN', 'STAFF')")
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
                    .build();
        }).toList();

        return ResponseEntity.ok(ApiResponse.success("Lấy toàn bộ đơn đặt xe thành công", result));
    }
}
