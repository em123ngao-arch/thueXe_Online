package com.driveshare.modules.payment.repository;

import com.driveshare.modules.payment.adapter.out.persistence.PaymentJpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentRepository extends PaymentJpaRepository {
}
