package com.driveshare.modules.rental.application.port.in;

import com.driveshare.modules.rental.dto.RejectRentalRequest;
import com.driveshare.modules.rental.dto.response.RentalSummaryResponse;

public interface OwnerRentalUseCase {

    RentalSummaryResponse approveRental(Long rentalId);

    RentalSummaryResponse rejectRental(Long rentalId, RejectRentalRequest request);

    RentalSummaryResponse startRental(Long rentalId);

    RentalSummaryResponse completeRental(Long rentalId);
}

