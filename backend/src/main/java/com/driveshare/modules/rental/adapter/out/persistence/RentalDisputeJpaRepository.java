package com.driveshare.modules.rental.adapter.out.persistence;

import com.driveshare.common.enums.EDisputeStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RentalDisputeJpaRepository extends JpaRepository<RentalDispute, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM RentalDispute d WHERE d.id = :id")
    Optional<RentalDispute> findByIdForUpdate(@Param("id") Long id);

    Optional<RentalDispute> findByRentalIdAndStatus(Long rentalId, EDisputeStatus status);

    List<RentalDispute> findByRentalIdOrderByCreatedAtDesc(Long rentalId);

    boolean existsByRentalIdAndStatus(Long rentalId, EDisputeStatus status);

    List<RentalDispute> findByStatusOrderByCreatedAtDesc(EDisputeStatus status);

    List<RentalDispute> findAllByOrderByCreatedAtDesc();
}

