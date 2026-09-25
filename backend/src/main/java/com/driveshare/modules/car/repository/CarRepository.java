package com.driveshare.modules.car.repository;

import com.driveshare.common.enums.ECarStatus;
import com.driveshare.modules.car.entity.Car;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CarRepository extends JpaRepository<Car, Long>, JpaSpecificationExecutor<Car> {

    /**
     * Kiểm tra biển số đã tồn tại trong hệ thống chưa (bỏ qua xe đã xóa mềm).
     * Dùng khi tạo xe mới — CRP-23.
     */
    boolean existsByPlateNumberAndDeletedAtIsNull(String plateNumber);

    /**
     * Tìm xe theo ID, chỉ lấy xe chưa bị xóa mềm.
     * Dùng cho mọi thao tác của Owner — CRP-24.
     */
    Optional<Car> findByCarIdAndDeletedAtIsNull(Long carId);

    /**
     * Lấy danh sách xe của một Owner, bỏ qua xe đã xóa mềm, có phân trang.
     * Dùng cho API GET /api/v1/cars/my-cars.
     */
    Page<Car> findByOwnerIdAndDeletedAtIsNull(Long ownerId, Pageable pageable);

    /**
     * Lấy toàn bộ danh sách xe của một Owner chưa xóa mềm (CRP-46).
     */
    List<Car> findByOwnerIdAndDeletedAtIsNull(Long ownerId);

    /**
     * Lấy danh sách xe của một Owner theo trạng thái, bỏ qua xe đã xóa mềm, có phân trang.
     * Dùng cho API GET /api/v1/cars/my-cars?status=... (CRP-31).
     */
    Page<Car> findByOwnerIdAndStatusAndDeletedAtIsNull(Long ownerId, ECarStatus status, Pageable pageable);


    /**
     * Lấy danh sách xe PENDING chờ Admin duyệt — Admin module (Khiêm - feat/Backend).
     */
    Page<Car> findByStatusAndDeletedAtIsNull(ECarStatus status, Pageable pageable);

    /**
     * Kiểm tra xe có đơn đặt xe đang hoạt động không (PENDING, APPROVED, CONFIRMED).
     * Dùng khi Owner muốn xóa xe — CRP-24.
     */
    @Query("""
            SELECT CASE WHEN COUNT(r) > 0 THEN TRUE ELSE FALSE END
            FROM com.driveshare.modules.rental.entity.Rental r
            WHERE r.carId = :carId
              AND r.status IN (
                  com.driveshare.common.enums.ERentalStatus.PENDING,
                  com.driveshare.common.enums.ERentalStatus.APPROVED,
                  com.driveshare.common.enums.ERentalStatus.CONFIRMED
              )
            """)
    boolean hasActiveBooking(@Param("carId") Long carId);

    /**
     * Đếm số xe đang ACTIVE của một Owner (dùng cho thống kê dashboard).
     */
    long countByOwnerIdAndStatusAndDeletedAtIsNull(Long ownerId, ECarStatus status);

    /**
     * Đếm số xe theo trạng thái toàn sàn (bỏ qua xe xóa mềm).
     */
    long countByStatusAndDeletedAtIsNull(ECarStatus status);
}
