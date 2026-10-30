package com.driveshare.modules.health.application.port.in;

import com.driveshare.modules.health.domain.model.SystemStatusRecord;

import java.util.Map;

public interface HealthCheckUseCase {

    SystemStatusRecord checkHealth();

    Map<String, Object> getHomeInfo();
}

