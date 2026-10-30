package com.driveshare.modules.car.adapter.out.persistence;

import com.driveshare.common.enums.ECarStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CarJpaRepository extends JpaRepository<Car, Long>, JpaSpecificationExecutor<Car> {

    boolean existsByPlateNumber(String plateNumber);

    Optional<Car> findByPlateNumber(String plateNumber);

    boolean existsByPlateNumberAndDeletedAtIsNull(String plateNumber);

    Optional<Car> findByCarIdAndDeletedAtIsNull(Long carId);

    Page<Car> findByOwnerIdAndDeletedAtIsNull(Long ownerId, Pageable pageable);

    List<Car> findByOwnerIdAndDeletedAtIsNull(Long ownerId);

    Page<Car> findByOwnerIdAndStatusAndDeletedAtIsNull(Long ownerId, ECarStatus status, Pageable pageable);

    Page<Car> findByStatusAndDeletedAtIsNull(ECarStatus status, Pageable pageable);

    @Query("""
            SELECT CASE WHEN COUNT(r) > 0 THEN TRUE ELSE FALSE END
            FROM com.driveshare.modules.rental.adapter.out.persistence.Rental r
            WHERE r.carId = :carId
              AND r.status IN (
                  com.driveshare.common.enums.ERentalStatus.PENDING,
                  com.driveshare.common.enums.ERentalStatus.APPROVED,
                  com.driveshare.common.enums.ERentalStatus.CONFIRMED
              )
            """)
    boolean hasActiveBooking(@Param("carId") Long carId);

    long countByOwnerIdAndStatusAndDeletedAtIsNull(Long ownerId, ECarStatus status);

    long countByStatusAndDeletedAtIsNull(ECarStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Car c WHERE c.carId = :carId AND c.deletedAt IS NULL")
    Optional<Car> findCarForUpdate(@Param("carId") Long carId);
}

