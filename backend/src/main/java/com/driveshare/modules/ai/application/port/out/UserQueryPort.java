package com.driveshare.modules.ai.application.port.out;

import com.driveshare.modules.ai.application.result.UserSummaryResult;

import java.util.Optional;

/**
 * Outbound Port for querying User profile information in AI module.
 */
public interface UserQueryPort {
    Optional<UserSummaryResult> findUserById(Long userId);
}

