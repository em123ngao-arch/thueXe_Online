package com.driveshare.modules.car.repository.specification;

import com.driveshare.common.enums.ECarStatus;
import com.driveshare.modules.car.dto.request.CarSearchRequest;
import com.driveshare.modules.car.entity.Car;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

/**
 * Lớp tạo dynamic query (JPA Specification) phục vụ tìm kiếm và lọc xe (CRP-39).
 */
public class CarSpecification {

    private CarSpecification() {}

    public static Specification<Car> filterCars(CarSearchRequest request) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Bắt buộc: Xe chưa bị xóa mềm và trạng thái phải là ACTIVE (đã được Admin duyệt)
            predicates.add(cb.isNull(root.get("deletedAt")));
            predicates.add(cb.equal(root.get("status"), ECarStatus.ACTIVE));

            // 2. Lọc theo Tỉnh/Thành phố
            if (StringUtils.hasText(request.getProvince())) {
                predicates.add(cb.like(cb.lower(root.get("province")), "%" + request.getProvince().toLowerCase().trim() + "%"));
            }

            // 3. Lọc theo Địa điểm/Vị trí
            if (StringUtils.hasText(request.getLocation())) {
                Predicate addressPredicate = cb.like(cb.lower(root.get("address")), "%" + request.getLocation().toLowerCase().trim() + "%");
                Predicate provincePredicate = cb.like(cb.lower(root.get("province")), "%" + request.getLocation().toLowerCase().trim() + "%");
                predicates.add(cb.or(addressPredicate, provincePredicate));
            }

            // 4. Lọc theo Hãng xe
            if (StringUtils.hasText(request.getBrand())) {
                predicates.add(cb.equal(cb.lower(root.get("brand")), request.getBrand().toLowerCase().trim()));
            }

            // 5. Lọc theo Số chỗ ngồi
            if (request.getSeats() != null) {
                predicates.add(cb.equal(root.get("seats"), request.getSeats()));
            }

            // 6. Lọc theo Hộp số
            if (request.getTransmission() != null) {
                predicates.add(cb.equal(root.get("transmission"), request.getTransmission()));
            }

            // 7. Lọc theo Nhiên liệu
            if (request.getFuelType() != null) {
                predicates.add(cb.equal(root.get("fuelType"), request.getFuelType()));
            }

            // 8. Lọc theo Khoảng giá (minPrice <= pricePerDay <= maxPrice)
            if (request.getMinPrice() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("pricePerDay"), request.getMinPrice()));
            }
            if (request.getMaxPrice() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("pricePerDay"), request.getMaxPrice()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
