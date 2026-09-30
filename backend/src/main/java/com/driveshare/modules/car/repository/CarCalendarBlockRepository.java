package com.driveshare.modules.car.repository;

import com.driveshare.modules.car.entity.CarCalendarBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CarCalendarBlockRepository extends JpaRepository<CarCalendarBlock, Long> {

    List<CarCalendarBlock> findByCarIdAndDeletedAtIsNullOrderByStartDateAsc(Long carId);

    List<CarCalendarBlock> findByCarIdAndEndDateGreaterThanEqualAndDeletedAtIsNullOrderByStartDateAsc(
            Long carId,
            LocalDate fromDate
    );

    Optional<CarCalendarBlock> findByBlockIdAndDeletedAtIsNull(Long blockId);

    /**
     * Kiểm tra xe đã có khoảng chặn lịch nào giao thoa với [startDate, endDate] chưa:
     * Điều kiện giao nhau: b.startDate <= :endDate AND b.endDate >= :startDate
     */
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

    /**
     * Lấy danh sách carId đang bị chặn lịch trong khoảng [startDate, endDate] để loại trừ khi tìm kiếm xe
     */
    @Query("SELECT DISTINCT b.carId FROM CarCalendarBlock b " +
           "WHERE b.deletedAt IS NULL " +
           "AND b.startDate <= :endDate " +
           "AND b.endDate >= :startDate")
    List<Long> findCarIdsWithConflictingBlocks(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
