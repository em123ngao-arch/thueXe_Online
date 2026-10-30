package com.driveshare.modules.admin.specification;

import com.driveshare.modules.user.adapter.out.persistence.User;
import org.springframework.data.jpa.domain.Specification;

/**
 * Backward compatibility bridge for UserSpecification.
 */
public class UserSpecification {

    public static Specification<User> filterUsers(String search, String role, String status) {
        return com.driveshare.modules.admin.adapter.out.persistence.UserSpecification.filterUsers(search, role, status);
    }
}
