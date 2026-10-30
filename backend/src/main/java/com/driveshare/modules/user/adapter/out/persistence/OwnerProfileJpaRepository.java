package com.driveshare.modules.user.adapter.out.persistence;

import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Primary
@Repository
public interface OwnerProfileJpaRepository extends JpaRepository<OwnerProfile, Long> {
}
