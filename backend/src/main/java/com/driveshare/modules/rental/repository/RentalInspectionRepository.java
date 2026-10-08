package com.driveshare.modules.rental.repository;

import com.driveshare.common.enums.EInspectionType;
import com.driveshare.modules.rental.entity.RentalInspection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RentalInspectionRepository extends JpaRepository<RentalInspection, Long> {

    List<RentalInspection> findByRentalIdOrderByCreatedAtAsc(Long rentalId);

    Optional<RentalInspection> findByRentalIdAndInspectionType(Long rentalId, EInspectionType inspectionType);

    boolean existsByRentalIdAndInspectionType(Long rentalId, EInspectionType inspectionType);
}
