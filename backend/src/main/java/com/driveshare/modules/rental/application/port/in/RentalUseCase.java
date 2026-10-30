package com.driveshare.modules.rental.application.port.in;

import com.driveshare.modules.rental.dto.CreateRentalRequest;
import com.driveshare.modules.rental.dto.RentalResponse;

public interface RentalUseCase {

    RentalResponse createRentalRequest(CreateRentalRequest request);
}

