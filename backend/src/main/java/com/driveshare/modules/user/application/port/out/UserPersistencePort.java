package com.driveshare.modules.user.application.port.out;

import com.driveshare.modules.user.domain.model.OwnerProfileRecord;
import com.driveshare.modules.user.domain.model.RenterProfileRecord;
import com.driveshare.modules.user.domain.model.UserProfileRecord;

import java.util.Optional;

public interface UserPersistencePort {
    Optional<UserProfileRecord> findUserById(Long userId);
    Optional<OwnerProfileRecord> findOwnerProfileById(Long userId);
    Optional<RenterProfileRecord> findRenterProfileById(Long userId);
}

