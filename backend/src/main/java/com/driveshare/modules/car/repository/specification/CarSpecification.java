package com.driveshare.modules.car.repository.specification;

import com.driveshare.common.enums.ECarStatus;
import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.modules.car.dto.request.CarSearchRequest;
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
 * Lớp tạo dynamic query (JPA Specification) phục vụ tìm kiếm và lọc xe (CRP-39, CRP-38).
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

            // 9. Lọc xe khả dụng theo khoảng ngày (CRP-38 & Giai đoạn 1 v2.0.0)
            if (request.getStartDate() != null && request.getEndDate() != null && query != null) {
                Subquery<Long> subquery = query.subquery(Long.class);
                Root<Rental> rentalRoot = subquery.from(Rental.class);
                subquery.select(rentalRoot.get("carId"));

                List<Predicate> conflictPredicates = new ArrayList<>();
                conflictPredicates.add(cb.equal(rentalRoot.get("carId"), root.get("carId")));
                conflictPredicates.add(rentalRoot.get("status").in(
                        ERentalStatus.APPROVED,
                        ERentalStatus.WAITING_PAYMENT,
                        ERentalStatus.CONFIRMED,
                        ERentalStatus.IN_PROGRESS
                ));
                conflictPredicates.add(cb.isNull(rentalRoot.get("deletedAt")));

                // Điều kiện giao nhau: rental.startDate <= request.endDate AND rental.endDate >= request.startDate
                conflictPredicates.add(cb.lessThanOrEqualTo(rentalRoot.get("startDate"), request.getEndDate()));
                conflictPredicates.add(cb.greaterThanOrEqualTo(rentalRoot.get("endDate"), request.getStartDate()));

                subquery.where(conflictPredicates.toArray(new Predicate[0]));

                predicates.add(cb.not(root.get("carId").in(subquery)));

                // 9.2 Loại trừ xe bị chủ xe chủ động chặn lịch bận (Blackout Dates)
                Subquery<Long> blockSubquery = query.subquery(Long.class);
                Root<com.driveshare.modules.car.entity.CarCalendarBlock> blockRoot = blockSubquery.from(com.driveshare.modules.car.entity.CarCalendarBlock.class);
                blockSubquery.select(blockRoot.get("carId"));

                List<Predicate> blockPredicates = new ArrayList<>();
                blockPredicates.add(cb.equal(blockRoot.get("carId"), root.get("carId")));
                blockPredicates.add(cb.isNull(blockRoot.get("deletedAt")));
                blockPredicates.add(cb.lessThanOrEqualTo(blockRoot.get("startDate"), request.getEndDate()));
                blockPredicates.add(cb.greaterThanOrEqualTo(blockRoot.get("endDate"), request.getStartDate()));

                blockSubquery.where(blockPredicates.toArray(new Predicate[0]));

                predicates.add(cb.not(root.get("carId").in(blockSubquery)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
