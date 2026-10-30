package com.driveshare.modules.ai.application.port.out;

import com.driveshare.modules.ai.application.result.CarSummaryResult;

import java.util.List;
import java.util.Optional;

/**
 * Outbound Port for querying Car information required by AI Advisor.
 */
public interface CarDataQueryPort {
    List<CarSummaryResult> findActiveCars(int limit);
    Optional<CarSummaryResult> findCarById(Long carId);
}

