package com.driveshare.modules.rental.controller;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.modules.rental.dto.CreateRentalRequest;
import com.driveshare.modules.rental.dto.RentalResponse;
import com.driveshare.modules.rental.service.RentalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/rentals")
@RequiredArgsConstructor
@Tag(name = "Rental Management", description = "API quản lý yêu cầu thuê xe (Renter & Owner)")
@SecurityRequirement(name = "bearerAuth")
public class RentalController {

    private final RentalService rentalService;

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
}
