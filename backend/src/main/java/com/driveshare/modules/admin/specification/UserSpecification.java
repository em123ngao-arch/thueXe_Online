package com.driveshare.modules.admin.specification;

import com.driveshare.common.enums.ERole;
import com.driveshare.common.enums.EUserStatus;
import com.driveshare.modules.user.entity.Role;
import com.driveshare.modules.user.entity.User;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public class UserSpecification {

    public static Specification<User> filterUsers(String search, String role, String status) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Search keyword (name, email, username, phone)
            if (StringUtils.hasText(search)) {
                String keyword = "%" + search.trim().toLowerCase() + "%";
                Predicate fullNamePredicate = cb.like(cb.lower(root.get("fullName")), keyword);
                Predicate emailPredicate = cb.like(cb.lower(root.get("email")), keyword);
                Predicate usernamePredicate = cb.like(cb.lower(root.get("username")), keyword);
                Predicate phonePredicate = cb.like(cb.lower(root.get("phone")), keyword);
                predicates.add(cb.or(fullNamePredicate, emailPredicate, usernamePredicate, phonePredicate));
            }

            // 2. Filter by status (pending, active, locked)
            if (StringUtils.hasText(status) && !"all".equalsIgnoreCase(status)) {
                try {
                    EUserStatus userStatus = EUserStatus.valueOf(status.trim().toUpperCase());
                    predicates.add(cb.equal(root.get("status"), userStatus));
                } catch (IllegalArgumentException ignored) {
                }
            }

            // 3. Filter by role (renter, owner, admin, staff)
            if (StringUtils.hasText(role) && !"all".equalsIgnoreCase(role)) {
                try {
                    ERole targetRole = ERole.fromString(role);
                    Join<User, Role> roleJoin = root.join("roles", JoinType.INNER);
                    predicates.add(cb.equal(roleJoin.get("roleName"), targetRole));
                    query.distinct(true);
                } catch (IllegalArgumentException ignored) {
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
