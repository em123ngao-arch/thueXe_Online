package com.driveshare.modules.health.domain.policy;

/**
 * Pure domain policy for health verification.
 */
public final class HealthPolicy {

    private HealthPolicy() {}

    public static boolean isHealthy(boolean dbAlive) {
        return dbAlive;
    }
}

