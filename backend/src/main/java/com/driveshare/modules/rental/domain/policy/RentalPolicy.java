package com.driveshare.modules.rental.domain.policy;

import com.driveshare.common.enums.ERentalStatus;

import java.time.LocalDate;
import java.util.Set;

public final class RentalPolicy {

    public static final int MAX_PENDING_RENTALS_PER_RENTER = 3;

    private static final Set<ERentalStatus> CANCELABLE_STATUSES = Set.of(
            ERentalStatus.PENDING,
            ERentalStatus.APPROVED
    );

    private RentalPolicy() {
    }

    public static boolean isOverlap(LocalDate start1, LocalDate end1, LocalDate start2, LocalDate end2) {
        if (start1 == null || end1 == null || start2 == null || end2 == null) {
            return false;
        }
        return !start1.isAfter(end2) && !end1.isBefore(start2);
    }

    public static boolean isCancelable(ERentalStatus status) {
        return CANCELABLE_STATUSES.contains(status);
    }

    public static boolean isRatingValid(Integer rating) {
        return rating != null && rating >= 1 && rating <= 5;
    }
}

