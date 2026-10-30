package com.driveshare.modules.health.application.usecase;

import com.driveshare.modules.health.application.port.in.HealthCheckUseCase;
import com.driveshare.modules.health.application.port.out.DatabaseHealthPort;
import com.driveshare.modules.health.domain.model.SystemStatusRecord;
import com.driveshare.modules.health.domain.policy.HealthPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class HealthCheckUseCaseImpl implements HealthCheckUseCase {

    private final DatabaseHealthPort databaseHealthPort;

    @Override
    public SystemStatusRecord checkHealth() {
        boolean dbAlive = databaseHealthPort.isDatabaseUp();
        String status = HealthPolicy.isHealthy(dbAlive) ? "UP" : "DEGRADED";
        return new SystemStatusRecord(status, "DriveShare Backend", "1.0.0", Instant.now());
    }

    @Override
    public Map<String, Object> getHomeInfo() {
        boolean dbAlive = databaseHealthPort.isDatabaseUp();
        return Map.of(
                "status", dbAlive ? "UP" : "DEGRADED",
                "frontend_url", "http://localhost:3000",
                "swagger_docs", "/swagger-ui.html",
                "langfuse_status", "/api/v1/chat/langfuse-status",
                "health_check", "/api/v1/health"
        );
    }
}

