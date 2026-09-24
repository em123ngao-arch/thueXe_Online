package com.driveshare.modules.admin.specification;

import com.driveshare.common.enums.ECarStatus;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.user.entity.User;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public class CarSpecification {

    public static Specification<Car> filterCars(String search, String status) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Search keyword (brand, model, license_plate, owner full_name, owner username)
            if (StringUtils.hasText(search)) {
                String keyword = "%" + search.trim().toLowerCase() + "%";
                Predicate brandPredicate = cb.like(cb.lower(root.get("brand")), keyword);
                Predicate modelPredicate = cb.like(cb.lower(root.get("model")), keyword);
                Predicate licensePlatePredicate = cb.like(cb.lower(root.get("licensePlate")), keyword);

                Join<Car, User> ownerJoin = root.join("owner", JoinType.LEFT);
                Predicate ownerNamePredicate = cb.like(cb.lower(ownerJoin.get("fullName")), keyword);
                Predicate ownerUsernamePredicate = cb.like(cb.lower(ownerJoin.get("username")), keyword);

                predicates.add(cb.or(brandPredicate, modelPredicate, licensePlatePredicate, ownerNamePredicate, ownerUsernamePredicate));
            }

            // 2. Filter by status (pending_review, approved, rejected, active, inactive, suspended)
            if (StringUtils.hasText(status) && !"all".equalsIgnoreCase(status)) {
                String normalizedStatus = status.trim().toUpperCase();
                if ("PENDING".equals(normalizedStatus) || "PENDING_APPROVAL".equals(normalizedStatus)) {
                    normalizedStatus = "PENDING_REVIEW";
                }
                try {
                    ECarStatus carStatus = ECarStatus.valueOf(normalizedStatus);
                    predicates.add(cb.equal(root.get("status"), carStatus));
                } catch (IllegalArgumentException ignored) {
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
