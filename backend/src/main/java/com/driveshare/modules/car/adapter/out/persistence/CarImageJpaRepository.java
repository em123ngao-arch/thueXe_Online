package com.driveshare.modules.car.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CarImageJpaRepository extends JpaRepository<CarImage, Long> {

    List<CarImage> findByCar_CarId(Long carId);
}

