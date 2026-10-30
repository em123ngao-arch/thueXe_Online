package com.driveshare.modules.admin.domain.model;

import java.time.Instant;

/**
 * Domain model representing an immutable audit log record.
 */
public record AuditLogRecord(
        Long logId,
        String action,
        Long actorId,
        String actorUsername,
        String targetType,
        Long targetId,
        String details,
        Instant createdAt
) {
    public static AuditLogRecord create(String action, Long actorId, String actorUsername, String targetType, Long targetId, String details) {
        return new AuditLogRecord(null, action, actorId, actorUsername, targetType, targetId, details, Instant.now());
    }
}

