package com.driveshare.modules.admin.application.port.out;

import com.driveshare.modules.admin.domain.model.AuditLogRecord;

import java.util.List;

public interface AdminPersistencePort {

    AuditLogRecord saveAuditLog(AuditLogRecord record);

    List<AuditLogRecord> findByTarget(String targetType, Long targetId);
}

