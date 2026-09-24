package com.driveshare.modules.car.specification;

import com.driveshare.common.enums.ECarStatus;
import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.modules.car.dto.request.CarSearchFilterRequest;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.rental.entity.Rental;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

/**
 * Specification phục vụ tìm kiếm xe công khai đa tiêu chí (CRP-35, 36, 38).
 */
public class CarSpecification {

    public static Specification<Car> filterCars(CarSearchFilterRequest filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Chỉ lấy xe đang ACTIVE và chưa bị xóa mềm (BR-04-2, CRP-35)
            predicates.add(cb.equal(root.get("status"), ECarStatus.ACTIVE));
            predicates.add(cb.isNull(root.get("deletedAt")));

            if (filter == null) {
                return cb.and(predicates.toArray(new Predicate[0]));
            }

            // 2. Lọc theo hãng xe (brand)
            if (StringUtils.hasText(filter.getBrand())) {
                String brandKeyword = "%" + filter.getBrand().trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("brand")), brandKeyword));
            }

            // 3. Lọc theo dòng xe (model)
            if (StringUtils.hasText(filter.getModel())) {
                String modelKeyword = "%" + filter.getModel().trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("model")), modelKeyword));
            }

            // 4. Lọc theo khoảng giá thuê / ngày (priceMin, priceMax)
            if (filter.getPriceMin() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("pricePerDay"), filter.getPriceMin()));
            }
            if (filter.getPriceMax() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("pricePerDay"), filter.getPriceMax()));
            }

            // 5. Lọc theo số chỗ ngồi (seats)
            if (filter.getSeats() != null) {
                predicates.add(cb.equal(root.get("seats"), filter.getSeats()));
            }

            // 6. Lọc theo hộp số (transmission)
            if (filter.getTransmission() != null) {
                predicates.add(cb.equal(root.get("transmission"), filter.getTransmission()));
            }

            // 7. Lọc theo loại nhiên liệu (fuelType)
            if (filter.getFuelType() != null) {
                predicates.add(cb.equal(root.get("fuelType"), filter.getFuelType()));
            }

            // 8. Lọc theo Tỉnh/Thành phố (province)
            if (StringUtils.hasText(filter.getProvince())) {
                String provinceKeyword = "%" + filter.getProvince().trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("province")), provinceKeyword));
            }

            // 9. Lọc xe khả dụng theo khoảng ngày (CRP-38)
            // Loại trừ các xe đã có cuốc thuê ở trạng thái APPROVED hoặc CONFIRMED giao nhau với [startDate, endDate]
            if (filter.getStartDate() != null && filter.getEndDate() != null) {
                Subquery<Long> subquery = query.subquery(Long.class);
                Root<Rental> rentalRoot = subquery.from(Rental.class);
                subquery.select(rentalRoot.get("carId"));

                List<Predicate> conflictPredicates = new ArrayList<>();
                conflictPredicates.add(cb.equal(rentalRoot.get("carId"), root.get("carId")));
                conflictPredicates.add(rentalRoot.get("status").in(ERentalStatus.APPROVED, ERentalStatus.CONFIRMED));
                conflictPredicates.add(cb.isNull(rentalRoot.get("deletedAt")));

                // Điều kiện giao nhau: rental.startDate <= filter.endDate AND rental.endDate >= filter.startDate
                conflictPredicates.add(cb.lessThanOrEqualTo(rentalRoot.get("startDate"), filter.getEndDate()));
                conflictPredicates.add(cb.greaterThanOrEqualTo(rentalRoot.get("endDate"), filter.getStartDate()));

                subquery.where(conflictPredicates.toArray(new Predicate[0]));

                predicates.add(cb.not(root.get("carId").in(subquery)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
