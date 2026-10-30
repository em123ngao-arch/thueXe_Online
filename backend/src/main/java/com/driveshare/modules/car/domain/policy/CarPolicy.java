package com.driveshare.modules.car.domain.policy;

import com.driveshare.common.enums.ECarStatus;

import java.time.LocalDate;
import java.util.Set;

public final class CarPolicy {

    private static final Set<ECarStatus> OWNER_ALLOWED_STATUSES = Set.of(
            ECarStatus.ACTIVE,
            ECarStatus.INACTIVE
    );

    private CarPolicy() {
    }

    public static boolean isOwnerStatusChangeAllowed(ECarStatus status) {
        return OWNER_ALLOWED_STATUSES.contains(status);
    }

    public static boolean isDateRangeValid(LocalDate startDate, LocalDate endDate) {
        return startDate != null && endDate != null && !startDate.isAfter(endDate);
    }
}

