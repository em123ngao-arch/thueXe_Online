package com.driveshare.modules.health;

import com.driveshare.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
@Tag(name = "Health Check", description = "Kiểm tra trạng thái hoạt động của Backend Service")
public class HealthController {

    @GetMapping
    @Operation(summary = "Kiểm tra tình trạng server (Ping / Health)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkHealth() {
        Map<String, Object> status = Map.of(
                "status", "UP",
                "service", "DriveShare Backend",
                "version", "1.0.0",
                "timestamp", Instant.now()
        );
        return ResponseEntity.ok(ApiResponse.success("DriveShare Backend Service is running smoothly", status));
    }
}
