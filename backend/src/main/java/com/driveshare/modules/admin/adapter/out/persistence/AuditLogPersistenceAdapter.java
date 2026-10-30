package com.driveshare.modules.admin.adapter.out.persistence;

import com.driveshare.modules.admin.application.port.out.AdminPersistencePort;
import com.driveshare.modules.admin.domain.model.AuditLogRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class AuditLogPersistenceAdapter implements AdminPersistencePort {

    private final AuditLogJpaRepository auditLogJpaRepository;

    @Override
    public AuditLogRecord saveAuditLog(AuditLogRecord record) {
        AuditLog entity = toEntity(record);
        AuditLog saved = auditLogJpaRepository.save(entity);
        return toRecord(saved);
    }

    @Override
    public List<AuditLogRecord> findByTarget(String targetType, Long targetId) {
        return auditLogJpaRepository.findByTargetTypeAndTargetId(targetType, targetId)
                .stream()
                .map(this::toRecord)
                .toList();
    }

    private AuditLog toEntity(AuditLogRecord record) {
        return AuditLog.builder()
                .logId(record.logId())
                .action(record.action())
                .actorId(record.actorId())
                .actorUsername(record.actorUsername())
                .targetType(record.targetType())
                .targetId(record.targetId())
                .details(record.details())
                .createdAt(record.createdAt())
                .build();
    }

    private AuditLogRecord toRecord(AuditLog entity) {
        return new AuditLogRecord(
                entity.getLogId(),
                entity.getAction(),
                entity.getActorId(),
                entity.getActorUsername(),
                entity.getTargetType(),
                entity.getTargetId(),
                entity.getDetails(),
                entity.getCreatedAt()
        );
    }
}

