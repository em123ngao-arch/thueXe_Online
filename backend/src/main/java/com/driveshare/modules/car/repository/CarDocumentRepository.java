package com.driveshare.modules.car.repository;

import com.driveshare.modules.car.entity.CarDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CarDocumentRepository extends JpaRepository<CarDocument, Long> {

    List<CarDocument> findByCar_CarId(Long carId);

    Optional<CarDocument> findByDocumentIdAndCar_CarId(Long documentId, Long carId);
}
