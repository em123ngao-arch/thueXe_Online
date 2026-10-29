package com.driveshare.modules.rag.service;

import com.fasterxml.jackson.databind.JsonNode;
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
import java.util.*;

@Slf4j
@Service
public class GeminiEmbeddingService {

    private final String apiKey;
    private final String embeddingModel;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    private static final int FALLBACK_VECTOR_DIM = 256;

    public GeminiEmbeddingService(
            @Value("${gemini.api-key:}") String apiKey,
            @Value("${gemini.embedding-model:text-embedding-004}") String embeddingModel,
            ObjectMapper objectMapper
    ) {
        this.apiKey = apiKey;
        this.embeddingModel = embeddingModel;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public float[] embedText(String text) {
        if (text == null || text.isBlank()) {
            return new float[FALLBACK_VECTOR_DIM];
        }

        // 1. Thử gọi Google Gemini Embedding API nếu có key
        if (apiKey != null && !apiKey.isBlank() && !apiKey.startsWith("YOUR_")) {
            try {
                float[] vector = callGeminiEmbeddingApi(text);
                if (vector != null && vector.length > 0) {
                    return vector;
                }
            } catch (Exception e) {
                log.warn("Gọi Gemini Embedding API thất bại ({}), tự động dùng Local Vectorizer fallback", e.getMessage());
            }
        }

        // 2. Dự phòng nội bộ: Hash-based Term Frequency Vector (đảm bảo không bao giờ lỗi)
        return generateLocalEmbedding(text);
    }

    private float[] callGeminiEmbeddingApi(String text) throws Exception {
        String cleanText = text.length() > 2000 ? text.substring(0, 2000) : text;
        String url = String.format(
                "https://generativelanguage.googleapis.com/v1beta/models/%s:embedContent?key=%s",
                embeddingModel, apiKey
        );

        Map<String, Object> body = Map.of(
                "content", Map.of(
                        "parts", List.of(Map.of("text", cleanText))
                )
        );

        String jsonBody = objectMapper.writeValueAsString(body);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(12))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 200) {
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode valuesNode = root.path("embedding").path("values");
            if (valuesNode.isArray() && valuesNode.size() > 0) {
                float[] vector = new float[valuesNode.size()];
                for (int i = 0; i < valuesNode.size(); i++) {
                    vector[i] = (float) valuesNode.get(i).asDouble();
                }
                return vector;
            }
        } else {
            log.warn("Gemini Embedding API trả về HTTP {}: {}", response.statusCode(), response.body());
        }
        return null;
    }

    /**
     * Local TF-IDF / Hashing Vectorizer fallback:
     * Chiếu các từ trong đoạn văn vào không gian vector 256 chiều với chuẩn L2 normalization.
     */
    public float[] generateLocalEmbedding(String text) {
        float[] vector = new float[FALLBACK_VECTOR_DIM];
        String[] words = text.toLowerCase().split("[\\s,;:.!?\"'()\\[\\]{}<>/-]+");

        for (String word : words) {
            if (word.isBlank() || word.length() < 2) continue;
            int hash = Math.abs(word.hashCode()) % FALLBACK_VECTOR_DIM;
            vector[hash] += 1.0f;
        }

        // L2 Normalization để chuẩn hóa độ dài vector = 1.0
        double norm = 0.0;
        for (float v : vector) {
            norm += v * v;
        }
        norm = Math.sqrt(norm);
        if (norm > 0.0) {
            for (int i = 0; i < vector.length; i++) {
                vector[i] = (float) (vector[i] / norm);
            }
        }

        return vector;
    }
}
