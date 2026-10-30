package com.driveshare.modules.health.adapter.out.persistence;

import com.driveshare.modules.health.application.port.out.DatabaseHealthPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseHealthAdapter implements DatabaseHealthPort {

    private final DataSource dataSource;

    @Override
    public boolean isDatabaseUp() {
        if (dataSource == null) {
            return false;
        }
        try (Connection conn = dataSource.getConnection()) {
            return conn.isValid(2);
        } catch (Exception e) {
            log.warn("Database health check ping failed: {}", e.getMessage());
            return false;
        }
    }
}

