package com.driveshare.modules.car.adapter.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CarDocumentJpaRepository extends JpaRepository<CarDocument, Long> {

    List<CarDocument> findByCar_CarId(Long carId);

    Optional<CarDocument> findByDocumentIdAndCar_CarId(Long documentId, Long carId);
}

