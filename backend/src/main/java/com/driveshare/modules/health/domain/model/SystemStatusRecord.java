package com.driveshare.modules.health.domain.model;

import java.time.Instant;

/**
 * Domain record representing service health status.
 */
public record SystemStatusRecord(
        String status,
        String service,
        String version,
        Instant timestamp
) {
    public static SystemStatusRecord up(String service, String version) {
        return new SystemStatusRecord("UP", service, version, Instant.now());
    }
}

