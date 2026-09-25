package com.driveshare.modules.rental.repository;

import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.modules.rental.entity.Rental;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface RentalRepository extends JpaRepository<Rental, Long> {

    // CRP-42: Đếm số đơn PENDING hiện tại của 1 khách thuê (khống chế tối đa 3)
    long countByRenterIdAndStatus(Long renterId, ERentalStatus status);

    // CRP-44: Khách thuê xem lịch sử yêu cầu của mình
    List<Rental> findByRenterIdOrderByCreatedAtDesc(Long renterId);

    // CRP-46: Chủ xe xem danh sách yêu cầu gửi đến các xe của mình
    List<Rental> findByCarIdInOrderByCreatedAtDesc(List<Long> carIds);

    List<Rental> findByCarIdInAndStatusOrderByCreatedAtDesc(List<Long> carIds, ERentalStatus status);

    // CRP-49: Tìm các đơn PENDING khác bị trùng khoảng thời gian với đơn vừa duyệt
    @Query("SELECT r FROM Rental r WHERE r.carId = :carId " +
           "AND r.rentalId != :excludeRentalId " +
           "AND r.status = :status " +
           "AND r.startDate <= :endDate " +
           "AND r.endDate >= :startDate")
    List<Rental> findCompetingPendingRentals(
            @Param("carId") Long carId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("excludeRentalId") Long excludeRentalId,
            @Param("status") ERentalStatus status
    );

    // CRP-44, 51: Tìm đơn thuê theo ID và Renter ID (bảo mật tránh thao tác chéo đơn người khác)
    java.util.Optional<Rental> findByRentalIdAndRenterId(Long rentalId, Long renterId);

    // CRP-47, 48: Tìm đơn thuê của các xe thuộc quyền sở hữu của Owner
    java.util.Optional<Rental> findByRentalIdAndCarIdIn(Long rentalId, List<Long> carIds);

    // CRP-43: Tìm các đơn PENDING quá hạn (ví dụ: tạo hơn 60 phút trước)
    @Query("SELECT r FROM Rental r WHERE r.status = :status AND r.createdAt <= :threshold")
    List<Rental> findExpiredPendingRentals(
            @Param("status") ERentalStatus status,
            @Param("threshold") Instant threshold
    );

    // CRP-38: Kiểm tra 1 xe cụ thể có bị trùng lịch trong khoảng ngày [startDate, endDate] không
    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN TRUE ELSE FALSE END FROM Rental r " +
           "WHERE r.carId = :carId " +
           "AND r.status IN :statuses " +
           "AND r.startDate <= :endDate " +
           "AND r.endDate >= :startDate")
    boolean hasDateConflict(
            @Param("carId") Long carId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("statuses") List<ERentalStatus> statuses
    );

    // CRP-38: Lấy danh sách carId bận lịch để loại trừ khi tìm kiếm xe công khai theo khoảng ngày
    @Query("SELECT DISTINCT r.carId FROM Rental r " +
           "WHERE r.status IN :statuses " +
           "AND r.startDate <= :endDate " +
           "AND r.endDate >= :startDate")
    List<Long> findCarIdsWithConflictingRentals(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("statuses") List<ERentalStatus> statuses
    );
}
