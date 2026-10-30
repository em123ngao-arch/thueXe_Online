package com.driveshare.modules.rental.application.port.out;

import com.driveshare.modules.rental.domain.model.RentalRecord;

import java.util.Optional;

public interface RentalPersistencePort {

    Optional<RentalRecord> findById(Long rentalId);

    long countActivePendingByRenter(Long renterId);
}

