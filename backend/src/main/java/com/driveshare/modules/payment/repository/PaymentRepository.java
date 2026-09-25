package com.driveshare.modules.payment.repository;

import com.driveshare.common.enums.EPaymentStatus;
import com.driveshare.modules.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByRentalId(Long rentalId);

    Optional<Payment> findByRentalIdAndStatus(Long rentalId, EPaymentStatus status);

    Optional<Payment> findByTransactionCode(String transactionCode);

    List<Payment> findByRentalIdInAndStatus(List<Long> rentalIds, EPaymentStatus status);

    // CRP-54: Tính tổng doanh thu của các đơn thuê thuộc về chủ xe
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p " +
           "WHERE p.rentalId IN :rentalIds AND p.status = :status")
    BigDecimal sumEarningsByRentalIds(
            @Param("rentalIds") List<Long> rentalIds,
            @Param("status") EPaymentStatus status
    );

    List<Payment> findByRentalIdInOrderByCreatedAtDesc(List<Long> rentalIds);
}
