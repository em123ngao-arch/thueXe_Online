package com.driveshare.modules.rental.application.port.in;

import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.modules.rental.dto.response.RentalSummaryResponse;

import java.util.List;

public interface RentalQueryUseCase {

    List<RentalSummaryResponse> getMyRentals();

    RentalSummaryResponse cancelMyRental(Long rentalId);

    List<RentalSummaryResponse> getOwnerIncomingRentals(ERentalStatus status);
}

