package com.driveshare.modules.user.adapter.out.persistence;

import com.driveshare.common.enums.ERole;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Primary
@Repository
public interface RoleJpaRepository extends JpaRepository<Role, Long> {
    Optional<Role> findByRoleName(ERole roleName);
}

