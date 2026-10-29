package com.driveshare.modules.ai.service.impl;

import com.driveshare.modules.ai.dto.ChatMessageDto;
import com.driveshare.modules.ai.service.GeminiService;
import com.driveshare.modules.ai.service.LangfuseService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiServiceImpl implements GeminiService {

    private final ObjectMapper objectMapper;
    private final LangfuseService langfuseService;

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String model;

    private static final String BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";
    private static final int MAX_HISTORY_MESSAGES = 6;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .build();

    @Override
    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    public Optional<String> generateContent(String systemInstruction, List<ChatMessageDto> history, String userMessage) {
        return generateContent(systemInstruction, history, userMessage, "default-session", "guest");
    }

    @Override
    public Optional<String> generateContent(String systemInstruction, List<ChatMessageDto> history, String userMessage, String sessionId, String userId) {
        if (!isEnabled()) {
            log.debug("[Gemini] API Key chưa được cấu hình, bỏ qua gọi Gemini.");
            return Optional.empty();
        }

        long startTime = System.currentTimeMillis();
        String traceId = UUID.randomUUID().toString().replace("-", "");

        try {
            String endpoint = BASE_URL + model + ":generateContent?key=" + apiKey.trim();

            Map<String, Object> requestBody = new HashMap<>();

            // 1. System Instruction (Bao gồm Prompt kịch bản & Ngữ cảnh xe RAG từ Database)
            if (systemInstruction != null && !systemInstruction.isBlank()) {
                requestBody.put("system_instruction", Map.of(
                        "parts", List.of(Map.of("text", systemInstruction))
                ));
            }

            // 2. Chuyển đổi lịch sử chat + câu hỏi hiện tại sang contents của Gemini (BẢO ĐẢM LUÂN PHIÊN USER / MODEL)
            List<Map<String, Object>> contents = new ArrayList<>();
            String lastRole = null;

            if (history != null && !history.isEmpty()) {
                int startIndex = Math.max(0, history.size() - MAX_HISTORY_MESSAGES);
                for (int i = startIndex; i < history.size(); i++) {
                    ChatMessageDto msg = history.get(i);
                    if (msg.getContent() == null || msg.getContent().isBlank()) continue;

                    // Nếu là tin nhắn cuối cùng và trùng với userMessage, bỏ qua để thêm ở bước cuối
                    if (i == history.size() - 1 && "USER".equalsIgnoreCase(msg.getRole()) && msg.getContent().trim().equals(userMessage.trim())) {
                        continue;
                    }

                    String role = "ASSISTANT".equalsIgnoreCase(msg.getRole()) ? "model" : "user";
                    if (role.equals(lastRole)) {
                        // Tránh lặp role liên tiếp gây lỗi HTTP 400
                        continue;
                    }
                    contents.add(Map.of(
                            "role", role,
                            "parts", List.of(Map.of("text", msg.getContent()))
                    ));
                    lastRole = role;
                }
            }

            // Tin nhắn hiện tại của User (bắt buộc role = "user" ở cuối cùng)
            if (!"user".equals(lastRole)) {
                contents.add(Map.of(
                        "role", "user",
                        "parts", List.of(Map.of("text", userMessage))
                ));
            } else {
                // Nếu lượt cuối cùng trong history vô tình vừa là user, thay thế nội dung mới nhất
                if (!contents.isEmpty()) {
                    contents.remove(contents.size() - 1);
                }
                contents.add(Map.of(
                        "role", "user",
                        "parts", List.of(Map.of("text", userMessage))
                ));
            }

            // Quy tắc bắt buộc của Google Gemini API: Tin nhắn đầu tiên trong contents PHẢI có role = "user"
            while (!contents.isEmpty() && "model".equals(contents.get(0).get("role"))) {
                contents.remove(0);
            }

            requestBody.put("contents", contents);

            // 3. Generation Config
            requestBody.put("generationConfig", Map.of(
                    "temperature", 0.6,
                    "maxOutputTokens", 1024
            ));

            String jsonPayload = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .header("Content-Type", "application/json; charset=UTF-8")
                    .timeout(Duration.ofSeconds(20))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, StandardCharsets.UTF_8))
                    .build();

            log.info("[Gemini] Đang gửi yêu cầu tới mô hình {}...", model);
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            long latencyMs = System.currentTimeMillis() - startTime;

            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode candidates = root.path("candidates");
                if (candidates.isArray() && !candidates.isEmpty()) {
                    JsonNode textNode = candidates.get(0).path("content").path("parts").get(0).path("text");
                    if (!textNode.isMissingNode()) {
                        String generatedText = textNode.asText().trim();
                        log.info("[Gemini] Phản hồi thành công từ Gemini ({} ký tự, {}ms).", generatedText.length(), latencyMs);

                        // Ghi vết vào Langfuse
                        langfuseService.recordGeneration(
                                traceId, "chat-completion",
                                sessionId != null ? sessionId : "default-session",
                                userId != null ? userId : "guest",
                                model, systemInstruction, userMessage, generatedText,
                                latencyMs, true, null
                        );

                        return Optional.of(generatedText);
                    }
                }
            } else {
                log.warn("[Gemini] API trả về mã lỗi HTTP {}: {}", response.statusCode(), response.body());
                langfuseService.recordGeneration(
                        traceId, "chat-completion",
                        sessionId != null ? sessionId : "default-session",
                        userId != null ? userId : "guest",
                        model, systemInstruction, userMessage, null,
                        latencyMs, false, "HTTP " + response.statusCode() + ": " + response.body()
                );
            }
        } catch (Exception e) {
            long latencyMs = System.currentTimeMillis() - startTime;
            log.warn("[Gemini] Gọi Gemini API thất bại ({}: {}). Sẽ dùng bộ xử lý nội bộ.", e.getClass().getSimpleName(), e.getMessage());
            langfuseService.recordGeneration(
                    traceId, "chat-completion",
                    sessionId != null ? sessionId : "default-session",
                    userId != null ? userId : "guest",
                    model, systemInstruction, userMessage, null,
                    latencyMs, false, e.getMessage()
            );
        }

        return Optional.empty();
    }
}
