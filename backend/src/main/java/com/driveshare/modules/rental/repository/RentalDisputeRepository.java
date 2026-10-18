package com.driveshare.modules.rental.repository;

import com.driveshare.common.enums.EDisputeStatus;
import com.driveshare.modules.rental.entity.RentalDispute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RentalDisputeRepository extends JpaRepository<RentalDispute, Long> {

    Optional<RentalDispute> findByRentalIdAndStatus(Long rentalId, EDisputeStatus status);

    List<RentalDispute> findByRentalIdOrderByCreatedAtDesc(Long rentalId);

    boolean existsByRentalIdAndStatus(Long rentalId, EDisputeStatus status);

    List<RentalDispute> findByStatusOrderByCreatedAtDesc(EDisputeStatus status);

    List<RentalDispute> findAllByOrderByCreatedAtDesc();
}
