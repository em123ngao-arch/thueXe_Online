package com.driveshare.modules.payment.adapter.out.persistence;

import com.driveshare.common.enums.EPaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface PaymentJpaRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByRentalId(Long rentalId);

    Optional<Payment> findByRentalIdAndStatus(Long rentalId, EPaymentStatus status);

    Optional<Payment> findByTransactionCode(String transactionCode);

    List<Payment> findByRentalIdInAndStatus(List<Long> rentalIds, EPaymentStatus status);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p " +
           "WHERE p.rentalId IN :rentalIds AND p.status = :status")
    BigDecimal sumEarningsByRentalIds(
            @Param("rentalIds") List<Long> rentalIds,
            @Param("status") EPaymentStatus status
    );

    List<Payment> findByRentalIdInOrderByCreatedAtDesc(List<Long> rentalIds);
}

