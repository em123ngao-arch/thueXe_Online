package com.driveshare.modules.rental.repository;

import com.driveshare.modules.rental.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    Optional<Review> findByRentalId(Long rentalId);

    boolean existsByRentalId(Long rentalId);

    List<Review> findByCarIdOrderByCreatedAtDesc(Long carId);

    Page<Review> findByCarIdOrderByCreatedAtDesc(Long carId, Pageable pageable);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.carId = :carId")
    Double calculateAverageRatingByCarId(@Param("carId") Long carId);

    long countByCarId(Long carId);
}
