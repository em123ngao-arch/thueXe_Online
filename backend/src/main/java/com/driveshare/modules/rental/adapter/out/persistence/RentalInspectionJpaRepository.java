package com.driveshare.modules.rental.adapter.out.persistence;

import com.driveshare.common.enums.EInspectionType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RentalInspectionJpaRepository extends JpaRepository<RentalInspection, Long> {

    List<RentalInspection> findByRentalIdOrderByCreatedAtAsc(Long rentalId);

    Optional<RentalInspection> findByRentalIdAndInspectionType(Long rentalId, EInspectionType inspectionType);

    boolean existsByRentalIdAndInspectionType(Long rentalId, EInspectionType inspectionType);
}

