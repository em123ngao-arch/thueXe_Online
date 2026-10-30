package com.driveshare.modules.car.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CarCalendarBlockJpaRepository extends JpaRepository<CarCalendarBlock, Long> {

    List<CarCalendarBlock> findByCarIdAndDeletedAtIsNullOrderByStartDateAsc(Long carId);

    List<CarCalendarBlock> findByCarIdAndEndDateGreaterThanEqualAndDeletedAtIsNullOrderByStartDateAsc(
            Long carId,
            LocalDate fromDate
    );

    List<CarCalendarBlock> findByCarIdInAndEndDateGreaterThanEqualAndDeletedAtIsNullOrderByStartDateAsc(
            List<Long> carIds,
            LocalDate fromDate
    );

    Optional<CarCalendarBlock> findByBlockIdAndDeletedAtIsNull(Long blockId);

    @Query("SELECT CASE WHEN COUNT(b) > 0 THEN TRUE ELSE FALSE END FROM CarCalendarBlock b " +
           "WHERE b.carId = :carId " +
           "AND b.deletedAt IS NULL " +
           "AND b.startDate <= :endDate " +
           "AND b.endDate >= :startDate")
    boolean hasDateConflict(
            @Param("carId") Long carId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("SELECT DISTINCT b.carId FROM CarCalendarBlock b " +
           "WHERE b.deletedAt IS NULL " +
           "AND b.startDate <= :endDate " +
           "AND b.endDate >= :startDate")
    List<Long> findCarIdsWithConflictingBlocks(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}

