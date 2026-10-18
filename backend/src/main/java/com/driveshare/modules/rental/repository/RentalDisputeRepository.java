package com.driveshare.modules.rental.repository;

import com.driveshare.common.entity.RentalDispute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RentalDisputeRepository extends JpaRepository<RentalDispute, Long> {
    List<RentalDispute> findByRentalId(Long rentalId);
    List<RentalDispute> findByReporterId(Long reporterId);
    Optional<RentalDispute> findFirstByRentalIdOrderByCreatedAtDesc(Long rentalId);
}
