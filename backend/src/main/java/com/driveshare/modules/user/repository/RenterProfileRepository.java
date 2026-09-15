package com.driveshare.modules.user.repository;

import com.driveshare.modules.user.entity.RenterProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RenterProfileRepository extends JpaRepository<RenterProfile, Long> {
    Optional<RenterProfile> findByLicenseNumber(String licenseNumber);
}
