package com.driveshare.modules.admin.specification;

import com.driveshare.modules.car.adapter.out.persistence.Car;
import org.springframework.data.jpa.domain.Specification;

/**
 * Backward compatibility bridge for CarSpecification.
 */
public class CarSpecification {

    public static Specification<Car> filterCars(String search, String status) {
        return com.driveshare.modules.admin.adapter.out.persistence.CarSpecification.filterCars(search, status);
    }
}
