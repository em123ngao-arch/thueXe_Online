package com.driveshare.modules.car.repository;

import com.driveshare.modules.car.entity.Car;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CarRepository extends JpaRepository<Car, Long>, JpaSpecificationExecutor<Car> {

    boolean existsByLicensePlate(String licensePlate);

    Optional<Car> findByLicensePlate(String licensePlate);
}
