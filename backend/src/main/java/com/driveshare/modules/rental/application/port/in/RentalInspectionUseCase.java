package com.driveshare.modules.rental.application.port.in;

import com.driveshare.modules.rental.dto.CheckInRequest;
import com.driveshare.modules.rental.dto.CheckOutRequest;
import com.driveshare.modules.rental.dto.ConfirmInspectionRequest;
import com.driveshare.modules.rental.dto.response.RentalInspectionResponse;

import java.util.List;

public interface RentalInspectionUseCase {

    RentalInspectionResponse checkIn(Long rentalId, Long ownerId, CheckInRequest request);

    RentalInspectionResponse checkOut(Long rentalId, Long ownerId, CheckOutRequest request);

    RentalInspectionResponse confirmInspection(Long rentalId, Long inspectionId, Long customerId, ConfirmInspectionRequest request);

    List<RentalInspectionResponse> getInspections(Long rentalId, Long userId);
}

