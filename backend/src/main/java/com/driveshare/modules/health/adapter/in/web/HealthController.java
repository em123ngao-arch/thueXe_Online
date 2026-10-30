package com.driveshare.modules.health.adapter.in.web;

import com.driveshare.common.dto.ApiResponse;
import com.driveshare.modules.health.application.port.in.HealthCheckUseCase;
import com.driveshare.modules.health.domain.model.SystemStatusRecord;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
@RequiredArgsConstructor
@Tag(name = "Health Check", description = "Kiểm tra trạng thái hoạt động của Backend Service")
public class HealthController {

    private final HealthCheckUseCase healthCheckUseCase;

    @GetMapping
    @Operation(summary = "Kiểm tra tình trạng server (Ping / Health)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkHealth() {
        SystemStatusRecord record = healthCheckUseCase.checkHealth();
        Map<String, Object> status = Map.of(
                "status", record.status(),
                "service", record.service(),
                "version", record.version(),
                "timestamp", record.timestamp()
        );
        return ResponseEntity.ok(ApiResponse.success("DriveShare Backend Service is running smoothly", status));
    }
}

