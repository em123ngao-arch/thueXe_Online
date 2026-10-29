package com.driveshare.modules.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.CompletableFuture;

/**
 * Service tích hợp Langfuse LLM Observability & Tracing (v2 Ingestion API).
 * Giám sát mọi cuộc gọi LLM, đo độ trễ, lưu vết câu hỏi/câu trả lời, và quản lý prompt.
 */
@Slf4j
@Service
public class LangfuseService {

    private final boolean enabled;
    private final String host;
    private final String publicKey;
    private final String secretKey;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public LangfuseService(
            @Value("${langfuse.enabled:false}") boolean enabled,
            @Value("${langfuse.host:https://cloud.langfuse.com}") String host,
            @Value("${langfuse.public-key:}") String publicKey,
            @Value("${langfuse.secret-key:}") String secretKey,
            ObjectMapper objectMapper
    ) {
        this.enabled = enabled && publicKey != null && !publicKey.isBlank();
        this.host = host.endsWith("/") ? host.substring(0, host.length() - 1) : host;
        this.publicKey = publicKey;
        this.secretKey = secretKey;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(4))
                .build();

        if (this.enabled) {
            log.info("🚀 [Langfuse] Đã kích hoạt giám sát AI Tracing tại host: {}", this.host);
        } else {
            log.info("ℹ️ [Langfuse] Chế độ giám sát chưa bật hoặc chưa cấu hình API key. Hoạt động ở chế độ Local Logging.");
        }
    }

    public boolean isEnabled() {
        return enabled;
    }

    /**
     * Ghi nhận một Trace và Generation lên Langfuse bất đồng bộ (không làm chậm chat).
     */
    public void recordGeneration(
            String traceId,
            String name,
            String sessionId,
            String userId,
            String model,
            String systemPrompt,
            String userQuery,
            String outputText,
            long latencyMs,
            boolean success,
            String errorMessage
    ) {
        if (!enabled) {
            log.debug("[Langfuse-Local] Trace: {} | Model: {} | Latency: {}ms | Success: {}",
                    traceId, model, latencyMs, success);
            return;
        }

        CompletableFuture.runAsync(() -> {
            try {
                long nowMs = System.currentTimeMillis();
                long startMs = nowMs - Math.max(1, latencyMs);
                String nowNs = String.valueOf(nowMs * 1_000_000L);
                String startNs = String.valueOf(startMs * 1_000_000L);

                // OpenTelemetry yêu cầu traceId đúng chuẩn 16 bytes (32 ký tự hex [0-9a-f])
                String cleanTraceId;
                if (traceId != null && traceId.matches("^[0-9a-fA-F]{32}$")) {
                    cleanTraceId = traceId.toLowerCase();
                } else {
                    cleanTraceId = UUID.randomUUID().toString().replace("-", "");
                }
                String spanId = UUID.randomUUID().toString().replace("-", "").substring(0, 16);

                List<Map<String, Object>> attributes = new ArrayList<>();
                if (sessionId != null) {
                    attributes.add(Map.of("key", "session.id", "value", Map.of("stringValue", sessionId)));
                    attributes.add(Map.of("key", "langfuse.session.id", "value", Map.of("stringValue", sessionId)));
                }
                if (userId != null) {
                    attributes.add(Map.of("key", "user.id", "value", Map.of("stringValue", userId)));
                    attributes.add(Map.of("key", "langfuse.user.id", "value", Map.of("stringValue", userId)));
                }
                attributes.add(Map.of("key", "gen_ai.system", "value", Map.of("stringValue", model != null && model.contains("gemini") ? "google_gemini" : "driveshare_smart_advisor")));
                if (model != null) attributes.add(Map.of("key", "gen_ai.request.model", "value", Map.of("stringValue", model)));
                if (userQuery != null) {
                    attributes.add(Map.of("key", "gen_ai.prompt", "value", Map.of("stringValue", userQuery)));
                    attributes.add(Map.of("key", "langfuse.observation.input", "value", Map.of("stringValue", userQuery)));
                }
                if (outputText != null) {
                    attributes.add(Map.of("key", "gen_ai.completion", "value", Map.of("stringValue", outputText)));
                    attributes.add(Map.of("key", "langfuse.observation.output", "value", Map.of("stringValue", outputText)));
                }
                if (systemPrompt != null) attributes.add(Map.of("key", "system_prompt", "value", Map.of("stringValue", systemPrompt)));
                attributes.add(Map.of("key", "platform", "value", Map.of("stringValue", "DriveShare Car Rental")));

                Map<String, Object> span = new HashMap<>();
                span.put("traceId", cleanTraceId);
                span.put("spanId", spanId);
                span.put("name", name != null ? name : "chat-completion");
                span.put("kind", 1);
                span.put("startTimeUnixNano", startNs);
                span.put("endTimeUnixNano", nowNs);
                span.put("attributes", attributes);
                span.put("status", Map.of("code", success ? 1 : 2));

                Map<String, Object> scopeSpan = Map.of(
                        "scope", Map.of("name", "langfuse-sdk", "version", "2.0.0"),
                        "spans", List.of(span)
                );

                Map<String, Object> resourceSpan = Map.of(
                        "resource", Map.of("attributes", List.of(
                                Map.of("key", "service.name", "value", Map.of("stringValue", "driveshare-backend")),
                                Map.of("key", "telemetry.sdk.language", "value", Map.of("stringValue", "java")),
                                Map.of("key", "telemetry.sdk.name", "value", Map.of("stringValue", "langfuse-sdk")),
                                Map.of("key", "telemetry.sdk.version", "value", Map.of("stringValue", "2.0.0"))
                        )),
                        "scopeSpans", List.of(scopeSpan)
                );

                String payload = objectMapper.writeValueAsString(Map.of("resourceSpans", List.of(resourceSpan)));
                String auth = Base64.getEncoder().encodeToString((publicKey + ":" + secretKey).getBytes(StandardCharsets.UTF_8));

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(host + "/api/public/otel/v1/traces"))
                        .header("Content-Type", "application/json")
                        .header("Authorization", "Basic " + auth)
                        .header("x-langfuse-ingestion-version", "4")
                        .timeout(Duration.ofSeconds(6))
                        .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    log.info("✅ [Langfuse] Đã đẩy Trace thành công lên dashboard (ID: {}, name: {}).", cleanTraceId, name);
                } else {
                    log.warn("⚠️ [Langfuse] Lỗi khi đẩy trace ({}) HTTP {}: {}", cleanTraceId, response.statusCode(), response.body());
                }
            } catch (Exception e) {
                log.warn("⚠️ [Langfuse] Không thể gửi dữ liệu tracing: {}", e.getMessage());
            }
        });
    }

    /**
     * Lấy trạng thái giám sát hiện tại để hiển thị trên màn hình kiểm thử.
     */
    public Map<String, Object> getStatus() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("enabled", enabled);
        status.put("host", host);
        status.put("hasPublicKey", publicKey != null && !publicKey.isBlank());
        status.put("hasSecretKey", secretKey != null && !secretKey.isBlank());
        status.put("dashboardUrl", host);
        return status;
    }
}
