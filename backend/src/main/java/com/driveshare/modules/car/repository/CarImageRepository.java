package com.driveshare.modules.car.repository;

import com.driveshare.modules.car.entity.CarImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CarImageRepository extends JpaRepository<CarImage, Long> {

    List<CarImage> findByCar_CarId(Long carId);
}
